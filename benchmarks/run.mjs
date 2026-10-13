import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { platform, release } from 'node:os';
import { launchContext } from '../sdk/js/index.mjs';
import { extract } from './adapters.mjs';

const args=process.argv.slice(2);
function option(name, fallback) {const i=args.indexOf(name);return i<0?fallback:args[i+1];}
const executable=option('--executable',process.env.CUSTOM_BROWSER_EXECUTABLE);
if(!executable) throw new Error('Specify --executable');
const mode=option('--engine-mode','custom');
const repetitions=Number(option('--repetitions','1'));
if(!Number.isInteger(repetitions)||repetitions<1||repetitions>20) throw new Error('repetitions must be 1..20');
const selected=option('--target','all');
const targets=JSON.parse(await readFile(new URL('./targets.json',import.meta.url),'utf8')).filter(t=>selected==='all'||t.id===selected);
if(!targets.length) throw new Error('Unknown target');
const runId=new Date().toISOString().replaceAll(':','-');
const directory=resolve(option('--output',`artifacts/${runId}`));
await mkdir(directory,{recursive:true});
const metadata={schemaVersion:1,startedAt:new Date().toISOString(),runId,engineMode:mode,executableHash:createHash('sha256').update(await readFile(executable)).digest('hex'),os:platform(),osRelease:release(),headless:!args.includes('--headed'),humanize:args.includes('--humanize'),profileMode:'fresh-temporary-per-repetition',proxyConfigured:Boolean(process.env.CUSTOM_BROWSER_PROXY),thresholdPolicy:'provisional-project-targets-not-site-official-thresholds',results:[]};
const context=await launchContext({executablePath:executable,engineMode:mode,headless:metadata.headless,humanize:metadata.humanize,proxy:process.env.CUSTOM_BROWSER_PROXY});
metadata.browserVersion=context.browser().version();
await context.close();
try {
  for(const target of targets) for(let iteration=1;iteration<=repetitions;iteration++) {
    const prefix=`${target.id}-${iteration}`, responses=[];
    const ctx=await launchContext({executablePath:executable,engineMode:mode,headless:metadata.headless,humanize:metadata.humanize,proxy:process.env.CUSTOM_BROWSER_PROXY});
    const page=await ctx.newPage();
    const result={target:target.id,url:target.url,iteration,startedAt:new Date().toISOString()};
    const pending=new Set();
    page.on('response',response=>{
      const url=new URL(response.url());
      if(url.hostname!=='recaptcha-demo.appspot.com'||url.pathname!=='/recaptcha-v3-verify.php') return;
      const task=response.json().then(body=>responses.push({endpoint:url.origin+url.pathname,body})).catch(()=>{});
      pending.add(task);task.finally(()=>pending.delete(task));
    });
    try {
      await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:45000});
      const end=Date.now()+30000;
      do {
        await page.waitForTimeout(1000);
        Object.assign(result,await extract(page,target,responses));
      } while(['unavailable','inconclusive'].includes(result.status)&&Date.now()<end);
      await Promise.allSettled([...pending]);
      Object.assign(result,await extract(page,target,responses));
      result.native=await page.evaluate(async()=>{
        const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl'), ext=gl?.getExtension('WEBGL_debug_renderer_info');
        return {ua:navigator.userAgent,platform:navigator.platform,webdriver:navigator.webdriver,languages:navigator.languages,cores:navigator.hardwareConcurrency,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,screen:{width:screen.width,height:screen.height,dpr:devicePixelRatio},gpu:ext?{vendor:gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),renderer:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}:null};
      });
      await writeFile(join(directory,`${prefix}.txt`),await page.locator('body').innerText());
      await writeFile(join(directory,`${prefix}.html`),await page.content());
      // Store score verification only, avoiding tokens and unnecessary response fields.
      await writeFile(join(directory,`${prefix}.verification.json`),JSON.stringify(responses.map(({endpoint,body})=>({endpoint,body:{success:body.success,score:body.score,action:body.action,hostname:body.hostname}})),null,2));
      await page.screenshot({path:join(directory,`${prefix}.png`),fullPage:true});
      result.evidencePrefix=prefix;
    } catch(error) {Object.assign(result,{status:'error',error:error.message});}
    finally {await ctx.close();}
    result.finishedAt=new Date().toISOString();metadata.results.push(result);
    await writeFile(join(directory,'results.json'),JSON.stringify(metadata,null,2));
    console.log(`${target.id}: ${result.status}${typeof result.score==='number'?` (${result.score})`:''}`);
  }
} finally {
  metadata.finishedAt=new Date().toISOString();
  await writeFile(join(directory,'results.json'),JSON.stringify(metadata,null,2));
  console.log(`Report: ${join(directory,'results.json')}`);
}
