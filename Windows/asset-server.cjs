'use strict';
const path=require('node:path');
const fs=require('node:fs/promises');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8'};
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://i.ytimg.com https://img.youtube.com; font-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebaseinstallations.googleapis.com; object-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'none'; worker-src 'none'; frame-ancestors 'none'";
function createAssetHandler({root,origin,forward}){
 const base=path.resolve(root);
 return async request=>{
  let url;try{url=new URL(request.url);}catch{return new Response('Invalid URL',{status:400});}
  if(url.origin!==origin)return forward(request);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return new Response('Invalid path',{status:400});}
  if(/[\\\u0000]/.test(pathname))return new Response('Invalid path',{status:400});
  const file=path.resolve(base,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(base+path.sep))return new Response('Forbidden',{status:403});
  try{
   const bytes=await fs.readFile(file);
   return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Security-Policy':CSP,'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-store'}});
  }catch{return new Response('Not found',{status:404});}
 };
}
module.exports={createAssetHandler,CSP};
