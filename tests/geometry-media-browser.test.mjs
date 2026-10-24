import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {chromium} from 'playwright-core';

const enginesFile=process.env.CUSTOM_GEOMETRY_ENGINES;
const output=resolve(process.env.CUSTOM_GEOMETRY_REPORT??`artifacts/geometry-media/${Date.now()}`);
const hash=async path=>{const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);return h.digest('hex')};
const closeTo=(actual,expected,message,tolerance=0.05)=>assert(Math.abs(actual-expected)<=tolerance,`${message}: ${actual} vs ${expected}`);

// Owned page instrumentation observes real APIs. It replaces no browser property.
function installFixture(){
  const queries={wide:'(min-width: 800px)',portrait:'(orientation: portrait)',highDpr:'(min-resolution: 1.5dppx)',dark:'(prefers-color-scheme: dark)',reduce:'(prefers-reduced-motion: reduce)',forced:'(forced-colors: active)'};
  const lists=Object.fromEntries(Object.entries(queries).map(([name,query])=>[name,matchMedia(query)]));
  const events=[];
  addEventListener('resize',()=>events.push({kind:'window-resize'}));
  visualViewport.addEventListener('resize',()=>events.push({kind:'visual-resize'}));
  visualViewport.addEventListener('scroll',()=>events.push({kind:'visual-scroll'}));
  for(const [name,list] of Object.entries(lists))list.addEventListener('change',event=>events.push({kind:'media',name,matches:event.matches}));
  window.geometryFixture={
    reset(){events.length=0},
    sample(includeFrame=true){
      const rect=document.querySelector('#viewport-box').getBoundingClientRect();
      const style=getComputedStyle(document.documentElement);
      const result={
        inner:{width:innerWidth,height:innerHeight},outer:{width:outerWidth,height:outerHeight},
        client:{width:document.documentElement.clientWidth,height:document.documentElement.clientHeight},
        dpr:devicePixelRatio,scroll:{x:scrollX,y:scrollY},
        screen:{width:screen.width,height:screen.height,availWidth:screen.availWidth,availHeight:screen.availHeight},
        visual:{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale,offsetLeft:visualViewport.offsetLeft,offsetTop:visualViewport.offsetTop,pageLeft:visualViewport.pageLeft,pageTop:visualViewport.pageTop},
        rect:{width:rect.width,height:rect.height},
        queries:Object.fromEntries(Object.entries(lists).map(([name,list])=>[name,list.matches])),
        dynamicQueries:{width:matchMedia(`(width: ${innerWidth}px)`).matches,height:matchMedia(`(height: ${innerHeight}px)`).matches,resolution:matchMedia(`(resolution: ${devicePixelRatio}dppx)`).matches,deviceWidth:matchMedia(`(device-width: ${screen.width}px)`).matches,deviceHeight:matchMedia(`(device-height: ${screen.height}px)`).matches},
        css:Object.fromEntries(Object.keys(queries).map(name=>[name,style.getPropertyValue(`--${name}`).trim()==='1'])),
        events:[...events],
      };
      if(includeFrame&&document.querySelector('iframe'))result.frame=document.querySelector('iframe').contentWindow.geometryFixture.sample(false);
      return result;
    },
  };
}
const fixtureHtml=frame=>`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Owned geometry fixture</title>
<style>html,body{margin:0;overflow:hidden}#viewport-box{position:absolute;pointer-events:none;width:100vw;height:100vh}iframe{position:absolute;left:0;top:0;width:100vw;height:100vh;border:0}
:root{--wide:0;--portrait:0;--highDpr:0;--dark:0;--reduce:0;--forced:0}
@media(min-width:800px){:root{--wide:1}}@media(orientation:portrait){:root{--portrait:1}}@media(min-resolution:1.5dppx){:root{--highDpr:1}}
@media(prefers-color-scheme:dark){:root{--dark:1}}@media(prefers-reduced-motion:reduce){:root{--reduce:1}}@media(forced-colors:active){:root{--forced:1}}</style>
<div id="viewport-box"></div>${frame?'':'<iframe src="/frame"></iframe>'}<script>(${installFixture})();</script>`;
const sample=page=>page.evaluate(()=>geometryFixture.sample());
const reset=page=>page.evaluate(()=>{geometryFixture.reset();document.querySelector('iframe')?.contentWindow.geometryFixture.reset()});
const basic=value=>({inner:value.inner,dpr:value.dpr,screen:value.screen,queries:value.queries});
const metrics={width:840,height:620,deviceScaleFactor:1.25,mobile:false,screenWidth:1440,screenHeight:900,positionX:20,positionY:30};

