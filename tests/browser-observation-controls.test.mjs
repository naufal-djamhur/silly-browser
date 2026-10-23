import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {chromium} from 'playwright-core';

const customPath=process.env.CUSTOM_BROWSER_EXECUTABLE;
const stockPath=process.env.CUSTOM_BROWSER_CONTROL_EXECUTABLE;
const output=resolve(process.env.CUSTOM_OBSERVATION_CONTROL_REPORT??'artifacts/observation-controls/results.json');
const hash=async path=>{const h=createHash('sha256');for await(const b of createReadStream(path))h.update(b);return h.digest('hex')};
const workerSample=`()=>({language:navigator.language,locale:Intl.DateTimeFormat().resolvedOptions().locale,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,userAgent:navigator.userAgent})`;

test('diagnostic API observations agree with exact upstream and declared viewport configuration',{
  skip:!customPath||!stockPath,timeout:120000,
},async t=>{
  const report={schemaVersion:1,startedAt:new Date().toISOString(),
    scope:'Owned local API availability, frame/worker consistency and viewport controls; no external score optimization or overrides',
    engines:[],observations:[],comparisons:[],completed:false};
  await mkdir(dirname(output),{recursive:true});
  const server=createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');
    if(req.url==='/worker.js'){res.setHeader('Content-Type','application/javascript');res.end(`postMessage((${workerSample})())`);return}
    res.setHeader('Content-Type','text/html');
    if(req.url==='/frame'){res.end('<!doctype html><title>Owned frame</title><p>ready</p>');return}
    res.end(`<!doctype html><title>Owned observation fixture</title><button onclick="this.textContent='handled'">Ready</button><iframe src="/frame"></iframe><script>window.observe=${workerSample}</script>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  try{
    for(const [engine,path] of [['upstream-155',stockPath],['silly-patch-six',customPath]]){
      const identity={engine,exeSha256:await hash(path),dllSha256:await hash(join(dirname(path),'chrome.dll'))};report.engines.push(identity);
      for(const headless of [false,true]){
        const mode=headless?'headless':'headed';
        const browser=await chromium.launch({executablePath:path,headless,chromiumSandbox:true});
        try{
          identity.version=browser.version();assert.equal(identity.version,'155.0.8059.80');
          for(const [viewportMode,options] of [['configured',{viewport:{width:1920,height:1080},deviceScaleFactor:1}],['native-window',{viewport:null}]])await t.test(`${engine} ${mode} ${viewportMode}`,async()=>{
            const context=await browser.newContext(options);
            const observation={engine,mode,viewportMode,status:'failed',pageErrors:[],crashes:[]};
            try{
              const page=await context.newPage();page.setDefaultTimeout(7000);
              page.on('pageerror',error=>observation.pageErrors.push(error.message));page.on('crash',()=>observation.crashes.push(true));
              await page.goto(url);await page.frameLocator('iframe').locator('p').waitFor();
              observation.data=await page.evaluate(async()=>{
                const worker=new Worker('/worker.js');
                let environment;
                try{environment=await new Promise((resolve,reject)=>{
                  const timer=setTimeout(()=>reject(Error('Worker timeout')),5000);
                  worker.onmessage=event=>{clearTimeout(timer);resolve(event.data)};
                  worker.onerror=event=>{clearTimeout(timer);reject(Error(event.message))};
                })}finally{worker.terminate()}
                const frame=window.frames[0];
                return {document:window.observe(),worker:environment,
                  frame:{present:!!frame,contentWindowMatches:frame===document.querySelector('iframe').contentWindow,count:window.frames.length,userAgent:frame.navigator.userAgent,language:frame.navigator.language},
                  apis:{contentIndex:typeof ContentIndex,contacts:'contacts' in navigator,downlinkMax:'downlinkMax' in (navigator.connection||{}),webdriver:navigator.webdriver,lightColor:matchMedia('(prefers-color-scheme: light)').matches},
                  screen:{width:screen.width,height:screen.height,availWidth:screen.availWidth,availHeight:screen.availHeight},
                  viewport:{width:innerWidth,height:innerHeight}};
              });
              const data=observation.data;
              assert.deepEqual(data.worker,data.document,'Document and worker environment must agree');
              assert.equal(data.frame.present,true);assert.equal(data.frame.contentWindowMatches,true);assert.equal(data.frame.count,1);
              assert.equal(data.frame.userAgent,data.document.userAgent);assert.equal(data.frame.language,data.document.language);
              assert.equal(typeof data.apis.webdriver,'boolean');
              if(viewportMode==='configured'){
                assert.deepEqual(data.viewport,{width:1920,height:1080});
                assert.deepEqual(data.screen,{width:1920,height:1080,availWidth:1920,availHeight:1080});
              }
              assert(data.viewport.width>0&&data.viewport.height>0);
              await page.locator('button').click();assert.equal(await page.locator('button').textContent(),'handled');
              assert.deepEqual(observation.pageErrors,[]);assert.deepEqual(observation.crashes,[]);
              observation.status='passed';
            }catch(error){observation.error=String(error);throw error}
            finally{await context.close();report.observations.push(observation);await writeFile(output,JSON.stringify(report,null,2)+'\n')}
          });
        }finally{await browser.close()}
      }
      identity.runtimeUnchanged=identity.exeSha256===await hash(path)&&identity.dllSha256===await hash(join(dirname(path),'chrome.dll'));
      assert(identity.runtimeUnchanged);
    }
    await t.test('custom values match stock within each mode and viewport configuration',()=>{
      for(const observation of report.observations.filter(x=>x.engine==='silly-patch-six')){
        const baseline=report.observations.find(x=>x.engine==='upstream-155'&&x.mode===observation.mode&&x.viewportMode===observation.viewportMode);
        const comparison={mode:observation.mode,viewportMode:observation.viewportMode,status:'failed'};report.comparisons.push(comparison);
        assert.equal(observation.status,'passed');assert.equal(baseline?.status,'passed');
        // Unemulated window dimensions are OS-controlled, not deterministic
        // browser identity. Compare the native APIs/screen/environment there.
        if(observation.viewportMode==='native-window'){
          const {viewport:customViewport,...custom}=observation.data;
          const {viewport:stockViewport,...stock}=baseline.data;
          assert.deepEqual(custom,stock);
        }else assert.deepEqual(observation.data,baseline.data);
        comparison.status='passed';
      }
    });
    report.completed=true;
  }finally{
    await new Promise(resolve=>server.close(resolve));report.completedAt=new Date().toISOString();
    report.passed=report.observations.filter(x=>x.status==='passed').length;report.failed=report.observations.filter(x=>x.status!=='passed').length;
    await writeFile(output,JSON.stringify(report,null,2)+'\n');
  }
});
