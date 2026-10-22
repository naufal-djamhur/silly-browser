import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {launch} from '../sdk/js/index.mjs';

const executablePath=process.env.CUSTOM_BROWSER_EXECUTABLE;
const fontDirectory=process.env.CUSTOM_BROWSER_FONT_TEST_DIR;
const release=process.env.CUSTOM_BROWSER_RELEASE??'155.0.8059.80';
const execute=promisify(execFile);
const sample=`()=>({language:navigator.language,locale:Intl.DateTimeFormat().resolvedOptions().locale,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,jan:new Date('2026-01-15T12:00:00Z').getTimezoneOffset(),jul:new Date('2026-07-15T12:00:00Z').getTimezoneOffset()})`;
const hash=async path=>{const digest=createHash('sha256');for await(const chunk of createReadStream(path))digest.update(chunk);return digest.digest('hex')};

test('native CLI rejects invalid timezone/locale before engine-info success',{skip:!executablePath,timeout:45000},async()=>{
  for(const [flag,value] of [['custom-browser-timezone','Invalid/Zone'],['custom-browser-locale','en_US']]){
    await assert.rejects(execute(executablePath,['--headless','--custom-browser-engine-info',`--${flag}=${value}`],{windowsHide:true,timeout:15000}),error=>
      typeof error.code==='number' && error.code!==0 && !error.killed && error.stderr.includes(flag));
  }
});

test('native flags: document, iframe, HTTP and worker locale/timezone agree in both modes',{skip:!executablePath,timeout:180000},async()=>{
  const server=createServer((request,response)=>{
    if(request.url==='/headers'){response.setHeader('Content-Type','application/json');response.end(JSON.stringify({language:request.headers['accept-language']}));return}
    if(request.url==='/dedicated.js'){response.setHeader('Content-Type','application/javascript');response.end(`onmessage=()=>postMessage((${sample})())`);return}
    if(request.url==='/shared.js'){response.setHeader('Content-Type','application/javascript');response.end(`onconnect=e=>{const p=e.ports[0];p.onmessage=()=>p.postMessage((${sample})())}`);return}
    if(request.url==='/service.js'){response.setHeader('Content-Type','application/javascript');response.end(`oninstall=()=>skipWaiting();onactivate=e=>e.waitUntil(clients.claim());onmessage=e=>e.ports[0].postMessage((${sample})())`);return}
    response.setHeader('Content-Type','text/html');response.end(`<!doctype html><title>Native configuration fixture</title><script>window.observe=${sample}</script>${request.url==='/frame'?'':'<iframe src="/frame"></iframe>'}`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`,observations=[];
  let completed=false;
  try {
    const {stdout}=await execute(executablePath,['--headless','--custom-browser-engine-info'],{windowsHide:true,timeout:15000});
    const info=JSON.parse(stdout.trim());
    for(const name of ['native-timezone','native-locale'])assert(info.capabilities?.includes(name),`Missing ${name} capability`);
    for(const headless of [true,false]){
      const args=['--custom-browser-timezone=Europe/Paris','--custom-browser-locale=fr-FR'];
      if(fontDirectory)args.push(`--custom-browser-fonts-dir=${resolve(fontDirectory)}`);
      const browser=await launch({executablePath,headless,args});
      try {
        assert.equal(browser.version(),release);
        // Deliberately no locale/timezone overrides: this qualifies native defaults.
        const context=await browser.newContext();
        try {
          const page=await context.newPage();await page.goto(url);
          const document=await page.evaluate(()=>window.observe());
          const frame=await page.frames().find(frame=>frame!==page.mainFrame()).evaluate(()=>window.observe());
          const headers=await page.evaluate(async()=>await(await fetch('/headers')).json());
          const workers=await page.evaluate(async()=>{
            const ask=(port,start)=>new Promise((resolve,reject)=>{
              const timer=setTimeout(()=>reject(Error('Worker response timeout')),10000);
              port.onmessage=event=>{clearTimeout(timer);resolve(event.data)};start();
            });
            const worker=new Worker('/dedicated.js');
            const dedicated=await ask(worker,()=>worker.postMessage('sample'));worker.terminate();
            const sharedWorker=new SharedWorker('/shared.js');
            const shared=await ask(sharedWorker.port,()=>{sharedWorker.port.start();sharedWorker.port.postMessage('sample')});sharedWorker.port.close();
            const registration=await navigator.serviceWorker.register('/service.js');
            const ready=await navigator.serviceWorker.ready;
            const channel=new MessageChannel();
            const service=await ask(channel.port1,()=>ready.active.postMessage('sample',[channel.port2]));
            channel.port1.close();await registration.unregister();return {dedicated,shared,service};
          });
          const expected={language:'fr-FR',locale:'fr-FR',timezone:'Europe/Paris',jan:-60,jul:-120};
          for(const observed of [document,frame,...Object.values(workers)])assert.deepEqual(observed,expected);
          assert.equal(headers.language.split(',')[0],'fr-FR');
          let font={status:'not-requested'};
          if(fontDirectory){
            assert(info.capabilities.includes('font-directory-windows'));
            const width=await page.evaluate(async()=>{
              const face=new FontFace('NativeAhemFixture','local("Ahem")');
              await face.load();document.fonts.add(face);
              const canvas=document.createElement('canvas'),context=canvas.getContext('2d');context.font='20px NativeAhemFixture';
              return context.measureText('MMMM').width;
            });
            assert(Math.abs(width-80)<0.05,`Ahem advance width mismatch: ${width}`);
            font={status:'passed',width,fixtureSha256:await hash(join(fontDirectory,'Ahem.ttf'))};
          }
          observations.push({headless,status:'passed',document,frame,workers,headerLanguage:headers.language,font});
        }finally{await context.close()}
      }finally{await browser.close()}
    }
    completed=true;
  }finally{
    await new Promise(resolve=>server.close(resolve));
    const output=resolve(process.env.CUSTOM_NATIVE_ENV_REPORT??'artifacts/native-environment/results.json');
    await mkdir(dirname(output),{recursive:true});
    await writeFile(output,JSON.stringify({completed,release,scope:'Native process defaults and optional Windows Ahem collection. Managed policy, host-change notifications, UI resource fallback, Local Font Access and all platforms remain separately qualified; no detector claim',binarySha256:await hash(executablePath),runtimeSha256:await hash(join(dirname(executablePath),'chrome.dll')),observations},null,2)+'\n');
  }
});
