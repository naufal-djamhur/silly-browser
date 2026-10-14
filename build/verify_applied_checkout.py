"""Verify the exact applied patch series before resuming a failed build."""
import hashlib
import json
import pathlib
import re
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
release_root,lock,manifest=load_release(args.release)
source=args.source.resolve()
head=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
if head!=lock['commit']:raise SystemExit('Checkout revision does not match upstream lock')
patches=[release_root/'patches'/p['file'] for p in manifest['patches']]
names=set(manifest['upstreamFiles'])
for patch in patches:
    names.update(re.findall(r'^\+\+\+ b/(.+)$',patch.read_text(),re.MULTILINE))
modified=set(subprocess.check_output(['git','-C',str(source),'diff','--name-only','HEAD'],text=True).splitlines())
untracked=set(subprocess.check_output(['git','-C',str(source),'ls-files','--others','--exclude-standard'],text=True).splitlines())
if not (modified|untracked).issubset(names):raise SystemExit('Checkout contains changes outside the expected patch series')
for prefix,dependency in manifest.get('dependencyRepositories',{}).items():
    checkout=source/prefix
    if subprocess.check_output(['git','-C',str(checkout),'rev-parse','HEAD'],text=True).strip()!=dependency['commit']:
        raise SystemExit(f'Dependency revision mismatch: {prefix}')
    changed=set(subprocess.check_output(['git','-C',str(checkout),'diff','--name-only','HEAD'],text=True).splitlines())
    changed.update(subprocess.check_output(['git','-C',str(checkout),'ls-files','--others','--exclude-standard'],text=True).splitlines())
    if not {prefix+'/'+name for name in changed}.issubset(names):
        raise SystemExit(f'Unexpected dependency changes: {prefix}')
with tempfile.TemporaryDirectory(prefix='custom-browser-resume-') as directory:
    fixture=pathlib.Path(directory)
    subprocess.run(['git','init','--quiet',str(fixture)],check=True)
    subprocess.run(['git','-C',str(fixture),'config','core.autocrlf','false'],check=True)
    for name in names:
        target=fixture/name
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(source/name,target)
    for patch in reversed(patches):
        subprocess.run(['git','-C',str(fixture),'apply','--reverse','--check',str(patch)],check=True)
        subprocess.run(['git','-C',str(fixture),'apply','--reverse',str(patch)],check=True)
    for name,expected in manifest['upstreamFiles'].items():
        if hashlib.sha256((fixture/name).read_bytes()).hexdigest()!=expected:
            raise SystemExit(f'Unexpected source changes in {name}')
print(f'Verified the exact {len(patches)}-patch series; safe to resume this checkout')
