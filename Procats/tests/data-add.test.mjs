import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {planAddition} from '../public/data-add-core.js';
import {validateSnapshot} from '../public/validation.js';
import * as limits from '../public/security-limits.js';
const C=globalThis.ProcatsKnowledgeCore,copy=structuredClone;
const card=(id,question='Question '+id,extra={})=>C.make({id,question,answer:'Answer '+id,category:['Coğrafya'],tags:['Avrupa'],...extra},1000);
const pack=data=>({format:'procats-data-pack',version:1,title:'Example additions',data});
const state=()=>({procats_folders:[{id:1,name:'Old folder',expanded:true}],yks_v3_days:[{id:1,name:'Old day',folderId:1,completed:false}],yks_v3_tasks:[{id:1,title:'Old task',dayId:1,completed:false}],yks_v5_notes:[{id:1,text:'Private existing note',color:'red',x:90}],procats_timer:{isRunning:true,endTime:1800000060000,remainingTime:60},procats_sw:{isRunning:true,startTime:1800000000000,savedTime:123},procats_knowledge_v1:[C.rate(card(1),'knew',1800000000000)],procats_lists_v1:[{id:1,title:'Existing list',items:[{id:1,title:'Existing item',completed:true}],position:0}]});

test('knowledge-only JSON appends new cards without touching existing records, progress or source',()=>{
 const current=state(),before=copy(current),file=pack({procats_knowledge_v1:[card(1,'New question')]}),original=copy(file),plan=planAddition(current,file,{now:5000});
 assert.deepEqual(Object.keys(plan.updates),['procats_knowledge_v1']);assert.deepEqual(plan.updates.procats_knowledge_v1[0],current.procats_knowledge_v1[0]);assert.notEqual(plan.updates.procats_knowledge_v1[1].id,1);assert.equal(plan.totalAdded,1);assert.deepEqual(current,before);assert.deepEqual(file,original);
 const graded=plan.updates.procats_knowledge_v1.map(c=>C.rate(c,'hard',1800000100000)),again=planAddition({...current,procats_knowledge_v1:graded},file);assert.equal(again.totalAdded,0);assert.equal(again.totalSkipped,1);assert.deepEqual(graded[1].review.grade,'hard');
});
test('parent/day/task and free-plan links remap together when incoming IDs collide',()=>{
 const current=state(),file=pack({procats_folders:[{id:1,name:'New folder'}],yks_v3_days:[{id:1,name:'New day',folderId:1}],yks_v3_tasks:[{id:1,title:'New task',dayId:1}],procats_obs_folders:[{id:1,name:'Notes folder'}],procats_obs_notes:[{id:1,name:'New note',content:'Text',folderId:1}]}),plan=planAddition(current,file,{now:10000});
 assert.equal(plan.totalAdded,5);const u=plan.updates;assert.equal(u.yks_v3_tasks[1].dayId,u.yks_v3_days[1].id);assert.equal(u.yks_v3_days[1].folderId,u.procats_folders[1].id);assert.equal(u.procats_obs_notes[0].folderId,u.procats_obs_folders[0].id);assert.equal(u.yks_v3_tasks[0].title,'Old task');
 const again=planAddition({...current,...u},file,{now:20000});assert.equal(again.totalAdded,0);assert.equal(again.totalSkipped,5);
});
test('knowledge relations and nested list ordering survive reallocated IDs',()=>{
 const current=state(),file=pack({procats_knowledge_v1:[card(1,'First',{related:[2]}),card(2,'Second')],procats_lists_v1:[{id:1,title:'New list',items:[{id:10,title:'A',completed:false},{id:20,title:'B',completed:true}],itemOrder:[20,999,10],position:0}]}),u=planAddition(current,file,{now:9000}).updates;
 assert.deepEqual(u.procats_knowledge_v1[1].related,[u.procats_knowledge_v1[2].id]);assert.deepEqual(u.procats_lists_v1[1].itemOrder,[2,1]);assert.equal(u.procats_lists_v1[1].items[1].completed,true);assert.equal(u.procats_lists_v1[1].position,1);assert.deepEqual(u.procats_lists_v1[0],current.procats_lists_v1[0]);
});
test('real backup sections decode as additions while settings, timers and ledgers are ignored',()=>{
 const current=state(),file={format:'procats',version:2,yks_v5_notes:JSON.stringify([{id:1,text:'Added note'}]),procats_theme:'oled',procats_timer:JSON.stringify({isRunning:false}),procats_activity_v1:JSON.stringify({})},plan=planAddition(current,file,{now:9000});
 assert.deepEqual(Object.keys(plan.updates),['yks_v5_notes']);assert.equal(plan.updates.yks_v5_notes.length,2);assert.equal(plan.ignored.length,3);assert.equal(current.procats_timer.isRunning,true);
 const changed={...current,yks_v5_notes:[{...current.yks_v5_notes[0],color:'blue',x:200}]};assert.equal(planAddition(changed,pack({yks_v5_notes:current.yks_v5_notes})).totalAdded,0);
});
test('unsafe structures, unknown sections, malformed references, duplicates and quota overflow fail before mutation',()=>{
 const current=state(),before=copy(current);for(const file of [JSON.parse('{"format":"procats-data-pack","version":1,"data":{"__proto__":{}}}'),pack({unknown:[]}),pack({yks_v3_tasks:[{id:1,title:'No parent',dayId:999}]}),pack({yks_v5_notes:[{id:1,text:'a'},{id:1,text:'b'}]}),pack({yks_v7_bookmarks:[{id:1,title:'Unsafe',url:'javascript:alert(1)'}]}),pack({yks_v5_notes:[{id:1,text:'x'.repeat(850001)}]}),pack({procats_knowledge_v1:[{...card(2),image:'data:image/svg+xml,<svg/>'}]})])assert.throws(()=>planAddition(current,file));assert.deepEqual(current,before);
 assert.throws(()=>planAddition(current,{format:'procats-data-pack',version:2,data:{yks_v5_notes:[]}}));assert.throws(()=>planAddition(current,pack({procats_theme:'oled'})),/empty/);
});
test('a large but valid knowledge section in an exported string remains addable within its own 2MB budget',()=>{
 const cards=Array.from({length:30},(_,i)=>card(i+10,'Image '+i,{image:'data:image/jpeg;base64,/9j/'+'A'.repeat(31000)}));C.check(cards);
 const plan=planAddition(state(),{format:'procats',version:2,procats_knowledge_v1:JSON.stringify(cards)});assert.equal(plan.totalAdded,30);
});
test('text case and poem line structure remain distinct during duplicate detection',()=>{
 const current={procats_knowledge_v1:[card(1,'US',{answer:'United States'})],yks_v5_notes:[{id:1,text:'First\nSecond'}]};assert.equal(planAddition(current,pack({procats_knowledge_v1:[card(2,'us',{answer:'United States'})],yks_v5_notes:[{id:2,text:'First Second'}]})).totalAdded,2);
});

