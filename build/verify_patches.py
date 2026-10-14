"""Download exact upstream files and verify our patch; no Chromium execution."""
import argparse
import base64
import hashlib
import json
import pathlib
import subprocess
import urllib.request
from release_config import load_release

ROOT = pathlib.Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', type=pathlib.Path, required=True)
    parser.add_argument('--release')
    parser.add_argument('--upstream-dir',type=pathlib.Path,help='Optional pristine file cache; every file must match its pinned SHA256')
    args = parser.parse_args()
    directory = args.workspace.resolve()
    if directory.exists() and any(directory.iterdir()):
        raise SystemExit('Use an empty patch verification directory')
    directory.mkdir(parents=True, exist_ok=True)
    release_root,lock,manifest=load_release(args.release)
    subprocess.run(['git', 'init', str(directory)], check=True, capture_output=True)
    subprocess.run(['git','-C',str(directory),'config','core.autocrlf','false'],check=True)
    for path, expected in manifest['upstreamFiles'].items():
        url = f'https://chromium.googlesource.com/chromium/src/+/{lock["commit"]}/{path}?format=TEXT'
        for prefix,dependency in manifest.get('dependencyRepositories',{}).items():
            if path.startswith(prefix+'/'):
                repository=dependency['repository'].removesuffix('.git')
                url=f'{repository}/+/{dependency["commit"]}/{path[len(prefix)+1:]}?format=TEXT'
                break
        if args.upstream_dir:
            content=(args.upstream_dir/path).read_bytes()
        else:
            with urllib.request.urlopen(url, timeout=60) as response:
                content = base64.b64decode(response.read())
        if hashlib.sha256(content).hexdigest() != expected:
            raise SystemExit(f'Upstream file hash mismatch: {path}')
        target = directory/path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    for patch in manifest['patches']:
        file = release_root/'patches'/patch['file']
        subprocess.run(['git', '-C', str(directory), 'apply', '--check', str(file)], check=True)
        subprocess.run(['git', '-C', str(directory), 'apply', str(file)], check=True)
    print(json.dumps({'status':'patches-apply','commit':lock['commit'], 'patchCount':len(manifest['patches']), 'compiledChromium':False}))

if __name__ == '__main__':
    main()
