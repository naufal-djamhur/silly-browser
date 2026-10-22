import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile,mkdir,rm,readdir,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {zipSync,strToU8} from 'fflate';
import {installBrowser,selectRelease,safeArchivePath,hostPlatform,browserStatus} from '../sdk/js/browser-manager.mjs';
import {prepareExecutable,buildLaunchOptions} from '../sdk/js/index.mjs';

const sha=data=>createHash('sha256').update(data).digest('hex');
function fixture(entries={'chrome.exe':strToU8('fixture executable'),'locales/en-US.pak':strToU8('fixture locale')}) {
  const zip=Buffer.from(zipSync(entries));
  const files=Object.fromEntries(Object.entries(entries).map(([name,data])=>[name,{sha256:sha(data),size:data.length}]));
  const entry={revision:'fixture-1',platform:hostPlatform(),executable:'chrome.exe',chromiumVersion:'155.0.8059.80',url:'https://github.com/naufal-djamhur/silly-browser/releases/download/fixture-1/browser.zip',sha256:sha(zip),size:zip.length,files};
  return {zip,entry,catalog:{schemaVersion:1,defaultRevision:'fixture-1',releases:[entry]}};
}
async function temporary(run) {const root=await mkdtemp(join(tmpdir(),'silly-installer-test-'));try{return await run(root)}finally{await rm(root,{recursive:true,force:true})}}

test('both SDK catalogs agree and pending catalogs have no fake binary',async()=>{
  const js=JSON.parse(await readFile(new URL('../sdk/js/releases.json',import.meta.url)));
  const py=JSON.parse(await readFile(new URL('../sdk/python/custom_browser/releases.json',import.meta.url)));
  assert.deepEqual(js,py);
  if(js.defaultRevision===null){assert.equal(js.releases.length,0);assert.equal(browserStatus().downloadAvailable,false)}
  for(const entry of js.releases)selectRelease(js,entry.revision,entry.platform);
  assert.throws(()=>selectRelease({schemaVersion:1,defaultRevision:null,releases:[]}),/No published/);
});

test('portable path and release URL validation blocks traversal and unsafe metadata',()=>{
  for (const path of ['../outside','/absolute','C:/drive','a\\b','a/../b','NUL.txt','trailing.','a//b','.silly-browser-install.json']) assert.throws(()=>safeArchivePath(path));
  const {catalog}=fixture();
  for (const url of ['http://github.com/naufal-djamhur/silly-browser/releases/download/a/b.zip','https://example.com/b.zip','https://github.com/another/project/releases/download/a/b.zip']) {
    const copy=structuredClone(catalog);copy.releases[0].url=url;assert.throws(()=>selectRelease(copy));
  }
  assert.throws(()=>selectRelease(catalog,'../escape'));
  assert.throws(()=>selectRelease(catalog,undefined,'../../escape'));
});

test('a verified archive installs atomically and the cache is reused without network',()=>temporary(async root=>{
  const {zip,entry,catalog}=fixture();let calls=0;
  const options={cacheDir:root,releaseCatalog:catalog,fetchImpl:async()=>{calls++;return new Response(zip)}};
  const path=await installBrowser(options);
  assert.equal(await readFile(path,'utf8'),'fixture executable');
  assert.equal(await installBrowser({...options,fetchImpl:()=>{throw Error('network should not run')}}),path);
  assert.equal(calls,1);
  const parent=join(root,entry.revision);assert.deepEqual(await readdir(parent),[entry.platform]);
  await writeFile(path,'corrupt');
  await assert.rejects(installBrowser(options),/integrity failure/);
}));

test('checksum failure publishes no runtime and cleans its own temporary files/lock',()=>temporary(async root=>{
  const {zip,entry,catalog}=fixture();entry.sha256='0'.repeat(64);
  await assert.rejects(installBrowser({cacheDir:root,releaseCatalog:catalog,fetchImpl:async()=>new Response(zip)}),/checksum/);
  assert.deepEqual(await readdir(join(root,entry.revision)),[]);
}));

test('malicious ZIP entries cannot escape the cache or become a completed install',()=>temporary(async root=>{
  for (const attack of ['../outside','CHROME.exe']) {
    const {entry,catalog}=fixture();
    const zip=Buffer.from(zipSync({'chrome.exe':strToU8('fixture executable'),[attack]:strToU8('attack')}));
    entry.sha256=sha(zip);entry.size=zip.length;
    await assert.rejects(installBrowser({cacheDir:root,releaseCatalog:catalog,fetchImpl:async()=>new Response(zip)}));
    assert.deepEqual(await readdir(join(root,entry.revision)),[]);
  }
  await assert.rejects(stat(join(root,'outside')),{code:'ENOENT'});
}));

test('ZIP symlinks and unapproved download redirects are rejected',()=>temporary(async root=>{
  const {zip,entry,catalog}=fixture({'chrome.exe':strToU8('link target')});
  const central=zip.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));
  zip.writeUInt32LE(0xa1ff0000>>>0,central+38);entry.sha256=sha(zip);
  await assert.rejects(installBrowser({cacheDir:root,releaseCatalog:catalog,fetchImpl:async()=>new Response(zip)}),/entry type/);
  await assert.rejects(installBrowser({cacheDir:root,releaseCatalog:catalog,fetchImpl:async()=>new Response(null,{status:302,headers:{location:'https://example.com/evil'}})}),/official/);
}));

test('an existing installation lock is preserved',()=>temporary(async root=>{
  const {entry,catalog}=fixture();const parent=join(root,entry.revision);await mkdir(parent);
  const lock=join(parent,`${entry.platform}.lock`);await writeFile(lock,'another process');
  await assert.rejects(installBrowser({cacheDir:root,releaseCatalog:catalog}),/in progress/);
  assert.equal(await readFile(lock,'utf8'),'another process');
}));

test('explicit executable environment and early option validation preserve offline usage',async()=>{
  const old=process.env.SILLY_BROWSER_EXECUTABLE_PATH;process.env.SILLY_BROWSER_EXECUTABLE_PATH='owned-local-build.exe';
  try {
    assert.match((await prepareExecutable({})).executablePath,/owned-local-build\.exe$/);
    await assert.rejects(prepareExecutable({args:'invalid'}),/args/);
    await assert.rejects(prepareExecutable({engineMode:'baseline'}),/explicit/);
    assert.equal(buildLaunchOptions({executablePath:'explicit.exe'}).chromiumSandbox,true);
  } finally {if(old===undefined)delete process.env.SILLY_BROWSER_EXECUTABLE_PATH;else process.env.SILLY_BROWSER_EXECUTABLE_PATH=old}
});
