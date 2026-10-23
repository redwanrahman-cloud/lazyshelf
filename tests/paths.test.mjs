import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';
import {resolvePublicPath} from '../scripts/public-path.mjs';
const root=path.resolve('fixture-product');
test('assets traversal never resolves product root',()=>{
 for(const url of ['/assets/%2e%2e%2fpackage.json','/assets/..%5cpackage.json','/assets/%2e%2e/package.json','/assets/../../package.json','/assets/%252e%252e%252fpackage.json'])assert.equal(resolvePublicPath(root,url),null,url);
});
test('valid asset and UI paths stay in their mounts',()=>{
 assert.equal(resolvePublicPath(root,'/assets/runtime/a.js'),path.join(root,'assets/runtime/a.js'));
 assert.equal(resolvePublicPath(root,'/'),path.join(root,'dist/index.html'));
 assert.equal(resolvePublicPath(root,'/core.mjs'),path.join(root,'dist/core.mjs'));
});
test('reject malformed encodings, backslashes and hidden path components',()=>{
 for(const url of ['/bad%','/.git/config','/assets/.hidden','/assets/a%00','/a\\b'])assert.equal(resolvePublicPath(root,url),null);
});
