import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../public/knowledge-core.js';
import '../public/sync-merge.js';
import {createKnowledgeStore} from '../public/knowledge-store.js';
import {createKnowledgeCloud} from '../public/knowledge-cloud.js';
import {hasPendingKnowledge} from '../public/knowledge-journal.js';
const C=globalThis.ProcatsKnowledgeCore,M=globalThis.ProcatsMerge,copy=structuredClone;
const card=(id=1,extra={})=>C.make({id,question:'Tirat ne anlama gelir?',answer:'Bir kişinin uzun konuşması.',category:['Edebiyat','Tiyatro'],tags:['tiyatro'],...extra},1000);
const save=(cards,c,now=2000)=>C.update(cards,{type:'save',card:c,now});
function server(){let value={data:{[C.key]:[]},revision:0},offline=false;return {offline:v=>offline=v,get:()=>copy(value),factory:()=>({subscribe(){},stop(){},async request(method,payload){if(offline)throw Error('offline');if(method==='GET')return copy(value);if(value.revision!==payload.revision)return {conflict:true,...copy(value)};value={data:copy(payload.data),revision:value.revision+1};return {revision:value.revision};}})};}
function instance(backend,entries=[],recovered=[]){const raw=new Map(entries);let broken=false;const store=createKnowledgeStore({storage:{getItem:k=>raw.get(k)??null,setItem(k,v){if(broken)throw Error('disk full');raw.set(k,v);}},flush:async()=>{},merge:M.mergeDocuments,cloudFactory:()=>backend.factory(),recovered});return {store,raw,fail:v=>broken=v};}
test('empty treasury accepts only user-created content and editing preserves identity',()=>{
 const first=save([],card());assert.equal(first.length,1);assert.equal(first[0].createdAt,2000);
 const next=save(first,{...first[0],question:'Yeni soru'},2000);assert.equal(next[0].createdAt,2000);assert.equal(next[0].updatedAt,2001);assert.equal(first[0].question,'Tirat ne anlama gelir?');
});
test('validation rejects malformed, unsafe-image, duplicate and excessive records',()=>{
 const c=card();for(const value of [[c,c],[{...c,answer:''}],[{...c,id:NaN}],[{...c,image:'data:image/svg+xml,<svg/>'}],[{...c,related:[1]}],[{...c,tags:['x','X']}],[{...c,review:{...c.review,interval:-1}}],[{...c,passage:'x'.repeat(12001)}]])assert.equal(C.valid(value),false);
 assert.equal(C.snapshot({[C.key]:[c]}),true);assert.equal(C.snapshot({}),false);assert.equal(C.snapshot({[C.key]:[],yks_v3_tasks:[]}),false);
 const many=Array.from({length:2001},(_,i)=>card(i+1));assert.throws(()=>C.check(many));
 const large=Array.from({length:55},(_,i)=>card(i+1,{answer:'x'.repeat(12000),explanation:'x'.repeat(12000),passage:'x'.repeat(12000)}));assert.throws(()=>C.check(large),/knowledge-limit/);
});
test('nested category, tags and Turkish search include specialised card text',()=>{
 const cards=[card(1,{kind:'quote',passage:'Olmak ya da olmamak',author:'Shakespeare',category:['Edebiyat','Shakespeare','Hamlet']}),card(2,{kind:'word',origin:'İtalyanca',example:'Bir tirat okudu.'})];
 assert.deepEqual(C.filter(cards,{category:'Edebiyat › Shakespeare',query:'olmak shakespeare'}).map(c=>c.id),[1]);assert.deepEqual(C.filter(cards,{query:'italyanca',kind:'word',tag:'TİYATRO'}).map(c=>c.id),[2]);assert.equal(C.filter(cards,{category:'Tarih'}).length,0);
});
test('scheduled review progresses 1, 3, 7, then monthly and missed cards restart tomorrow',()=>{
 let c=card();for(const interval of [1,3,7,30,30,30]){c=C.rate(c,'knew',10000+c.review.count*1000);assert.equal(c.review.interval,interval);}
 c=C.rate(c,'hard',40000);assert.equal(c.review.interval,1);assert.equal(c.review.dueAt,C.calendarDue(40000,1));c=C.rate(c,'knew',45000);assert.equal(c.review.interval,1);
 c=C.rate(c,'again',50000);assert.equal(c.review.dueAt,C.calendarDue(50000,1));assert.equal(c.review.lapses,1);assert.equal(c.review.count,9);
 assert.deepEqual(C.queue([c,card(2)],{now:100000}),[2]);assert.equal(C.queue([c],{mode:'random',now:0}).length,1);assert.equal(C.rate({...c,review:{...c.review,grade:'knew',interval:300}},'knew',100000).review.interval,30);
});
test('answer edits reset the due interval; stale grades and stale editor saves are rejected',()=>{
 const c=C.rate(card(),'knew',5000),cards=[c],edited=save(cards,{...c,answer:'Yeni cevap'});assert.equal(edited[0].review.interval,0);assert.equal(edited[0].review.dueAt,0);assert.equal(edited[0].review.count,1);
 assert.throws(()=>C.update(edited,{type:'rate',id:1,grade:'knew',expected:JSON.stringify(c)}),/changed/);assert.throws(()=>C.update(edited,{type:'save',card:c,expected:JSON.stringify(c)}),/changed/);assert.throws(()=>C.update(cards,{type:'save',card:c,expected:null}),/changed/);
});
test('deletion cleans references without mutating the source array',()=>{
 const cards=[card(1),card(2,{related:[1]})],next=C.update(cards,{type:'delete',id:1});assert.deepEqual(next[0].related,[]);assert.deepEqual(cards[1].related,[1]);
});
test('images and multiline text pack across bounded atomic shards losslessly',()=>{
 const image='data:image/jpeg;base64,/9j/'+'A'.repeat(45000),cards=Array.from({length:30},(_,i)=>card(i+1,{image,answer:'Birinci satır\nİkinci satır'}));const shards=C.pack(cards);assert.equal(shards.length,4);assert.ok(shards.filter(s=>s[C.key].length).length>=3);for(const part of shards)assert.ok(new TextEncoder().encode(JSON.stringify(part)).length<=600000);assert.deepEqual(shards.flatMap(s=>s[C.key]),cards);
});
test('two devices merge independent edits and review updates while preserving old main schema',async()=>{
 const remote=server(),a=instance(remote),b=instance(remote);a.store.commit([card(1),card(2)]);await a.store.sync();await b.store.sync();a.store.commit(save(a.store.get(),{...a.store.get()[0],explanation:'Telefon'}));b.store.commit(C.update(b.store.get(),{type:'rate',id:2,grade:'hard',now:5000}));await a.store.sync();await b.store.sync();await a.store.sync();assert.equal(a.store.get()[0].explanation,'Telefon');assert.equal(a.store.get()[1].review.grade,'hard');assert.equal(b.store.getState().conflict,false);await a.store.stop();await b.store.stop();
});
test('same-answer conflicts and answer-versus-review conflicts survive reopening with explicit choice',async()=>{
 for(const review of [false,true]){const remote=server(),a=instance(remote),b=instance(remote);a.store.commit([card()]);await a.store.sync();await b.store.sync();a.store.commit(save(a.store.get(),{...card(),answer:'Telefon'}));b.store.commit(review?C.update(b.store.get(),{type:'rate',id:1,grade:'again',now:5000}):save(b.store.get(),{...card(),answer:'PC'}));await a.store.sync();await b.store.sync();assert.equal(b.store.getState().conflict,true);await b.store.stop();const reopened=instance(remote,b.raw);assert.equal(reopened.store.getState().conflict,true);assert.ok(reopened.store.getConflict());await reopened.store.resolve('local');await a.store.sync();assert.equal(a.store.get()[0].answer,review?card().answer:'PC');assert.ok(JSON.parse(reopened.raw.get(C.metaKey)).recovery);await a.store.stop();await reopened.store.stop();}
});
test('offline cards survive reopening, block sign-out and sync after reconnection',async()=>{
 const remote=server();remote.offline(true);const a=instance(remote);a.store.commit([card()]);await a.store.sync();assert.equal(a.store.getState().status,'offline');await assert.rejects(a.store.beforeExit(),{code:'pending-records'});await a.store.stop();const b=instance(remote,a.raw);assert.equal(b.store.get()[0].question,card().question);remote.offline(false);await b.store.beforeExit();assert.equal(b.store.getState().pending,false);await b.store.stop();
});
test('storage failure and malformed stored archive never silently erase existing records',async()=>{
 const remote=server(),a=instance(remote);a.fail(true);assert.throws(()=>a.store.commit([card()]));assert.deepEqual(a.store.get(),[]);await a.store.stop();const b=instance(remote,[[C.key,'{broken']]);assert.equal(b.store.getState().invalid,true);assert.throws(()=>b.store.commit([]));assert.equal(b.raw.get(C.key),'{broken');await b.store.stop();
});
test('backup replacement and another-tab recovery include knowledge',async()=>{
 const remote=server(),a=instance(remote);a.raw.set(C.key,JSON.stringify([card()]));a.store.refresh();await a.store.sync();const old=[card()],local=save(old,{...old[0],explanation:'local'}),other=save(old,{...old[0],source:'Book'});a.raw.set(C.key,JSON.stringify(local));const journal={settings:{[C.key]:JSON.stringify(other),[C.metaKey]:JSON.stringify({base:old,revision:1})}};assert.equal(hasPendingKnowledge(journal,local),true);const b=instance(remote,a.raw,[journal]);assert.equal(b.store.get()[0].source,'Book');assert.equal(b.store.get()[0].explanation,'local');await b.store.sync();await a.store.stop();await b.store.stop();
});
test('Data Vault validates the archive and exports it without adding it to the main sync keys',()=>{
 const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),validation=source.slice(source.indexOf('        const isRecord'),source.indexOf('        function localDate'));const ctx={ProcatsKnowledgeCore:C,ProcatsNavigation:{valid:()=>true},ProcatsExamData:{},TextEncoder};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(validation,ctx);assert.equal(vm.runInContext(`validData('${C.key}',${JSON.stringify([card()])})`,ctx),true);assert.equal(vm.runInContext(`validData('${C.key}',[{}])`,ctx),false);assert.match(source,/procats_knowledge_v1: window\.ProcatsKnowledgeStore\.get\(\)/);
});
test('cloud adapter guards account switches and targets only the five knowledge documents',async()=>{
 const paths=[],user={uid:'owner',emailVerified:true},auth={currentUser:user},sdk={doc(...p){paths.push(p);return p.join('/');},runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>false})})};const cloud=createKnowledgeCloud({sdk,db:'db',auth,user});assert.equal((await cloud.request('GET')).revision,0);assert.equal(paths.length,5);assert.ok(paths.every(p=>p[2]==='owner'&&p[3]==='state'&&p[4].startsWith('knowledge')));auth.currentUser={uid:'other',emailVerified:true};await assert.rejects(cloud.request('GET'),{code:'account-changed'});cloud.stop();
});
test('idle listener avoids repeated archive reads and resumes after stream failure',async()=>{
 let docs=new Map(),reads=0,listeners=0,change,error,changes=0;
 const root=(revision=1)=>({payload:JSON.stringify({version:1,shards:4}),revision});
 const snapshot=id=>({exists:()=>docs.has(id),data:()=>docs.get(id),metadata:{fromCache:false,hasPendingWrites:false}});
 const user={uid:'owner',emailVerified:true},sdk={doc:(_,a,b,c,id)=>id,onSnapshot(ref,options,cb,err){listeners++;change=cb;error=err;return ()=>{};},async runTransaction(db,fn){return fn({async get(id){reads++;return snapshot(id);}});}};
 const cloud=createKnowledgeCloud({sdk,db:{},auth:{currentUser:user},user});cloud.subscribe(()=>changes++,()=>{});for(const id of ['knowledge','knowledge_0','knowledge_1','knowledge_2','knowledge_3'])docs.set(id,id==='knowledge'?root():{payload:JSON.stringify({[C.key]:id==='knowledge_0'?[card()]:[]}),revision:1});
 await cloud.request('GET');change(snapshot('knowledge'));const before=reads;await cloud.request('GET');await cloud.request('GET');assert.equal(reads,before);
 for(const [id,v]of docs)docs.set(id,{...v,revision:2});change(snapshot('knowledge'));assert.equal(changes,1);assert.equal((await cloud.request('GET')).revision,2);assert.equal(reads,before+5);
 error(Error('stream lost'));await cloud.request('GET');assert.equal(listeners,2);change(snapshot('knowledge'));const resumed=reads;await cloud.request('GET');assert.equal(reads,resumed);cloud.stop();
});
test('knowledge backup survives encryption and restores a large archive with images',async()=>{
 const {encryptBackup,decryptBackup}=await import('../public/backup-crypto.js'),{limits,checkStructure,checkChange}=await import('../public/security-limits.js');
 const image='data:image/jpeg;base64,/9j/'+'A'.repeat(44000),cards=Array.from({length:25},(_,i)=>card(i+1,{image})),backup={format:'procats',version:2,[C.key]:JSON.stringify(cards)};
 const encrypted=await encryptBackup(backup,'Private backup test 173'),decoded=await decryptBackup(encrypted,'Private backup test 173');assert.deepEqual(decoded,backup);assert.ok(JSON.stringify(encrypted).length<limits.fileBytes);
 const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),ctx={Map,TextEncoder,ProcatsKnowledgeCore:C,ProcatsActivity,ProcatsLimits:{checkStructure,checkChange},ProcatsSync:{getData:()=>({}),keys:[]},days:[],tasks:[],folders:[],obsFolders:[],obsNotes:[]};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('        const isRecord'),source.indexOf('        function localDate'))+`\nconst backupJSONKeys=['${C.key}'],backupTextKeys=[];\n`+source.slice(source.indexOf('        function prepareBackupData'),source.indexOf('        async function restoreBackupData')),ctx);const updates=ctx.prepareBackupData(decoded);assert.equal(updates.get(C.key),backup[C.key]);
});
