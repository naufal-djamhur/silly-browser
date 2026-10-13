"""Verify the exact applied patch series before resuming a failed build."""
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

root=pathlib.Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:raise SystemExit('Usage: python build/verify_applied_checkout.py CHROMIUM_SRC')
source=pathlib.Path(sys.argv[1]).resolve()
lock=json.loads((root/'engine/upstream.lock.json').read_text())
head=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
if head!=lock['commit']:raise SystemExit('Checkout revision does not match upstream lock')
manifest=json.loads((root/'engine/patches/manifest.json').read_text())
patches=[root/'engine/patches'/p['file'] for p in manifest['patches']]
names=set(manifest['upstreamFiles'])
for patch in patches:
    names.update(re.findall(r'^\+\+\+ b/(.+)$',patch.read_text(),re.MULTILINE))
modified=set(subprocess.check_output(['git','-C',str(source),'diff','--name-only','HEAD'],text=True).splitlines())
untracked=set(subprocess.check_output(['git','-C',str(source),'ls-files','--others','--exclude-standard'],text=True).splitlines())
if not (modified|untracked).issubset(names):raise SystemExit('Checkout contains changes outside the expected patch series')
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
