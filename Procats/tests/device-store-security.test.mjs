import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {hasPendingLists} from '../public/lists-journal.js';
import {hasPendingKnowledge} from '../public/knowledge-journal.js';

const source=(await readFile(new URL('../public/device-store.js',import.meta.url),'utf8'))
 .replace(/^import .*;\r?\n/gm,'').replace(/^export \{.*\};\r?\n/gm,'').replace('export const DeviceStore=','const DeviceStore=');
const turn=()=>new Promise(setImmediate);
const record=(text='saved',pending=false)=>({base:{yks_v5_notes:[{id:1,text:pending?'before':text}]},data:{yks_v5_notes:[{id:1,text}]},revision:1,savedAt:1});
// Transaction fixture: independent clients share committed records; writes are
// serialized, reads use a transaction snapshot, and abort rolls back all writes.
// This exercises the production store, without adding a browser dependency.
class Transactions {
 values=new Map();tail=Promise.resolve();unavailable=false;failWrites=false;
 open(){const request={};setImmediate(()=>{if(this.unavailable){request.error=Error('Unavailable');request.onerror?.();}else{request.result={transaction:(_,mode='readonly')=>this.transaction(mode)};request.onsuccess?.();}});return request;}
 transaction(mode){
  if(this.unavailable)throw Error('Unavailable');
  const requests=[];let data,aborted=false;
  const tx={abort(){aborted=true;tx.error=Error('Aborted');}};
  const request=fn=>{const r={};requests.push(()=>{r.result=fn();r.onsuccess?.();});return r;};
  const store={get:key=>request(()=>structuredClone(data.get(key))),put:(value,key)=>request(()=>data.set(key,structuredClone(value))),delete:key=>request(()=>data.delete(key)),openCursor:()=>{
   const r={};let last;
   const next=()=>{const key=[...data.keys()].sort().find(k=>last===undefined||k>last);last=key;r.result=key===undefined?null:{key,value:structuredClone(data.get(key)),continue:()=>requests.push(next),delete:()=>store.delete(key)};r.onsuccess?.();};
   requests.push(next);return r;
  }};
  tx.objectStore=()=>store;
  this.tail=this.tail.then(async()=>{
   data=structuredClone(this.values);
   while(requests.length&&!aborted){await turn();try{requests.shift()();}catch(error){aborted=true;tx.error=error;}}
   if(mode==='readwrite'&&this.failWrites){aborted=true;tx.error=Error('Disk full');}
   if(aborted)tx.onabort?.();else{if(mode==='readwrite')this.values=data;tx.oncomplete?.();}
  });
  return tx;
 }
}
function client(db,{native=false,bridge={}}={}){
 const context=vm.createContext({hasPendingLists,hasPendingKnowledge,Capacitor:{isNativePlatform:()=>native},registerPlugin:()=>bridge,validateSnapshot:v=>!!v&&typeof v==='object',crypto:{randomUUID},indexedDB:db,structuredClone,console,localStorage:{length:0,key:()=>null},navigator:{}});
 context.window=context;vm.runInContext(source,context);return context.ProcatsDeviceStore;
}
const changed=error=>error.code==='account-changed';
test('purge fences existing and queued writers, including recovery, but preserves other accounts and metadata',async()=>{
 const db=new Transactions(),first=client(db),stale=client(db);
 await first.load('u');await stale.load('u');await first.save('u',record());await first.recovery('u',{local:'private'});await first.save('other',record('keep'));await first.meta('privacy-1.4.1',{accepted:true});
 const remove=first.remove('u'),late=stale.save('u',record('late'));
 await Promise.all([remove,late.catch(error=>assert(changed(error)))]);await assert.rejects(stale.save('u',record('after purge')),changed);await assert.rejects(stale.recovery('u',{local:'late'}),changed);await assert.rejects(first.save('u',record()),changed);
 assert.equal([...db.values.keys()].some(k=>k==='u'||k.startsWith('u::draft::')||k==='u:recovery'),false);
 assert.equal(db.values.get('other').data.yks_v5_notes[0].text,'keep');assert.equal(db.values.get('meta:privacy-1.4.1').accepted,true);
 const reopened=client(db);assert.equal(await reopened.load('u'),null);await reopened.save('u',record('new session'));assert.equal(db.values.get('u').data.yks_v5_notes[0].text,'new session');
});
test('load captures the epoch of its record snapshot, even when removal is queued concurrently',async()=>{
 const db=new Transactions(),first=client(db);await first.load('u');await first.save('u',record());
 const old=client(db),loaded=old.load('u');await turn();const removed=first.remove('u');await loaded;await removed;
 await assert.rejects(old.save('u',record('stale snapshot')),changed);
});
test('conditional purge rolls back earlier deletes when another draft is pending and leaves the writer usable',async()=>{
 const db=new Transactions(),a=client(db),b=client(db);await a.load('u');await b.load('u');await a.save('u',record());await b.save('u',record('other edit',true));
 const before=structuredClone(db.values);await assert.rejects(a.remove('u',{expectedData:record().data}),e=>e.code==='pending-records');assert.deepEqual(db.values,before);
 await a.save('u',record());assert.equal(db.values.get('u').data.yks_v5_notes[0].text,'saved');
 await a.remove('u');assert.equal(db.values.has('u'),false);
});
test('native-only and IndexedDB-only commits remain durable, while total storage failure rejects',async()=>{
 const db=new Transactions();db.unavailable=true;let nativeValue=null;
 const bridge={readJournal:async()=>({value:nativeValue}),writeJournal:async({value})=>{nativeValue=value;}};
 const native=client(db,{native:true,bridge});await native.load('u');await native.save('u',record());assert.equal(JSON.parse(nativeValue).data.yks_v5_notes[0].text,'saved');
 const reopened=client(db,{native:true,bridge});assert.equal((await reopened.load('u')).data.yks_v5_notes[0].text,'saved');
 const healthy=new Transactions(),fallback=client(healthy,{native:true,bridge:{readJournal:async()=>{throw Error();},writeJournal:async()=>{throw Error();}}});await fallback.load('u');await fallback.save('u',record());assert.equal(healthy.values.has('u'),true);
 await assert.rejects(client(db,{native:true,bridge:{writeJournal:async()=>{throw Error();}}}).save('u',record()));
});
test('an epoch rejection cannot fall back to native writes',async()=>{
 const db=new Transactions();let writes=0;const bridge={readJournal:async()=>({value:null}),writeJournal:async()=>{writes++;}};
 const stale=client(db,{native:true,bridge}),other=client(db);await stale.load('u');await other.load('u');await other.remove('u');
 await assert.rejects(stale.save('u',record()),changed);assert.equal(writes,0);
});
test('removal closes the local writer immediately and drains an already started native write before deleting',async()=>{
 const db=new Transactions(),calls=[];let finish,started;
 const began=new Promise(resolve=>started=resolve),bridge={readJournal:async()=>({value:null}),writeJournal:async()=>{calls.push('write');started();await new Promise(resolve=>finish=resolve);calls.push('write-done');},removeJournal:async({account})=>calls.push('remove:'+account)};
 const a=client(db,{native:true,bridge});await a.load('u');const saving=a.save('u',record());await began;
 const removing=a.remove('u');await assert.rejects(a.save('u',record('late')),changed);await turn();assert.deepEqual(calls,['write']);
 finish();await saving;await removing;assert.deepEqual(calls.slice(0,2),['write','write-done']);assert.deepEqual(new Set(calls.slice(2)),new Set(['remove:u','remove:assistant:u']));assert.equal(db.values.has('u'),false);
});
test('failed account deletion is surfaced and prevents further local writes',async()=>{
 const db=new Transactions(),a=client(db);await a.load('u');await a.save('u',record());db.failWrites=true;
 await assert.rejects(a.remove('u'));assert.equal(db.values.has('u'),true);await assert.rejects(a.save('u',record()),changed);
});

