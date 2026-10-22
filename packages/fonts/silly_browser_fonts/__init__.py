"""Unmodified OFL Noto fonts; no browser dependency or system installation."""
import hashlib
import json
from pathlib import Path

_ROOT=Path(__file__).resolve().parent
FONT_MANIFEST=json.loads((_ROOT/'manifest.json').read_text())


def get_font_directory():
    return str((_ROOT/'fonts').resolve(strict=True))


def verify_fonts():
    directory=Path(get_font_directory())
    if {p.name for p in directory.iterdir()}!={entry['file'] for entry in FONT_MANIFEST['files']}:
        raise RuntimeError('Font directory differs from the inventory')
    for entry in FONT_MANIFEST['files']:
        path=directory/entry['file']
        if path.is_symlink() or not path.is_file():raise RuntimeError(f"Invalid font file: {entry['file']}")
        digest=hashlib.sha256()
        with path.open('rb') as handle:
            for chunk in iter(lambda:handle.read(1024*1024),b''):digest.update(chunk)
        if path.stat().st_size!=entry['size'] or digest.hexdigest()!=entry['sha256']:
            raise RuntimeError(f"Font integrity failure: {entry['file']}")
    return {'pack':FONT_MANIFEST['pack'],'fonts':len(FONT_MANIFEST['files']),'directory':str(directory),'verified':True}
