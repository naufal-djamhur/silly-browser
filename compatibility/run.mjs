import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir,platform,arch} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import puppeteer from 'puppeteer-core';
import {launchContext,launchPersistentContext} from '../sdk/js/index.mjs';

const exec=promisify(execFile);
const root=fileURLToPath(new URL('../',import.meta.url));
const argv=process.argv.slice(2);
const option=(name,fallback)=>{const i=argv.indexOf(name);return i<0?fallback:argv[i+1]};
const executablePath=resolve(option('--executable',process.env.CUSTOM_BROWSER_EXECUTABLE??''));
if(!option('--executable',process.env.CUSTOM_BROWSER_EXECUTABLE))throw Error('--executable is required');
const engineMode=option('--engine-mode','custom');
if(!['custom','baseline'].includes(engineMode))throw Error('Invalid engine mode');
const python=option('--python',process.env.CUSTOM_BROWSER_PYTHON??'python');
const output=resolve(option('--output',join(root,'artifacts','compatibility',`${engineMode}-${Date.now()}`)));
const modes=argv.includes('--both-modes')?[true,false]:[!argv.includes('--headed')];
const html=`<!doctype html><title>Driver compatibility fixture</title>
<input id="value"><button id="submit" onclick="document.querySelector('#result').textContent=document.querySelector('#value').value">Submit</button>
<div id="result"></div><iframe src="/frame"></iframe>
<script>window.observe=()=>({ua:navigator.userAgent,platform:navigator.platform,webdriver:navigator.webdriver,hardwareConcurrency:navigator.hardwareConcurrency,screen:{width:screen.width,height:screen.height},geometry:{innerWidth,innerHeight,outerWidth,outerHeight}})</script>`;
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(req.url==='/frame'?'<p id="frame-value">frame-ready</p>':html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}`;
const assert=(condition,detail)=>{if(!condition)throw Error(detail)};
const results=[];
await mkdir(output,{recursive:true});
const libraryVersions={node:process.version,playwright:JSON.parse(await readFile(join(root,'node_modules','playwright-core','package.json'),'utf8')).version,puppeteer:JSON.parse(await readFile(join(root,'node_modules','puppeteer-core','package.json'),'utf8')).version};
const report={engineMode,executablePath,binarySha256:createHash('sha256').update(await readFile(executablePath)).digest('hex'),host:{platform:platform(),arch:arch()},libraryVersions,startedAt:new Date().toISOString(),results,scope:'Local navigation, input, iframe, storage, and protocol smoke checks. No detector or universal compatibility claims.'};
if(engineMode==='custom'){const {stdout}=await exec(executablePath,['--headless','--custom-browser-engine-info'],{timeout:10000,windowsHide:true});report.engineInfo=JSON.parse(stdout.trim());if(report.engineInfo.engine!=='custom-browser'||report.engineInfo.policyVersion!==1)throw Error('Custom engine handshake failed')}
async function record(driver,headless,probe){
  const start=Date.now();
  try{results.push({driver,headless,status:'passed',observed:await probe(),elapsedMs:Date.now()-start})}
  catch(error){results.push({driver,headless,status:'failed',error:error.stack,elapsedMs:Date.now()-start})}
  await writeFile(join(output,'results.json'),JSON.stringify(report,null,2));
  console.log(`${driver} ${headless?'headless':'headed'}: ${results.at(-1).status}`);
}
async function exercisePlaywright(page){
  await page.goto(url);await page.locator('#value').fill('compatibility');await page.locator('#submit').click();
  assert(await page.locator('#result').innerText()==='compatibility','Input/click result mismatch');
  assert(await page.frameLocator('iframe').locator('#frame-value').innerText()==='frame-ready','Iframe mismatch');
  await page.evaluate(()=>localStorage.setItem('driver-fixture','retained'));await page.reload();
  assert(await page.evaluate(()=>localStorage.getItem('driver-fixture'))==='retained','Storage mismatch');
  return page.evaluate(()=>window.observe());
}
async function withEndpoint(headless,probe){
  const profile=await mkdtemp(join(tmpdir(),'custom-browser-cdp-'));
  let owner;
  try {
    owner=await launchPersistentContext(profile,{executablePath,engineMode,headless,args:['--remote-debugging-port=0','--remote-debugging-address=127.0.0.1']});
    const deadline=Date.now()+15000;let port;
    while(Date.now()<deadline){try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);if(port>0)break}catch{}await new Promise(r=>setTimeout(r,50))}
    assert(port>0,'CDP endpoint not published');
    return await probe(`http://127.0.0.1:${port}`);
  } finally {if(owner)await owner.close();await rm(profile,{recursive:true,force:true})}
}
try {
  for(const headless of modes){
    await record('playwright-js-sdk',headless,async()=>{const context=await launchContext({executablePath,engineMode,headless});try{const page=await context.newPage();const observed=await exercisePlaywright(page);const cdp=await context.newCDPSession(page);observed.cdp=await cdp.send('Browser.getVersion');await cdp.detach();return observed}finally{await context.close()}});
    await record('playwright-js-cdp',headless,()=>withEndpoint(headless,async endpoint=>{const browser=await chromium.connectOverCDP(endpoint);try{return {...await exercisePlaywright(await browser.contexts()[0].newPage()),version:browser.version()}}finally{await browser.close()}}));
    await record('puppeteer-cdp',headless,()=>withEndpoint(headless,async endpoint=>{const browser=await puppeteer.connect({browserURL:endpoint,defaultViewport:null});try{const page=await browser.newPage();await page.goto(url);await page.type('#value','compatibility');await page.click('#submit');assert(await page.$eval('#result',el=>el.textContent)==='compatibility','Input/click mismatch');assert(await page.frames().find(f=>f!==page.mainFrame()).$eval('#frame-value',el=>el.textContent)==='frame-ready','Iframe mismatch');await page.evaluate(()=>localStorage.setItem('driver-fixture','retained'));await page.reload();assert(await page.evaluate(()=>localStorage.getItem('driver-fixture'))==='retained','Storage mismatch');return {...await page.evaluate(()=>window.observe()),version:await browser.version()}}finally{await browser.disconnect()}}));
    for(const driver of ['playwright-python','selenium'])await record(driver,headless,async()=>{const args=[join(root,'compatibility','python_driver.py'),'--driver',driver,'--executable',executablePath,'--engine-mode',engineMode,'--url',url,...(headless?[]:['--headed'])];const {stdout}=await exec(python,args,{timeout:180000,windowsHide:true,maxBuffer:1024*1024});return JSON.parse(stdout.trim().split('\n').at(-1)).observed});
  }
} finally {report.completedAt=new Date().toISOString();await writeFile(join(output,'results.json'),JSON.stringify(report,null,2));await new Promise(r=>server.close(r))}
console.log(`Evidence: ${join(output,'results.json')}`);
if(results.some(r=>r.status!=='passed'))process.exitCode=1;