function checkGeometry(value,{width,height,dpr,scale=1,frame=true}={}){
  assert(value.inner.width>0&&value.inner.height>0);
  if(width!==undefined)assert.equal(value.inner.width,width);
  if(height!==undefined)assert.equal(value.inner.height,height);
  if(dpr!==undefined)closeTo(value.dpr,dpr,'DPR',1e-6);
  assert(value.screen.width>0&&value.screen.height>0);
  assert(value.screen.availWidth>0&&value.screen.availWidth<=value.screen.width);
  assert(value.screen.availHeight>0&&value.screen.availHeight<=value.screen.height);
  for(const [name,matches] of Object.entries(value.dynamicQueries))assert.equal(matches,true,`dynamic ${name} query`);
  assert.equal(value.queries.wide,value.inner.width>=800);
  assert.equal(value.queries.portrait,value.inner.height>=value.inner.width);
  assert.equal(value.queries.highDpr,value.dpr>=1.5);
  assert.deepEqual(value.css,value.queries,'CSS and matchMedia agree');
  closeTo(value.rect.width,value.inner.width,'100vw');closeTo(value.rect.height,value.inner.height,'100vh');
  closeTo(value.visual.scale,scale,'visual scale',1e-6);
  closeTo(value.visual.width*scale,value.client.width,'visual width / layout relationship',1);
  closeTo(value.visual.height*scale,value.client.height,'visual height / layout relationship',1);
  closeTo(value.visual.pageLeft,value.scroll.x+value.visual.offsetLeft,'visual pageLeft');
  closeTo(value.visual.pageTop,value.scroll.y+value.visual.offsetTop,'visual pageTop');
  if(frame&&value.frame){
    checkGeometry(value.frame,{width:value.inner.width,height:value.inner.height,dpr:value.dpr,frame:false});
    assert.deepEqual(value.frame.screen,value.screen,'frame screen propagation');
  }
}
const requireEvent=(value,kind,name,matches)=>assert(value.events.some(event=>event.kind===kind&&(name===undefined||event.name===name&&event.matches===matches)),`missing ${kind} ${name??''} ${matches??''}`);
const waitSize=async(page,width,height)=>{
  await page.waitForFunction(({width,height})=>innerWidth===width&&innerHeight===height&&document.querySelector('iframe').contentWindow.innerWidth===width&&document.querySelector('iframe').contentWindow.innerHeight===height,{width,height});
};
const waitEvent=(page,kind,name,matches)=>page.waitForFunction(({kind,name,matches})=>geometryFixture.sample().events.some(event=>event.kind===kind&&(name===undefined||event.name===name&&event.matches===matches)),{kind,name,matches});

