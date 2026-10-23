import test from 'node:test';
import assert from 'node:assert/strict';
import {rankSemantic} from '../dist/core.mjs';
test('malformed embedding containers fail with domain errors, not native TypeErrors',()=>{
 for(const query of [null,{},[],[undefined],new Array(2)])assert.throws(()=>rankSemantic([{id:'a'}],[[0,1]],query),/Invalid embedding index/);
 for(const vector of [null,{},new DataView(new ArrayBuffer(8)),new Array(2)])assert.throws(()=>rankSemantic([{id:'a'}],[vector],[0,1]),/Invalid embedding vector/);
 assert.throws(()=>rankSemantic([{id:'a'}],null,[0,1]),/Invalid embedding index/);
 assert.equal(rankSemantic([{id:'a'}],[new Float32Array([0,1])],new Float32Array([0,1]))[0].score,1);
});
