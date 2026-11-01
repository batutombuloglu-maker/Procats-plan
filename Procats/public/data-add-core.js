import {checkStructure,checkChange,limits} from './security-limits.js';
import {validateSnapshot} from './validation.js';
import './knowledge-core.js';
import {planKnowledgeRefresh} from './knowledge-refresh-core.js';
import './lists-core.js';

// Additive imports only operate on record collections. Preferences, running
// clocks, selection state and activity ledgers are never replaced here.
export const addKeys=Object.freeze(['procats_folders','yks_v3_days','yks_v3_tasks','yks_v5_notes','yks_v7_bookmarks','yks_v8_archives','procats_obs_folders','procats_obs_notes','procats_reminders','procats_exams_v1','procats_lists_v1','procats_knowledge_v1']);
const independent=new Set(['procats_lists_v1','procats_knowledge_v1']);
const ignoredKeys=new Set(['yks_v6_activity','procats_activity_v1','procats_sw','procats_timer','procats_exam_selection_v1','procats_navigation_v1','procats-device-settings-v1','procats_theme','procats_lang','yks_v3_sidebarWidth','procats_obs_sidebarWidth']);
const metadata=new Set(['format','version','exportDate','id','title','description','source','createdAt']);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const fold=x=>String(x??'').normalize('NFC').replace(/\r\n?/g,'\n').trim();
const clone=structuredClone;
const bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length;
const stable=x=>JSON.stringify(canonical(x));
function canonical(x){if(Array.isArray(x))return x.map(canonical);if(!object(x))return x;return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]));}
const volatile=new Set(['id','createdAt','updatedAt','position','expanded','completed','missed','rating','score','isExempt','completedDate','activityDate','lastSentTimestamp','timesSentToday','active','itemOrder','review','x','y','w','h','width','height','z']);
function identity(key,item){
 if(key==='procats_knowledge_v1')return stable({kind:item.kind,question:fold(item.question),answer:fold(item.answer),image:item.image||'',map:globalThis.ProcatsKnowledgeCore.mapOf(item)});
 if(key==='procats_lists_v1')return stable({title:fold(item.title),items:item.items.map(i=>fold(i.title))});
 const value=Object.fromEntries(Object.entries(item).filter(([k])=>!volatile.has(k)));
 // Cosmetic note movement or progress changes do not cause repeat imports.
 if(key==='yks_v5_notes')return stable({text:fold(item.text)});
 return stable(value);
}
function readCollections(value){
 if(!object(value))throw Error('add-invalid');if(bytes(value)>limits.fileBytes)throw Error('backup-size');
 let source=value;
 if(value.format==='procats-data-pack'){
  if(value.version!==1||!object(value.data)||Object.keys(value).some(k=>k!=='data'&&!metadata.has(k)))throw Error('add-format');
  source=value.data;
 }else if(value.format!=null&&value.format!=='procats')throw Error('add-format');
 else if(value.version!=null&&(!Number.isInteger(value.version)||value.version<1||value.version>2))throw Error('add-format');
 const incoming={},ignored=[];
 for(const [key,raw]of Object.entries(source)){
  if(source===value&&metadata.has(key)){checkStructure(raw);continue;}
  if(ignoredKeys.has(key)){ignored.push(key);continue;}
  if(!addKeys.includes(key))throw Error('add-section');
  if(raw===null)continue;
  const records=typeof raw==='string'?JSON.parse(raw):clone(raw);checkStructure(records);
  if(!Array.isArray(records))throw Error('add-invalid');
  const ids=new Set();for(const item of records){if(!object(item)||!Number.isFinite(item.id)||item.id<=0||ids.has(item.id))throw Error('add-invalid');ids.add(item.id);}
  if(key==='procats_knowledge_v1')globalThis.ProcatsKnowledgeCore.check(records);
  if(key==='procats_lists_v1'&&!globalThis.ProcatsListsCore.valid(records))throw Error('add-invalid');
  incoming[key]=records;
 }
 if(!Object.keys(incoming).length)throw Error('add-empty');
 return {incoming,ignored};
}
function guardedKeys(incoming){const keys=new Set(Object.keys(incoming));if(keys.has('yks_v3_tasks'))keys.add('yks_v3_days');if(keys.has('yks_v3_days'))keys.add('procats_folders');if(keys.has('procats_obs_notes'))keys.add('procats_obs_folders');return [...keys].sort();}
export function additionSignature(current,incoming){return stable(Object.fromEntries(guardedKeys(incoming).map(k=>[k,current[k]??[]])));}
export function planAddition(current,file,{now=Date.now()}={}){
 if(!object(current)||!Number.isSafeInteger(now)||now<0)throw Error('add-invalid');
 if(file?.format==='procats-knowledge-refresh')return planKnowledgeRefresh(current,file,{now,signature:additionSignature(current,{procats_knowledge_v1:[]})});
 const {incoming,ignored}=readCollections(file),signature=additionSignature(current,incoming),updates={},counts={},skipped={},mappings={};
 for(const key of Object.keys(incoming))if(!Array.isArray(current[key]??[]))throw Error('add-current');
 const reference=(section,id)=>{
  if(id==null)return id;
  if(mappings[section]?.has(id))return mappings[section].get(id);
  if((current[section]||[]).some(x=>x.id===id))return id;
  throw Error('add-reference');
 };
 for(const key of addKeys){
  if(!Object.hasOwn(incoming,key))continue;
  const old=current[key]||[];if(key==='procats_knowledge_v1')globalThis.ProcatsKnowledgeCore.check(old);if(key==='procats_lists_v1'&&!globalThis.ProcatsListsCore.valid(old))throw Error('add-current');
  const next=clone(old),known=new Map(old.map(item=>[identity(key,item),item.id])),used=new Set(old.map(item=>item.id)),mapping=new Map();mappings[key]=mapping;counts[key]=0;skipped[key]=0;
  let candidate=Math.max(1,Math.min(now,Number.MAX_SAFE_INTEGER-100000));
  const allocate=()=>{while(used.has(candidate)){candidate=candidate<Number.MAX_SAFE_INTEGER?candidate+1:1;}const id=candidate;used.add(id);candidate=candidate<Number.MAX_SAFE_INTEGER?candidate+1:1;return id;};
  const appended=[];
  for(const source of incoming[key]){
   const item=clone(source);
   if(key==='yks_v3_days')item.folderId=reference('procats_folders',item.folderId);
   if(key==='yks_v3_tasks')item.dayId=reference('yks_v3_days',item.dayId);
   if(key==='procats_obs_notes')item.folderId=reference('procats_obs_folders',item.folderId);
   const fingerprint=identity(key,item);
   if(known.has(fingerprint)){mapping.set(source.id,known.get(fingerprint));skipped[key]++;continue;}
   item.id=allocate();mapping.set(source.id,item.id);known.set(fingerprint,item.id);counts[key]++;
   if(key==='procats_lists_v1'){
    const itemMap=new Map(),itemsUsed=new Set();let nested=1;
    item.items=item.items.map(child=>{while(itemsUsed.has(nested))nested++;const id=nested++;itemsUsed.add(id);itemMap.set(child.id,id);return {...child,id};});
    if(item.itemOrder)item.itemOrder=item.itemOrder.filter(id=>itemMap.has(id)).map(id=>itemMap.get(id));
    item.position=Math.max(-1,...old.map((x,i)=>x.position??i))+counts[key];
   }
   next.push(item);appended.push(item);
  }
  if(key==='procats_knowledge_v1'){
   for(const item of appended)item.related=[...new Set(item.related.map(id=>reference(key,id)))].filter(id=>id!==item.id);
   globalThis.ProcatsKnowledgeCore.check(next);
  }
  if(key==='procats_lists_v1'&&(!globalThis.ProcatsListsCore.valid(next)||bytes({[key]:next})>750000))throw Error('add-limit');
  if(counts[key])updates[key]=next;
 }
 const mainUpdates=Object.fromEntries(Object.entries(updates).filter(([key])=>!independent.has(key)));
 if(Object.keys(mainUpdates).length){
  const main=Object.fromEntries(Object.entries(current).filter(([key])=>!independent.has(key))),next=globalThis.ProcatsActivity.snapshot({...main,...mainUpdates});
  if(!validateSnapshot(next))throw Error('add-invalid');checkChange(main,next);
 }
 const totalAdded=Object.values(counts).reduce((a,b)=>a+b,0),totalSkipped=Object.values(skipped).reduce((a,b)=>a+b,0);
 return {updates,counts,skipped,totalAdded,totalSkipped,ignored,signature};
}
globalThis.ProcatsDataAdd={addKeys,plan:planAddition,signature:additionSignature,fileBytes:limits.fileBytes};
