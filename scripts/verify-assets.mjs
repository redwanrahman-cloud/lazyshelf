import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const destination=process.argv[2]?path.resolve(process.argv[2]):root;
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
for(const e of manifest){const b=fs.readFileSync(path.join(destination,e.file));if(b.length!==e.bytes||crypto.createHash('sha256').update(b).digest('hex')!==e.sha256)throw Error(`Integrity mismatch: ${e.file}`);}
console.log(`${manifest.length} asset hashes verified.`);
