"""Pin selected public wrapper source contracts without importing or executing it."""
import argparse
import ast
import hashlib
import json
import pathlib
import re
import subprocess

PIN='160f56da85860e89f0e7d9bfdc80266b984057d5'
FILES=['cloakbrowser/__init__.py','cloakbrowser/browser.py','cloakbrowser/config.py','cloakbrowser/geoip.py',
       'js/src/index.ts','js/src/types.ts','js/src/playwright.ts','js/src/puppeteer.ts','js/src/proxy.ts',
       'js/src/profile-seed.ts','js/src/config.ts','js/src/args.ts','js/src/fonts.ts','js/src/download.ts']
parser=argparse.ArgumentParser();parser.add_argument('--reference',type=pathlib.Path,required=True);parser.add_argument('--output',type=pathlib.Path,required=True)
args=parser.parse_args();root=args.reference.resolve()
def git(*argv):return subprocess.check_output(['git','-C',str(root),*argv],text=True).strip()
if git('rev-parse','HEAD')!=PIN:raise SystemExit('Reference revision differs from the reviewed pin')
if git('status','--porcelain','--',*FILES):raise SystemExit('Selected reference files have local changes')
sources={}
for name in FILES:
    payload=(root/name).read_bytes()
    sources[name]={'sha256':hashlib.sha256(payload).hexdigest(),'gitBlob':git('rev-parse',f'HEAD:{name}')}
functions=[]
tree=ast.parse((root/'cloakbrowser/browser.py').read_text(encoding='utf-8'))
for node in tree.body:
    if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)) and node.name in ('launch','launch_async','launch_context','launch_context_async','launch_persistent_context','launch_persistent_context_async'):
        functions.append({'name':node.name,'async':isinstance(node,ast.AsyncFunctionDef),'line':node.lineno,'signature':ast.unparse(node.args)})
interfaces={};current=None
for number,line in enumerate((root/'js/src/types.ts').read_text(encoding='utf-8').splitlines(),1):
    match=re.match(r'export interface (Launch\w+)',line)
    if match:current=match.group(1);interfaces[current]=[]
    elif current and line=='}':current=None
    elif current:
        field=re.match(r'^  (\w+)\??:',line)
        if field:interfaces[current].append({'name':field.group(1),'line':number})
report={'schemaVersion':1,'referenceRepository':'https://github.com/CloakHQ/CloakBrowser','referenceRevision':PIN,
        'scope':'Selected public SDK launch signatures, typed fields and file identities; static source observations, no wrapper or comparator execution; not a native patch inventory',
        'sources':sources,'pythonLaunchFunctions':functions,'jsLaunchInterfaces':interfaces,'binaryRuntimeValidated':False}
args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'sourceFiles':len(sources),'pythonLaunchFunctions':len(functions),'jsInterfaces':len(interfaces),'referenceRevision':PIN}))
