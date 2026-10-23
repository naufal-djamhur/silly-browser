import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {chromium} from 'playwright-core';
import {launch} from '../sdk/js/index.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const executablePath=process.env.CUSTOM_BROWSER_EXECUTABLE;
const output=resolve(process.env.CUSTOM_HTTP_PROXY_REPORT??'artifacts/http-proxy-native/results.json');
const baseline=process.env.CUSTOM_HTTP_PROXY_BASELINE==='1';
const execute=promisify(execFile);
const hash=async path=>{const h=createHash('sha256');for await(const b of createReadStream(path))h.update(b);return h.digest('hex')};

async function fixture(){
  const records=[],sockets=new Set();
  const username='fixture-user',password='p@ss:+/%=value';
  const expected='Basic '+Buffer.from(`${username}:${password}`).toString('base64');
  const respond=(req,res)=>{records.push({kind:'origin',authorization:req.headers.authorization??null,proxyAuthorization:req.headers['proxy-authorization']??null});res.setHeader('Content-Type','application/json');res.end(JSON.stringify({marker:'owned-native-proxy',authorization:req.headers.authorization??null,proxyAuthorization:req.headers['proxy-authorization']??null}))};
  const origin=http.createServer(respond);
  const tlsOrigin=https.createServer({key:await readFile(process.env.CUSTOM_HTTP_PROXY_TLS_KEY),cert:await readFile(process.env.CUSTOM_HTTP_PROXY_TLS_CERT)},respond);
  const proxy=http.createServer((req,res)=>{
    let url;try{url=new URL(req.url)}catch{res.writeHead(400);res.end();return}
    if(url.hostname!=='origin.test'){res.writeHead(502);res.end();return}
    const valid=req.headers['proxy-authorization']===expected;
    records.push({kind:'http-proxy',credentialsProvided:!!req.headers['proxy-authorization'],authenticated:valid});
    if(!valid){res.writeHead(407,{'Proxy-Authenticate':'Basic realm="owned-fixture"','Connection':'close'});res.end();return}
    const headers={...req.headers};delete headers['proxy-authorization'];delete headers['proxy-connection'];
    const upstream=http.request({hostname:'127.0.0.1',port:origin.address().port,path:url.pathname+url.search,method:req.method,headers,agent:false},incoming=>{res.writeHead(incoming.statusCode,incoming.headers);incoming.pipe(res)});
    upstream.on('error',()=>{res.writeHead(502);res.end()});req.pipe(upstream);
  });
  proxy.on('connect',(req,client,head)=>{
    if(req.url!==`tunnel.test:${tlsOrigin.address().port}`){client.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');return}
    const valid=req.headers['proxy-authorization']===expected;
    records.push({kind:'connect-proxy',credentialsProvided:!!req.headers['proxy-authorization'],authenticated:valid});
    if(!valid){client.end('HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic realm="owned-fixture"\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');return}
    const upstream=net.connect(tlsOrigin.address().port,'127.0.0.1',()=>{client.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)upstream.write(head);client.pipe(upstream);upstream.pipe(client)});
    sockets.add(upstream);upstream.on('close',()=>sockets.delete(upstream));upstream.on('error',()=>client.destroy());client.on('error',()=>upstream.destroy());
  });
  const servers=[origin,tlsOrigin,proxy];
  for(const server of servers){server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket))});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))}
  const uri=`http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@127.0.0.1:${proxy.address().port}`;
  return {records,uri,wrongUri:uri.replace(encodeURIComponent(password),'incorrect'),httpUrl:`http://origin.test:${origin.address().port}/proof`,httpsUrl:`https://tunnel.test:${tlsOrigin.address().port}/proof`,async close(){for(const socket of sockets)socket.destroy();await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))))}};
}

test('native HTTP proxy configuration fails closed before launch',{skip:!executablePath||baseline,timeout:45000},async()=>{
  const invalid=[
    ['--proxy-server=http://fixture:bad%GG@127.0.0.1:1234'],
    ['--proxy-server=http://fixture%3Auser:password@127.0.0.1:1234'],
    ['--proxy-server=http://fixture:bad%0D%0A@127.0.0.1:1234'],
    ['--proxy-server=http://fixture:bad%00@127.0.0.1:1234'],
    ['--proxy-server=http://fixture:password@127.0.0.1:1234/path'],
    ['--proxy-server=http://fixture:password@127.0.0.1:1234?query'],
    ['--proxy-server=http://fixture:password@127.0.0.1:1234#fragment'],
    ['--proxy-server=http://:password@127.0.0.1:1234'],
    ['--proxy-server=http://fixture:password@127.0.0.1:1234','--no-proxy-server'],
    ['--proxy-server=http://fixture:password@127.0.0.1:1234','--proxy-auto-detect'],
    ['--proxy-server=http://fixture:password@127.0.0.1:1234','--proxy-pac-url=http://example.test/proxy.pac'],
    ['--custom-browser-http-proxy-file=relative.txt'],
    ['--custom-browser-http-proxy-file=relative.txt','--proxy-server=http://127.0.0.1:1234'],
  ];
  for(const args of invalid)await assert.rejects(
    execute(executablePath,['--headless','--custom-browser-engine-info',...args],{windowsHide:true,timeout:10000}),
    error=>Number.isInteger(error.code)&&error.code!==0&&!error.killed&&
      !error.stdout?.includes('"engine":"custom-browser"')&&
      !error.stderr?.includes('password@')&&error.stderr.includes('Invalid native HTTP proxy configuration'));
});

