// Explicit source allowlist: never package HQ, local credentials, user files or runtime caches.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const required=['LICENSE','README.md','THIRD_PARTY_NOTICES.md','licenses/TRANSFORMERS-APACHE-2.0.txt','licenses/ONNX-RUNTIME-MIT.txt','licenses/ONNX-ThirdPartyNotices.txt'];
const allowed=['dist','scripts','tests','licenses','evaluation'];
const files=['package.json','.gitignore',...required.filter(f=>!f.startsWith('licenses/')),'assets/manifest.json'];
const extensions={dist:['.html','.css','.mjs','.svg'],scripts:['.mjs'],tests:['.mjs'],licenses:['.txt'],evaluation:['.mjs','.json','.md']};
function inspect(rel){
 let current=root;
 for(const part of rel.split('/')){
  if((part.startsWith('.')&&rel!=='.gitignore')||/^(auth|login|passwords?|credentials?|secrets?|tokens?|id_rsa|id_ed25519)([._-]|$)/i.test(part)||/\.(pem|key|p12|pfx)$/i.test(part))throw Error(`Private filename not allowed: ${rel}`);
  current=path.join(current,part);
  if(fs.lstatSync(current).isSymbolicLink())throw Error(`Symlinks not allowed: ${rel}`);
 }
 return fs.lstatSync(current);
}
function walk(dir){inspect(dir);for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=dir+'/'+e.name;const stat=inspect(rel);if(stat.isDirectory())walk(rel);else if(stat.isFile()){
 if(!extensions[rel.split('/')[0]].includes(path.extname(rel).toLowerCase()))throw Error(`Unapproved source file type: ${rel}`);
 files.push(rel);
 }else throw Error(`Unsupported source entry: ${rel}`);}}
for(const dir of allowed)walk(dir);
// Complete path/name checks before reading any candidate file content.
for(const file of files)if(!inspect(file).isFile())throw Error(`Expected source file: ${file}`);
for(const file of required)if(inspect(file).size<100)throw Error(`Required distribution notice/document missing: ${file}`);
const manifest=files.sort().map(file=>{const bytes=fs.readFileSync(path.join(root,file));return {file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
if(process.argv[2]==='--check'){console.log(JSON.stringify({source_files:manifest.length,notice_gate:'PASS',publication_authorized:false}));process.exit(0);}
if(!process.argv[2])throw Error('Usage: node scripts/package-source.mjs --check OR <new-empty-destination>');
const destination=path.resolve(process.argv[2]);if(fs.existsSync(destination))throw Error('Destination must not exist; never overwrite a package.');
fs.mkdirSync(destination,{recursive:true});for(const e of manifest){const target=path.join(destination,e.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,e.file),target);}
fs.writeFileSync(path.join(destination,'SOURCE-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({source_files:manifest.length,destination,publication_authorized:false}));
