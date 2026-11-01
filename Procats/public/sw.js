// Cache only bundled public assets. Authentication and user records never enter this cache.
const CACHE='procats-shell-__VERSION__',ASSETS=/* ASSETS */ [],CORE=/* CORE */ [];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(async names=>{
 const cache=await caches.open(CACHE);
 for(const name of names.filter(n=>n.startsWith('procats-shell-')&&n!==CACHE)){
  const old=await caches.open(name);
  for(const asset of ASSETS.filter(a=>!CORE.includes(a.path))){
   if(await cache.match(asset.path))continue;
   const response=await old.match(asset.path);
   if(response?.headers.get('X-Procats-Asset-Hash')===asset.hash)await cache.put(asset.path,response);
  }
  await caches.delete(name);
 }
 await self.clients.claim();
})));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),pathname=url.pathname==='/'?'/index.html':url.pathname;
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const asset=ASSETS.find(a=>a.path===pathname);if(!asset)return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const saved=await cache.match(pathname);if(saved)return saved;
  const response=await fetch(event.request);
  if(response.ok&&response.type!=='opaque'){
   const headers=new Headers(response.headers);headers.set('X-Procats-Asset-Hash',asset.hash);
   await cache.put(pathname,new Response(await response.clone().arrayBuffer(),{status:response.status,statusText:response.statusText,headers}));
  }
  return response;
 }));
});
