// Simulated DOM unit tests. These do not establish browser UX/accessibility.
import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import * as core from '../dist/core.mjs';
const stripImport=source=>source.replace(/^import [^\r\n]*\r?\n/,'');
test('mock harness removes module import with LF or CRLF',()=>{
 for(const newline of ['\n','\r\n'])assert.equal(stripImport(`import x from './x.mjs';${newline}const a=1;`),'const a=1;');
});
const code=stripImport(fs.readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8'));
function harness(){
 class Element{constructor(){this.children=[];this.value='';this.disabled=false;this.textContent='';}append(...x){this.children.push(...x);}replaceChildren(...x){this.children=x;}setAttribute(){}close(){this.open=false;}showModal(){this.open=true;}focus(){}scrollIntoView(){}querySelector(){return this.button??=new Element();}}
 const els=new Map();const document={getElementById:id=>{if(!els.has(id))els.set(id,new Element());return els.get(id);},createElement:()=>new Element(),createTextNode:text=>({textContent:text})};
 class Worker{postMessage(){}terminate(){this.terminated=true;}}
 const context=vm.createContext({...core,document,Worker,TextEncoder,Uint8Array,requestAnimationFrame:cb=>cb()});vm.runInContext(code,context);return {els,run:code=>vm.runInContext(code,context),context};
}
test('async import blocks search and completion restores controls',async()=>{
 const h=harness();let release;h.context.readBytes=()=>new Promise(r=>release=r);
 const done=h.run("importFiles([{name:'note.txt',size:5,arrayBuffer:readBytes}])");
 assert.equal(h.els.get('query').disabled,true);assert.equal(h.els.get('search-form').querySelector().disabled,true);
 release(new TextEncoder().encode('hello').buffer);await done;
 assert.equal(h.els.get('query').disabled,false);assert.equal(h.els.get('search-form').querySelector().disabled,false);assert.equal(h.run('shelf.files.length'),1);
});
test('cancelled import cannot restore files after clear',async()=>{
 const h=harness();let release;h.context.readBytes=()=>new Promise(r=>release=r);
 const done=h.run("importFiles([{name:'note.txt',size:5,arrayBuffer:readBytes}])");h.els.get('clear').onclick();release(new TextEncoder().encode('hello').buffer);await done;
 assert.equal(h.run('shelf.files.length'),0);assert.equal(h.els.get('query').disabled,false);
});
test('query edits invalidate old results and stop in-flight semantic work',()=>{
 const h=harness();h.run("setBusy(true); $('results').append('old-result')");h.els.get('query').oninput();
 assert.equal(h.els.get('results').children.length,0);assert.equal(h.els.get('query').disabled,false);assert.equal(h.run('generation'),1);
});
test('collection changes remove stale source dialog content',()=>{
 const h=harness();h.run("$('source').showModal(); $('source-text').append('old-document'); changed()");assert.equal(h.els.get('source').open,false);assert.equal(h.els.get('source-text').children.length,0);
});
test('model error retires worker and index; next request uses fresh worker',async()=>{
 const h=harness();const first=h.run('embed([])');const rejected=assert.rejects(first,/failed/);
 h.run("globalThis.oldWorker=worker; index={vectors:[[1]]}; worker.onmessage({data:{id:serial,error:'load failed'}})");await rejected;
 assert.equal(h.run('oldWorker.terminated'),true);assert.equal(h.run('worker'),null);assert.equal(h.run('index'),null);
 const retry=h.run('embed([])');assert.equal(h.run('worker===oldWorker'),false);
 h.run('worker.onmessage({data:{id:serial,vectors:[]}})');await retry;
});
test('worker failure rejects all pending work; late retired event cannot retire replacement',async()=>{
 const h=harness();const a=h.run('embed([])'),b=h.run('embed([])');const checks=Promise.all([assert.rejects(a),assert.rejects(b)]);
 h.run("globalThis.oldWorker=worker; worker.onmessage({data:{id:serial,error:'failed'}})");await checks;assert.equal(h.run('pending.size'),0);
 const retry=h.run('embed([])');h.run('oldWorker.onerror()');assert.notEqual(h.run('worker'),null);h.run('worker.onmessage({data:{id:serial,vectors:[]}})');await retry;
});
