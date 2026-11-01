import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const src=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
function setup(){
 const handlers={},stores=new Map(),network=[];
 const assets=[{path:'/index.html',hash:'shell1'},{path:'/themes/test.webp',hash:'theme1'},{path:'/report-pdf.js',hash:'pdf1'}];
 const cache=name=>{if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);return {map,async addAll(paths){for(const path of paths)map.set(path,new Response('core'));},async match(path){return map.get(path)?.clone();},async put(path,response){map.set(path,response.clone());}};};
 const context={self:{location:{origin:'https://app.example'},clients:{async claim(){}},addEventListener:(type,fn)=>handlers[type]=fn},URL,Response,Headers,caches:{open:async name=>cache(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)},fetch:async req=>{network.push(req.url);return new Response('optional');}};
 vm.runInNewContext(src.replace('__VERSION__','new').replace('/* ASSETS */ []',JSON.stringify(assets)).replace('/* CORE */ []',JSON.stringify(['/index.html'])),context);
 const lifecycle=type=>new Promise((resolve,reject)=>handlers[type]({waitUntil:promise=>promise.then(resolve,reject)}));
 const request=async(url,method='GET')=>{let promise;handlers.fetch({request:new Request(url,{method}),respondWith:p=>promise=p});return promise?await promise:null;};
 return {stores,cache,network,lifecycle,request};
}
test('core install excludes optional themes and reports; a used optional asset becomes offline cached',async()=>{
 const s=setup();await s.lifecycle('install');assert.deepEqual([...s.stores.get('procats-shell-new').keys()],['/index.html']);
 assert.equal(await (await s.request('https://app.example/themes/test.webp?v=1.7.1')).text(),'optional');assert.equal(s.network.length,1);
 assert.equal(await (await s.request('https://app.example/themes/test.webp')).text(),'optional');assert.equal(s.network.length,1);
 assert.equal(s.stores.get('procats-shell-new').get('/themes/test.webp').headers.get('X-Procats-Asset-Hash'),'theme1');
});
test('auth, private routes, foreign origins and writes are never intercepted or cached',async()=>{
 const s=setup();for(const url of ['https://app.example/private-profile','https://identitytoolkit.googleapis.com/v1/accounts','https://other.example/index.html'])assert.equal(await s.request(url),null);
 assert.equal(await s.request('https://app.example/index.html','POST'),null);assert.equal(s.network.length,0);
});
test('update retains matching downloaded optional hashes, discards stale ones and leaves unrelated caches alone',async()=>{
 const s=setup();await s.lifecycle('install');const old=s.cache('procats-shell-old');await old.put('/themes/test.webp',new Response('savedtheme',{headers:{'X-Procats-Asset-Hash':'theme1'}}));await old.put('/report-pdf.js',new Response('oldpdf',{headers:{'X-Procats-Asset-Hash':'pdf0'}}));s.cache('other-product');
 await s.lifecycle('activate');assert.equal(await (await s.cache('procats-shell-new').match('/themes/test.webp')).text(),'savedtheme');assert.equal(await s.cache('procats-shell-new').match('/report-pdf.js'),undefined);assert.equal(s.stores.has('procats-shell-old'),false);assert.equal(s.stores.has('other-product'),true);
});