test('account purge removes only that account custom pictures and guide state, and abort preserves them',async()=>{
 const db=new Transactions(),a=client(db);await a.load('u');await a.save('u',record());
 await a.meta('custom-themes:u',{slots:['private image',null],active:0});await a.meta('resources-tour:u',true);await a.meta('custom-themes:other',{slots:['other image',null],active:0});
 db.failWrites=true;await assert.rejects(a.remove('u'));assert.equal(db.values.has('meta:custom-themes:u'),true);
 db.failWrites=false;await a.remove('u');assert.equal(db.values.has('meta:custom-themes:u'),false);assert.equal(db.values.has('meta:resources-tour:u'),false);assert.equal(db.values.has('meta:custom-themes:other'),true);
});

test('unsynced Lists in another tab are recovered and block conditional purge',async()=>{
 const db=new Transactions(),a=client(db),b=client(db);await a.load('u');await b.load('u');const lists=[{id:1,title:'TYT Matematik',items:[]}],pending={...record(),settings:{procats_lists_v1:JSON.stringify(lists),procats_lists_sync_v1:JSON.stringify({base:[],revision:0})},savedAt:1};
 await a.save('u',pending);await b.save('u',{...record(),savedAt:2});assert.equal(await b.hasOtherPending('u',record().data,[]),true);await assert.rejects(b.remove('u',{expectedData:record().data,expectedLists:[]}),e=>e.code==='pending-records');
 const c=client(db),loaded=await c.load('u');assert.ok(loaded.recovered.some(v=>v.settings?.procats_lists_v1===JSON.stringify(lists)));assert.equal(await c.hasOtherPending('u',record().data,lists),false);
});

