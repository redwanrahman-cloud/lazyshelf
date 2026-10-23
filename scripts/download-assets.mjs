// Explicit setup-only download of public, hash-pinned artifacts. No user files.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {readVerifiedAsset} from './asset-integrity.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=process.argv[2]?path.resolve(process.argv[2]):root;
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
const runtime={
 'transformers.js':'https://unpkg.com/@huggingface/transformers@3.8.1/dist/transformers.js',
 'ort-wasm-simd-threaded.jsep.mjs':'https://unpkg.com/onnxruntime-web@1.22.0-dev.20250409-89f8206ba4/dist/ort-wasm-simd-threaded.jsep.mjs',
 'ort-wasm-simd-threaded.jsep.wasm':'https://unpkg.com/onnxruntime-web@1.22.0-dev.20250409-89f8206ba4/dist/ort-wasm-simd-threaded.jsep.wasm'
};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let downloaded=0,cached=0;
for(const entry of manifest){
 if(!/^assets\/(runtime|model)\/[a-zA-Z0-9_./-]+$/.test(entry.file)||entry.file.includes('..'))throw Error('Invalid manifest path');
 const file=path.join(destination,entry.file);
 if(fs.existsSync(file)&&hash(fs.readFileSync(file))===entry.sha256){cached++;continue;}
 const url=entry.file.startsWith('assets/runtime/')?runtime[path.basename(entry.file)]:`https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9/${entry.file.split('all-MiniLM-L6-v2/')[1]}`;
 if(!url)throw Error('Unknown runtime asset');
 const response=await fetch(url,{signal:AbortSignal.timeout(120000),credentials:'omit',headers:{Accept:'application/octet-stream'}});
 const bytes=await readVerifiedAsset(response,entry);
 fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.download';fs.writeFileSync(tmp,bytes);fs.renameSync(tmp,file);downloaded++;
 console.log(`Verified ${entry.file} (${entry.bytes} bytes)`);
}
console.log(JSON.stringify({downloaded,cached,total:manifest.length,bytes:manifest.reduce((s,e)=>s+e.bytes,0)}));
