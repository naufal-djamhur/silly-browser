import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {launchContext} from '../sdk/js/index.mjs';
const executablePath=process.env.CUSTOM_BROWSER_EXECUTABLE;
test('compiled engine: desktop identities agree in HTTP, document, iframe and worker',{skip:!executablePath,timeout:120000},async()=>{
  const server=createServer((req,res)=>{
    res.setHeader('Accept-CH','Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness');
    if(req.url==='/headers') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.headers));}
    else {res.setHeader('Content-Type','text/html');res.end(req.url==='/frame'?'<title>Frame</title>':'<!doctype html><title>Identity fixture</title><iframe src="/frame"></iframe>');}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const cases=[{platform:'windows',navigator:'Win32',hint:'Windows',ua:'Windows NT 10.0'}, {platform:'linux',navigator:'Linux x86_64',hint:'Linux',ua:'Linux x86_64'}, {platform:'macos',navigator:'MacIntel',hint:'macOS',ua:'Macintosh'}];
  const observations=[];
  try {
    for(const identity of cases) {
      const context=await launchContext({executablePath,platform:identity.platform,seed:'12345',headless:true});
      try {
        const page=await context.newPage();await page.goto(origin);
        const result=await page.evaluate(async()=>{
          const workerSource=`onmessage = async () => postMessage({platform:navigator.platform,ua:navigator.userAgent,hints:await navigator.userAgentData.getHighEntropyValues(['platformVersion','architecture','bitness'])});`;
          const url=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));
          const worker=new Worker(url);
          const info=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker timed out')),10000);worker.onmessage=e=>{clearTimeout(timer);resolve(e.data)};worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message))};worker.postMessage('observe')});
          worker.terminate();URL.revokeObjectURL(url);
          return {document:{platform:navigator.platform,ua:navigator.userAgent,hints:await navigator.userAgentData.getHighEntropyValues(['platformVersion','architecture','bitness'])},worker:info,headers:await(await fetch('/headers')).json()};
        });
        const frame=page.frames().find(f=>f!==page.mainFrame());
        result.frame=await frame.evaluate(()=>({platform:navigator.platform,ua:navigator.userAgent,hints:navigator.userAgentData.toJSON()}));
        for(const surface of [result.document,result.worker,result.frame]) {
          assert.equal(surface.platform,identity.navigator);
          assert.equal(surface.hints.platform,identity.hint);
          assert(surface.ua.includes(identity.ua));
        }
        assert(result.headers['user-agent'].includes(identity.ua));
        assert.equal(result.headers['sec-ch-ua-platform'],`"${identity.hint}"`);
        observations.push({identity:identity.platform,...result});
      } finally {await context.close();}
    }
    console.log(JSON.stringify(observations));
  } finally {await new Promise(r=>server.close(r));}
});
