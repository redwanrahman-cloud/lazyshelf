import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readVerifiedAsset} from '../scripts/asset-integrity.mjs';
const bytes=Buffer.from('fixture');
const entry={bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
test('accepts exact bytes and digest',async()=>assert.deepEqual(await readVerifiedAsset(new Response(bytes),entry),bytes));
test('rejects a wrong digest',async()=>assert.rejects(readVerifiedAsset(new Response('fixturE'),entry),/integrity/));
test('rejects short data',async()=>assert.rejects(readVerifiedAsset(new Response('fix'),entry),/integrity/));
test('rejects oversized stream without consuming subsequent chunks',async()=>{
 let reads=0,cancelled=false;
 const body={getReader:()=>({read:async()=>{reads++;return {done:false,value:Buffer.alloc(8)};},cancel:async()=>{cancelled=true;},releaseLock(){}})};
 await assert.rejects(readVerifiedAsset({ok:true,body},entry),/size/);
 assert.equal(reads,1);assert.equal(cancelled,true);
});
test('rejects HTTP error and malformed manifest bounds',async()=>{
 await assert.rejects(readVerifiedAsset(new Response('',{status:503}),entry),/HTTP 503/);
 await assert.rejects(readVerifiedAsset(new Response(bytes),{...entry,bytes:-1}),/manifest/);
});
