import json
import hashlib
import pathlib
import shutil
import subprocess
import sys
import tempfile
import argparse
from release_config import load_release
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('source',type=pathlib.Path)
parser.add_argument('--release')
args=parser.parse_args()
directory,lock,manifest=load_release(args.release)
source=args.source.resolve()
head=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
if head!=lock['commit']:raise SystemExit('Checkout revision does not match upstream lock')
if subprocess.check_output(['git','-C',str(source),'status','--porcelain'],text=True).strip():raise SystemExit('Checkout must be clean')
patches=[str(directory/'patches'/p['file']) for p in manifest['patches']]
# Later patches depend on earlier changes. Check the ordered series in a
# disposable fixture before changing the real checkout.
with tempfile.TemporaryDirectory(prefix='custom-browser-patches-') as fixture:
    fixture=pathlib.Path(fixture)
    subprocess.run(['git','init','--quiet',str(fixture)],check=True)
    subprocess.run(['git','-C',str(fixture),'config','core.autocrlf','false'],check=True)
    for name,expected in manifest['upstreamFiles'].items():
        original=source/name
        if hashlib.sha256(original.read_bytes()).hexdigest()!=expected:
            raise SystemExit(f'Upstream file hash mismatch: {name}')
        target=fixture/name
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(original,target)
    for patch in patches:
        subprocess.run(['git','-C',str(fixture),'apply','--check',patch],check=True)
        subprocess.run(['git','-C',str(fixture),'apply',patch],check=True)
for patch in patches:
    subprocess.run(['git','-C',str(source),'apply',patch],check=True)
print(f'Applied {len(patches)} source patches; build and browser tests still required')
