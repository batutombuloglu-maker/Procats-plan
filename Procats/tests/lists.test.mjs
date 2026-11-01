import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../public/lists-core.js';
import '../public/sync-merge.js';
import {createListsStore} from '../public/lists-store.js';
import {createCloudAdapter} from '../public/cloud-adapter.js';
import {validateSnapshot} from '../public/validation.js';
const C=globalThis.ProcatsListsCore,M=globalThis.ProcatsMerge,copy=v=>structuredClone(v);
const sample=()=>[{id:1,title:'TYT Matematik',items:[{id:11,title:'Temel kavramlar',completed:false},{id:12,title:'Sayı basamakları',completed:false}]}];
test('list title order preserves contents, appends new lists and rejects invalid moves',()=>{const lists=[...sample(),{id:2,title:'Fizik',items:[]},{id:3,title:'Kimya',items:[]}];const next=C.update(lists,{type:'reorder-lists',ids:[3,1,2]});assert.deepEqual(C.orderedLists(next).map(l=>l.id),[3,1,2]);assert.deepEqual(next[0].items,lists[0].items);assert.deepEqual(C.orderedLists(C.update(next,{type:'add-list',id:4,title:'Biyoloji'})).map(l=>l.id),[3,1,2,4]);assert.throws(()=>C.update(lists,{type:'reorder-lists',ids:[1,1,3]}));assert.equal(C.valid([{...lists[0],position:-1}]),false);});
function backend(){let current={data:{},revision:0},offline=false;return {get:()=>copy(current),set:v=>current=copy(v),offline:v=>offline=v,factory(){return {subscribe(){},stop(){},async request(method,payload){if(offline)throw Error('offline');if(method==='GET')return copy(current);if(payload.revision!==current.revision)return {conflict:true,...copy(current)};current={data:copy(payload.data),revision:current.revision+1};return {revision:current.revision};}};}};}
function instance(server,entries=[],recovered=[]){const raw=new Map(entries);let failure=false;const storage={getItem:k=>raw.get(k)??null,setItem(k,v){if(failure)throw Error('disk full');raw.set(k,v);}};const store=createListsStore({storage,cloudFactory:()=>server.factory(),flush:async()=>{},merge:M.mergeDocuments,recovered});return {store,raw,fail:v=>failure=v};}
test('list title order syncs with simultaneous item edit and persists after reopening',async()=>{const server=backend(),a=instance(server),b=instance(server);a.store.commit([...sample(),{id:2,title:'Fizik',items:[]}]);await a.store.sync();await b.store.sync();a.store.commit(C.update(a.store.get(),{type:'reorder-lists',ids:[2,1]}));b.store.commit(C.update(b.store.get(),{type:'check-item',listId:1,id:11,completed:true}));await b.store.sync();await a.store.sync();await b.store.sync();assert.deepEqual(C.orderedLists(b.store.get()).map(l=>l.id),[2,1]);assert.equal(b.store.get().find(l=>l.id===1).items[0].completed,true);await a.store.stop();await b.store.stop();const reopened=instance(server,b.raw);assert.deepEqual(C.orderedLists(reopened.store.get()).map(l=>l.id),[2,1]);await reopened.store.stop();});
test('lists start empty, add only user content, and preserve item order when checked or unchecked',()=>{
 const a=C.update([],{type:'add-list',id:1,title:' TYT Matematik '});assert.deepEqual(a,[{id:1,title:'TYT Matematik',items:[]}]);
 const b=C.update(a,{type:'add-item',listId:1,id:11,title:' Temel kavramlar '});const c=C.update(b,{type:'check-item',listId:1,id:11,completed:true});assert.equal(c[0].items[0].completed,true);assert.equal(b[0].items[0].completed,false);
 assert.equal(C.update(c,{type:'check-item',listId:1,id:11,completed:false})[0].items[0].completed,false);
 assert.deepEqual(C.update(sample(),{type:'rename-item',listId:1,id:11,title:'Temel Kavramlar'})[0].items.map(i=>i.id),[11,12]);
 assert.deepEqual(C.update(sample(),{type:'remove-list',listId:1}),[]);
});
test('invalid, oversized, duplicate and nonboolean checklist records are rejected',()=>{
 for(const value of [[{id:1,title:' ',items:[]}],[...sample(),...sample()],[{...sample()[0],items:[{id:2,title:'x',completed:'yes'}]}],[{...sample()[0],items:[...sample()[0].items,...sample()[0].items]}],[{id:1,title:'a'.repeat(241),items:[]}]])assert.equal(C.valid(value),false);
 assert.equal(C.snapshot({[C.key]:sample()}),true);assert.equal(C.snapshot({yks_v3_tasks:[]}),false);
 assert.throws(()=>C.update(sample(),{type:'add-item',listId:99,id:15,title:'Missing list'}));
});
test('two devices sync new lists and completion without changing main workspace schema',async()=>{
 const server=backend(),phone=instance(server),pc=instance(server);phone.store.commit(sample());await phone.store.sync();await pc.store.sync();assert.deepEqual(pc.store.get(),sample());
 phone.store.commit(C.update(phone.store.get(),{type:'check-item',listId:1,id:11,completed:true}));await phone.store.sync();await pc.store.sync();assert.equal(pc.store.get()[0].items[0].completed,true);
 assert.equal(validateSnapshot({yks_v3_days:[],yks_v3_tasks:[]}),true);assert.equal(validateSnapshot(server.get().data),false,'Lists never enter the old main document');
 await phone.store.stop();await pc.store.stop();
});
test('independent offline item edits merge without losing either device changes',async()=>{
 const server=backend(),phone=instance(server),pc=instance(server);phone.store.commit(sample());await phone.store.sync();await pc.store.sync();
 phone.store.commit(C.update(phone.store.get(),{type:'check-item',listId:1,id:11,completed:true}));pc.store.commit(C.update(pc.store.get(),{type:'rename-item',listId:1,id:12,title:'Basamak değeri'}));await phone.store.sync();await pc.store.sync();await phone.store.sync();
 assert.deepEqual(phone.store.get()[0].items,[{id:11,title:'Temel kavramlar',completed:true},{id:12,title:'Basamak değeri',completed:false}]);assert.equal(pc.store.getState().conflict,false);
 await phone.store.stop();await pc.store.stop();
});
test('same-field conflicts survive reload and resolve with the selected version',async()=>{
 const server=backend(),a=instance(server),b=instance(server);a.store.commit(sample());await a.store.sync();await b.store.sync();a.store.commit(C.update(a.store.get(),{type:'rename-list',listId:1,title:'Telefon'}));b.store.commit(C.update(b.store.get(),{type:'rename-list',listId:1,title:'Bilgisayar'}));await a.store.sync();await b.store.sync();assert.equal(b.store.getState().conflict,true);
 await b.store.stop();const reopened=instance(server,b.raw);assert.equal(reopened.store.getState().conflict,true);await reopened.store.resolve('local');await a.store.sync();assert.equal(a.store.get()[0].title,'Bilgisayar');assert.equal(reopened.store.getState().pending,false);await a.store.stop();await reopened.store.stop();
});
test('offline edits survive reopening and cannot be discarded by sign-out',async()=>{
 const server=backend();server.offline(true);const a=instance(server);a.store.commit(sample());await a.store.sync();assert.equal(a.store.getState().status,'offline');await assert.rejects(a.store.beforeExit(),{code:'pending-records'});await a.store.stop();const reopened=instance(server,a.raw);assert.deepEqual(reopened.store.get(),sample());server.offline(false);await reopened.store.sync();await reopened.store.beforeExit();await reopened.store.stop();
});
test('write failure preserves current list, invalid stored records are not overwritten',async()=>{
 const server=backend(),a=instance(server);a.fail(true);assert.throws(()=>a.store.commit(sample()));assert.deepEqual(a.store.get(),[]);await a.store.stop();
 const invalid=instance(server,[[C.key,'{broken']]);assert.equal(invalid.store.getState().invalid,true);assert.throws(()=>invalid.store.commit([]));assert.equal(invalid.raw.get(C.key),'{broken');await invalid.store.stop();
});
test('backup replacement refreshes the list journal and is sent to the independent document',async()=>{
 const server=backend(),a=instance(server);a.raw.set(C.key,JSON.stringify(sample()));a.store.refresh();await a.store.sync();assert.deepEqual(server.get().data[C.key],sample());await a.store.stop();
});
test('list cloud adapter targets only state/lists and enforces its validation',async()=>{
 let reference;const user={uid:'a',emailVerified:true},sdk={doc(...parts){reference=parts;return 'reference';},getDocFromServer:async()=>({exists:()=>false})};const adapter=createCloudAdapter({sdk,db:'db',auth:{currentUser:user},user,documentId:'lists',validate:C.snapshot});await adapter.read();assert.deepEqual(reference,['db','users','a','state','lists']);await assert.rejects(adapter.request('PUT',{data:{yks_v3_tasks:[]},revision:0}),{code:'invalid-data'});adapter.stop();
});
test('Data Vault validates and exports Lists without adding them to main sync keys',()=>{
 const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const validation=source.slice(source.indexOf('        const isRecord'),source.indexOf('        function localDate'));
 const context={ProcatsListsCore:C,ProcatsNavigation:{valid:()=>true},ProcatsExamData:{},window:{},TextEncoder};context.window=context;vm.createContext(context);vm.runInContext(validation,context);
 assert.equal(vm.runInContext(`validData('procats_lists_v1', ${JSON.stringify(sample())})`,context),true);
 assert.equal(vm.runInContext(`validData('procats_lists_v1', [{id:1,title:'',items:[]}])`,context),false);
 assert.match(source,/procats_lists_v1: window\.ProcatsListsStore\.get\(\)/);
});

