"""Pinned, bounded runtime installation shared with the JavaScript cache layout."""
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import stat
import sys
import tempfile
from urllib.parse import urljoin, urlsplit
from urllib.request import build_opener, HTTPRedirectHandler, Request
from urllib.error import HTTPError
import zipfile

CATALOG = json.loads(Path(__file__).with_name('releases.json').read_text())
MARKER = '.silly-browser-install.json'
MAX_ARCHIVE = 2 * 1024**3
MAX_TOTAL = 8 * 1024**3
PENDING = ('No published Silly Browser runtime is available for this platform/revision yet. '
           'Use executable_path '
           '(or SILLY_BROWSER_EXECUTABLE_PATH) for a local build; '
           'see https://github.com/naufal-djamhur/silly-browser/releases.')


def host_platform():
    os_name = {'Windows': 'windows', 'Darwin': 'macos', 'Linux': 'linux'}.get(platform.system())
    architecture = {'amd64': 'x64', 'x86_64': 'x64', 'arm64': 'arm64', 'aarch64': 'arm64'}.get(platform.machine().lower())
    if not os_name or not architecture or sys.maxsize <= 2**32:
        raise RuntimeError('Unsupported host platform/architecture')
    return f'{os_name}-{architecture}'


def browser_cache_dir():
    if os.environ.get('SILLY_BROWSER_CACHE_DIR'):
        return Path(os.environ['SILLY_BROWSER_CACHE_DIR']).absolute()
    if sys.platform == 'win32':
        return Path(os.environ.get('LOCALAPPDATA', Path.home()/'AppData'/'Local'))/'silly-browser'/'Cache'
    if sys.platform == 'darwin':
        return Path.home()/'Library'/'Caches'/'silly-browser'
    return Path(os.environ.get('XDG_CACHE_HOME', Path.home()/'.cache'))/'silly-browser'


def safe_archive_path(value):
    if not isinstance(value, str) or not value or len(value) > 1024 or '\\' in value or value == MARKER:
        raise ValueError('Unsafe archive path')
    parts = value.split('/')
    if any(not p or p in ('.', '..') or re.search(r'[<>:"|?*\x00-\x1f]', p)
           or p.endswith(('.', ' ')) or re.match(r'^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)', p, re.I)
           for p in parts):
        raise ValueError('Unsafe archive path')
    return parts


def _release_url(value, redirect=False):
    url = urlsplit(value)
    if url.scheme != 'https' or url.username or url.password or url.fragment or url.port not in (None, 443):
        raise ValueError('Release downloads require an approved HTTPS URL')
    if redirect and url.hostname in ('release-assets.githubusercontent.com', 'objects.githubusercontent.com'):
        return value
    if (url.hostname != 'github.com' or url.query or
        not re.fullmatch(r'/naufal-djamhur/silly-browser/releases/download/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.zip', url.path)):
        raise ValueError('Release URL must belong to the official silly-browser repository')
    return value


def select_release(catalog=None, revision=None, host=None):
    source = CATALOG if catalog is None else catalog
    if source.get('schemaVersion') != 1 or not isinstance(source.get('releases'), list):
        raise ValueError('Unsupported release catalog')
    selected = revision or os.environ.get('SILLY_BROWSER_REVISION') or source.get('defaultRevision')
    if not selected:
        raise RuntimeError(PENDING)
    if not isinstance(selected, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,95}', selected) or '..' in selected:
        raise ValueError('Invalid browser revision')
    host = host or host_platform()
    if not re.fullmatch(r'(windows|linux|macos)-(x64|arm64)', host):
        raise ValueError('Invalid host platform')
    matches = [r for r in source['releases'] if r['revision'] == selected and r['platform'] == host]
    if len(matches) != 1:
        raise RuntimeError(PENDING)
    entry = matches[0]
    _release_url(entry['url'])
    if (not re.fullmatch('[a-f0-9]{64}', entry['sha256']) or type(entry['size']) is not int
        or not 0 < entry['size'] <= MAX_ARCHIVE):
        raise ValueError('Invalid release archive metadata')
    files = entry['files']
    if not isinstance(files, dict) or not 0 < len(files) <= 20000:
        raise ValueError('Invalid release file inventory')
    total, names = 0, set()
    for name, metadata in files.items():
        safe_archive_path(name)
        if name.lower() in names:
            raise ValueError('Duplicate release path')
        names.add(name.lower())
        if (not re.fullmatch('[a-f0-9]{64}', metadata['sha256']) or type(metadata['size']) is not int
            or not 0 <= metadata['size'] <= 4*1024**3):
            raise ValueError('Invalid release file metadata')
        total += metadata['size']
    if total > MAX_TOTAL or entry['executable'] not in files:
        raise ValueError('Invalid release runtime inventory')
    safe_archive_path(entry['executable'])
    return entry


