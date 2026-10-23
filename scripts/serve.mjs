import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {resolvePublicPath} from './public-path.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.wasm':'application/wasm','.onnx':'application/octet-stream'};
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 try{const file=resolvePublicPath(root,req.url);
 if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end('Not found');return;}
 const base=file.startsWith(path.join(root,'assets')+path.sep)?path.join(root,'assets'):path.join(root,'dist');
 if(!fs.realpathSync(file).startsWith(fs.realpathSync(base)+path.sep)){res.writeHead(404).end('Not found');return;}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-cache');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; connect-src 'self'; worker-src 'self' blob:; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
 res.setHeader('Content-Length',fs.statSync(file).size);if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(400).end('Invalid request');}
});server.listen(Number(process.env.PORT||4187),'127.0.0.1',()=>console.log('LazyShelf local: http://127.0.0.1:'+server.address().port));
