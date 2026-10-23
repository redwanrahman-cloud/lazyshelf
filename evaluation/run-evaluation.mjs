import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';

// Optional paths help separate evaluation tooling from an application checkout.
// Normal use from the repository: npm install --ignore-scripts, then run this file.
const here=path.dirname(fileURLToPath(import.meta.url));
const project=process.argv[2]?path.resolve(process.argv[2]):path.resolve(here,'..');
const dependencies=process.argv[3]?path.resolve(process.argv[3]):project;
const require=createRequire(path.join(dependencies,'package.json'));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(path.join(here,'fixture.json'));
const fixture=JSON.parse(bytes);
const core=await import(pathToFileURL(path.join(project,'dist/core.mjs')).href);
const shelf=new core.Collection();
for(const document of fixture.documents)shelf.add(document.name,core.decodeFile(document.name,new TextEncoder().encode(document.text)));
const chunks=shelf.chunks;
const documentId=chunk=>fixture.documents[Number(chunk.fileId.slice(1))-1]?.id;
const report={schema_version:1,started_at:new Date().toISOString(),backend:'Node CPU / ONNX. This evaluates the retrieval core, not browser rendering, browser performance, accessibility, or usability.',model:'Xenova/all-MiniLM-L6-v2',library_version:'3.8.1',fixture_sha256:digest(bytes),core_sha256:digest(fs.readFileSync(path.join(project,'dist/core.mjs'))),documents:fixture.documents.length,chunks:chunks.length,network_attempts:[],results:[]};
const timer=setTimeout(()=>{console.error('Evaluation exceeded 120 seconds.');process.exit(2);},120000);
let model;
try{
 globalThis.fetch=async(input)=>{report.network_attempts.push(String(input?.url||input).split('?')[0]);throw Error('The evaluation requires local assets and disables network access.');};
 const {pipeline,env}=require('@huggingface/transformers');
 env.allowRemoteModels=false;env.allowLocalModels=true;env.localModelPath=path.join(project,'assets/model/');env.useBrowserCache=false;
 let start=performance.now();model=await pipeline('feature-extraction',report.model,{device:'cpu',dtype:'q8'});report.model_load_ms=performance.now()-start;
 start=performance.now();const vectors=(await model([...chunks.map(c=>c.text),...fixture.queries.map(q=>q.text)],{pooling:'mean',normalize:true})).tolist();report.encode_ms=performance.now()-start;report.dimensions=vectors[0].length;
 for(const [index,query]of fixture.queries.entries()){
  for(const mode of ['lexical','semantic']){
   const rows=mode==='lexical'?core.lexicalSearch(chunks,query.text):core.rankSemantic(chunks,vectors.slice(0,chunks.length),vectors[chunks.length+index]);
   const matches=n=>query.expected.some(e=>rows.slice(0,n).some(c=>documentId(c)===e.document&&c.text.includes(e.span)));
   report.results.push({mode,id:query.id,category:query.category,query:query.text,expected:query.expected,top1:query.expected.length?matches(1):null,top3:query.expected.length?matches(3):null,total_results:rows.length,source_exact:rows.every(c=>shelf.files.find(f=>f.id===c.fileId).text.slice(c.start,c.end)===c.text),top3_rows:rows.slice(0,3).map(c=>({...c,document:documentId(c)}))});
  }
 }
 report.summary={all_source_exact:report.results.every(r=>r.source_exact),network_calls:report.network_attempts.length,ranking:Object.fromEntries(['lexical','semantic'].map(mode=>{const rows=report.results.filter(r=>r.mode===mode&&r.top1!==null);return[mode,{answerable:rows.length,top1:rows.filter(r=>r.top1).length,top3:rows.filter(r=>r.top3).length}]}))};
}catch(error){report.error=error.message;process.exitCode=1;}
finally{
 if(model)await model.dispose();clearTimeout(timer);report.finished_at=new Date().toISOString();fs.writeFileSync(path.join(here,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({backend:report.backend,summary:report.summary,error:report.error},null,2));
}