def _hash(path):
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024*1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def _location(entry, cache_dir):
    return Path(cache_dir).absolute()/entry['revision']/entry['platform']


def _cached_path(entry, cache_dir):
    directory = _location(entry, cache_dir)
    if directory.is_symlink():
        raise RuntimeError('Browser cache must not be a symlink')
    if not directory.exists():
        return None
    identity = json.loads((directory/MARKER).read_text())
    executable = directory.joinpath(*safe_archive_path(entry['executable']))
    if identity.get('archiveSha256') != entry['sha256'] or executable.is_symlink() or not executable.is_file():
        raise RuntimeError('Incomplete or invalid browser cache')
    return str(executable)


def browser_path(*, revision=None, cache_dir=None):
    if os.environ.get('SILLY_BROWSER_EXECUTABLE_PATH'):
        return str(Path(os.environ['SILLY_BROWSER_EXECUTABLE_PATH']).absolute())
    entry = select_release(revision=revision)
    path = _cached_path(entry, cache_dir or browser_cache_dir())
    if path is None:
        raise RuntimeError('Browser is not installed. Run python -m silly_browser install, or call install_browser().')
    return path


def _verify_files(directory, entry):
    for name, expected in entry['files'].items():
        parts = safe_archive_path(name)
        for count in range(1, len(parts)+1):
            if directory.joinpath(*parts[:count]).is_symlink():
                raise RuntimeError('Symlink in browser cache')
        path = directory.joinpath(*parts)
        if not path.is_file() or path.stat().st_size != expected['size'] or _hash(path) != expected['sha256']:
            raise RuntimeError(f'Browser file integrity failure: {name}')


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def _download(entry, destination):
    opener = build_opener(_NoRedirect())
    url, response = _release_url(entry['url']), None
    for _ in range(6):
        try:
            response = opener.open(Request(url, headers={'User-Agent': 'silly-browser/0.1.0'}), timeout=120)
        except HTTPError as error:
            if error.code not in (301, 302, 303, 307, 308):
                raise RuntimeError(f'Browser download failed (HTTP {error.code})') from error
            next_url = error.headers.get('Location')
            error.close()
            if not next_url:
                raise RuntimeError('Invalid download redirect')
            url = _release_url(urljoin(url, next_url), redirect=True)
            continue
        break
    if response is None:
        raise RuntimeError('Too many download redirects')
    digest, received = hashlib.sha256(), 0
    with response, destination.open('xb') as output:
        for chunk in iter(lambda: response.read(1024*1024), b''):
            received += len(chunk)
            if received > entry['size']:
                raise RuntimeError('Browser download exceeds pinned size')
            digest.update(chunk)
            output.write(chunk)
    if received != entry['size'] or digest.hexdigest() != entry['sha256']:
        raise RuntimeError('Browser archive checksum/size mismatch')


