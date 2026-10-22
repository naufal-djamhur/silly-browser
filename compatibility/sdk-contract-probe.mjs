// Driver-boundary observations only. No Chromium process or remote endpoint is used.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import puppeteer from 'puppeteer-core';
import {buildLaunchOptions,normalizeProxy,launch,launchPersistentContext,launchContext,launchPuppeteer} from '../sdk/js/index.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const rows=[];
const base={executablePath:'not-launched.exe',engineMode:'baseline'};
const config={locale:'fr-FR',timezone:'Europe/Paris',viewport:{width:900,height:700}};
let captured,profile;
const fake=()=>({close:async()=>{},newContext:async options=>({options})});
const originals={launch:chromium.launch,persistent:chromium.launchPersistentContext,puppeteer:puppeteer.launch};
chromium.launch=async options=>{captured=options;return fake()};
chromium.launchPersistentContext=async(directory,options)=>{profile=directory;captured=options;return fake()};
puppeteer.launch=async options=>{profile=options.userDataDir;captured=options;return fake()};
async function observe(id,probe){rows.push({id,observation:await probe(),browserRuntimeValidated:false})}
const rejected=async action=>{try{await action();return {rejected:false}}catch(error){return {rejected:true,errorType:error.name,message:error.message}}};
try {
  await observe('js-browser-context-fields',async()=>{
    const result=await rejected(()=>launch({...base,...config}));
    assert(result.rejected);return {...result,silentFieldDropPrevented:true};
  });
  await observe('js-persistent-context-fields',async()=>{
    const directory=await mkdtemp(join(tmpdir(),'silly-contract-'));
    try {
      const context=await launchPersistentContext(directory,{...base,...config});
      assert.equal(captured.locale,config.locale);assert.equal(captured.timezoneId,config.timezone);
      assert.deepEqual(captured.viewport,config.viewport);await context.close();
      return {localeForwarded:true,timezoneForwarded:true,viewportForwarded:true};
    }finally{await rm(directory,{recursive:true,force:true})}
  });
  await observe('js-temporary-context-cleanup',async()=>{
    const context=await launchContext(base);const directory=profile;
    await context.close();
    await assert.rejects(stat(directory),error=>error.code==='ENOENT');
    return {profileRemovedAfterSuccessfulStubClose:true};
  });
  await observe('js-http-credential-routing',async()=>{
    const options=buildLaunchOptions({...base,proxy:'http://fixture-user:fixture-password@127.0.0.1:8080'});
    assert(!options.args.some(arg=>arg.includes('fixture-password')));
    assert(!options.proxy.server.includes('@'));assert.equal(options.proxy.password,'fixture-password');
    return {credentialsSeparatedFromServer:true,credentialPresentInProcessArgs:false,credentialsStillSensitiveInLaunchObject:true};
  });
  await observe('js-authenticated-socks5',()=>rejected(()=>normalizeProxy('socks5://fixture-user:fixture-password@127.0.0.1:1080')));
  await observe('js-geoip',()=>rejected(()=>buildLaunchOptions({...base,geoip:true})));
  await observe('js-browser-extensions',()=>rejected(()=>launch({...base,extensionPaths:['fixture-extension']})));
  await observe('js-puppeteer-locale',()=>rejected(()=>launchPuppeteer({...base,locale:'fr-FR'})));
  await observe('js-puppeteer-authenticated-http',()=>rejected(()=>launchPuppeteer({...base,proxy:'http://fixture-user:fixture-password@127.0.0.1:8080'})));
  await observe('js-puppeteer-proxy-bypass',async()=>{
    const browser=await launchPuppeteer({...base,proxy:{server:'http://127.0.0.1:8080',bypass:'localhost'}});
    assert(captured.args.includes('--proxy-server=http://127.0.0.1:8080'));
    const forwarded=captured.args.some(arg=>arg.startsWith('--proxy-bypass-list='));
    assert.equal(forwarded,true);await browser.close();
    return {proxyServerForwarded:true,explicitBypassForwarded:true};
  });
  await observe('js-raw-args-string',()=>rejected(()=>buildLaunchOptions({...base,args:'--example'})));
  await observe('js-context-options-passthrough',()=>rejected(()=>buildLaunchOptions({...base,contextOptions:{permissions:[]}})));
  await observe('js-sandbox-policy',()=>rejected(()=>buildLaunchOptions({...base,args:['--no-sandbox']})));
}finally{
  chromium.launch=originals.launch;chromium.launchPersistentContext=originals.persistent;puppeteer.launch=originals.puppeteer;
}
const sources={};
for(const path of ['sdk/js/index.mjs','sdk/js/context-options.mjs','sdk/js/puppeteer.mjs','sdk/js/profile-seed.mjs'])sources[path]=createHash('sha256').update(await readFile(join(root,path))).digest('hex');
const report={schemaVersion:1,scope:'Own SDK validation and stubbed driver-boundary observations; no browser runtime, comparator execution, downloads or external traffic',runtime:process.version,sources,observations:rows};
const out=process.argv.indexOf('--output');
if(out>=0){if(!process.argv[out+1])throw Error('--output requires a file');const path=resolve(process.argv[out+1]);await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report,null,2));
