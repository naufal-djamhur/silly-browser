import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {buildLaunchOptions, verifyCustomBinary} from './index.mjs';
import {persistentSeed} from './profile-seed.mjs';
import {validateHumanConfig, motionPoints} from './humanize.mjs';

const wrapped = new WeakSet();
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve,milliseconds));

function humanizePage(page,defaults) {
  if(wrapped.has(page)) return;
  wrapped.add(page);
  let position={x:0,y:0};
  const move=page.mouse.move.bind(page.mouse),click=page.mouse.click.bind(page.mouse),wheel=page.mouse.wheel.bind(page.mouse),type=page.keyboard.type.bind(page.keyboard);
  const settings=overrides=>validateHumanConfig({...defaults,...overrides});
  page.mouse.move=async(x,y,options={})=>{
    const {humanConfig,signal,...native}=options,c=settings(humanConfig),points=motionPoints(position,{x,y},c);
    for(const point of points){if(signal?.aborted)throw signal.reason??Error('Input cancelled');if(page.isClosed())throw Error('Page closed during input');await move(point.x,point.y,native);position=point;await sleep(c.durationMs/points.length)}
  };
  page.mouse.click=async(x,y,options={})=>{const {humanConfig,signal,...native}=options;await page.mouse.move(x,y,{humanConfig,signal});if(signal?.aborted)throw signal.reason??Error('Input cancelled');return click(x,y,native)};
  page.mouse.wheel=async(options={})=>{const {deltaX=0,deltaY=0,humanConfig,signal}=options;if(![deltaX,deltaY].every(Number.isFinite))throw TypeError('Scroll deltas must be finite');const c=settings(humanConfig);for(let i=0;i<c.scrollSteps;i++){if(signal?.aborted)throw signal.reason??Error('Input cancelled');if(page.isClosed())throw Error('Page closed during input');await wheel({deltaX:deltaX/c.scrollSteps,deltaY:deltaY/c.scrollSteps});await sleep(c.durationMs/c.scrollSteps)}};
  page.keyboard.type=async(text,options={})=>{const {humanConfig,signal,...native}=options,c=settings(humanConfig);for(const char of text){if(signal?.aborted)throw signal.reason??Error('Input cancelled');if(page.isClosed())throw Error('Page closed during input');await type(char,{...native,delay:0});await sleep(c.typingDelayMs)}};
  page.humanClick=async(selector,options={})=>{
    if(typeof selector!=='string')throw TypeError('Puppeteer humanClick currently accepts a selector string');
    const {timeout=page.getDefaultTimeout(),humanConfig,signal,...native}=options;
    const deadline=timeout===0?Infinity:Date.now()+timeout;
    while(Date.now()<deadline){
      if(signal?.aborted)throw signal.reason??Error('Input cancelled');
      const handle=await page.$(selector);
      try {
        if(handle && await handle.isVisible()){
          await handle.scrollIntoView();
          const box=await handle.boundingBox();
          if(box){
            await page.mouse.move(box.x+box.width/2,box.y+box.height/2,{humanConfig,signal});
            const ready=await handle.evaluate(async element=>{
              const before=element.getBoundingClientRect();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              const after=element.getBoundingClientRect(),style=getComputedStyle(element);
              const hit=document.elementFromPoint(after.x+after.width/2,after.y+after.height/2);
              return element.isConnected&&!element.matches(':disabled')&&element.getAttribute('aria-disabled')!=='true'&&style.visibility==='visible'&&after.width>0&&after.height>0&&before.x===after.x&&before.y===after.y&&before.width===after.width&&before.height===after.height&&element.contains(hit);
            });
            const current=await handle.boundingBox();
            if(ready&&current&&current.x===box.x&&current.y===box.y&&current.width===box.width&&current.height===box.height){
              if(Date.now()>=deadline)throw Error('Humanized action timed out');
              if(signal?.aborted)throw signal.reason??Error('Input cancelled');
              return click(current.x+current.width/2,current.y+current.height/2,native);
            }
          }
        }
      } finally {if(handle)await handle.dispose()}
      await sleep(Math.min(25,Math.max(0,deadline-Date.now())));
    }
    throw Error('Humanized action timed out');
  };
  page.humanType=async(selector,text,options={})=>{await page.humanClick(selector,options);await page.keyboard.type(text,{humanConfig:options.humanConfig,signal:options.signal})};
}

export async function humanizePuppeteerBrowser(browser,defaults={}) {
  validateHumanConfig(defaults);
  if(wrapped.has(browser))return browser;
  wrapped.add(browser);
  for(const page of await browser.pages())humanizePage(page,defaults);
  const newPage=browser.newPage.bind(browser);
  browser.newPage=async(...args)=>{const page=await newPage(...args);humanizePage(page,defaults);return page};
  // Popup pages and separate browser contexts need explicit attachment in this version.
  return browser;
}

async function launchProfile(directory,options,temporary) {
  const cleanTemporary=async()=>{
    if(!temporary)return;
    if(resolve(dirname(directory))!==resolve(tmpdir())||!basename(directory).startsWith('silly-puppeteer-'))throw Error('Unexpected temporary profile location');
    await rm(directory,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  };
  try {
    const validated=buildLaunchOptions(options);
    if(options.locale||options.timezone)throw Error('Puppeteer locale/timezone options are not implemented yet');
    if(validated.proxy?.username||validated.proxy?.password)throw Error('Puppeteer authenticated proxies require a qualified native proxy capability; not implemented yet');
    const seed=await persistentSeed(directory,options.seed);
    const launchOptions=buildLaunchOptions({...options,seed});
    await verifyCustomBinary({...launchOptions,engineMode:options.engineMode});
    const {default:puppeteer}=await import('puppeteer-core');
    const browser=await puppeteer.launch({executablePath:launchOptions.executablePath,headless:launchOptions.headless,userDataDir:directory,
      args:[...launchOptions.args,...(launchOptions.proxy?[`--proxy-server=${launchOptions.proxy.server}`]:[])],
      ...(launchOptions.ignoreDefaultArgs?{ignoreDefaultArgs:launchOptions.ignoreDefaultArgs}:{}),defaultViewport:options.viewport??null});
    const close=browser.close.bind(browser);
    browser.close=async(...args)=>{try{return await close(...args)}finally{await cleanTemporary()}};
    if(options.humanize)await humanizePuppeteerBrowser(browser,options.humanConfig??{});
    return browser;
  }catch(error){await cleanTemporary();throw error}
}

export async function launchPuppeteer(options={}) {
  // A plain launch owns an isolated temporary profile; this is a Puppeteer Browser.
  buildLaunchOptions(options);
  const directory=await mkdtemp(join(tmpdir(),'silly-puppeteer-'));
  return launchProfile(directory,options,true);
}

export async function launchPuppeteerPersistent(userDataDir,options={}) {
  return launchProfile(resolve(userDataDir),options,false);
}