def extract_runtime(archive, directory, entry):
    seen = set()
    with zipfile.ZipFile(archive) as bundle:
        if len(bundle.infolist()) > 20000:
            raise ValueError('Too many archive entries')
        for member in bundle.infolist():
            is_directory = member.is_dir()
            name = member.filename[:-1] if is_directory else member.filename
            parts = safe_archive_path(name)
            kind = stat.S_IFMT(member.external_attr >> 16)
            if kind not in (0, stat.S_IFREG, stat.S_IFDIR) or member.flag_bits & 1:
                raise ValueError('Unsupported archive entry type')
            if name.lower() in seen:
                raise ValueError('Duplicate archive entry')
            seen.add(name.lower())
            if is_directory:
                continue
            expected = entry['files'].get(name)
            if expected is None or member.file_size != expected['size']:
                raise ValueError('Archive differs from release inventory')
            target = directory.joinpath(*parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            received = 0
            with bundle.open(member) as source, target.open('xb') as output:
                for chunk in iter(lambda: source.read(1024*1024), b''):
                    received += len(chunk)
                    if received > expected['size']:
                        raise ValueError('Archive entry exceeds pinned size')
                    output.write(chunk)
            if received != expected['size']:
                raise ValueError('Truncated archive entry')
            target.chmod(0o755 if name == entry['executable'] else 0o644)
    _verify_files(directory, entry)


def install_browser(*, revision=None, cache_dir=None, release_catalog=None):
    entry = select_release(catalog=release_catalog, revision=revision)
    root = Path(cache_dir or browser_cache_dir()).absolute()
    existing = _cached_path(entry, root)
    if existing:
        _verify_files(_location(entry, root), entry)
        return existing
    if os.environ.get('SILLY_BROWSER_SKIP_DOWNLOAD') == '1':
        raise RuntimeError('Browser download disabled by SILLY_BROWSER_SKIP_DOWNLOAD=1')
    parent = root/entry['revision']
    parent.mkdir(parents=True, exist_ok=True)
    if root.is_symlink() or parent.is_symlink():
        raise RuntimeError('Browser cache must not be a symlink')
    lock_path = parent/f"{entry['platform']}.lock"
    try:
        lock = lock_path.open('x')
    except FileExistsError as error:
        raise RuntimeError('Another browser installation is in progress. Retry when it finishes.') from error
    temporary = None
    try:
        lock.write(str(os.getpid()))
        lock.flush()
        temporary = Path(tempfile.mkdtemp(prefix=f".install-{entry['platform']}-", dir=parent))
        archive, runtime = temporary/'browser.zip', temporary/'runtime'
        runtime.mkdir()
        _download(entry, archive)
        extract_runtime(archive, runtime, entry)
        (runtime/MARKER).write_text(json.dumps({'schemaVersion': 1, 'archiveSha256': entry['sha256'],
                                              'revision': entry['revision'], 'platform': entry['platform']})+'\n')
        runtime.rename(_location(entry, root))
        return str(_location(entry, root).joinpath(*safe_archive_path(entry['executable'])))
    finally:
        try:
            if temporary is not None:
                shutil.rmtree(temporary)
        finally:
            try:
                lock.close()
            finally:
                lock_path.unlink()


def ensure_browser():
    if os.environ.get('SILLY_BROWSER_EXECUTABLE_PATH'):
        return str(Path(os.environ['SILLY_BROWSER_EXECUTABLE_PATH']).absolute())
    return install_browser()


def browser_status():
    result = {'platform': host_platform(), 'cacheDirectory': str(browser_cache_dir()),
              'revision': os.environ.get('SILLY_BROWSER_REVISION') or CATALOG['defaultRevision'],
              'downloadAvailable': False, 'installed': False}
    try:
        entry = select_release()
        result['downloadAvailable'] = True
        result['executablePath'] = _cached_path(entry, browser_cache_dir())
        result['installed'] = bool(result['executablePath'])
    except (ValueError, RuntimeError, OSError) as error:
        result['detail'] = str(error)
    return result
