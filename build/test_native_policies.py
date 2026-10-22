"""Run standalone native policy tests using existing Chromium build artifacts.

Does not invoke GN, Ninja, Siso or the browser. Requires Windows and vcvars64.
"""
import argparse
import hashlib
import json
import os
import pathlib
import shutil
import subprocess

ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=pathlib.Path,required=True)
parser.add_argument('--vcvars',type=pathlib.Path,required=True)
parser.add_argument('--output',type=pathlib.Path,required=True)
args=parser.parse_args()
if os.name!='nt':raise SystemExit('Windows native policy runner requires Windows')
source=args.source.resolve();output=args.output.resolve();vcvars=args.vcvars.resolve()
if output.exists():raise SystemExit('Use a new output directory to preserve earlier evidence')
compiler=source/'third_party/llvm-build/Release+Asserts/bin/clang-cl.exe'
build=source/'out/SillyBrowserStable'
icu=[build/'obj/third_party/icu/icui18n.lib',build/'obj/third_party/icu/icuuc.lib']
objects=sorted((build/'obj/buildtools/third_party/libc++/libc++').glob('*.obj'))
font=source/'third_party/blink/web_tests/resources/Ahem.ttf'
for path in [compiler,vcvars,font,build/'icudtl.dat',*icu]:
    if not path.is_file():raise SystemExit(f'Missing existing prerequisite: {path}; this runner will not build it')
if not objects:raise SystemExit('No existing libc++ objects; browser build remains untouched')
for path in [ROOT,source,output,vcvars]:
    if any(char in str(path) for char in '%!\r\n"'):
        raise SystemExit('Unsupported command-script metacharacter in path')
output.mkdir(parents=True)
valid=output/'valid-fonts';invalid=output/'invalid-fonts';valid.mkdir();invalid.mkdir()
shutil.copyfile(font,valid/'Ahem.ttf');(invalid/'broken.ttf').write_bytes(b'not a font')
rsp=output/'libcpp.rsp';rsp.write_text('\n'.join(subprocess.list2cmdline([str(path)]) for path in objects))
def command(argv):return subprocess.list2cmdline([str(value) for value in argv])
def build_program(name,extra):
    script=output/(name+'.cmd')
    lines=['@echo off',f'call "{vcvars}" >nul','if errorlevel 1 exit /b %errorlevel%']
    if name=='environment':
        lines += [command(['lib','/nologo','/OUT:'+str(output/'test-libcpp.lib'),'@'+str(rsp)]),'if errorlevel 1 exit /b %errorlevel%']
    flags=[compiler,'-fuse-ld=lld','/nologo','/EHsc','/std:c++20','/MT','/I'+str(source)]
    test={'environment':'native_environment_policy_test.cc','fonts':'native_font_directory_test.cc','seed':'native_seed_policy_test.cc'}[name]
    flags += [ROOT/'tests'/test,'/Fo'+str(output/(name+'.obj')),'/Fe'+str(output/(name+'.exe'))]
    flags += extra
    lines.append(command(flags));script.write_text('\n'.join(lines)+'\n')
    result=subprocess.run(['cmd.exe','/d','/c',str(script)],capture_output=True,text=True,creationflags=subprocess.CREATE_NO_WINDOW)
    (output/(name+'-compile.log')).write_text(result.stdout+result.stderr)
    if result.returncode:raise RuntimeError(f'{name} test compilation failed; see {name}-compile.log')
build_program('environment',['/DU_STATIC_IMPLEMENTATION','/I'+str(source/'third_party/icu/source/common'),'/I'+str(source/'third_party/icu/source/i18n'),'/link',*icu,output/'test-libcpp.lib','advapi32.lib'])
build_program('fonts',['/link','dwrite.lib'])
build_program('seed',[])
checks=[]
for name,arguments in [('environment',[build/'icudtl.dat']),('fonts',[valid,invalid]),('seed',[])]:
    result=subprocess.run([str(output/(name+'.exe')),*map(str,arguments)],capture_output=True,text=True,creationflags=subprocess.CREATE_NO_WINDOW,timeout=30)
    (output/(name+'-run.log')).write_text(result.stdout+result.stderr)
    checks.append({'program':name,'exitCode':result.returncode})
    print(name+': '+('passed' if result.returncode==0 else 'failed'))
header_pairs={'engine/native_locale_policy.h':'chrome/common/custom_browser_locale_policy.h','engine/native_font_directory_win.h':'ui/gfx/win/custom_browser_font_directory.h'}
hashes={}
for own,native in header_pairs.items():
    assert (ROOT/own).read_bytes()==(source/native).read_bytes(),native
    hashes[own]=hashlib.sha256((ROOT/own).read_bytes()).hexdigest()
report={'scope':'Three standalone native policy executables only; no browser build or runtime qualification','checks':checks,'headerSha256':hashes,'icuDataSha256':hashlib.sha256((build/'icudtl.dat').read_bytes()).hexdigest(),'fontFixtureSha256':hashlib.sha256(font.read_bytes()).hexdigest(),'reusedLibcppObjects':len(objects),'fullBrowserBuildStarted':False}
(output/'results.json').write_text(json.dumps(report,indent=2)+'\n')
raise SystemExit(any(row['exitCode'] for row in checks))