test('unsynced knowledge in another tab survives account-purge checks',async()=>{
 const db=new Transactions(),a=client(db),b=client(db);await a.load('u');await b.load('u');const C=globalThis.ProcatsKnowledgeCore,cards=[C.make({id:1,question:'Soru',answer:'Cevap'},1000)],draft={...record(),settings:{[C.key]:JSON.stringify(cards),[C.metaKey]:JSON.stringify({base:[],revision:0})},savedAt:1};
 await a.save('u',draft);await b.save('u',{...record(),savedAt:2});assert.equal(await b.hasOtherPending('u',record().data,[],[]),true);await assert.rejects(b.remove('u',{expectedData:record().data,expectedLists:[],expectedKnowledge:[]}),e=>e.code==='pending-records');const c=client(db),loaded=await c.load('u');assert.ok(loaded.recovered.some(v=>v.settings?.[C.key]===JSON.stringify(cards)));assert.equal(await c.hasOtherPending('u',record().data,[],cards),false);
});

test('removed feature has no archive-loading API and normal journal saves leave dormant capsules untouched',async()=>{
 const db=new Transactions(),a=client(db),legacy={archive:'old private archive',savedAt:1};
 db.values.set('meta:assistant-archives:u',legacy);await a.load('u');await a.save('u',record('Current task and note records'));
 assert.equal(typeof a.loadAssistant,'undefined');assert.deepEqual(db.values.get('meta:assistant-archives:u'),legacy);
 assert.equal(db.values.get('u').data.yks_v5_notes[0].text,'Current task and note records');
});

test('sign-out preserves dormant capsules, while explicit deletion removes only the owner legacy data atomically',async()=>{
 const db=new Transactions(),values=new Map([['assistant:u','old archive'],['assistant:other','other archive']]),bridge={readJournal:async({account})=>({value:values.get(account)||null}),writeJournal:async({account,value})=>values.set(account,value),removeJournal:async({account})=>values.delete(account)};
 db.values.set('meta:assistant-archives:u',{archive:'old archive'});db.values.set('meta:assistant-archives:other',{archive:'other archive'});
 const a=client(db,{native:true,bridge});await a.load('u');await a.save('u',record());await a.remove('u',{preserveLegacyArchives:true});
 assert.equal(db.values.has('meta:assistant-archives:u'),true);assert.equal(values.get('assistant:u'),'old archive');
 const reopened=client(db,{native:true,bridge});await reopened.load('u');await reopened.save('u',record());db.failWrites=true;const before=structuredClone(db.values);
 await assert.rejects(reopened.remove('u'));assert.deepEqual(db.values,before);assert.equal(values.has('assistant:u'),true);
 db.failWrites=false;await reopened.remove('u');assert.equal(db.values.has('meta:assistant-archives:u'),false);assert.equal(values.has('assistant:u'),false);
 assert.equal(db.values.has('meta:assistant-archives:other'),true);assert.equal(values.get('assistant:other'),'other archive');
});

