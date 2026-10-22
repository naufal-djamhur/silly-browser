"""Create pinned SDK metadata for an already-packaged, qualified Windows ZIP.

This reads an existing complete runtime ZIP and a successful local pipeline
receipt. It never builds Chromium, uploads assets, edits SDK catalogs or publishes.
Validate the extracted release layout before publishing; hashes are not signatures.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'sdk/python'))
from custom_browser.browser_manager import safe_archive_path, select_release, MAX_ARCHIVE, MAX_TOTAL


def create_catalog(archive, status, revision):
    if status.get('state')!='integration-passed' or status.get('compiled') is not True or status.get('validated') is not True:
        raise ValueError('A successful completed native qualification receipt is required')
    version=status.get('version')
    if version!='155.0.8059.80':
        raise ValueError('This first release path only supports the pinned Windows x64 Chromium 155 build')
    if not 0<archive.stat().st_size<=MAX_ARCHIVE:
        raise ValueError('Runtime ZIP exceeds installer limits')
    files,seen,total={},set(),0
    with zipfile.ZipFile(archive) as bundle:
        if len(bundle.infolist())>20000:raise ValueError('Too many archive entries')
        for member in bundle.infolist():
            name=member.filename.rstrip('/')
            safe_archive_path(name)
            if name.lower() in seen:raise ValueError('Duplicate ZIP entry')
            seen.add(name.lower())
            kind=(member.external_attr>>16)&0xf000
            if kind not in (0,0x4000,0x8000) or member.flag_bits&1:raise ValueError('Unsupported ZIP member')
            if member.is_dir():continue
            if name.split('/')[0] in ('obj','gen') or name.endswith(('.pdb','.obj','.ninja')):
                raise ValueError('Package a staged runtime, not a Chromium build tree')
            total+=member.file_size
            if total>MAX_TOTAL or member.file_size>4*1024**3:raise ValueError('Runtime exceeds installer limits')
            digest=hashlib.sha256()
            with bundle.open(member) as source:
                for chunk in iter(lambda:source.read(1024*1024),b''):digest.update(chunk)
            files[name]={'size':member.file_size,'sha256':digest.hexdigest()}
    required={'chrome.exe','chrome.dll','icudtl.dat','resources.pak','locales/en-US.pak','LICENSE.chromium.html'}
    if not required<=files.keys():raise ValueError('Missing required runtime files or Chromium third-party notices')
    if files['chrome.exe']['sha256']!=status.get('binarySha256') or files['chrome.dll']['sha256']!=status.get('runtimeSha256'):
        raise ValueError('Runtime ZIP does not match the qualified executable/DLL')
    digest=hashlib.sha256()
    with archive.open('rb') as source:
        for chunk in iter(lambda:source.read(1024*1024),b''):digest.update(chunk)
    filename=f'silly-browser-{revision}-windows-x64.zip'
    entry={'revision':revision,'platform':'windows-x64','chromiumVersion':version,
           'executable':'chrome.exe','size':archive.stat().st_size,'sha256':digest.hexdigest(),
           'url':f'https://github.com/naufal-djamhur/silly-browser/releases/download/browser-{revision}/{filename}',
           'files':files}
    catalog={'schemaVersion':1,'defaultRevision':revision,'releases':[entry]}
    select_release(catalog,host='windows-x64')
    return catalog


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive',type=Path,required=True)
    parser.add_argument('--qualification-status',type=Path,required=True)
    parser.add_argument('--revision',required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    catalog=create_catalog(args.archive,json.loads(args.qualification_status.read_text(encoding='utf-8-sig')),args.revision)
    with args.output.open('x',encoding='utf-8') as output:json.dump(catalog,output,indent=2);output.write('\n')
    print(f'Wrote {args.output}. Review, upload the matching ZIP, then update both SDK catalogs before publishing packages.')


if __name__=='__main__':main()
