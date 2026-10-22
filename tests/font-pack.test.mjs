import test from 'node:test';
import assert from 'node:assert/strict';
import {getFontDirectory,verifyFonts,fontManifest} from 'silly-browser-fonts';
import {buildLaunchOptions,verifyCustomBinary} from '../sdk/js/index.mjs';
import {createRequire,syncBuiltinESMExports} from 'node:module';
import {promisify} from 'node:util';

test('optional font pack contains ten unchanged, inventoried Noto faces',async()=>{
  assert.equal(fontManifest.fontLicense,'OFL-1.1');
  assert.equal(fontManifest.files.length,10);
  assert.equal((await verifyFonts()).verified,true);
  assert.deepEqual([...new Set(fontManifest.files.map(f=>f.family))].sort(),['Noto Sans','Noto Sans Mono','Noto Serif']);
});

test('font options map to a native directory flag and reject conflicting choices',()=>{
  const options=buildLaunchOptions({executablePath:'owned-engine.exe',fontPack:'noto-core'});
  assert(options.args.includes(`--custom-browser-fonts-dir=${getFontDirectory()}`));
  assert.throws(()=>buildLaunchOptions({executablePath:'owned-engine.exe',fontPack:'unknown'}),/Supported/);
  assert.throws(()=>buildLaunchOptions({executablePath:'owned-engine.exe',fontDirectory:'',fontPack:'noto-core'}),/Choose/);
  assert.throws(()=>buildLaunchOptions({executablePath:'owned-engine.exe',fontPack:'noto-core',args:['--custom-browser-fonts-dir=duplicate']}),/Duplicate/);
  assert.throws(()=>buildLaunchOptions({executablePath:'stock.exe',engineMode:'baseline',fontPack:'noto-core'}),/compiled custom/);
});

test('a stubbed handshake rejects a binary without the native font capability',async()=>{
  const childProcess=createRequire(import.meta.url)('node:child_process'),original=childProcess.execFile;
  const stub=()=>{throw Error('The process stub must not start an executable')};
  stub[promisify.custom]=async()=>({stdout:JSON.stringify({engine:'custom-browser',policyVersion:1,sourcePatchCount:5,capabilities:[]})});
  childProcess.execFile=stub;syncBuiltinESMExports();
  try {await assert.rejects(verifyCustomBinary({executablePath:'not-executed.exe',args:['--custom-browser-fonts-dir=fixture']}),/font-directory/)}
  finally {childProcess.execFile=original;syncBuiltinESMExports()}
});
