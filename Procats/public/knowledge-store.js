import './knowledge-core.js';
import {readKnowledgeJournal,hasPendingKnowledge} from './knowledge-journal.js';
const {key,metaKey,snapshot}=globalThis.ProcatsKnowledgeCore;
const valid=v=>{try{globalThis.ProcatsKnowledgeCore.check(v);return true;}catch{return false;}};
const clone=v=>structuredClone(v),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// Independent, atomically written archive shards preserve the main workspace schema.
// Local data uses the existing account journal, including its native mirror and backups.
export function createKnowledgeStore({storage,cloudFactory,flush,isLocalSaved=()=>true,merge,notify=()=>{},demo=false,delay=10000,recovered=[]}){
 let lists=[],base=[],revision=0,conflict=null,recovery=null,invalid=false,status='connecting',closed=false,busy=null,timer=null,heartbeat=null;
 let dueAt=0,writing=false,started=false;
 try{const raw=storage.getItem(key);if(raw!==null){lists=JSON.parse(raw);if(!valid(lists))throw Error('Invalid lists');}
  const rawMeta=storage.getItem(metaKey),meta=rawMeta?JSON.parse(rawMeta):null;
  if(meta){if(!valid(meta.base)||!Number.isSafeInteger(meta.revision)||meta.revision<0)throw Error('Invalid lists journal');base=meta.base;revision=meta.revision;conflict=meta.conflict||null;recovery=meta.recovery||null;
   if(conflict&&(!snapshot(conflict.data)||!Number.isSafeInteger(conflict.revision)||conflict.revision<0))throw Error('Invalid lists conflict');}
 }catch{invalid=true;status='invalid';lists=[];}
 // Recover unsynced knowledge from another local tab before its journal is cleaned up.
 if(!invalid)try{let changed=false;for(const record of recovered){if(!hasPendingKnowledge(record,lists))continue;const old=readKnowledgeJournal(record);if(!old)continue;const current=clone(lists),result=merge({[key]:old.meta.base},{[key]:old.lists},{[key]:current});if(!valid(result.data[key]))throw Error('Invalid recovery');lists=result.data[key];if(result.conflicts.length&&!conflict)conflict={data:{[key]:current},revision,localDraft:true};changed=true;}if(changed){storage.setItem(key,JSON.stringify(lists));storage.setItem(metaKey,JSON.stringify({base,revision,conflict,recovery}));}}
 catch{invalid=true;status='invalid';}
 if(conflict&&!invalid)status='conflict';
 const cloud=cloudFactory({base:{[key]:base},revision});
 const pending=()=>!same(lists,base);
 const publish=()=>notify();
 function schedule(ms=Math.max(0,dueAt-Date.now())){clearTimeout(timer);if(started&&!closed&&!invalid)timer=setTimeout(()=>void sync(false),ms);}
 function writeMeta(){storage.setItem(metaKey,JSON.stringify({base,revision,conflict,recovery}));}
 function write(next){writing=true;try{storage.setItem(key,JSON.stringify(next));lists=clone(next);writeMeta();}finally{writing=false;}publish();}
 function check(){if(closed||invalid)throw Error('lists-locked');}
 function refresh(){if(writing||closed||invalid)return;try{const current=JSON.parse(storage.getItem(key)||'[]');if(!valid(current))throw Error('Invalid lists');if(!same(current,lists)){lists=current;dueAt=Date.now()+delay;status=conflict?'conflict':'pending';schedule();publish();}}catch{invalid=true;status='invalid';publish();}}
 function commit(next){check();if(!valid(next))throw Error('lists-invalid');if(new TextEncoder().encode(JSON.stringify({[key]:next})).length>2000000)throw Error('lists-limit');write(next);dueAt=Date.now()+delay;status=conflict?'conflict':'pending';schedule();publish();}
 function accept(remote){
  const remoteLists=remote.data[key]||[];
  const result=merge({[key]:base},{[key]:lists},{[key]:remoteLists});
  if(result.conflicts.length||!valid(result.data[key])){conflict=clone(remote);writing=true;try{writeMeta();}finally{writing=false;}status='conflict';publish();return false;}
  base=clone(remoteLists);revision=remote.revision;write(result.data[key]);return true;
 }
 async function run(force){
  if(closed||invalid||conflict)return;refresh();
  if(!force&&pending()&&Date.now()<dueAt){schedule();return;}
  status='saving';publish();
  try{
   await flush();if(!isLocalSaved())throw Error('lists-storage');if(closed)return;
   const remote=await cloud.request('GET');if(closed)return;
   if(remote.revision!==revision&&!accept(remote))return;
   if(pending()){
    const sent=clone(lists),result=await cloud.request('PUT',{data:{[key]:sent},revision});if(closed)return;
    if(result.conflict){accept(result);schedule(250);return;}
    base=sent;revision=result.revision;writing=true;try{writeMeta();}finally{writing=false;}
    await flush();if(!isLocalSaved())throw Error('lists-storage');
   }
   status=pending()?'pending':demo?'device':'synced';if(pending())schedule();
  }catch(error){status=error.message==='lists-storage'?'storage':error.code==='permission-denied'?'unavailable':error.code==='invalid-data'?'invalid':'offline';schedule(30000);}
  finally{publish();}
 }
 function sync(force=true){if(busy)return busy;busy=run(force).finally(()=>busy=null);return busy;}
 async function resolve(which){check();if(!conflict)return;recovery={local:clone(lists),remote:clone(conflict.data[key]||[]),savedAt:Date.now()};const chosen=which==='remote'?conflict.data[key]||[]:lists;if(!conflict.localDraft){base=clone(conflict.data[key]||[]);revision=conflict.revision;}conflict=null;write(chosen);dueAt=Date.now();await sync();}
 function watch(){clearTimeout(heartbeat);if(closed)return;heartbeat=setTimeout(()=>{void sync(false);watch();},60000);}
 return {getConflict:()=>conflict?{local:clone(lists),remote:clone(conflict.data[key]||[])}:null,get:()=>clone(lists),commit,refresh,sync,resolve,getState:()=>({status,invalid,conflict:!!conflict,pending:pending(),revision}),
  start(){if(started)return;started=true;if(invalid){publish();return;}cloud.subscribe(()=>{void sync(false);},()=>{status='offline';publish();});watch();void sync();},
  async beforeExit(){await sync();await flush();if(pending()||conflict||invalid||!isLocalSaved())throw Object.assign(Error('Lists have unsynced records'),{code:'pending-records'});},
  async stop(){closed=true;clearTimeout(timer);clearTimeout(heartbeat);cloud.stop();await busy;await flush();},
 };
}
