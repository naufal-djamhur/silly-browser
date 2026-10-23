import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {chromium} from 'playwright-core';

// Shared web-platform contracts, adapted from functional-parity-browser.
// Font delivery is an owned HTTP web font, so stock requires no custom loader.
// Neither engine receives native overrides or CDP environment emulation.
const executablePath=process.env.CUSTOM_BROWSER_EXECUTABLE;
const controlPath=process.env.CUSTOM_BROWSER_CONTROL_EXECUTABLE;
const fontDirectory=process.env.CUSTOM_BROWSER_FONT_TEST_DIR;
const release='155.0.8059.80';
const sample=`()=>({language:navigator.language,locale:Intl.DateTimeFormat().resolvedOptions().locale,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,jan:new Date('2026-01-15T12:00:00Z').getTimezoneOffset(),jul:new Date('2026-07-15T12:00:00Z').getTimezoneOffset()})`;
let expectedEnvironment;
const hash=async path=>{const h=createHash('sha256');for await(const b of createReadStream(path))h.update(b);return h.digest('hex')};

const scenarios = [
  ['valid-beacon-delivery', async page => {
    const accepted=await page.evaluate(()=>navigator.sendBeacon('/beacon',new Blob(['owned beacon ✓'],{type:'text/plain;charset=UTF-8'})));
    assert.equal(accepted,true);
    await page.waitForFunction(async()=>{
      const result=await(await fetch('/beacon-received')).json();
      return result.body==='owned beacon ✓';
    });
    const observed=await page.evaluate(async()=>await(await fetch('/beacon-received')).json());
    assert.deepEqual(observed,{body:'owned beacon ✓',contentType:'text/plain;charset=utf-8'});
    return observed;
  }],
  ['layout-and-web-font', async page => {
    await page.setContent(`<!doctype html><style>body{margin:0}#box{position:absolute;left:10px;top:20px;width:120px;height:40px;padding:5px;border:2px solid;transform:translate(3px,4px)}</style><div id="box"></div>`);
    const observed = await page.evaluate(async () => {
      const face = await new FontFace('ParityAhem', 'url("/Ahem.ttf")').load();
      document.fonts.add(face);
      const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
      context.font = '20px ParityAhem';
      const {x,y,width,height} = document.querySelector('#box').getBoundingClientRect();
      return {box:{x,y,width,height}, textWidth:context.measureText('MMMM').width, viewport:[innerWidth,innerHeight]};
    });
    assert.deepEqual(observed.box, {x:13,y:24,width:134,height:54});
    assert(Math.abs(observed.textWidth - 80) < 0.05, 'Web Ahem width');
    assert.deepEqual(observed.viewport, [960,720]);
    return observed;
  }],
  ['canvas-and-offscreen-worker', async page => {
    const observed = await page.evaluate(async () => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 4;
      const context = canvas.getContext('2d'); context.fillStyle = 'rgb(17,34,51)'; context.fillRect(0,0,4,4);
      const worker = new Worker('/worker.js');
      try {
        const offscreen = await new Promise((resolve,reject) => {
          const timer = setTimeout(() => reject(Error('Offscreen worker timeout')), 7000);
          worker.onmessage = event => {clearTimeout(timer);resolve(event.data)};
          worker.onerror = error => {clearTimeout(timer);reject(Error(error.message))};
          worker.postMessage('canvas');
        });
        return {document:[...context.getImageData(1,1,1,1).data], offscreen};
      } finally {worker.terminate()}
    });
    assert.deepEqual(observed, {document:[17,34,51,255],offscreen:[17,34,51,255]});
    return observed;
  }],
  ['webgl-render-readback', async page => {
    const observed = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 4;
      const gl = canvas.getContext('webgl', {antialias:false});
      if (!gl) throw Error('WebGL context unavailable');
      gl.clearColor(0.25,0.5,0.75,1); gl.clear(gl.COLOR_BUFFER_BIT);
      const pixel = new Uint8Array(4); gl.readPixels(1,1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
      const result = {pixel:[...pixel],error:gl.getError()};
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return result;
    });
    assert.equal(observed.error, 0);
    for (const [index,value] of [64,128,191,255].entries()) assert(Math.abs(observed.pixel[index] - value) <= 1);
    return observed;
  }],
  ['offline-audio-gain', async page => {
    const observed = await page.evaluate(async () => {
      const audio = new OfflineAudioContext(1,128,48000), buffer = audio.createBuffer(1,128,48000);
      const values = [0,0.25,-0.5,0.75], input = buffer.getChannelData(0);
      for (let index=0;index<input.length;index++) input[index] = values[index%4];
      const source = audio.createBufferSource(), gain = audio.createGain();
      source.buffer = buffer; gain.gain.value = 0.5;
      source.connect(gain).connect(audio.destination); source.start();
      const rendered = await audio.startRendering(), output = rendered.getChannelData(0);
      let maxError = 0;
      for (let index=0;index<output.length;index++) maxError = Math.max(maxError, Math.abs(output[index]-values[index%4]*0.5));
      return {maxError,frames:rendered.length,sampleRate:rendered.sampleRate};
    });
    assert(observed.maxError <= 1e-7); assert.equal(observed.frames,128); assert.equal(observed.sampleRate,48000);
    return observed;
  }],
  ['unicode-editing-and-tab-order', async page => {
    await page.setContent(`<!doctype html><input id="editor"><button disabled>Disabled</button><button id="submit" onclick="document.querySelector('#count').textContent=Number(document.querySelector('#count').textContent)+1">Submit</button><output id="count">0</output>`);
    await page.locator('#editor').fill('naïve');
    await page.keyboard.press('End'); await page.keyboard.insertText('🙂'); await page.keyboard.press('Backspace');
    assert.equal(await page.locator('#editor').inputValue(), 'naïve');
    await page.keyboard.press('Shift+Home'); await page.keyboard.insertText('こんにちは');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'submit');
    await page.keyboard.press('Enter');
    const observed = {value:await page.locator('#editor').inputValue(),activations:await page.locator('#count').textContent()};
    assert.deepEqual(observed, {value:'こんにちは',activations:'1'});
    return observed;
  }],
  ['nested-scroll-and-iframe-input', async page => {
    await page.setContent(`<!doctype html><style>body{margin:0}#scroll{height:100px;overflow:auto;width:300px}#target{margin-top:600px}</style><div id="scroll"><button id="target" onclick="this.textContent='clicked'">Target</button></div><iframe src="/frame"></iframe>`);
    await page.locator('#target').click();
    const frame = page.frameLocator('iframe');
    await frame.locator('#editor').fill('frame value'); await frame.locator('#save').click();
    const observed = await page.evaluate(() => ({windowY:scrollY,scrolled:document.querySelector('#scroll').scrollTop>0,target:document.querySelector('#target').textContent}));
    observed.frameValue = await frame.locator('#saved').textContent();
    assert.deepEqual(observed, {windowY:0,scrolled:true,target:'clicked',frameValue:'frame value'});
    return observed;
  }],
  ['popup-navigation-and-close', async page => {
    await page.setContent('<!doctype html><a href="/popup" target="_blank">Open</a>');
    const [popup] = await Promise.all([page.waitForEvent('popup'),page.getByText('Open',{exact:true}).click()]);
    try {
      await popup.waitForLoadState('domcontentloaded');
      assert.equal(await popup.title(), 'Parity popup');
      assert.equal(new URL(popup.url()).pathname, '/popup');
    } finally {await popup.close()}
    assert.equal(page.isClosed(), false);
    return {popupTitle:'Parity popup',popupClosed:popup.isClosed(),openerOpen:!page.isClosed()};
  }],
  ['indexeddb-and-default-worker-configuration', async page => {
    const observed = await page.evaluate(async () => {
      const worker = new Worker('/worker.js');
      let environment;
      try {
        environment = await new Promise((resolve,reject) => {
          const timer = setTimeout(() => reject(Error('Configuration worker timeout')),7000);
          worker.onmessage = event => {clearTimeout(timer);resolve(event.data)};
          worker.onerror = error => {clearTimeout(timer);reject(Error(error.message))};
          worker.postMessage('environment');
        });
      } finally {worker.terminate()}
      const open = () => new Promise((resolve,reject) => {
        const request = indexedDB.open('parity',1);
        request.onupgradeneeded = () => request.result.createObjectStore('values');
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      const first = await open();
      try {
        await new Promise((resolve,reject) => {
          const transaction = first.transaction('values','readwrite');
          transaction.objectStore('values').put('saved','key');
          transaction.oncomplete = resolve; transaction.onabort = () => reject(transaction.error);
        });
      } finally {first.close()}
      const second = await open();
      let stored;
      try {
        stored = await new Promise((resolve,reject) => {
          const request = second.transaction('values').objectStore('values').get('key');
          request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        });
      } finally {second.close()}
      return {document:window.observe(),worker:environment,stored,headers:await(await fetch('/headers')).json()};
    });
    assert.deepEqual(observed.document, expectedEnvironment); assert.deepEqual(observed.worker, expectedEnvironment);
    assert.equal(observed.stored, 'saved'); assert.equal(observed.headers.language.split(',')[0], expectedEnvironment.language);
    return observed;
  }],
];

test('custom candidate matches exact upstream Chromium shared functional contracts',{
  skip:!executablePath||!controlPath,timeout:300000,
},async t=>{
  assert(fontDirectory,'Set CUSTOM_BROWSER_FONT_TEST_DIR to a directory containing Ahem.ttf');
  const output=resolve(process.env.CUSTOM_STOCK_PARITY_REPORT??'artifacts/stock-parity/results.json');
  await mkdir(dirname(output),{recursive:true});
  const font=await readFile(join(fontDirectory,'Ahem.ttf'));
  const report={schemaVersion:1,startedAt:new Date().toISOString(),release,
    scope:'Owned local web-platform correctness; no external detectors or concealment',
    conditions:{viewport:{width:960,height:720},deviceScaleFactor:1,environment:'native defaults',font:'HTTP Ahem web font',fontSha256:createHash('sha256').update(font).digest('hex'),profile:'fresh isolated context per scenario',proxy:false,humanize:false},
    engines:[],observations:[],comparisons:[],completed:false};
  let beacon;
  const server=createServer((request,response)=>{
    response.setHeader('Cache-Control','no-store');
    if(request.url==='/beacon'){
      const chunks=[];request.on('data',chunk=>chunks.push(chunk));
      request.on('end',()=>{beacon={body:Buffer.concat(chunks).toString('utf8'),contentType:request.headers['content-type']};response.writeHead(204);response.end()});return;
    }
    if(request.url==='/beacon-received'){response.setHeader('Content-Type','application/json');response.end(JSON.stringify(beacon??{}));return}
    if(request.url==='/Ahem.ttf'){response.setHeader('Content-Type','font/ttf');response.end(font);return}
    if(request.url==='/worker.js'){
      response.setHeader('Content-Type','application/javascript');
      response.end(`onmessage=e=>{if(e.data==='canvas'){const c=new OffscreenCanvas(4,4),x=c.getContext('2d');x.fillStyle='rgb(17,34,51)';x.fillRect(0,0,4,4);postMessage([...x.getImageData(1,1,1,1).data])}else postMessage((${sample})())}`);return;
    }
    if(request.url==='/headers'){response.setHeader('Content-Type','application/json');response.end(JSON.stringify({language:request.headers['accept-language']}));return}
    response.setHeader('Content-Type','text/html');
    if(request.url==='/frame'){response.end(`<!doctype html><input id="editor"><button id="save" onclick="document.querySelector('#saved').textContent=document.querySelector('#editor').value">Save</button><output id="saved"></output>`);return}
    response.end(`<!doctype html><title>${request.url==='/popup'?'Parity popup':'Stock parity'}</title><script>window.observe=${sample}</script>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  try{
    for(const [engine,path] of [['stock-control',controlPath],['custom-candidate',executablePath]]){
      const identity={engine,exeSha256:await hash(path),dllSha256:await hash(join(dirname(path),'chrome.dll'))};
      report.engines.push(identity);
      for(const headless of [false,true]){
        const mode=headless?'headless':'headed';
        const browser=await chromium.launch({executablePath:path,headless,chromiumSandbox:true});
        try{
          assert.equal(browser.version(),release,'Both binaries must report the exact requested version');
          identity.browserVersion=browser.version();
          if(!expectedEnvironment){
            const page=await browser.newPage();await page.goto(url);
            expectedEnvironment=await page.evaluate(()=>window.observe());
            report.conditions.expectedNativeEnvironment=expectedEnvironment;
            await page.close();
          }
          for(const [name,operation] of scenarios)await t.test(`${engine} ${mode}: ${name}`,{timeout:25000},async()=>{
            beacon=undefined;
            const context=await browser.newContext({viewport:{width:960,height:720},deviceScaleFactor:1});
            const observation={engine,mode,name,status:'failed',crashes:[],pageErrors:[]};
            try{
              const page=await context.newPage();page.setDefaultTimeout(7000);
              page.on('crash',()=>observation.crashes.push(true));
              page.on('pageerror',error=>observation.pageErrors.push(error.message));
              await page.goto(url);observation.data=await operation(page);
              assert.deepEqual(observation.crashes,[]);assert.deepEqual(observation.pageErrors,[]);
              observation.status='passed';
            }catch(error){observation.error=String(error);throw error}
            finally{report.observations.push(observation);await context.close();await writeFile(output,JSON.stringify(report,null,2)+'\n')}
          });
        }finally{await browser.close()}
      }
      identity.runtimeUnchanged=identity.exeSha256===await hash(path)&&identity.dllSha256===await hash(join(dirname(path),'chrome.dll'));
      assert(identity.runtimeUnchanged,'Runtime changed during the comparison');
    }
    await t.test('all four engine/mode observations agree',()=>{
      for(const [name] of scenarios){
        const baseline=report.observations.find(x=>x.engine==='stock-control'&&x.mode==='headed'&&x.name===name);
        assert.equal(baseline?.status,'passed');
        for(const observation of report.observations.filter(x=>x.name===name&&x!==baseline)){
          const comparison={name,engine:observation.engine,mode:observation.mode,status:'failed'};report.comparisons.push(comparison);
          assert.equal(observation.status,'passed');assert.deepEqual(observation.data,baseline.data,`${observation.engine} ${observation.mode}: ${name}`);
          comparison.status='passed';
        }
      }
    });
    report.completed=true;
  }finally{
    await new Promise(resolve=>server.close(resolve));report.completedAt=new Date().toISOString();
    report.passed=report.observations.filter(x=>x.status==='passed').length;report.failed=report.observations.filter(x=>x.status!=='passed').length;
    await writeFile(output,JSON.stringify(report,null,2)+'\n');
  }
});
