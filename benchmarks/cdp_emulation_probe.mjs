// Owned protocol contract probe. No external detectors, automation-indicator
// changes, identity overrides or third-party scripts are involved.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {chromium} from 'playwright-core';

const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);assert(i>=0&&args[i+1],`${name} is required`);return args[i+1]};
const engines=JSON.parse(await readFile(option('--engines'),'utf8'));
assert(Array.isArray(engines)&&engines.length>0,'At least one engine is required');
const output=resolve(option('--output'));
await mkdir(output,{recursive:false});
const hash=async path=>{const h=createHash('sha256');for await(const b of createReadStream(path))h.update(b);return h.digest('hex')};
const report={schemaVersion:1,startedAt:new Date().toISOString(),scope:'Owned CDP timezone/locale validation and restoration; no external detector or concealment workflow',engines:[],observations:[],completed:false};
const save=()=>writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
const serve=(req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Owned CDP lifecycle fixture</title><button onclick="this.textContent=\'handled\'">Ready</button>')};
const primary=createServer(serve),secondary=createServer(serve);
await new Promise(resolve=>primary.listen(0,'127.0.0.1',resolve));
await new Promise(resolve=>secondary.listen(0,'127.0.0.2',resolve));
const url=`http://127.0.0.1:${primary.address().port}`;
const otherUrl=`http://127.0.0.2:${secondary.address().port}`;
const sample=page=>page.evaluate(()=>({locale:Intl.DateTimeFormat().resolvedOptions().locale,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,jan:new Date('2026-01-15T12:00:00Z').getTimezoneOffset(),jul:new Date('2026-07-15T12:00:00Z').getTimezoneOffset()}));
async function command(session,name,params){
  try{return {accepted:true,result:await session.send(name,params)}}
  catch(error){return {accepted:false,error:error.message}}
}
try{
  for(const engine of engines){
    const executablePath=resolve(engine.executable);
    assert.equal(await hash(executablePath),engine.exeSha256);
    assert.equal(await hash(join(dirname(executablePath),'chrome.dll')),engine.dllSha256);
    const identity={...engine};delete identity.executable;report.engines.push(identity);
    const configurations=[['default',[]],...((engine.nativeEnvironment===true||engine.id==='silly-patch-six')?[['native-environment',['--custom-browser-locale=fr-FR','--custom-browser-timezone=Europe/Paris']]]:[])];
    for(const [configuration,launchArgs] of configurations)for(const headless of [false,true]){
      const mode=headless?'headless':'headed';
      const observation={engine:engine.id,configuration,mode,status:'error',steps:{},pageErrors:[],crashes:[]};
      let browser;
      try{
        browser=await chromium.launch({executablePath,headless,chromiumSandbox:true,args:launchArgs});
        assert.equal(browser.version(),engine.version);
        const owner=await browser.newBrowserCDPSession();
        const version=await owner.send('Browser.getVersion');
        observation.protocolVersion=version.protocolVersion;observation.revision=version.revision;await owner.detach();
        const context=await browser.newContext();
        const otherContext=await browser.newContext();
        try{
          const page=await context.newPage(),control=await otherContext.newPage();
          page.on('pageerror',error=>observation.pageErrors.push(error.message));page.on('crash',()=>observation.crashes.push(true));
          await page.goto(url);await control.goto(url);
          page.setDefaultTimeout(5000);
          const baseline=await sample(page),otherBaseline=await sample(control);
          observation.baseline=baseline;observation.otherContextBaseline=otherBaseline;
          const session=await context.newCDPSession(page);
          observation.steps.initialInvalidTimezone=await command(session,'Emulation.setTimezoneOverride',{timezoneId:'Invalid/DefinitelyNotAZone'});
          assert.equal(observation.steps.initialInvalidTimezone.accepted,false);
          observation.steps.validTimezone=await command(session,'Emulation.setTimezoneOverride',{timezoneId:'Pacific/Honolulu'});
          assert(observation.steps.validTimezone.accepted);
          observation.steps.afterValidTimezone=await sample(page);
          assert.equal(observation.steps.afterValidTimezone.timezone,'Pacific/Honolulu');
          observation.steps.sameTimezone=await command(session,'Emulation.setTimezoneOverride',{timezoneId:'Pacific/Honolulu'});
          assert(observation.steps.sameTimezone.accepted);
          observation.steps.equivalentTimezone=await command(session,'Emulation.setTimezoneOverride',{timezoneId:'US/Hawaii'});
          assert(observation.steps.equivalentTimezone.accepted);
          assert.equal((await sample(page)).timezone,'Pacific/Honolulu');
          observation.steps.validTimezoneUpdate=await command(session,'Emulation.setTimezoneOverride',{timezoneId:'America/New_York'});
          assert(observation.steps.validTimezoneUpdate.accepted);
          assert.equal((await sample(page)).timezone,'America/New_York');
          assert((await command(session,'Emulation.setTimezoneOverride',{timezoneId:'Pacific/Honolulu'})).accepted);
          await page.goto(otherUrl);
          observation.steps.validOnlyCrossSiteNavigation=await sample(page);
          observation.validOnlyTimezonePreservedAcrossNavigation=observation.steps.validOnlyCrossSiteNavigation.timezone==='Pacific/Honolulu';
          await page.goto(url);
          observation.steps.validOnlyReturnNavigation=await sample(page);
          observation.validOnlyTimezonePreservedOnReturn=observation.steps.validOnlyReturnNavigation.timezone==='Pacific/Honolulu';
          observation.steps.invalidTimezoneUpdate=await command(session,'Emulation.setTimezoneOverride',{timezoneId:'Invalid/DefinitelyNotAZone'});
          observation.steps.afterInvalidTimezoneUpdate=await sample(page);
          observation.invalidTimezoneUpdateAccepted=observation.steps.invalidTimezoneUpdate.accepted;
          observation.invalidTimezoneUpdateChangedEffectiveValue=observation.steps.afterInvalidTimezoneUpdate.timezone!=='Pacific/Honolulu';
          if(!observation.invalidTimezoneUpdateAccepted)assert.match(observation.steps.invalidTimezoneUpdate.error,/Invalid timezone id/);
          observation.steps.otherContextAfterTimezoneUpdate=await sample(control);
          assert.deepEqual(observation.steps.otherContextAfterTimezoneUpdate,otherBaseline);
          await page.goto(otherUrl);
          observation.steps.afterCrossSiteNavigation=await sample(page);
          observation.lastValidTimezonePreservedAcrossNavigation=observation.steps.afterCrossSiteNavigation.timezone==='Pacific/Honolulu';
          // Clear before subsequent locale checks; invalid timezone state must
          // not contaminate the independent locale lifecycle observations.
          observation.steps.clearTimezone=await command(session,'Emulation.setTimezoneOverride',{timezoneId:''});
          assert(observation.steps.clearTimezone.accepted);
          observation.steps.afterTimezoneReset=await sample(page);
          assert.deepEqual(observation.steps.afterTimezoneReset,baseline);
          observation.steps.icuStyleLocale=await command(session,'Emulation.setLocaleOverride',{locale:'de_DE'});
          observation.steps.afterIcuStyleLocale=await sample(page);
          observation.steps.clearLocaleAfterIcu=await command(session,'Emulation.setLocaleOverride',{locale:''});
          assert(observation.steps.clearLocaleAfterIcu.accepted);
          observation.steps.bcp47Locale=await command(session,'Emulation.setLocaleOverride',{locale:'de-DE'});
          assert(observation.steps.bcp47Locale.accepted);
          observation.steps.afterValidLocale=await sample(page);
          assert.equal(observation.steps.afterValidLocale.locale,'de-DE');
          observation.steps.invalidLocaleUpdate=await command(session,'Emulation.setLocaleOverride',{locale:'not a locale!!!'});
          observation.steps.afterInvalidLocaleUpdate=await sample(page);
          assert.equal(observation.steps.invalidLocaleUpdate.accepted,false);
          assert.equal(observation.steps.afterInvalidLocaleUpdate.locale,'de-DE');
          observation.steps.clearLocale=await command(session,'Emulation.setLocaleOverride',{locale:''});
          assert(observation.steps.clearLocale.accepted);
          observation.steps.afterLocaleReset=await sample(page);
          assert.deepEqual(observation.steps.afterLocaleReset,baseline);
          observation.steps.otherContextAfterLocaleReset=await sample(control);
          assert.deepEqual(observation.steps.otherContextAfterLocaleReset,otherBaseline);
          // Detaching must release a still-active temporary timezone override.
          observation.steps.validBeforeDetach=await command(session,'Emulation.setTimezoneOverride',{timezoneId:'Europe/Berlin'});
          assert(observation.steps.validBeforeDetach.accepted);
          await session.detach();
          observation.steps.afterDetach=await sample(page);assert.deepEqual(observation.steps.afterDetach,baseline);
          await page.locator('button').click();assert.equal(await page.locator('button').textContent(),'handled');
          assert.deepEqual(observation.pageErrors,[]);assert.deepEqual(observation.crashes,[]);
          observation.rendererUsable=true;observation.status='collected';
        }finally{await otherContext.close();await context.close()}
      }catch(error){observation.error=error.message}
      finally{
        if(browser)await browser.close();report.observations.push(observation);await save();
        console.log(`${engine.id} ${configuration} ${mode}: ${observation.status}; invalid timezone update accepted=${observation.invalidTimezoneUpdateAccepted}; persisted=${observation.lastValidTimezonePreservedAcrossNavigation}`);
      }
    }
    identity.runtimeUnchanged=await hash(executablePath)===engine.exeSha256&&await hash(join(dirname(executablePath),'chrome.dll'))===engine.dllSha256;
    assert(identity.runtimeUnchanged);
  }
  report.completed=true;
}finally{
  await new Promise(resolve=>primary.close(resolve));await new Promise(resolve=>secondary.close(resolve));
  report.completedAt=new Date().toISOString();report.collectionErrors=report.observations.filter(x=>x.status==='error').length;
  report.invalidTimezoneUpdateAccepted=report.observations.filter(x=>x.invalidTimezoneUpdateAccepted).length;
  report.lostLastValidTimezoneAfterNavigation=report.observations.filter(x=>x.status==='collected'&&!x.lastValidTimezonePreservedAcrossNavigation).length;
  await save();
}
if(report.collectionErrors)process.exitCode=1;
// Optional RED/GREEN gate for the proposed C++ validation fix. A successful
// diagnostic collection does not mean the protocol contract is correct.
if(args.includes('--expect-fixed')&&report.observations.some(x=>
  x.status!=='collected'||x.invalidTimezoneUpdateAccepted||x.invalidTimezoneUpdateChangedEffectiveValue||
  !x.validOnlyTimezonePreservedAcrossNavigation||!x.validOnlyTimezonePreservedOnReturn||
  !x.lastValidTimezonePreservedAcrossNavigation))process.exitCode=1;
