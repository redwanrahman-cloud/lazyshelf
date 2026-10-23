import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('../scripts/package-source.mjs',import.meta.url));
test('rejects symlinked public roots and the explicit asset-manifest parent',t=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'lazyshelf-link-test-'));
 try {
  const copy=path.join(scratch,'copy');
  assert.equal(spawnSync(process.execPath,[script,copy]).status,0);
  for(const name of ['dist','assets']){
   const original=path.join(copy,name), moved=path.join(scratch,`${name}-fixture`);
   try {
    fs.renameSync(original,moved);
    fs.symlinkSync(moved,original,process.platform==='win32'?'junction':'dir');
   } catch(error) {
    if(['EPERM','EACCES','ENOTSUP'].includes(error.code)){t.skip(`Host cannot prepare link fixture: ${error.code}; link rejection NOT verified`);return;}
    throw error;
   }
   const result=spawnSync(process.execPath,[path.join(copy,'scripts/package-source.mjs'),'--check'],{encoding:'utf8'});
   assert.notEqual(result.status,0);assert.match(result.stderr,/Symlinks not allowed/);
   fs.unlinkSync(original);fs.renameSync(moved,original);
  }
 }finally{fs.rmSync(scratch,{recursive:true,force:true});}
});
test('rejects inert private filenames inside otherwise public directories',()=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'lazyshelf-private-name-'));
 try {
  const copy=path.join(scratch,'copy');
  assert.equal(spawnSync(process.execPath,[script,copy]).status,0);
  for(const name of ['.env','credentials.json','private-key.pem']){
   const canary=path.join(copy,'scripts',name);
   fs.writeFileSync(canary,'FICTIONAL TEST ONLY');
   const destination=path.join(scratch,'output');
   const result=spawnSync(process.execPath,[path.join(copy,'scripts/package-source.mjs'),destination],{encoding:'utf8'});
   assert.notEqual(result.status,0,name);assert.equal(fs.existsSync(destination),false);
   fs.unlinkSync(canary);
  }
 }finally{fs.rmSync(scratch,{recursive:true,force:true});}
});
test('rejects auth login and password fixtures before creating a package',()=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'lazyshelf-auth-name-'));
 try {
  const copy=path.join(scratch,'copy');
  assert.equal(spawnSync(process.execPath,[script,copy]).status,0);
  for(const name of ['auth.json','login.json','password.json','passwords.json','AUTH.JSON','auth-backup.json']){
   const canary=path.join(copy,'evaluation',name);
   fs.writeFileSync(canary,'{"fixture":"INERT NOT A SECRET"}');
   const destination=path.join(scratch,'output');
   const result=spawnSync(process.execPath,[path.join(copy,'scripts/package-source.mjs'),destination],{encoding:'utf8'});
   assert.notEqual(result.status,0,name);assert.match(result.stderr,/Private filename not allowed/);
   assert.equal(fs.existsSync(destination),false);fs.unlinkSync(canary);
  }
 }finally{fs.rmSync(scratch,{recursive:true,force:true});}
});
test('fresh package includes notices/evaluation, excludes caches and verifies every manifest digest',()=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'lazyshelf-package-test-'));
 try {
  const destination=path.join(scratch,'source');
  const run=spawnSync(process.execPath,[script,destination],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const manifest=JSON.parse(fs.readFileSync(path.join(destination,'SOURCE-MANIFEST.json'),'utf8'));
  for(const file of ['LICENSE','licenses/ONNX-ThirdPartyNotices.txt','evaluation/results.json','scripts/asset-integrity.mjs'])assert.ok(manifest.some(e=>e.file===file),file);
  for(const e of manifest){
   assert.ok(!/(^|\/)(\.git|node_modules|\.env)(\/|$)/.test(e.file));
   assert.ok(!e.file.startsWith('assets/runtime/')&&!e.file.startsWith('assets/model/'));
   const data=fs.readFileSync(path.join(destination,e.file));
   assert.equal(data.length,e.bytes);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),e.sha256);
  }
  const retry=spawnSync(process.execPath,[script,destination],{encoding:'utf8'});
  assert.notEqual(retry.status,0);assert.match(retry.stderr,/Destination must not exist/);
 } finally {fs.rmSync(scratch,{recursive:true,force:true});}
});