const engine=fs.readFileSync(new URL('../public/sync-storage.js',import.meta.url),'utf8');
function journal(){
 const full=state(),main=Object.fromEntries(Object.entries(full).filter(([k])=>!['procats_lists_v1','procats_knowledge_v1'].includes(k)));let saved=null,fail=false,wait=null;const settings={procats_theme:'dark',procats_knowledge_v1:JSON.stringify(full.procats_knowledge_v1),procats_lists_v1:JSON.stringify(full.procats_lists_v1)};
 const ctx={JSON,Promise,Map,Set,Date,TextEncoder,structuredClone,CustomEvent:class{},setTimeout:()=>1,clearTimeout(){},addEventListener(){},dispatchEvent(){},localStorage:{length:0,getItem:()=>null,setItem(){},removeItem(){}},document:{querySelector:()=>null,activeElement:null,visibilityState:'visible',addEventListener(){}},PROCATS_BOOT:{user:'add-test',email:'test@example.test',data:main,revision:1,journal:{base:main,data:main,revision:1,settings}},ProcatsMerge:globalThis.ProcatsMerge,ProcatsActivity:globalThis.ProcatsActivity,ProcatsDataAdd:globalThis.ProcatsDataAdd,ProcatsLimits:limits,procatsValidate:validateSnapshot,ProcatsDeviceStore:{async save(_uid,record){if(fail)throw Error('disk full');if(wait)await wait;saved=copy(record);},persist:async()=>{}},ProcatsCloud:{request:async()=>({data:main,revision:1}),subscribe(){},stop(){}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(engine,ctx);return {ctx,get saved(){return saved;},fail(){fail=true;},hold(p){wait=p;}};
}
test('durable additive commit publishes selected sections together and leaves unrelated preferences and clocks intact',async()=>{
 const a=journal(),S=a.ctx.ProcatsSync,file=pack({yks_v5_notes:[{id:1,text:'New note'}],procats_knowledge_v1:[card(1,'Added card')]}),preview=S.previewAddition(file),before=copy(S.getData());await S.addData(file,preview.signature);
 assert.equal(S.getData().yks_v5_notes.length,2);assert.equal(JSON.parse(a.saved.settings.procats_knowledge_v1).length,2);assert.deepEqual(S.getData().procats_timer,before.procats_timer);assert.equal(a.saved.settings.procats_theme,'dark');assert.equal(JSON.parse(a.saved.settings.procats_lists_v1)[0].items[0].completed,true);assert.equal(S.previewAddition(file).totalAdded,0);
});
test('failed durable write and a changed preview leave both main records and knowledge untouched',async()=>{
 for(const mode of ['disk','stale']){const a=journal(),S=a.ctx.ProcatsSync,file=pack({yks_v5_notes:[{id:2,text:'New note'}],procats_knowledge_v1:[card(2)]}),preview=S.previewAddition(file);if(mode==='disk')a.fail();else a.ctx.procatsStorage.setItem('yks_v5_notes',JSON.stringify([{id:1,text:'Changed during preview'}]));const before=copy(S.getData()),knowledge=a.ctx.procatsStorage.getItem('procats_knowledge_v1');await assert.rejects(S.addData(file,preview.signature));assert.deepEqual(S.getData(),before);assert.equal(a.ctx.procatsStorage.getItem('procats_knowledge_v1'),knowledge);}
});
test('in-flight additive writes lock concurrent writes and expose no partial records',async()=>{
 const a=journal(),S=a.ctx.ProcatsSync,file=pack({yks_v5_notes:[{id:2,text:'New'}]}),preview=S.previewAddition(file);let release;const gate=new Promise(r=>release=r);a.hold(gate);const running=S.addData(file,preview.signature);await new Promise(setImmediate);assert.equal(S.getData().yks_v5_notes.length,1);assert.throws(()=>a.ctx.procatsStorage.setItem('yks_v5_notes','[]'),/locked/);release();await running;assert.equal(S.getData().yks_v5_notes.length,2);
});

test('refresh-only imports commit atomically even when no new card is added',async()=>{
 const a=journal(),S=a.ctx.ProcatsSync,old=C.make({id:81,kind:'visual',question:'Country?',answer:'Capital',category:['Coğrafya'],tags:['Başkentler','Country'],image:'data:image/jpeg;base64,/9j/AAAA'},1000),graded=C.rate(old,'knew',1800000000000);
 a.ctx.procatsStorage.setItem('procats_knowledge_v1',JSON.stringify([graded]));await S.flush();const file={format:'procats-knowledge-refresh',version:1,items:[{previous:old,card:{...copy(old),image:'',tags:[...old.tags,'@map/world-2026/CM']}}]},preview=S.previewAddition(file),before=copy(S.getData());assert.equal(preview.totalAdded,0);assert.equal(preview.totalChanged,1);await S.addData(file,preview.signature);
 const stored=JSON.parse(a.saved.settings.procats_knowledge_v1);assert.equal(stored[0].image,'');assert.deepEqual(stored[0].review,graded.review);assert.equal(stored[0].id,81);assert.deepEqual(S.getData(),before);assert.equal(S.previewAddition(file).totalChanged,0);
});