test('native inline HTTP proxy authentication in both display modes',{skip:!executablePath,timeout:180000},async t=>{
  await mkdir(dirname(output),{recursive:true});
  const report={schemaVersion:1,startedAt:new Date().toISOString(),baseline,executableSha256:await hash(executablePath),runtimeSha256:await hash(join(dirname(executablePath),'chrome.dll')),driverProxyOptionUsed:false,httpCredentialsUsed:false,scope:'Owned loopback HTTP proxy and HTTP/HTTPS origins; no external targets or detector checks',results:[]};
  const cases=baseline?['inline-http']:['inline-http','inline-connect','file-http','wrong-credentials','bypass'];
  try{
    for(const headless of [false,true])for(const name of cases)await t.test(`${headless?'headless':'headed'} ${name}`,{timeout:20000},async()=>{
      const owned=await fixture(),record={headless,name,status:'failed'};
      let browser;
      try{
        const uri=name==='wrong-credentials'?owned.wrongUri:owned.uri;
        const args=['--host-resolver-rules=MAP origin.test 127.0.0.1, MAP tunnel.test 127.0.0.1',`--proxy-bypass-list=${name==='bypass'?'origin.test':'<-loopback>'}`];
        if(!baseline&&name==='inline-http')args.push('--enable-automation');
        if(name==='file-http'){
          const path=join(dirname(output),`${headless?'headless':'headed'}-fixture-proxy.txt`);await writeFile(path,uri+'\n');args.push(`--custom-browser-http-proxy-file=${path}`);
        }else args.push(`--proxy-server=${uri}`);
        // No Playwright proxy or httpCredentials: authentication must be native.
        browser=name==='file-http'
          ?await launch({executablePath,headless,args})
          :await chromium.launch({executablePath,headless,chromiumSandbox:true,args});
        if(name==='file-http')record.sdkNativeArgumentsValidated=true;
        record.browserVersion=browser.version();
        assert.equal(record.browserVersion,process.env.CUSTOM_BROWSER_RELEASE??'155.0.8059.80');
        if(!baseline&&name==='inline-http'){
          const session=await browser.newBrowserCDPSession();
          const {arguments:commandLine}=await session.send('Browser.getBrowserCommandLine');
          assert(!commandLine.some(arg=>arg.includes('fixture-user')||arg.includes('p%40ss')));
          assert(commandLine.includes(`--proxy-server=${new URL(owned.uri).origin}`));
          record.browserCommandLineSanitized=true;
          await session.detach();
        }
        const context=await browser.newContext({ignoreHTTPSErrors:true});
        const page=await context.newPage();
        let response,error;
        try{response=await page.goto(name==='inline-connect'?owned.httpsUrl:owned.httpUrl,{timeout:8000})}catch(cause){error=cause}
        if(name==='wrong-credentials'){
          assert(!error?.message.includes('Timeout'),'Denial must finish without an interactive prompt or timeout');
          assert(error?.message.match(/ERR_(INVALID_AUTH_CREDENTIALS|PROXY_AUTH|TUNNEL_CONNECTION_FAILED|HTTP_RESPONSE_CODE_FAILURE)/)||response?.status()===407,`Expected explicit authentication denial; ${error?.message??response?.status()}`);
          const attempts=owned.records.filter(item=>item.kind==='http-proxy');
          assert(attempts.some(item=>item.credentialsProvided),'Native credentials were never attempted');
          assert(attempts.filter(item=>item.credentialsProvided).length<=2,'Unbounded authentication retries');
          assert.equal(owned.records.filter(item=>item.kind==='origin').length,0,'Wrong credentials reached the origin');
          record.denied=true;
        }else{
          assert.ifError(error);assert.equal(response.status(),200);
          const body=JSON.parse(await page.locator('body').innerText());
          assert.deepEqual(body,{marker:'owned-native-proxy',authorization:null,proxyAuthorization:null});
          if(name==='bypass')assert.equal(owned.records.filter(item=>item.kind.endsWith('proxy')).length,0);
          else assert(owned.records.some(item=>item.kind.endsWith('proxy')&&item.authenticated),'Origin response did not traverse the authenticated proxy');
          record.originCredentialsAbsent=true;
        }
        record.status='passed';
      }catch(error){record.error=String(error);throw error}
      finally{if(browser)await browser.close();record.observations=owned.records;report.results.push(record);await owned.close();await writeFile(output,JSON.stringify(report,null,2)+'\n')}
    });
  }finally{
    report.completedAt=new Date().toISOString();report.passed=report.results.filter(item=>item.status==='passed').length;report.failed=report.results.filter(item=>item.status!=='passed').length;
    report.runtimeUnchanged=report.executableSha256===await hash(executablePath)&&report.runtimeSha256===await hash(join(dirname(executablePath),'chrome.dll'));
    await writeFile(output,JSON.stringify(report,null,2)+'\n');assert(report.runtimeUnchanged);
  }
});
