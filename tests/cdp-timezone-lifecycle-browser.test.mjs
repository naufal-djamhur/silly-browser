import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {basename,dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {chromium} from 'playwright-core';

const enginesFile=process.env.CUSTOM_CDP_LIFECYCLE_ENGINES;
const output=resolve(process.env.CUSTOM_CDP_LIFECYCLE_REPORT??`artifacts/cdp-lifecycle/${Date.now()}`);
const hash=async path=>{const h=createHash('sha256');for await(const b of createReadStream(path))h.update(b);return h.digest('hex')};
const evaluateEnvironment=()=>({timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,locale:Intl.DateTimeFormat().resolvedOptions().locale,jan:new Date('2026-01-15T12:00:00Z').getTimezoneOffset(),jul:new Date('2026-07-15T12:00:00Z').getTimezoneOffset()});
const sample=page=>page.evaluate(evaluateEnvironment);
const command=async(session,timezoneId)=>{
  try{return {accepted:true,result:await session.send('Emulation.setTimezoneOverride',{timezoneId})}}
  catch(error){return {accepted:false,error:error.message}}
};
const invalidIds=['Invalid/DefinitelyNotAZone','Pacific/Honolulu\0Invalid','America/New_York\0Invalid','Europe/Paris\0Invalid','UTC\0Invalid'];

test('owned CDP timezone lifecycle contracts in both display modes',{
  skip:!enginesFile,timeout:600000,
},async t=>{
  const engines=JSON.parse((await readFile(enginesFile,'utf8')).replace(/^\uFEFF/,''));
  assert(Array.isArray(engines)&&engines.length>0);
  await mkdir(dirname(output),{recursive:true});await mkdir(output,{recursive:false});
  const report={schemaVersion:1,startedAt:new Date().toISOString(),scope:'Owned CDP validation, lifecycle and cleanup; no external detectors or automation-status changes',engines:[],observations:[],completed:false};
  const save=()=>writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  const serve=(request,response)=>{
    response.setHeader('Cache-Control','no-store');
    if(request.url==='/worker.js'){
      response.setHeader('Content-Type','application/javascript');
      response.end(`onmessage=()=>postMessage((${evaluateEnvironment})())`);return;
    }
    response.setHeader('Content-Type','text/html');
    response.end('<!doctype html><title>Owned CDP lifecycle</title><button onclick="this.textContent=\'handled\'">Ready</button>');
  };
  const primary=createServer(serve),secondary=createServer(serve);
  await new Promise(resolve=>primary.listen(0,'127.0.0.1',resolve));
  await new Promise(resolve=>secondary.listen(0,'127.0.0.2',resolve));
  const url=`http://127.0.0.1:${primary.address().port}`;
  const otherUrl=`http://127.0.0.2:${secondary.address().port}`;
  const scenarios=[
    ['interleaved-invalid-updates',async x=>{
      for(const zone of ['Pacific/Honolulu','America/New_York']){
        x.check((await command(x.session,zone)).accepted,`valid ${zone} accepted`);
        const valid=await sample(x.page);
        for(const invalid of invalidIds){
          const result=await command(x.session,invalid),after=await sample(x.page);
          x.data.updates??=[];x.data.updates.push({validZone:zone,invalid,result,after});
          x.check(!result.accepted,`invalid update rejected: ${JSON.stringify(invalid)}`);
          x.check(JSON.stringify(after)===JSON.stringify(valid),'invalid update preserves effective environment');
          await command(x.session,zone);
        }
      }
      await command(x.session,'');x.checkEqual(await sample(x.page),x.baseline,'clear restores baseline');
    }],
    ['rejected-update-cross-site-and-return',async x=>{
      await command(x.session,'Pacific/Honolulu');
      x.data.invalid=await command(x.session,'Invalid/DefinitelyNotAZone');
      x.check(!x.data.invalid.accepted,'invalid update rejected');
      await x.page.goto(otherUrl);x.data.away=await sample(x.page);
      x.check(x.data.away.timezone==='Pacific/Honolulu','last valid zone preserved away');
      await x.page.goto(url);x.data.returned=await sample(x.page);
      x.check(x.data.returned.timezone==='Pacific/Honolulu','last valid zone preserved on return');
    }],
    ['rejected-update-reload-and-document-replacement',async x=>{
      await command(x.session,'Pacific/Honolulu');
      x.data.invalid=await command(x.session,'Invalid/DefinitelyNotAZone');
      x.check(!x.data.invalid.accepted,'invalid update rejected');
      await x.page.reload();x.data.reload=await sample(x.page);
      x.check(x.data.reload.timezone==='Pacific/Honolulu','reload keeps accepted zone');
      await x.page.evaluate(()=>{document.open();document.write('<!doctype html><title>Replacement</title><button onclick="this.textContent=\'handled\'">Ready</button>');document.close()});
      x.data.replacement=await sample(x.page);
      x.check(x.data.replacement.timezone==='Pacific/Honolulu','replacement keeps accepted zone');
    }],
    ['detach-after-rejected-update',async x=>{
      await command(x.session,'Pacific/Honolulu');
      x.data.invalid=await command(x.session,'Invalid/DefinitelyNotAZone');
      x.check(!x.data.invalid.accepted,'invalid update rejected');
      await x.session.detach();x.detached=true;
      x.data.restored=await sample(x.page);x.checkEqual(x.data.restored,x.baseline,'detach restores baseline');
    }],
    ['close-target-and-create-target',async x=>{
      await command(x.session,'Pacific/Honolulu');await x.page.close();
      x.detached=true;x.page=await x.context.newPage();await x.page.goto(url);
      x.data.newTarget=await sample(x.page);x.checkEqual(x.data.newTarget,x.baseline,'closed target does not leak override');
    }],
    ['persistent-profile-relaunch',async x=>{
      const profile=await mkdtemp(join(tmpdir(),'silly-cdp-lifecycle-'));
      let context;
      try{
        context=await chromium.launchPersistentContext(profile,{executablePath:x.executable,headless:x.headless,chromiumSandbox:true,args:x.launchArgs});
        let page=context.pages()[0];await page.goto(url);
        const baseline=await sample(page),session=await context.newCDPSession(page);
        await page.evaluate(()=>localStorage.setItem('owned-cdp-lifecycle','retained'));
        x.check((await command(session,'Pacific/Honolulu')).accepted,'persistent target valid override accepted');
        await context.close();context=undefined;
        context=await chromium.launchPersistentContext(profile,{executablePath:x.executable,headless:x.headless,chromiumSandbox:true,args:x.launchArgs});
        page=context.pages()[0];await page.goto(url);x.data.relaunch=await sample(page);
        x.data.storage=await page.evaluate(()=>localStorage.getItem('owned-cdp-lifecycle'));
        x.checkEqual(x.data.relaunch,baseline,'temporary CDP state does not persist through browser relaunch');
        x.check(x.data.storage==='retained','persistent storage retained');
      }finally{
        if(context)await context.close();
        assert.equal(dirname(profile),resolve(tmpdir()));assert(basename(profile).startsWith('silly-cdp-lifecycle-'));
        await rm(profile,{recursive:true,force:true});
      }
    }],
    ['multiple-client-ownership',async x=>{
      const second=await x.context.newCDPSession(x.page);
      try{
        await command(x.session,'Pacific/Honolulu');
        x.data.conflict=await command(second,'Europe/Berlin');
        x.check(!x.data.conflict.accepted,'conflicting non-owner update is rejected');
        x.check((await sample(x.page)).timezone==='Pacific/Honolulu','conflict leaves owner state unchanged');
        x.data.sameZone=await command(second,'Pacific/Honolulu');
        x.check(x.data.sameZone.accepted,'matching request accepted under current ownership model');
        await x.session.detach();x.detached=true;x.data.afterOwnerDetach=await sample(x.page);
        x.data.note='Matching second-client acceptance does not establish independent ownership; post-owner detach is observational.';
        x.data.reacquire=await command(second,'Europe/Berlin');
        x.check(x.data.reacquire.accepted,'remaining client acquires after owner detach');
        x.check((await sample(x.page)).timezone==='Europe/Berlin','reacquired value effective');
      }finally{await second.detach()}
      x.checkEqual(await sample(x.page),x.baseline,'last client detach restores baseline');
    }],
    ['worker-creation-and-restoration',async x=>{
      const workerSample=()=>x.page.evaluate(()=>new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Error('Owned worker timeout')),5000);
        window.lifecycleWorker.onmessage=event=>{clearTimeout(timer);resolve(event.data)};
        window.lifecycleWorker.postMessage('sample');
      }));
      await x.page.evaluate(()=>{window.lifecycleWorker=new Worker('/worker.js')});
      x.data.before=await workerSample();x.checkEqual(x.data.before,x.baseline,'worker gets native baseline');
      await command(x.session,'Pacific/Honolulu');x.data.during=await workerSample();
      await x.page.evaluate(()=>{window.lifecycleWorker.terminate();window.lifecycleWorker=new Worker('/worker.js')});
      x.data.recreated=await workerSample();
      await command(x.session,'');
      await x.page.waitForFunction(async baseline=>new Promise(resolve=>{
        const timer=setTimeout(()=>resolve(false),1000);
        window.lifecycleWorker.onmessage=event=>{clearTimeout(timer);resolve(JSON.stringify(event.data)===JSON.stringify(baseline))};
        window.lifecycleWorker.postMessage('sample');
      }),x.baseline);
      x.data.restored=await workerSample();x.checkEqual(x.data.restored,x.baseline,'worker returns to native baseline');
      await x.page.evaluate(()=>window.lifecycleWorker.terminate());
      x.data.note='Worker CDP inheritance samples are observations; explicit native baseline and restoration are asserted.';
    }],
    ['initial-malformed-timezone-identifiers',async x=>{
      for(const invalid of invalidIds){
        const result=await command(x.session,invalid),after=await sample(x.page);
        x.data.requests??=[];x.data.requests.push({invalid,result,after});
        x.check(!result.accepted,`initial malformed ID rejected: ${JSON.stringify(invalid)}`);
        x.checkEqual(after,x.baseline,'initial invalid request preserves baseline');
        await command(x.session,'');
      }
    }],
  ];
  try{
    for(const engine of engines){
      const executable=resolve(engine.executable);
      assert.equal(await hash(executable),engine.exeSha256);
      assert.equal(await hash(join(dirname(executable),'chrome.dll')),engine.dllSha256);
      const identity={...engine};delete identity.executable;report.engines.push(identity);
      const configurations=[['default',[]],...(engine.nativeEnvironment?[['native-environment',['--custom-browser-timezone=Europe/Paris','--custom-browser-locale=fr-FR']]]:[])];
      for(const [configuration,launchArgs] of configurations)for(const headless of [false,true]){
        const mode=headless?'headless':'headed';
        const browser=await chromium.launch({executablePath:executable,headless,chromiumSandbox:true,args:launchArgs});
        try{
          assert.equal(browser.version(),engine.version);
          for(const [name,operation] of scenarios)await t.test(`${engine.id} ${configuration} ${mode}: ${name}`,async()=>{
            const observation={engine:engine.id,configuration,mode,name,status:'failed',checks:[],data:{},pageErrors:[],crashes:[]};
            const context=await browser.newContext();let x;
            try{
              const page=await context.newPage();page.setDefaultTimeout(7000);
              page.on('pageerror',error=>observation.pageErrors.push(error.message));page.on('crash',()=>observation.crashes.push(true));
              await page.goto(url);const baseline=await sample(page),session=await context.newCDPSession(page);
              observation.baseline=baseline;
              x={page,session,context,baseline,executable,headless,launchArgs,data:observation.data,detached:false,
                check:(passed,contract)=>observation.checks.push({contract,passed:!!passed}),
                checkEqual:(actual,expected,contract)=>observation.checks.push({contract,passed:JSON.stringify(actual)===JSON.stringify(expected),actual,expected})};
              await operation(x);
              if(!x.detached)await x.session.detach();
              await x.page.locator('button').click();
              x.check(await x.page.locator('button').textContent()==='handled','renderer remains usable');
              x.check(observation.pageErrors.length===0&&observation.crashes.length===0,'no captured page error or crash');
              observation.status=observation.checks.every(check=>check.passed)?'passed':'failed';
              assert.equal(observation.status,'passed',JSON.stringify(observation.checks.filter(check=>!check.passed)));
            }catch(error){observation.error=error.message;throw error}
            finally{await context.close();report.observations.push(observation);await save()}
          });
        }finally{await browser.close()}
      }
      identity.runtimeUnchanged=await hash(executable)===engine.exeSha256&&await hash(join(dirname(executable),'chrome.dll'))===engine.dllSha256;
      assert(identity.runtimeUnchanged);
    }
    report.completed=true;
  }finally{
    await new Promise(resolve=>primary.close(resolve));await new Promise(resolve=>secondary.close(resolve));
    report.completedAt=new Date().toISOString();report.passed=report.observations.filter(x=>x.status==='passed').length;
    report.failed=report.observations.filter(x=>x.status==='failed').length;await save();
  }
});
