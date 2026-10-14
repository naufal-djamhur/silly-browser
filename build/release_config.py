"""Select an exact ordered patch series without accepting arbitrary paths."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]

def load_release(version=None):
    if version is not None and not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+', version):
        raise ValueError('Release must be an exact Chromium version')
    directory = ROOT/'engine' if version is None else ROOT/'engine/releases'/version
    lock = json.loads((directory/'upstream.lock.json').read_text())
    manifest = json.loads((directory/'patches/manifest.json').read_text())
    if version is not None and lock['tag'] != version:
        raise ValueError('Release directory and lock revision disagree')
    if not re.fullmatch('[a-f0-9]{40}', lock['commit']):
        raise ValueError('Lock requires a full source commit')
    return directory, lock, manifest