test('reorder preserves items and checkboxes, rejects incomplete permutations',()=>{
 const initial=sample(),moved=C.update(initial,{type:'reorder-items',listId:1,ids:[12,11]});assert.deepEqual(C.orderedItems(moved[0]).map(i=>i.id),[12,11]);assert.deepEqual(moved[0].items,initial[0].items);
 for(const ids of [[12,12],[11],[12,99]])assert.throws(()=>C.update(initial,{type:'reorder-items',listId:1,ids}));
 assert.deepEqual(C.orderedItems(C.update(moved,{type:'check-item',listId:1,id:11,completed:true})[0]).map(i=>i.id),[12,11]);
 assert.deepEqual(C.orderedItems(C.update(moved,{type:'add-item',listId:1,id:13,title:'Yeni'})[0]).map(i=>i.id),[12,11,13]);
});
test('order and completion from different devices merge and survive reload',async()=>{
 const server=backend(),a=instance(server),b=instance(server);a.store.commit(sample());await a.store.sync();await b.store.sync();
 a.store.commit(C.update(a.store.get(),{type:'reorder-items',listId:1,ids:[12,11]}));b.store.commit(C.update(b.store.get(),{type:'check-item',listId:1,id:11,completed:true}));
 await b.store.sync();await a.store.sync();await b.store.sync();assert.deepEqual(C.orderedItems(b.store.get()[0]).map(i=>i.id),[12,11]);assert.equal(b.store.get()[0].items[0].completed,true);
 await a.store.stop();await b.store.stop();const reopened=instance(server,b.raw);assert.deepEqual(C.orderedItems(reopened.store.get()[0]).map(i=>i.id),[12,11]);await reopened.store.stop();
});
test('simultaneous reorders require a choice instead of silently losing a change',async()=>{
 const server=backend(),a=instance(server),b=instance(server);a.store.commit(C.update(sample(),{type:'add-item',listId:1,id:13,title:'Üçüncü'}));await a.store.sync();await b.store.sync();
 a.store.commit(C.update(a.store.get(),{type:'reorder-items',listId:1,ids:[12,11,13]}));b.store.commit(C.update(b.store.get(),{type:'reorder-items',listId:1,ids:[13,11,12]}));await a.store.sync();await b.store.sync();assert.equal(b.store.getState().conflict,true);await b.store.resolve('local');await a.store.sync();assert.deepEqual(C.orderedItems(a.store.get()[0]).map(i=>i.id),[13,11,12]);await a.store.stop();await b.store.stop();
});
test('recovering a second tab retains independent unsynced list edits',async()=>{
 const server=backend(),old=instance(server);old.store.commit(sample());await old.store.sync();
 const first=C.update(sample(),{type:'check-item',listId:1,id:11,completed:true}),second=C.update(sample(),{type:'rename-item',listId:1,id:12,title:'Diğer sekme'});old.raw.set(C.key,JSON.stringify(first));
 const reopened=instance(server,old.raw,[{settings:{[C.key]:JSON.stringify(second),[C.metaKey]:JSON.stringify({base:sample(),revision:1})}}]);assert.equal(reopened.store.get()[0].items[0].completed,true);assert.equal(reopened.store.get()[0].items[1].title,'Diğer sekme');await reopened.store.sync();assert.equal(server.get().data[C.key][0].items[1].title,'Diğer sekme');await old.store.stop();await reopened.store.stop();
});
test('conflicting recovered tabs keep a choice without inventing a cloud base',async()=>{
 const server=backend(),a=instance(server);a.store.commit(sample());await a.store.sync();const local=C.update(sample(),{type:'rename-list',listId:1,title:'Son sekme'}),older=C.update(sample(),{type:'rename-list',listId:1,title:'Önceki sekme'});a.raw.set(C.key,JSON.stringify(local));
 const b=instance(server,a.raw,[{settings:{[C.key]:JSON.stringify(older),[C.metaKey]:JSON.stringify({base:sample(),revision:1})}}]);assert.equal(b.store.getState().status,'conflict');await b.store.resolve('remote');assert.equal(server.get().data[C.key][0].title,'Son sekme');await a.store.stop();await b.store.stop();
});
