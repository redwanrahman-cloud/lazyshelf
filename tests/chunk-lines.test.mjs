import test from 'node:test';
import assert from 'node:assert/strict';
import {chunkText} from '../dist/core.mjs';

test('line numbers equal original-prefix count across seeded Unicode and CRLF inputs',()=>{
 let seed=20261023;
 const samples=['word ','\r\n','\n','🧰','long_identifier-17','x','\r'];
 for(let trial=0;trial<120;trial++){
  let text='';for(let i=0;i<800+trial*7;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;text+=samples[seed%samples.length];}
  for(const c of chunkText(text,'f')){
   assert.equal(c.text,text.slice(c.start,c.end));
   assert.equal(c.line,1+(text.slice(0,c.start).match(/\n/g)||[]).length);
   assert.ok(!/^[\uDC00-\uDFFF]/.test(c.text));
   assert.ok(!/[\uD800-\uDBFF]$/.test(c.text));
  }
 }
});
test('near-limit newline-dense input retains exact final line and chunk coordinates',()=>{
 const text=('line with words\r\n').repeat(29411), chunks=chunkText(text,'f');
 assert.equal(chunks.length,841);assert.equal(chunks.at(-1).end,text.length);
 for(const c of chunks)assert.equal(c.line,1+Math.floor(c.start/17));
});
