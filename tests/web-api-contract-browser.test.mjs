import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {chromium} from 'playwright-core';

const executablePath=process.env.CUSTOM_BROWSER_EXECUTABLE;
const controlPath=process.env.CUSTOM_BROWSER_CONTROL_EXECUTABLE;
const output=resolve(process.env.CUSTOM_WEB_API_CONTRACT_REPORT??'artifacts/web-api-contract/results.json');
const hash=async path=>{const h=createHash('sha256');for await(const b of createReadStream(path))h.update(b);return h.digest('hex')};

// Reproduce the invalid calls observed in external page-error diagnostics.
// Exceptions are caught by the page; no request, media access or permission
// grant is needed to exercise required-argument validation.
test('invalid API calls throw TypeError and leave the renderer usable',{
  skip:!executablePath,timeout:90000,
},async t=>{
  const report={schemaVersion:1,scope:'Owned local invalid-call contracts; no external detectors or browser overrides',startedAt:new Date().toISOString(),observations:[]};
  const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Owned API contract fixture</title>')});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  await mkdir(dirname(output),{recursive:true});
  const paths=[['custom',executablePath],...(controlPath?[['stock-control',controlPath]]:[])];
  try{
    for(const [engine,path] of paths)for(const headless of [false,true])await t.test(`${engine} ${headless?'headless':'headed'}`,async()=>{
      const observation={engine,headless,status:'failed',binarySha256:await hash(path)};
      if(engine==='custom')observation.runtimeSha256=await hash(join(dirname(path),'chrome.dll'));
      let browser;
      try{
        browser=await chromium.launch({executablePath:path,headless,chromiumSandbox:true});
        observation.browserVersion=browser.version();
        const page=await browser.newPage();
        const crashes=[],pageErrors=[];
        page.on('crash',()=>crashes.push(true));page.on('pageerror',error=>pageErrors.push(error.message));
        await page.goto(url);
        observation.results=await page.evaluate(()=>{
          const calls=[
            ['sendBeacon-required-url',()=>navigator.sendBeacon()],
            ['legacy-getUserMedia-required-callbacks',()=>navigator.getUserMedia()],
            ['undefined-frames-access',()=>{const missing=undefined;return missing.frames}],
          ];
          return calls.map(([name,call])=>{
            try{return {name,threw:false,value:String(call())}}
            catch(error){return {name,threw:true,errorName:error.name,message:error.message}}
          });
        });
        for(const result of observation.results){assert(result.threw,result.name);assert.equal(result.errorName,'TypeError',result.name)}
        assert.match(observation.results[0].message,/1 argument required/);
        assert.match(observation.results[1].message,/3 arguments required/);
        await page.setContent('<!doctype html><button onclick="this.textContent=\'handled\'">Ready</button>');
        await page.locator('button').click();assert.equal(await page.locator('button').innerText(),'handled');
        assert.deepEqual(crashes,[]);assert.deepEqual(pageErrors,[]);
        observation.rendererUsable=true;observation.status='passed';
      }catch(error){observation.error=String(error);throw error}
      finally{
        if(browser)await browser.close();
        observation.runtimeUnchanged=observation.binarySha256===await hash(path)&&
          (engine!=='custom'||observation.runtimeSha256===await hash(join(dirname(path),'chrome.dll')));
        if(!observation.runtimeUnchanged){observation.status='failed';observation.error='Runtime changed during the observation'}
        report.observations.push(observation);await writeFile(output,JSON.stringify(report,null,2)+'\n');
        assert(observation.runtimeUnchanged,'Runtime changed during the observation');
      }
    });
  }finally{
    await new Promise(resolve=>server.close(resolve));report.completedAt=new Date().toISOString();
    report.passed=report.observations.filter(x=>x.status==='passed').length;
    report.failed=report.observations.filter(x=>x.status!=='passed').length;
    await writeFile(output,JSON.stringify(report,null,2)+'\n');
  }
});
