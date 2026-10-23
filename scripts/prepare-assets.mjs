// Copy already downloaded public runtime/model assets; no network or credentials.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=process.argv[2];if(!source)throw Error('Usage: node scripts/prepare-assets.mjs <existing transformers installation and model-cache directory>');
const copies=[['node_modules/@huggingface/transformers/dist/transformers.js','assets/runtime/transformers.js'],['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs','assets/runtime/ort-wasm-simd-threaded.jsep.mjs'],['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm','assets/runtime/ort-wasm-simd-threaded.jsep.wasm']];
for(const file of ['config.json','tokenizer.json','tokenizer_config.json','onnx/model_quantized.onnx'])copies.push([`model-cache/Xenova/all-MiniLM-L6-v2/${file}`,`assets/model/Xenova/all-MiniLM-L6-v2/${file}`]);
const manifest=[];for(const [from,to]of copies){const bytes=fs.readFileSync(path.join(source,from));const target=path.join(root,to);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);manifest.push({file:to,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
fs.writeFileSync(path.join(root,'assets/manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({copied:manifest.length,bytes:manifest.reduce((s,f)=>s+f.bytes,0)}));
