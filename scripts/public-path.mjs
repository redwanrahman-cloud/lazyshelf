import path from 'node:path';
export function resolvePublicPath(root,request){
 try{
  // Inspect before URL normalization can erase dot segments.
  const raw=request.split('?')[0];const decoded=decodeURIComponent(raw);
  if(!decoded.startsWith('/')||decoded.includes('\\')||decoded.includes('%')||/[\x00-\x1f]/.test(decoded))return null;
  const parts=decoded.split('/').filter(Boolean);if(parts.some(p=>p.startsWith('.')||p.includes(':')))return null;
  const asset=parts[0]==='assets';const base=path.resolve(root,asset?'assets':'dist');
  const relative=asset?parts.slice(1).join('/'):parts.join('/')||'index.html';
  const file=path.resolve(base,relative);return file.startsWith(base+path.sep)?file:null;
 }catch{return null;}
}
