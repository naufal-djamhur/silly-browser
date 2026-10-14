import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,readFile,rm,stat,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {launchPuppeteer,launchPuppeteerPersistent,humanizePuppeteerBrowser} from '../sdk/js/index.mjs';

const executablePath=process.env.CUSTOM_BROWSER_EXECUTABLE;
const observations=[];
const root=fileURLToPath(new URL('../',import.meta.url));

for(const headless of [true,false])test(`Puppeteer SDK: input, actionability, persistence and cleanup ${headless?'headless':'headed'}`,{skip:!executablePath,timeout:60000},async()=>{
  const server=createServer((request,response)=>{response.setHeader('Content-Type','text/html');response.end(`<!doctype html><input id="field"><button disabled id="go">Submit</button><button disabled id="never">Disabled</button><div id="result"></div><div style="height:3000px"></div><script>window.motion=0;addEventListener('mousemove',()=>motion++);setTimeout(()=>go.disabled=false,500);go.onclick=()=>result.textContent=field.value</script>`)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const directory=await mkdtemp(join(tmpdir(),'silly-puppeteer-test-'));let browser;
  const options={executablePath,headless,humanize:true,humanConfig:{durationMs:32,typingDelayMs:1,scrollSteps:3,seed:42},args:['--enable-automation']};
  try {
    browser=await launchPuppeteerPersistent(directory,options);
    await humanizePuppeteerBrowser(browser); // Wrapping twice must not duplicate input.
    const page=await browser.newPage();await page.goto(url);
    await page.humanType('#field','Puppeteer',{humanConfig:{typingDelayMs:0}});
    await page.humanClick('#go',{humanConfig:{durationMs:48},timeout:5000});
    assert.equal(await page.$eval('#result',element=>element.textContent),'Puppeteer');
    assert(await page.evaluate(()=>motion)>1);
    await assert.rejects(page.humanClick('#never',{timeout:80,humanConfig:{durationMs:0}}),/timed out/);
    const controller=new AbortController();controller.abort(Error('fixture cancelled'));
    await assert.rejects(page.keyboard.type('x',{signal:controller.signal}),/fixture cancelled/);
    await page.evaluate(()=>{localStorage.setItem('puppeteer-profile','retained');document.cookie='puppeteer-profile=retained;path=/;max-age=3600'});
    await page.mouse.wheel({deltaY:200,humanConfig:{durationMs:0}});
    const seed=(await readFile(join(directory,'.custom-browser-seed'),'utf8')).trim();
    const version=await browser.version();await browser.close();browser=null;
    browser=await launchPuppeteerPersistent(directory,{executablePath,headless});
    const reopened=await browser.newPage();await reopened.goto(url);
    assert.equal(await reopened.evaluate(()=>localStorage.getItem('puppeteer-profile')),'retained');
    assert((await reopened.evaluate(()=>document.cookie)).includes('puppeteer-profile=retained'));
    assert.equal((await readFile(join(directory,'.custom-browser-seed'),'utf8')).trim(),seed);
    await browser.close();browser=null;
    browser=await launchPuppeteer({executablePath,headless,args:['--enable-automation']});
    const session=await browser.target().createCDPSession();
    const args=(await session.send('Browser.getBrowserCommandLine')).arguments;
    const temporary=args.find(value=>value.startsWith('--user-data-dir='))?.slice('--user-data-dir='.length);
    assert(temporary);await stat(temporary);await browser.close();browser=null;
    await assert.rejects(stat(temporary),{code:'ENOENT'});
    observations.push({headless,status:'passed',version,inputAndActionability:true,cancellation:true,cookiesAndStorageRetained:true,seedPreserved:true,temporaryCleanup:true});
  } finally {if(browser)await browser.close();await rm(directory,{recursive:true,force:true});await new Promise(resolve=>server.close(resolve))}
});

test('Puppeteer does not silently accept unsupported authentication or locale options',async()=>{
  await assert.rejects(launchPuppeteer({executablePath:'chrome.exe',proxy:'http://fixture:password@localhost:8080'}),/qualified native proxy/);
  await assert.rejects(launchPuppeteer({executablePath:'chrome.exe',timezone:'UTC'}),/not implemented/);
});

test.after(async()=>{
  if(!executablePath)return;
  const output=join(root,'artifacts/compatibility/puppeteer-sdk/results.json');await mkdir(dirname(output),{recursive:true});
  const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
  await writeFile(output,JSON.stringify({engineMode:'custom',completedAt:new Date().toISOString(),binarySha256:await hash(executablePath),runtimeSha256:await hash(join(dirname(executablePath),'chrome.dll')),node:process.version,puppeteer:'25.13.0',observations,scope:'Puppeteer direct launch and explicit input helpers. Popup/context wrapping, authenticated proxy, locale/timezone and native engine input remain unqualified.'},null,2)+'\n');
});
