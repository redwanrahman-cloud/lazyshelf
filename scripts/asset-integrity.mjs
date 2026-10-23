import crypto from 'node:crypto';

// Setup-only bounded reader. Nothing is installed until size AND digest match.
export async function readVerifiedAsset(response, entry) {
 if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 1 || entry.bytes > 100_000_000 || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw Error('Invalid asset manifest');
 if (!response.ok) throw Error(`Asset download failed: HTTP ${response.status}`);
 if (!response.body) throw Error('Missing asset body');
 const reader=response.body.getReader(), chunks=[]; let size=0;
 try {
  for (;;) {
   const {done,value}=await reader.read(); if(done)break;
   size+=value.byteLength;
   if(size>entry.bytes){await reader.cancel();throw Error('Asset size exceeds pinned manifest');}
   chunks.push(Buffer.from(value));
  }
 } finally {reader.releaseLock();}
 const bytes=Buffer.concat(chunks,size);
 if(size!==entry.bytes || crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256) throw Error('Asset integrity mismatch; no file replaced');
 return bytes;
}
