import {assetPaths} from './asset-paths.mjs';
const assets=assetPaths(import.meta.url);
let model;
self.onmessage=async({data})=>{
 const {id,texts}=data;
 try{
  if(!model){const {pipeline,env}=await import(assets.runtime);env.allowRemoteModels=false;env.allowLocalModels=true;env.localModelPath=assets.models;env.backends.onnx.wasm.wasmPaths=assets.wasm;env.backends.onnx.wasm.numThreads=1;
   model=await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{device:'wasm',dtype:'q8'});}
  const out=texts.length?(await model(texts,{pooling:'mean',normalize:true})).tolist():[];
  self.postMessage({id,vectors:out});
 }catch{self.postMessage({id,error:'Local model could not load or run. Check that model assets are prepared; lexical search remains available.'});}
};
