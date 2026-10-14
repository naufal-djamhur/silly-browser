import test from 'node:test';
import assert from 'node:assert/strict';
import {createSocket} from 'node:dgram';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {launchContext} from '../sdk/js/index.mjs';

const executablePath=process.env.CUSTOM_BROWSER_EXECUTABLE;
const root=fileURLToPath(new URL('../',import.meta.url));

// RFC 5389 Binding success: echo the transaction and report the actual UDP peer.
function bindingResponse(request,peer){
  if(request.length<20||request.readUInt16BE(0)!==1||request.readUInt32BE(4)!==0x2112a442)return;
  const response=Buffer.alloc(32);
  response.writeUInt16BE(0x0101,0);response.writeUInt16BE(12,2);response.writeUInt32BE(0x2112a442,4);
  request.copy(response,8,8,20);
  response.writeUInt16BE(0x0020,20);response.writeUInt16BE(8,22);response[25]=1;
  response.writeUInt16BE(peer.port^0x2112,26);
  const address=peer.address.split('.').map(Number),cookie=[0x21,0x12,0xa4,0x42];
  for(let i=0;i<4;i++)response[28+i]=address[i]^cookie[i];
  return response;
}

test('native WebRTC policy controls actual local STUN traffic in headed and headless engines',{skip:!executablePath,timeout:120000},async()=>{
  const socket=createSocket('udp4');let packets=0;
  const server=createServer((request,response)=>{response.setHeader('Content-Type','text/html');response.end('<!doctype html><title>Local WebRTC policy fixture</title>')});
  socket.on('message',(request,peer)=>{const response=bindingResponse(request,peer);if(response){packets++;socket.send(response,peer.port,peer.address)}});
  await new Promise((resolve,reject)=>{socket.once('error',reject);socket.bind(0,'127.0.0.1',resolve)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const observations=[];
  try{
    for(const headless of [true,false])for(const webrtcPolicy of ['default','disable_non_proxied_udp']){
      const context=await launchContext({executablePath,headless,webrtcPolicy});
      try{
        const page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
        const before=packets;
        const result=await page.evaluate(async port=>{
          const connection=new RTCPeerConnection({iceServers:[{urls:`stun:127.0.0.1:${port}`}],iceCandidatePoolSize:0});
          const candidates=[];let complete=false;
          connection.onicecandidate=event=>{if(event.candidate)candidates.push(event.candidate.toJSON())};
          connection.createDataChannel('local-policy-fixture');
          await connection.setLocalDescription(await connection.createOffer());
          await new Promise(resolve=>{
            const timer=setTimeout(resolve,8000);
            connection.onicegatheringstatechange=()=>{if(connection.iceGatheringState==='complete'){complete=true;clearTimeout(timer);resolve()}};
            if(connection.iceGatheringState==='complete'){complete=true;clearTimeout(timer);resolve()}
          });
          connection.close();return {candidates,complete};
        },socket.address().port);
        assert.equal(result.complete,true,'ICE gathering must complete; a timed-out fixture cannot qualify the policy');
        const received=packets-before;
        if(webrtcPolicy==='default')assert(received>0,'Control must send local STUN packets before absence can establish a policy result');
        else assert.equal(received,0,'disable_non_proxied_udp must prevent direct UDP to the fixture');
        observations.push({headless,webrtcPolicy,localStunPackets:received,...result,status:'passed'});
      }finally{await context.close()}
    }
  }finally{
    await new Promise(resolve=>socket.close(resolve));
    await new Promise(resolve=>server.close(resolve));
    const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
    const output=process.env.CUSTOM_WEBRTC_REPORT??join(root,'artifacts/engine-validation/webrtc-local/results.json');
    await mkdir(dirname(output),{recursive:true});
    await writeFile(output,JSON.stringify({completedAt:new Date().toISOString(),binarySha256:await hash(executablePath),runtimeSha256:await hash(join(dirname(executablePath),'chrome.dll')),observations,scope:'Local IPv4 STUN/direct UDP policy only. TURN, remote proxies, UDP ASSOCIATE, IPv6, managed policy and per-origin precedence remain unqualified.'},null,2)+'\n');
  }
});
