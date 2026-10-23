import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeFile, chunkText, lexicalSearch, rankSemantic, Collection, LIMITS} from '../dist/core.mjs';
test('strict supported extensions and UTF8, empty and binary rejected',()=>{
 assert.throws(()=>decodeFile('x.pdf',new Uint8Array([65])),/TXT/);
 assert.throws(()=>decodeFile('x.txt',new Uint8Array([255])),/UTF/);
 assert.throws(()=>decodeFile('x.txt',new Uint8Array([0,65])),/binary/);
 assert.throws(()=>decodeFile('x.md',new TextEncoder().encode('  ')),/empty/);
 assert.equal(decodeFile('X.MD',new TextEncoder().encode('Hello')), 'Hello');
});
test('every chunk preserves exact original offsets including CRLF/unicode',()=>{
 const text=('Hello 😀\r\nA paragraph with meaningful words.\r\n\r\n').repeat(60);
 const chunks=chunkText(text,'f1'); assert(chunks.length>1);
 for(const c of chunks) assert.equal(c.text,text.slice(c.start,c.end));
 assert.equal(chunks[0].start,0); assert.equal(chunks.at(-1).end,text.length);
 for(let i=1;i<chunks.length;i++)assert(chunks[i].start<=chunks[i-1].end);
});
test('lexical matches exact identifier and never returns zero matches',()=>{
 const c=[{id:'1',text:'DVC-0179 amber cable'},{id:'2',text:'DVC-0719 blue cable'}];
 assert.equal(lexicalSearch(c,'DVC-0179')[0].id,'1');
 assert.deepEqual(lexicalSearch(c,'elephant'),[]); assert.deepEqual(lexicalSearch(c,' '),[]);
});
test('collection duplicate names are distinguishable and reset invalidates identity',()=>{
 const c=new Collection(); const a=c.add('notes.txt','alpha'); const b=c.add('notes.txt','beta');
 assert.notEqual(a.id,b.id);assert.equal(c.files.length,2);const rev=c.revision;c.clear();assert(c.revision>rev);assert.equal(c.files.length,0);
});
test('collection enforces file and character budget atomically',()=>{
 const c=new Collection();for(let i=0;i<LIMITS.files;i++)c.add(`${i}.txt`,'abc');
 assert.throws(()=>c.add('extra.txt','abc'),/files/);assert.equal(c.files.length,LIMITS.files);
});
test('semantic rank validates dimensions and finite values',()=>{
 const c=[{id:'a',text:'one'},{id:'b',text:'two'}];assert.equal(rankSemantic(c,[[1,0],[0,1]],[0,1])[0].id,'b');
 assert.throws(()=>rankSemantic(c,[[1,0]],[0,1]));assert.throws(()=>rankSemantic(c,[[NaN,0],[0,1]],[0,1]));
});
