import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright-core';
import puppeteer from 'puppeteer-core';
import * as sdk from '../sdk/js/index.mjs';

const base={executablePath:'not-launched.exe',engineMode:'baseline'};

test('context builder maps typed settings without changing caller objects',()=>{
  const viewport={width:900,height:700};
  assert.deepEqual(sdk.buildContextOptions({locale:'fr-FR',timezone:'Europe/Paris',viewport}),{locale:'fr-FR',timezoneId:'Europe/Paris',viewport});
  const mapped=sdk.buildContextOptions({viewport});mapped.viewport.width=1000;
  assert.equal(viewport.width,900);
  assert.deepEqual(sdk.buildContextOptions(),{viewport:null});
  assert.deepEqual(sdk.buildContextOptions({viewport:null}),{viewport:null});
});

test('invalid context settings fail before creating a caller profile',async()=>{
  const root=await mkdtemp(join(tmpdir(),'silly-sdk-contract-'));
  try {
    const profile=join(root,'never-created');
    for(const options of [{viewport:{width:-1,height:10}},{viewport:{width:10.5,height:10}},{viewport:{width:true,height:10}},{viewport:{width:10,height:10,extra:1}},{locale:123},{locale:''},{timezone:'bad zone'}]){
      await assert.rejects(sdk.launchPersistentContext(profile,{...base,...options}),/locale|timezone|viewport/);
      await assert.rejects(stat(profile),error=>error.code==='ENOENT');
    }
    assert.throws(()=>sdk.buildContextOptions({unknown:true}),/Unknown context option/);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('plain Browser launch rejects context fields without starting the driver',async()=>{
  const original=chromium.launch;let launches=0;
  chromium.launch=async()=>{launches++;return {close:async()=>{}}};
  try {
    for(const setting of [{locale:'fr-FR'},{timezone:'Europe/Paris'},{viewport:{width:900,height:700}},{viewport:null}]){
      await assert.rejects(sdk.launch({...base,...setting}),/context|Context/);
    }
    assert.equal(launches,0);
    const browser=await sdk.launch(base);await browser.close();assert.equal(launches,1);
  }finally{chromium.launch=original}
});

test('profile launch forwards context settings independently from launch options',async()=>{
  const original=chromium.launchPersistentContext;let captured;
  chromium.launchPersistentContext=async(directory,options)=>{captured=options;return {close:async()=>{}}};
  const directory=await mkdtemp(join(tmpdir(),'silly-sdk-contract-'));
  try {
    const context=await sdk.launchPersistentContext(directory,{...base,locale:'fr-FR',timezone:'Europe/Paris',viewport:{width:900,height:700}});
    assert.equal(captured.locale,'fr-FR');assert.equal(captured.timezoneId,'Europe/Paris');assert.deepEqual(captured.viewport,{width:900,height:700});
    assert(!Object.hasOwn(captured,'timezone'));await context.close();
  }finally{chromium.launchPersistentContext=original;await rm(directory,{recursive:true,force:true})}
});

test('Puppeteer forwards explicit proxy bypass, including an empty value',async()=>{
  const original=puppeteer.launch;let captured;
  puppeteer.launch=async options=>{captured=options;return {close:async()=>{}}};
  try {
    for(const bypass of ['localhost,.example.test','']){
      const proxy={server:'http://127.0.0.1:8080',bypass};
      const browser=await sdk.launchPuppeteer({...base,proxy});
      try{assert(captured.args.includes(`--proxy-bypass-list=${bypass}`));assert.equal(proxy.bypass,bypass)}finally{await browser.close()}
    }
  }finally{puppeteer.launch=original}
});

test('malformed bypass policy is rejected rather than stringified',()=>{
  for(const bypass of [false,['localhost'],'localhost\nexample.test'])assert.throws(()=>sdk.normalizeProxy({server:'http://127.0.0.1:8080',bypass}),/bypass/);
});
