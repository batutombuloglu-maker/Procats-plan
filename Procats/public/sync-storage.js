/* Account-scoped durable journal; cloud writes wait for ten seconds without edits. */
(()=>{'use strict';const boot=window.PROCATS_BOOT;if(!boot?.user)throw Error('Account required');
const keys=new Set(['procats_folders','yks_v3_days','yks_v3_tasks','yks_v5_notes','yks_v6_activity','procats_activity_v1','yks_v7_bookmarks','yks_v8_archives','procats_obs_folders','procats_obs_notes','procats_reminders','procats_sw','procats_timer','procats_exams_v1','procats_exam_selection_v1']);
const clone=v=>JSON.parse(JSON.stringify(v)),{same,mergeDocuments}=ProcatsMerge,prefix='procats-cloud:'+boot.user+':',store=window.ProcatsDeviceStore;
let base=clone(boot.journal?.base||boot.data),data=clone(boot.journal?.data||boot.data),revision=boot.journal?.revision??boot.revision,conflict=boot.journal?.conflict||null;
let syncPromise=Promise.resolve(),resolvePromise=Promise.resolve(),closing=false,importPromise=Promise.resolve(),importing=false,busy=false,again=false,ready=false,stopped=false,applying=false,status='connecting',localSaved=true,storageError=false,generation=0,durable=Promise.resolve(),timer,heartbeat,dueAt=Date.now()+10000,pendingRemote=null;
// Ignore settings from the removed feature when opening old device journals or backups.
const retiredSettings=new Set(['procats_assistant_chat_v1','procats_assistant_applied_v1']);
const recovered=[],settings=Object.fromEntries(Object.entries(boot.journal?.settings||{}).filter(([key])=>!retiredSettings.has(key)));
function recover(v){if(!v?.base||!v?.data||same(v.data,v.base))return;const merged=mergeDocuments(v.base,v.data,data);if(merged.conflicts.length)conflict={data:clone(data),revision};data=merged.data;}
for(const v of boot.journal?.recovered||[])recover(v);
try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key?.startsWith(prefix+'draft:'))continue;const raw=localStorage.getItem(key),v=JSON.parse(raw);if(!v?.base||!v?.data)continue;recover(v);recovered.push({key,raw});}}catch{storageError=true;}
// Migration is durable through the normal journal. Never discard legacy totals
// or silently strip unknown sections from an account opened by a newer client.
data=ProcatsActivity.snapshot(data,ProcatsActivity.snapshot(base).procats_activity_v1);
function candidate(updates,replaceActivity=false){let next={...data,...updates};if(replaceActivity)delete next.procats_activity_v1;return ProcatsActivity.snapshot(next);}
function checkChange(next){const limits=window.ProcatsLimits;if(limits?.checkChange)limits.checkChange(data,next);else limits?.checkSnapshot(next);}
function commit(next){if(same(data,next))return;checkChange(next);data=next;changed();}
function notify(){window.dispatchEvent(new CustomEvent('procats-sync-status'));}function setStatus(v){status=v;notify();}
function persist(){const token=++generation,record={base:clone(base),data:clone(data),revision,conflict:conflict?clone(conflict):null,settings:clone(settings),savedAt:Date.now()};localSaved=false;notify();durable=durable.catch(()=>{}).then(async()=>{if(token!==generation)return;await store.save(boot.user,record);if(token===generation){localSaved=true;storageError=false;for(const old of recovered)if(localStorage.getItem(old.key)===old.raw)localStorage.removeItem(old.key);recovered.length=0;notify();}}).catch(()=>{storageError=true;localSaved=false;setStatus('storage');});return durable;}
function schedule(delay=Math.max(0,dueAt-Date.now())){clearTimeout(timer);if(ready&&!stopped&&!closing)timer=setTimeout(()=>sync(false),delay);}function changed(){persist();setStatus(conflict?'conflict':'pending');dueAt=Date.now()+10000;schedule();}
window.procatsStorage={getItem(key){if(retiredSettings.has(key))return null;return keys.has(key)?Object.hasOwn(data,key)?JSON.stringify(data[key]):null:Object.hasOwn(settings,key)?settings[key]:(()=>{try{return retiredSettings.has(key)?null:localStorage.getItem(prefix+'setting:'+key);}catch{return null;}})();},setItem(key,raw){if(stopped||closing||importing)throw Error('Storage locked');if(retiredSettings.has(key))return;if(!keys.has(key)){settings[key]=raw;try{if(!retiredSettings.has(key))localStorage.setItem(prefix+'setting:'+key,raw);}catch{}persist();return;}const value=JSON.parse(raw);if(applying||same(data[key],value))return;commit(candidate({[key]:value}));},removeItem(key){if(stopped||closing||importing)throw Error('Storage locked');if(!keys.has(key)){delete settings[key];try{localStorage.removeItem(prefix+'setting:'+key);}catch{}persist();return;}if(applying||!Object.hasOwn(data,key))return;const next={...data};delete next[key];commit(ProcatsActivity.snapshot(next));}};
function safe(){return !document.querySelector('#taskModal.active,#dayModal.active,#folderModal.active,#obsNoteModal.active,#obsFolderModal.active,#examModal.active,#linkModal.active')&&!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');}
function apply(remote){if(remote.revision<revision)return true;const merged=mergeDocuments(base,data,remote.data);let exceedsLimit=false;try{window.ProcatsLimits?.checkSnapshot(merged.data);}catch{exceedsLimit=true;}if(merged.conflicts.length||exceedsLimit||(window.procatsValidate&&!window.procatsValidate(merged.data))){conflict=remote;persist();setStatus('conflict');return false;}const previous=clone(data);base=clone(remote.data);revision=remote.revision;data=merged.data;persist();if(!same(previous,data)&&ready){applying=true;try{window.procatsApplyRemote?.(previous,data);}finally{applying=false;}}setStatus(same(base,data)?'synced':'pending');return true;}
function sync(force=true){if(busy){again=true;return syncPromise;}const result=performSync(force);syncPromise=result;return result;}
async function performSync(force=true){if(!ready||stopped||closing||conflict||importing)return;if(busy){again=true;return;}if(!force&&!same(base,data)&&Date.now()<dueAt){schedule();return;}busy=true;let failed=false;
try{await durable;if(stopped)return;if(pendingRemote){if(!safe()){setStatus('waiting');schedule(1500);return;}const remote=pendingRemote;pendingRemote=null;if(!apply(remote))return;}
if(!same(base,data)){const sent=clone(data);setStatus('saving');const result=await ProcatsCloud.request('PUT',{data:sent,revision});if(stopped)return;if(result.conflict){if(safe())apply(result);else{pendingRemote=result;setStatus('waiting');}again=true;return;}base=sent;revision=result.revision;await persist();setStatus(same(base,data)?'synced':'pending');if(!same(base,data))again=true;}
else{setStatus('connecting');const remote=await ProcatsCloud.request('GET');if(stopped)return;if(remote.revision!==revision){if(safe())apply(remote);else{pendingRemote=remote;setStatus('waiting');schedule(1500);}}else setStatus('synced');}}
catch(error){failed=true;if(['permission-denied','unauthenticated','account-changed'].includes(error.code)){stopped=true;setStatus('signin');void window.ProcatsAccount?.onAccessDenied();}else setStatus(error.code==='invalid-data'?'invalid':error.code==='resource-exhausted'?'quota':'offline');}
finally{busy=false;if(!stopped){if(failed)schedule(30000);else if(again){again=false;schedule();}}}}
function resolve(which){if(stopped||closing||importing)return Promise.resolve();const result=performResolve(which);resolvePromise=result;return result;}
async function performResolve(which){if(!conflict)return;await store.recovery(boot.user,{local:clone(data),remote:clone(conflict.data),createdAt:Date.now()});if(stopped)return;const old=clone(data);base=clone(conflict.data);revision=conflict.revision;if(which==='remote')data=ProcatsActivity.snapshot(clone(conflict.data));conflict=null;await persist();applying=true;try{window.procatsApplyRemote?.(old,data);}finally{applying=false;}dueAt=Date.now();await sync();}
function importBackup(updates){if(importing)return Promise.reject(Error("Storage busy"));const result=commitBackup(updates);importPromise=result.catch(()=>{});return result;}
function additionCurrent(){const current=clone(data);for(const key of ['procats_lists_v1','procats_knowledge_v1'])current[key]=settings[key]?JSON.parse(settings[key]):[];return current;}
function previewAddition(file){if(importing||stopped||closing||conflict)throw Error('add-busy');return ProcatsDataAdd.plan(additionCurrent(),file);}
function addData(file,expected){if(importing)return Promise.reject(Error('add-busy'));const result=commitAddition(file,expected);importPromise=result.catch(()=>{});return result;}
async function commitAddition(file,expected){
 if(stopped||closing||busy||importing||conflict)throw Error('add-busy');
 importing=true;clearTimeout(timer);
 try{
  await durable;
  // Prepare against the newest durable record while all storage writes are locked.
  const plan=ProcatsDataAdd.plan(additionCurrent(),file);
  if(plan.signature!==expected)throw Error('add-changed');
  for(const [key,store]of [['procats_lists_v1',window.ProcatsListsStore],['procats_knowledge_v1',window.ProcatsKnowledgeStore]])if(Object.hasOwn(plan.updates,key)){const state=store?.getState();if(state?.invalid||state?.conflict)throw Error('add-busy');}
  const previous=clone(data);
  if(!plan.totalAdded&&!plan.totalChanged)return {plan,previous,mainChanged:false};
  const mainUpdates=Object.fromEntries(Object.entries(plan.updates).filter(([key])=>keys.has(key))),mainChanged=Object.keys(mainUpdates).length>0;
  const next=mainChanged?ProcatsActivity.snapshot({...clone(data),...mainUpdates}):clone(data),prefs=clone(settings);
  for(const key of ['procats_lists_v1','procats_knowledge_v1'])if(Object.hasOwn(plan.updates,key))prefs[key]=JSON.stringify(plan.updates[key]);
  if(mainChanged&&window.procatsValidate&&!window.procatsValidate(next))throw Error('add-invalid');
  checkChange(next);
  const record={base:clone(base),data:next,revision,conflict:null,settings:prefs,savedAt:Date.now()};
  // One atomic durable journal commit; failure exposes none of the additions.
  await store.save(boot.user,record);
  data=next;for(const key of Object.keys(settings))delete settings[key];Object.assign(settings,prefs);
  for(const key of ['procats_lists_v1','procats_knowledge_v1'])if(Object.hasOwn(plan.updates,key))try{localStorage.setItem(prefix+'setting:'+key,prefs[key]);}catch{}
  localSaved=true;storageError=false;dueAt=Date.now()+10000;setStatus('pending');
  return {plan,previous,mainChanged};
 }finally{importing=false;schedule();}
}
async function commitBackup(updates){
 if(stopped||closing||busy||importing||conflict)throw Error('Storage busy');
 importing=true;clearTimeout(timer);
 try{
  await durable;
  let next=clone(data);const prefs=clone(settings);
  for(const [key,raw]of updates){if(keys.has(key))next[key]=JSON.parse(raw);else if(!retiredSettings.has(key))prefs[key]=raw;}
  if(!updates.has('procats_activity_v1')&&(updates.has('yks_v3_tasks')||updates.has('yks_v6_activity')))delete next.procats_activity_v1;
  next=ProcatsActivity.snapshot(next);
  delete prefs.procats_bot_settings;
  if(window.procatsValidate&&!window.procatsValidate(next))throw Error('Invalid backup');
  checkChange(next);
  const record={base:clone(base),data:next,revision,conflict:null,settings:prefs,savedAt:Date.now()};
  // Commit one durable journal before exposing imported values to the application.
  await store.save(boot.user,record);
  data=next;for(const key of Object.keys(settings))delete settings[key];Object.assign(settings,prefs);
  for(const [key,raw]of Object.entries(prefs))try{if(!retiredSettings.has(key))localStorage.setItem(prefix+'setting:'+key,raw);}catch{}
  localSaved=true;storageError=false;dueAt=Date.now()+10000;setStatus('pending');
 }finally{importing=false;schedule();}
}
async function flush(){await Promise.all([importPromise,resolvePromise]);await durable;}
async function pause(){closing=true;clearTimeout(timer);await Promise.all([syncPromise,importPromise,resolvePromise]);await durable;}
function resume(){if(stopped)return;closing=false;schedule();}
window.ProcatsSync={pause,resume,importBackup,keys:[...keys],sync,resolve,flush,stop(){stopped=true;clearTimeout(timer);clearTimeout(heartbeat);ProcatsCloud.stop();},getState:()=>({status:storageError?'storage':status,localSaved,conflict:!!conflict,pending:!same(base,data),email:boot.email,revision}),getData:()=>clone(data),getConflict:()=>conflict?{format:'procats-conflict',local:clone(data),remote:clone(conflict.data)}:null,start(){ready=true;persist();setStatus(conflict?'conflict':same(base,data)?'connecting':'pending');watch();ProcatsCloud.subscribe(()=>{if(busy)again=true;else void sync(false);},error=>{if(['permission-denied','unauthenticated'].includes(error.code)){stopped=true;setStatus('signin');void window.ProcatsAccount?.onAccessDenied();}else setStatus(error.code==='resource-exhausted'?'quota':'offline');});void store.persist();return sync(false);},importLegacy(snapshot){return importBackup(new Map(Object.entries(snapshot).filter(([key])=>keys.has(key)||['procats_theme','procats_lang','yks_v3_sidebarWidth','procats_obs_sidebarWidth','procats_navigation_v1','procats-device-settings-v1'].includes(key)).map(([key,value])=>[key,typeof value==='string'?value:JSON.stringify(value)])));}};
// One logical calendar paste must never expose a day without its tasks.
window.ProcatsSync.previewAddition=previewAddition;window.ProcatsSync.addData=addData;
window.ProcatsSync.commitSections=function(updates){
 if(applying)return;
 if(stopped||closing||importing)throw Error('Storage locked');
 const next=clone(data);
 for(const [key,value]of Object.entries(updates)){if(!keys.has(key))throw Error('Unknown data section');next[key]=clone(value);}
 if(window.procatsValidate&&!window.procatsValidate(next))throw Error('Invalid data');
 commit(ProcatsActivity.snapshot(next));
};
window.ProcatsSync.checkSections=function(updates){checkChange(candidate(updates));};
function watch(){clearTimeout(heartbeat);if(stopped)return;heartbeat=setTimeout(async()=>{if(!closing&&document.visibilityState==='visible')await sync(false);watch();},60000);}
window.addEventListener('online',()=>sync(true));window.addEventListener('focus',()=>sync(true));document.addEventListener('visibilitychange',()=>{void sync(true);});window.addEventListener('pagehide',()=>{void sync(true);});window.addEventListener('beforeunload',event=>{if(!localSaved){event.preventDefault();event.returnValue='';}});
})();
