import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.resolve(process.argv[2]||'');
if(!process.argv[2]||fs.existsSync(destination))throw Error('Provide a new destination; never overwrite.');
execFileSync(process.execPath,[path.join(root,'scripts/package-source.mjs'),'--check'],{cwd:root});
execFileSync(process.execPath,[path.join(root,'scripts/verify-assets.mjs')],{cwd:root});
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
if(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim())throw Error('Commit reviewed source before packaging.');
const tracked=execFileSync('git',['ls-files'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
const assets=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
const entries=[];
for(const file of tracked){
 if(file.startsWith('dist/'))entries.push({from:file,to:file.slice(5)});
 else if(file.startsWith('licenses/')||['LICENSE','THIRD_PARTY_NOTICES.md'].includes(file))entries.push({from:file,to:file});
}
for(const asset of assets)entries.push({from:asset.file,to:asset.file});
const prepared=entries.map(({from,to})=>{
 if(path.isAbsolute(from)||from.split(/[\\/]/).includes('..'))throw Error('Invalid source path');
 const source=path.join(root,from);if(fs.lstatSync(source).isSymbolicLink())throw Error('Symlink not allowed');
 const bytes=fs.readFileSync(source),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
 const expected=assets.find(a=>a.file===from);if(expected&&(expected.bytes!==bytes.length||expected.sha256!==sha256))throw Error('Asset mismatch');
 return {from,to,bytes,sha256};
});
fs.mkdirSync(destination,{recursive:true});
for(const e of prepared){const target=path.join(destination,e.to);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,e.bytes);}
fs.writeFileSync(path.join(destination,'.nojekyll'),'');
const manifest={source_commit:sourceCommit,files:prepared.map(e=>({file:e.to,bytes:e.bytes.length,sha256:e.sha256})),browser_render_verified:false};
fs.writeFileSync(path.join(destination,'DEPLOYMENT-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({destination,source_commit:sourceCommit,files:prepared.length}));