test('owned native geometry and media-query lifecycle contracts', {skip:!enginesFile,timeout:600000},async t=>{
  const engines=JSON.parse((await readFile(enginesFile,'utf8')).replace(/^\uFEFF/,''));
  assert(Array.isArray(engines)&&engines.length>0);
  await mkdir(dirname(output),{recursive:true});await mkdir(output,{recursive:false});
  const report={schemaVersion:1,startedAt:new Date().toISOString(),scope:'Owned geometry, explicit emulation and media-query correctness; no detector optimization or system DPI changes',engines:[],observations:[],comparisons:[],completed:false};
  const save=()=>writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  const server=createServer((request,response)=>{response.setHeader('Cache-Control','no-store');response.setHeader('Content-Type','text/html');response.end(fixtureHtml(request.url==='/frame'))});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const scenarios=[];
  for(const dpr of [1,2])scenarios.push({id:`configured-resize-dpr-${dpr}`,options:{viewport:{width:960,height:720},deviceScaleFactor:dpr},run:async x=>{
    x.data.steps=[];let previous=await sample(x.page);checkGeometry(previous,{width:960,height:720,dpr});
    x.data.initial=previous;
    for(const [width,height] of [[640,900],[1200,650],[720,720],[960,720]]){
      await reset(x.page);await x.page.setViewportSize({width,height});await waitSize(x.page,width,height);
      await waitEvent(x.page,'window-resize');await waitEvent(x.page,'visual-resize');
      for(const [name,matches] of Object.entries({wide:width>=800,portrait:height>=width}))if(previous.queries[name]!==matches)await waitEvent(x.page,'media',name,matches);
      const value=await sample(x.page);x.data.steps.push(value);checkGeometry(value,{width,height,dpr});
      assert.deepEqual(value.screen,{width,height,availWidth:width,availHeight:height},'Playwright resets implicit screen with viewport');
      requireEvent(value,'window-resize');requireEvent(value,'visual-resize');previous=value;
    }
    x.signature=x.data.steps.map(value=>basic(value));
  }});
  scenarios.push({id:'native-window-resize',options:{viewport:null},run:async x=>{
    const session=await x.context.newCDPSession(x.page);
    try{
      const {windowId,bounds}=await session.send('Browser.getWindowForTarget');
      assert.equal(bounds.windowState,'normal','owned fresh window must start normal');
      const initial=await sample(x.page);x.data.initial=initial;x.data.initialBounds=bounds;checkGeometry(initial);
      x.data.steps=[];
      for(const [width,height] of [[980,760],[1200,900],[bounds.width,bounds.height]]){
        await reset(x.page);await session.send('Browser.setWindowBounds',{windowId,bounds:{width,height}});
        await x.page.waitForFunction(({width,height})=>Math.abs(outerWidth-width)<=2&&Math.abs(outerHeight-height)<=2,{width,height});
        await waitEvent(x.page,'window-resize');await waitEvent(x.page,'visual-resize');
        const currentBounds=(await session.send('Browser.getWindowBounds',{windowId})).bounds;
        const value=await sample(x.page);x.data.steps.push({bounds:currentBounds,value});checkGeometry(value);
        closeTo(currentBounds.width,width,'native window width',2);closeTo(currentBounds.height,height,'native window height',2);
        assert.deepEqual(value.screen,initial.screen,'window resize preserves native display');closeTo(value.dpr,initial.dpr,'native DPR unchanged',1e-6);
      }
      assert.deepEqual(basic(x.data.steps.at(-1).value),basic(initial),'restoring window bounds restores viewport/environment');
      x.signature={resizePassed:true,screenStable:true,dprStable:true,restored:true};
    }finally{await session.detach()}
  }});
  scenarios.push({id:'device-metrics-clear',options:{viewport:null},run:async x=>{
    const session=await x.context.newCDPSession(x.page);
    try{
      x.data.initial=await sample(x.page);x.data.steps=[];let previousHigh=x.data.initial.queries.highDpr;
      for(const dpr of [1,1.25,2,1.25,2]){
        await reset(x.page);await session.send('Emulation.setDeviceMetricsOverride',{...metrics,deviceScaleFactor:dpr});
        await waitSize(x.page,840,620);
        await x.page.waitForFunction(dpr=>devicePixelRatio===dpr,dpr);
        try{
          if(previousHigh!==(dpr>=1.5))await waitEvent(x.page,'media','highDpr',dpr>=1.5);
        }catch(error){x.data.failedMetrics=await sample(x.page);throw error}
        const value=await sample(x.page);x.data.steps.push(value);checkGeometry(value,{width:840,height:620,dpr});
        assert.deepEqual(value.screen,{width:1440,height:900,availWidth:1440,availHeight:900});
        previousHigh=dpr>=1.5;
      }
      await reset(x.page);
      await session.send('Emulation.clearDeviceMetricsOverride');
      await waitSize(x.page,x.data.initial.inner.width,x.data.initial.inner.height);
      if(previousHigh!==x.data.initial.queries.highDpr)await waitEvent(x.page,'media','highDpr',x.data.initial.queries.highDpr);
      x.data.restored=await sample(x.page);checkGeometry(x.data.restored);
      assert.deepEqual(basic(x.data.restored),basic(x.data.initial),'clear restores native viewport, display, DPR and media state');
      x.signature={steps:x.data.steps.map(value=>basic(value)),restored:true};
    }finally{await session.detach()}
  }});
  scenarios.push({id:'rejected-device-metrics-preserve-state',options:{viewport:null},run:async x=>{
    const session=await x.context.newCDPSession(x.page);
    try{
      await session.send('Emulation.setDeviceMetricsOverride',metrics);await waitSize(x.page,840,620);
      const accepted=await sample(x.page);x.data.accepted=accepted;x.data.rejected=[];
      for(const change of [{width:-1},{height:-1},{deviceScaleFactor:-1},{screenWidth:-1},{positionX:1441},{scale:0},{screenOrientation:{type:'portraitPrimary',angle:360}}]){
        let error;
        try{await session.send('Emulation.setDeviceMetricsOverride',{...metrics,...change})}catch(caught){error=caught.message}
        const after=await sample(x.page);x.data.rejected.push({change,error:error??null,after});
        assert(error,'invalid metrics must reject');checkGeometry(after,{width:840,height:620,dpr:1.25});
        assert.deepEqual(basic(after),basic(accepted),'rejected command preserves valid state');
      }
      await x.page.reload();await x.page.frameLocator('iframe').locator('#viewport-box').waitFor({state:'attached'});
      x.data.reloaded=await sample(x.page);checkGeometry(x.data.reloaded,{width:840,height:620,dpr:1.25});
      assert.deepEqual(basic(x.data.reloaded),basic(accepted),'valid metrics survive reload after rejection');
      x.signature={rejected:x.data.rejected.map(value=>value.change),statePreserved:true,reloadPreserved:true};
    }finally{await session.send('Emulation.clearDeviceMetricsOverride');await session.detach()}
  }});
  scenarios.push({id:'visual-viewport-scale-scroll-reset',options:{viewport:{width:960,height:720},deviceScaleFactor:1},run:async x=>{
    const session=await x.context.newCDPSession(x.page);
    try{
      x.data.initial=await sample(x.page);await reset(x.page);
      await session.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});
      await x.page.waitForFunction(()=>visualViewport.scale===2);await waitEvent(x.page,'visual-resize');
      x.data.scaled=await sample(x.page);checkGeometry(x.data.scaled,{width:960,height:720,dpr:1,scale:2});
      assert.deepEqual(x.data.scaled.queries,x.data.initial.queries,'pinch scale does not change layout media queries or DPR');
      await x.page.evaluate(()=>{document.documentElement.style.overflow='auto';document.body.style.overflow='visible';document.body.style.height='3000px';scrollTo(0,120)});
      await x.page.waitForFunction(()=>scrollY>0);
      x.data.scrolled=await sample(x.page);checkGeometry(x.data.scrolled,{width:960,height:720,dpr:1,scale:2});
      await session.send('Emulation.resetPageScaleFactor');
      // Reset requests a constraint reset, consumed on the next layout. It
      // does not promise synchronous scale mutation in this protocol version.
      await x.page.evaluate(()=>{scrollTo(0,0);document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';document.body.style.height=''});
      await x.page.waitForFunction(()=>visualViewport.scale===1);
      x.data.restored=await sample(x.page);checkGeometry(x.data.restored,{width:960,height:720,dpr:1});
      assert.deepEqual(basic(x.data.restored),basic(x.data.initial));
      x.signature={scaledLayout:x.data.scaled.inner,scaledDpr:x.data.scaled.dpr,scale:x.data.scaled.visual.scale,scrolled:true,restored:true};
    }finally{await session.send('Emulation.resetPageScaleFactor');await session.detach()}
  }});
  scenarios.push({id:'preference-change-and-reset',options:{viewport:{width:960,height:720},colorScheme:null,reducedMotion:null,forcedColors:null},run:async x=>{
    const initial=await sample(x.page);x.data.initial=initial;x.data.steps=[];let previous=initial;
    for(const options of [{colorScheme:'dark',reducedMotion:'reduce',forcedColors:'active'},{colorScheme:'light',reducedMotion:'no-preference',forcedColors:'none'},{colorScheme:null,reducedMotion:null,forcedColors:null}]){
      await reset(x.page);await x.page.emulateMedia(options);
      const expected=options.colorScheme===null?{dark:initial.queries.dark,reduce:initial.queries.reduce,forced:initial.queries.forced}:{dark:options.colorScheme==='dark',reduce:options.reducedMotion==='reduce',forced:options.forcedColors==='active'};
      await x.page.waitForFunction(expected=>Object.entries(expected).every(([name,value])=>geometryFixture.sample().queries[name]===value&&geometryFixture.sample().frame.queries[name]===value),expected);
      for(const [name,value] of Object.entries(expected))if(previous.queries[name]!==value)await waitEvent(x.page,'media',name,value);
      const current=await sample(x.page);x.data.steps.push({options,current});checkGeometry(current,{width:960,height:720});
      for(const [name,value] of Object.entries(expected)){assert.equal(current.queries[name],value);assert.equal(current.frame.queries[name],value)}
      previous=current;
    }
    assert.deepEqual(basic(previous),basic(initial),'null media options restore context defaults');
    x.signature={explicit:x.data.steps.slice(0,2).map(step=>step.current.queries),restored:true};
  }});
  scenarios.push({id:'target-and-context-isolation',options:{viewport:null},run:async x=>{
    const sibling=await x.context.newPage(),otherContext=await x.browser.newContext({viewport:null}),other=await otherContext.newPage();
    const session=await x.context.newCDPSession(x.page);
    try{
      await sibling.goto(url);await other.goto(url);
      for(const page of [sibling,other])await page.frameLocator('iframe').locator('#viewport-box').waitFor({state:'attached'});
      x.data.before={sibling:await sample(sibling),other:await sample(other)};
      await session.send('Emulation.setDeviceMetricsOverride',metrics);
      await session.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'},{name:'prefers-reduced-motion',value:'reduce'}]});
      await waitSize(x.page,840,620);
      x.data.target=await sample(x.page);checkGeometry(x.data.target,{width:840,height:620,dpr:1.25});
      assert.equal(x.data.target.queries.dark,true);assert.equal(x.data.target.queries.reduce,true);
      x.data.after={sibling:await sample(sibling),other:await sample(other)};
      assert.deepEqual(basic(x.data.after.sibling),basic(x.data.before.sibling),'sibling target unaffected');
      assert.deepEqual(basic(x.data.after.other),basic(x.data.before.other),'unrelated context unaffected');
      x.signature={target:basic(x.data.target),siblingUnchanged:true,otherContextUnchanged:true};
    }finally{await session.send('Emulation.clearDeviceMetricsOverride');await session.send('Emulation.setEmulatedMedia',{media:'',features:[]});await session.detach();await sibling.close();await otherContext.close()}
  }});
  try{
    for(const engine of engines){
      const identity={id:engine.id,version:engine.version,exeSha256:await hash(engine.executable),dllSha256:await hash(join(dirname(engine.executable),'chrome.dll'))};report.engines.push(identity);
      assert.equal(identity.exeSha256,engine.exeSha256);assert.equal(identity.dllSha256,engine.dllSha256);
      for(const headless of [false,true]){
        const mode=headless?'headless':'headed';
        const browser=await chromium.launch({executablePath:engine.executable,headless,chromiumSandbox:true});
        try{
          assert.equal(browser.version(),engine.version);
          for(const scenario of scenarios)await t.test(`${engine.id} ${mode} ${scenario.id}`,{timeout:45000},async()=>{
            const context=await browser.newContext(scenario.options);
            const observation={engine:engine.id,mode,scenario:scenario.id,status:'failed',pageErrors:[],crashes:[],data:{}};
            let page;
            try{
              page=await context.newPage();page.setDefaultTimeout(7000);
              page.on('pageerror',error=>observation.pageErrors.push(error.message));page.on('crash',()=>observation.crashes.push(true));
              await page.goto(url);await page.frameLocator('iframe').locator('#viewport-box').waitFor({state:'attached'});
              const state={browser,context,page,data:observation.data};await scenario.run(state);observation.signature=state.signature;
              assert.deepEqual(observation.pageErrors,[]);assert.deepEqual(observation.crashes,[]);observation.status='passed';
            }catch(error){
              observation.error={message:error.message,stack:error.stack};
              if(page&&!page.isClosed())observation.failureState=await sample(page).catch(failure=>({captureError:failure.message}));
              throw error;
            }
            finally{await context.close();report.observations.push(observation);await save()}
          });
        }finally{await browser.close()}
      }
      identity.runtimeUnchanged=identity.exeSha256===await hash(engine.executable)&&identity.dllSha256===await hash(join(dirname(engine.executable),'chrome.dll'));
      assert.equal(identity.runtimeUnchanged,true);
    }
    if(engines.length===2)await t.test('paired engine contract outcomes and deterministic results agree',()=>{
      for(const observation of report.observations.filter(value=>value.engine===engines[1].id)){
        const baseline=report.observations.find(value=>value.engine===engines[0].id&&value.mode===observation.mode&&value.scenario===observation.scenario);
        const comparison={mode:observation.mode,scenario:observation.scenario,status:'failed'};report.comparisons.push(comparison);
        assert.equal(observation.status,'passed');assert.equal(baseline?.status,'passed');
        assert.deepEqual(observation.signature,baseline.signature);comparison.status='passed';
      }
    });
    report.completed=true;
  }finally{
    await new Promise(resolve=>server.close(resolve));report.completedAt=new Date().toISOString();
    report.passed=report.observations.filter(value=>value.status==='passed').length;report.failed=report.observations.filter(value=>value.status!=='passed').length;
    await save();
  }
});
