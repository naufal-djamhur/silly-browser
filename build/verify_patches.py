"""Download exact upstream files and verify our patch; no Chromium execution."""
import argparse
import base64
import hashlib
import json
import pathlib
import subprocess
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', type=pathlib.Path, required=True)
    args = parser.parse_args()
    directory = args.workspace.resolve()
    if directory.exists() and any(directory.iterdir()):
        raise SystemExit('Use an empty patch verification directory')
    directory.mkdir(parents=True, exist_ok=True)
    lock = json.loads((ROOT/'engine/upstream.lock.json').read_text())
    manifest = json.loads((ROOT/'engine/patches/manifest.json').read_text())
    subprocess.run(['git', 'init', str(directory)], check=True, capture_output=True)
    subprocess.run(['git','-C',str(directory),'config','core.autocrlf','false'],check=True)
    for path, expected in manifest['upstreamFiles'].items():
        url = f'https://chromium.googlesource.com/chromium/src/+/{lock["commit"]}/{path}?format=TEXT'
        with urllib.request.urlopen(url, timeout=60) as response:
            content = base64.b64decode(response.read())
        if hashlib.sha256(content).hexdigest() != expected:
            raise SystemExit(f'Upstream file hash mismatch: {path}')
        target = directory/path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    for patch in manifest['patches']:
        file = ROOT/'engine/patches'/patch['file']
        subprocess.run(['git', '-C', str(directory), 'apply', '--check', str(file)], check=True)
        subprocess.run(['git', '-C', str(directory), 'apply', str(file)], check=True)
    print(json.dumps({'status':'patches-apply','commit':lock['commit'], 'patchCount':len(manifest['patches']), 'compiledChromium':False}))

if __name__ == '__main__':
    main()
