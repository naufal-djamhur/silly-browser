import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {launch,buildContextOptions} from '../sdk/js/index.mjs';

const executablePath=process.env.CUSTOM_BROWSER_EXECUTABLE;
const release=process.env.CUSTOM_BROWSER_RELEASE??'155.0.8059.80';
const hash=async path=>{const digest=createHash('sha256');for await(const chunk of createReadStream(path))digest.update(chunk);return digest.digest('hex')};
const script=`window.observe=()=>({language:navigator.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,jan:new Date('2026-01-15T12:00:00Z').getTimezoneOffset(),jul:new Date('2026-07-15T12:00:00Z').getTimezoneOffset(),width:innerWidth,height:innerHeight})`;

test('actual engine: context locale, timezone/DST and viewport stay isolated in both modes',{skip:!executablePath,timeout:120000},async()=>{
  const server=createServer((request,response)=>{
    if(request.url==='/headers'){response.setHeader('Content-Type','application/json');response.end(JSON.stringify({language:request.headers['accept-language']}));return}
    response.setHeader('Content-Type','text/html');response.end(`<!doctype html><title>Context configuration fixture</title><script>${script}</script>${request.url==='/frame'?'':'<iframe src="/frame"></iframe>'}`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const observations=[];let completed=false;
  try {
    for(const headless of [true,false]){
      const browser=await launch({executablePath,headless});
      try {
        assert.equal(browser.version(),release,'Do not substitute a historical browser for the selected release');
        const contexts=[];
        try {
          for(const settings of [{locale:'fr-FR',timezone:'Europe/Paris',jan:-60,jul:-120},{locale:'en-US',timezone:'America/New_York',jan:300,jul:240}]){
            const context=await browser.newContext(buildContextOptions({locale:settings.locale,timezone:settings.timezone,viewport:{width:900,height:700}}));contexts.push(context);
            const page=await context.newPage();await page.goto(url);await page.frameLocator('iframe').locator('body').waitFor();
            const observed=await page.evaluate(()=>window.observe());
            const frame=await page.frames().find(frame=>frame!==page.mainFrame()).evaluate(()=>window.observe());
            const headers=await page.evaluate(async()=>await(await fetch('/headers')).json());
            const expected={language:settings.locale,timezone:settings.timezone,jan:settings.jan,jul:settings.jul,width:900,height:700};
            assert.deepEqual(observed,expected);assert.deepEqual(frame,{...expected,width:300,height:150});
            assert.equal(headers.language.split(',')[0],settings.locale);
            observations.push({headless,status:'passed',observed,frame,headerLanguage:headers.language});
          }
          // Recheck the first context while the second remains alive.
          assert.equal(await contexts[0].pages()[0].evaluate(()=>Intl.DateTimeFormat().resolvedOptions().timeZone),'Europe/Paris');
        }finally{for(const context of contexts)await context.close()}
      }finally{await browser.close()}
    }
    completed=true;
  }finally{
    await new Promise(resolve=>server.close(resolve));
    const output=resolve(process.env.CUSTOM_CONTEXT_REPORT??'artifacts/context-validation/results.json');
    await mkdir(dirname(output),{recursive:true});
    await writeFile(output,JSON.stringify({scope:'Local document/iframe/header/context isolation, viewport and DST fixture only; no worker, detector, CAPTCHA or universal rendering claim',completedAt:new Date().toISOString(),release,binarySha256:await hash(executablePath),runtimeSha256:await hash(join(dirname(executablePath),'chrome.dll')),completed,observations},null,2)+'\n');
  }
});
