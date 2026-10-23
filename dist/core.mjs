export const LIMITS=Object.freeze({files:30,fileBytes:512000,totalChars:500000,chunks:900});
export function decodeFile(name,bytes){
 if(!/\.(txt|md)$/i.test(name))throw Error('Choose English TXT or Markdown files only.');
 if(bytes.byteLength>LIMITS.fileBytes)throw Error('File exceeds 500 KB limit.');
 let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw Error('File must use valid UTF-8 encoding.');}
 if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text))throw Error('This appears to contain binary data.');
 if(!text.trim())throw Error('The file is empty.');return text;
}
export function chunkText(text,fileId){
 const out=[];let start=0,line=1,lineCursor=0;
 while(start<text.length){
  let end=Math.min(start+700,text.length);
  if(end<text.length){const boundary=text.lastIndexOf(' ',end);if(boundary>start+400)end=boundary;}
  if(end<text.length && /[\uD800-\uDBFF]/.test(text[end-1]))end--;
  // Starts move forward even with overlap. Count each source newline once,
  // rather than rescanning/allocating the complete prefix for every passage.
  while(lineCursor<start){if(text.charCodeAt(lineCursor)===10)line++;lineCursor++;}
  out.push({id:`${fileId}:${start}`,fileId,start,end,text:text.slice(start,end),line});
  if(end===text.length)break;start=Math.max(start+1,end-100);
  if(/[\uDC00-\uDFFF]/.test(text[start]))start--;
 }return out;
}
export class Collection{
 constructor(){this.files=[];this.revision=0;this.sequence=0;}
 get chunks(){return this.files.flatMap(f=>f.chunks);}
 add(name,text){
  if(this.files.length>=LIMITS.files)throw Error(`Maximum ${LIMITS.files} files per shelf.`);
  if(this.files.reduce((s,f)=>s+f.text.length,0)+text.length>LIMITS.totalChars)throw Error('Shelf exceeds 500,000 characters.');
  const id=`f${++this.sequence}`;const chunks=chunkText(text,id);
  if(this.chunks.length+chunks.length>LIMITS.chunks)throw Error('Shelf has too many passages. Import fewer files.');
  const file={id,name,text,chunks};this.files.push(file);this.revision++;return file;
 }
 remove(id){this.files=this.files.filter(f=>f.id!==id);this.revision++;}
 clear(){this.files=[];this.revision++;}
}
const tokens=s=>s.toLowerCase().match(/[a-z0-9]+(?:[-_][a-z0-9]+)*/g)||[];
export function lexicalSearch(chunks,query){
 const terms=[...new Set(tokens(query))];if(!terms.length||!chunks.length)return [];
 const docs=chunks.map(c=>tokens(c.text));const avg=docs.reduce((s,d)=>s+d.length,0)/docs.length;
 const df=new Map(terms.map(t=>[t,docs.filter(d=>d.includes(t)).length]));
 return chunks.map((c,i)=>{let score=0;for(const t of terms){const tf=docs[i].filter(x=>x===t).length;if(tf)score+=Math.log(1+(chunks.length-df.get(t)+.5)/(df.get(t)+.5))*tf*2.2/(tf+1.2*(.25+.75*docs[i].length/(avg||1)));}return {...c,score};}).filter(c=>c.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
export function rankSemantic(chunks,vectors,query){
 const valid=v=>(Array.isArray(v)||(ArrayBuffer.isView(v)&&!(v instanceof DataView)))&&Array.from(v).every(Number.isFinite);
 if(!Array.isArray(chunks)||!Array.isArray(vectors)||chunks.length!==vectors.length||!valid(query)||!query.length)throw Error('Invalid embedding index.');
 return chunks.map((c,i)=>{const v=vectors[i];if(!valid(v)||v.length!==query.length)throw Error('Invalid embedding vector.');return {...c,score:v.reduce((s,x,k)=>s+x*query[k],0)};}).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
