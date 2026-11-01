import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as limits from '../public/security-limits.js';
import {validateSnapshot} from '../public/validation.js';
const code=await readFile(new URL('../public/sync-merge.js',import.meta.url),'utf8');
const engine=await readFile(new URL('../public/sync-storage.js',import.meta.url),'utf8');
const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const c=vm.createContext({});vm.runInContext(code,c);
const plain=x=>JSON.parse(JSON.stringify(x));
const merge=(b,l,r)=>plain(c.ProcatsMerge.mergeDocuments(b,l,r));
const migrate=x=>plain(c.ProcatsActivity.snapshot(x));
const day='2026-10-21';
const task=(id,extra={})=>({id,dayId:1,title:'Task '+id,completed:false,missed:false,isExempt:false,...extra});
const document=(tasks,activity={})=>({yks_v3_days:[{id:1,name:'Plan'}],yks_v3_tasks:tasks,yks_v6_activity:activity});
function edit(base,id,fields){const doc=structuredClone(base);Object.assign(doc.yks_v3_tasks.find(t=>t.id===id),fields);return migrate(doc);}
const done={completed:true,missed:false,completedDate:day,activityDate:day};
const undone={completed:false,completedDate:null,activityDate:null};
test('task reorder and independent content edit converge in both sync directions',()=>{
 const base=document([task(1),task(2)]),reorder=structuredClone(base),rename=structuredClone(base);
 reorder.yks_v3_tasks.reverse();rename.yks_v3_tasks[0].title='Edited on PC';
 for(const [a,b] of [[reorder,rename],[rename,reorder]]){
  const got=merge(base,a,b);assert.deepEqual(got.conflicts,[]);assert.deepEqual(got.data.yks_v3_tasks.map(t=>t.id),[2,1]);assert.equal(got.data.yks_v3_tasks[1].title,'Edited on PC');
 }
});
test('different day reorders merge independently; divergent same-day reorders ask for a choice',()=>{
 const base=document([task(1),task(2),task(3),task(4,{dayId:2}),task(5,{dayId:2})]),a=structuredClone(base),b=structuredClone(base);
 a.yks_v3_tasks=[a.yks_v3_tasks[1],a.yks_v3_tasks[0],...a.yks_v3_tasks.slice(2)];b.yks_v3_tasks=[...b.yks_v3_tasks.slice(0,3),b.yks_v3_tasks[4],b.yks_v3_tasks[3]];
 const good=merge(base,a,b);assert.deepEqual(good.conflicts,[]);assert.deepEqual(good.data.yks_v3_tasks.map(t=>t.id),[2,1,3,5,4]);
 b.yks_v3_tasks=[task(1),task(3),task(2),task(4,{dayId:2}),task(5,{dayId:2})];
 assert.ok(merge(base,a,b).conflicts.some(x=>x.endsWith('.day.1.order')));
});
test('concurrent insertions, deletion and reordered base items preserve each remaining record once',()=>{
 const base={yks_v5_notes:[{id:1,text:'A'},{id:2,text:'B'},{id:3,text:'C'}]},a=structuredClone(base),b=structuredClone(base);
 a.yks_v5_notes=[a.yks_v5_notes[1],{id:5,text:'New A'},a.yks_v5_notes[0]];
 b.yks_v5_notes=[b.yks_v5_notes[0],{id:6,text:'New B'},b.yks_v5_notes[1],b.yks_v5_notes[2]];
 const left=merge(base,a,b),right=merge(base,b,a);assert.deepEqual(left.conflicts,[]);assert.deepEqual(left.data,right.data);assert.deepEqual(new Set(left.data.yks_v5_notes.map(t=>t.id)),new Set([1,2,5,6]));
 assert.ok(left.data.yks_v5_notes.findIndex(t=>t.id===2)<left.data.yks_v5_notes.findIndex(t=>t.id===1));
});
test('different tasks completed offline count twice; the same task completed twice counts once',()=>{
 const base=migrate(document([task(1),task(2)]));
 const a=edit(base,1,done),b=edit(base,2,done);
 for(const [left,right]of [[a,b],[b,a]]){const got=merge(base,left,right);assert.deepEqual(got.conflicts,[]);assert.equal(got.data.yks_v6_activity[day],2);assert.equal(validateSnapshot(got.data),true);}
 assert.equal(merge(base,a,a).data.yks_v6_activity[day],1);
});
test('unmigrated offline journals share one legacy baseline instead of duplicating historical counts',()=>{
 const base=document([task(1),task(2)],{'2026-10-20':6}),a=structuredClone(base),b=structuredClone(base);
 Object.assign(a.yks_v3_tasks[0],done);a.yks_v6_activity[day]=1;Object.assign(b.yks_v3_tasks[1],done);b.yks_v6_activity[day]=1;
 for(const [left,right]of [[a,b],[b,a]]){const got=merge(base,left,right);assert.deepEqual(got.conflicts,[]);assert.equal(got.data.yks_v6_activity[day],2);assert.equal(got.data.yks_v6_activity['2026-10-20'],6);}
});
test('new task insertion preserves user order when another device edits an existing task',()=>{
 const base=document([task(1)]),a=structuredClone(base),b=structuredClone(base);a.yks_v3_tasks.push(task(9),task(4));b.yks_v3_tasks[0].title='Renamed';
 for(const [left,right]of [[a,b],[b,a]])assert.deepEqual(merge(base,left,right).data.yks_v3_tasks.map(t=>t.id),[1,9,4]);
});
test('independent undo and exemption remove the correct contributions with no stale total',()=>{
 const base=migrate(document([task(1,done),task(2,done)],{[day]:2})),a=edit(base,1,undone),b=edit(base,2,undone);
 for(const [left,right]of [[a,b],[b,a]])assert.equal(merge(base,left,right).data.yks_v6_activity[day]||0,0);
 const pending=migrate(document([task(1)])),complete=edit(pending,1,done),exempt=edit(pending,1,{isExempt:true});
 for(const [left,right]of [[complete,exempt],[exempt,complete]]){const got=merge(pending,left,right);assert.deepEqual(got.conflicts,[]);assert.equal(got.data.yks_v3_tasks[0].completed,true);assert.equal(got.data.yks_v3_tasks[0].isExempt,true);assert.equal(got.data.yks_v3_tasks[0].activityDate,null);assert.equal(got.data.yks_v6_activity[day]||0,0);}
});
test('legacy migration preserves deleted-task history, is idempotent and does not duplicate copies',()=>{
 const legacy=document([task(1,done)],{[day]:5,'2026-10-20':3}),first=migrate(legacy);
 assert.deepEqual(first.yks_v6_activity,legacy.yks_v6_activity);assert.deepEqual(migrate(first),first);assert.equal(first.procats_activity_v1.baseline[day],4);
 const deleted=migrate({...first,yks_v3_tasks:[]});assert.equal(deleted.yks_v6_activity[day],5);
 const copied=migrate({...first,yks_v3_tasks:[...first.yks_v3_tasks,task(2,{completed:true,completedDate:null,activityDate:null})]});assert.equal(copied.yks_v6_activity[day],5);
 const reset=plain(c.ProcatsActivity.reset(first,first.yks_v3_tasks));assert.deepEqual(reset.yks_v6_activity,{});assert.equal(reset.yks_v3_tasks[0].completed,true);assert.deepEqual(migrate(reset),reset);
});
test('completed then deleted tasks from two devices retain distinct activity records',()=>{
 const base=migrate(document([task(1),task(2)])),a=edit(base,1,done),b=edit(base,2,done);
 a.yks_v3_tasks=a.yks_v3_tasks.filter(t=>t.id!==1);b.yks_v3_tasks=b.yks_v3_tasks.filter(t=>t.id!==2);
 const got=merge(base,a,b);assert.deepEqual(got.conflicts,[]);assert.deepEqual(got.data.yks_v3_tasks,[]);assert.equal(got.data.yks_v6_activity[day],2);
});
test('invalid activity ledgers fail validation without silently rewriting the account',()=>{
 for(const ledger of [{version:2,baseline:{},entries:{}},{version:1,baseline:{bad:1},entries:{}},{version:1,baseline:{},entries:{1:{date:day,extra:true}}},{version:1,baseline:{},entries:{1:{date:42}}}]){
  const doc={procats_activity_v1:ledger};assert.equal(validateSnapshot(doc),false);assert.deepEqual(migrate(doc),doc);
 }
});
test('legacy positive finite task IDs remain valid after activity migration',()=>{
 for(const id of [1.5,Number.MAX_SAFE_INTEGER+1,1e22,1e-7]){const old=document([task(id,done)],{[day]:1}),next=migrate(old);assert.equal(validateSnapshot(old),true);assert.equal(validateSnapshot(next),true);assert.equal(next.yks_v3_tasks[0].id,id);assert.equal(next.yks_v6_activity[day],1);assert.deepEqual(migrate(next),next);}
 for(const id of ['01','1.0','NaN','Infinity','-1','0','__proto__'])assert.equal(c.ProcatsActivity.valid({version:1,baseline:{},entries:JSON.parse('{'+JSON.stringify(id)+':{"date":null}}')}),false);
});
async function storage(initial){
 let saved=null;const ctx=vm.createContext({JSON,Promise,Map,Set,Date,TextEncoder,CustomEvent:class{},setTimeout:()=>1,clearTimeout(){},dispatchEvent(){},addEventListener(){},localStorage:{length:0,getItem:()=>null,setItem(){},removeItem(){}},document:{querySelector:()=>null,activeElement:null,visibilityState:'visible',addEventListener(){}},PROCATS_BOOT:{user:'quota-test',email:'test@example.test',data:initial,revision:1},ProcatsLimits:limits,procatsValidate:validateSnapshot,ProcatsDeviceStore:{save:async(_uid,x)=>saved=plain(x),persist:async()=>{},recovery:async()=>{}},ProcatsCloud:{request:async()=>({data:initial,revision:1}),subscribe(){},stop(){}}});
 ctx.window=ctx;vm.runInContext(code,ctx);vm.runInContext(engine,ctx);await ctx.ProcatsSync.flush();return {ctx,get saved(){return saved;}};
}
test('common journal boundary rejects oversized exam and bypass writes before any durable mutation',async()=>{
 const main={yks_v5_notes:[{id:1,text:''}]};main.yks_v5_notes[0].text='x'.repeat(849900-Buffer.byteLength(JSON.stringify(main)));
 const s=await storage(main),old=plain(s.ctx.ProcatsSync.getData()),records=[{id:2,type:'ydus',track:'written0',title:'Deneme',date:day,notes:'x'.repeat(200),scores:{},result:75,createdAt:1,updatedAt:1}];
 assert.equal(Buffer.byteLength(JSON.stringify(main)),849900);assert.equal(validateSnapshot({...main,procats_exams_v1:records}),true);
 assert.throws(()=>s.ctx.procatsStorage.setItem('procats_exams_v1',JSON.stringify(records)),/backup-size/);
 assert.deepEqual(plain(s.ctx.ProcatsSync.getData()),old);assert.equal(s.saved,null);
 assert.throws(()=>s.ctx.ProcatsSync.commitSections({yks_v5_notes:[{id:1,text:'x'.repeat(850001)}]}),/backup-size/);assert.deepEqual(plain(s.ctx.ProcatsSync.getData()),old);
 s.ctx.procatsStorage.setItem('yks_v5_notes',JSON.stringify([{id:1,text:'Shortened'}]));s.ctx.procatsStorage.setItem('procats_exams_v1',JSON.stringify(records));await s.ctx.ProcatsSync.flush();assert.equal(s.saved.data.procats_exams_v1[0].title,'Deneme');
});
test('normal writes succeed and old oversized records can shrink until sync becomes possible',async()=>{
 const s=await storage({yks_v5_notes:[{id:1,text:'ü'.repeat(450000)}]});
 assert.doesNotThrow(()=>s.ctx.procatsStorage.setItem('yks_v5_notes',JSON.stringify([{id:1,text:'ü'.repeat(435000)}])));await s.ctx.ProcatsSync.flush();assert.equal(s.saved.data.yks_v5_notes[0].text.length,435000);
 assert.throws(()=>s.ctx.procatsStorage.setItem('yks_v5_notes',JSON.stringify([{id:1,text:'ü'.repeat(440000)}])));
 s.ctx.procatsStorage.setItem('yks_v5_notes',JSON.stringify([{id:1,text:'x'.repeat(1000)}]));await s.ctx.ProcatsSync.flush();assert.equal(s.saved.data.yks_v5_notes[0].text.length,1000);
});
test('legacy backup replaces old ledger atomically and the new backup preserves deleted history',async()=>{
 const initial=migrate(document([task(1,done)],{[day]:9})),s=await storage(initial);
 const legacy=document([task(2,done)],{[day]:3});await s.ctx.ProcatsSync.importBackup(new Map(Object.entries(legacy).map(([k,v])=>[k,JSON.stringify(v)])));
 assert.equal(s.saved.data.yks_v6_activity[day],3);assert.equal(s.saved.data.procats_activity_v1.baseline[day],2);assert.equal(s.saved.data.procats_activity_v1.entries['1'],undefined);
 const backup=plain(s.saved.data);backup.yks_v3_tasks=[];await s.ctx.ProcatsSync.importBackup(new Map(Object.entries(backup).map(([k,v])=>[k,JSON.stringify(v)])));assert.equal(s.saved.data.yks_v6_activity[day],3);
});
test('exam quota failure leaves the form open and the persisted records unchanged',()=>{
 const start=app.indexOf('        function saveExam()'),end=app.indexOf('        function deleteExam(',start),c=vm.createContext({examDraft:{type:'ydus',track:'written0'},examRecords:[],examEditingId:null,ProcatsExamData:{tracks:()=>[],profile:()=>({manual:true})},getExamSubjects:()=>[],readExamScore(){},createId:()=>7,isExamDate:()=>true,validateExamRecords:()=>true,updateExamFormTotals:()=>true,canSaveSection:()=>false,t:x=>x,Date,document:{getElementById:id=>({value:({mExamTitle:'Exam',mExamDate:day,mExamNotes:'Notes',mExamResult:'75'})[id],textContent:'',focus(){}})},appStorage:{setItem(){throw Error('Must not write');}},closeModal(){throw Error('Must remain open');},renderExams(){throw Error('Must not render');}});
 vm.runInContext(app.slice(start,end),c);assert.equal(c.saveExam(),false);assert.deepEqual(plain(c.examRecords),[]);
});
