'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),fs=require('node:fs/promises');
const {createAssetHandler}=require('../asset-server.cjs');
test('Windows serves bundled version at the existing secure origin with safe MIME and CSP',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'procats-assets-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.writeFile(path.join(root,'index.html'),'<h1>1.7.1</h1>');await fs.writeFile(path.join(root,'clock.js'),'clock');
 let forwarded=[];const handle=createAssetHandler({root,origin:'https://procats-example.web.app',forward:r=>{forwarded.push(r.url);return new Response('firebase');}});
 let r=await handle(new Request('https://procats-example.web.app/'));assert.equal(await r.text(),'<h1>1.7.1</h1>');assert.match(r.headers.get('Content-Security-Policy'),/object-src 'none'/);
 r=await handle(new Request('https://procats-example.web.app/clock.js?v=1.7.1'));assert.equal(await r.text(),'clock');assert.match(r.headers.get('content-type'),/javascript/);
 assert.equal((await handle(new Request('https://procats-example.web.app/missing.js'))).status,404);
 assert.equal((await handle(new Request('https://procats-example.web.app/%2e%2e%5csecret'))).status,400);
 assert.equal((await handle(new Request('https://procats-example.web.app/file%00'))).status,400);
 assert.equal((await handle(new Request('https://procats-example.web.app/',{method:'POST'}))).status,405);
 assert.equal(await (await handle(new Request('https://identitytoolkit.googleapis.com/test'))).text(),'firebase');assert.equal(forwarded.length,1);
});
