import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assetPaths} from '../dist/asset-paths.mjs';

for (const root of ['http://127.0.0.1:4187/', 'https://redwanrahman-cloud.github.io/lazyshelf/']) {
  test(`asset paths retain deployment base ${root}`, () => {
    assert.deepEqual(assetPaths(root+'embedding-worker.mjs'), {
      runtime:root+'assets/runtime/transformers.js',
      models:root+'assets/model/',
      wasm:root+'assets/runtime/'
    });
  });
}
test('worker uses deployment-relative paths and forbids remote model fallback',()=>{
  const source=fs.readFileSync(new URL('../dist/embedding-worker.mjs',import.meta.url),'utf8');
  assert.match(source,/assetPaths\(import\.meta\.url\)/);
  assert.match(source,/import\(assets\.runtime\)/);
  assert.match(source,/env\.localModelPath=assets\.models/);
  assert.match(source,/wasmPaths=assets\.wasm/);
  assert.match(source,/allowRemoteModels=false/);
  assert.doesNotMatch(source,/["']\/assets\//);
});
