// Merge independent edits while retaining both sides of unresolved conflicts.
(function(root){
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const clone=x=>JSON.parse(JSON.stringify(x)),activityKey='procats_activity_v1';
 const taskDate=t=>t.completed&&!t.missed&&!t.isExempt?(t.activityDate||t.completedDate||null):null;
 function totals(ledger){const result={...ledger.baseline};for(const entry of Object.values(ledger.entries))if(entry.date)result[entry.date]=(result[entry.date]||0)+1;return result;}
 // Older task validation accepted every positive finite number, not only safe
 // integers. Keep their canonical keys readable without rewriting task IDs.
 const activityId=id=>Number.isFinite(Number(id))&&Number(id)>0&&String(Number(id))===id;
 function validActivity(v){return object(v)&&v.version===1&&Object.keys(v).every(k=>['version','baseline','entries'].includes(k))&&object(v.baseline)&&object(v.entries)&&Object.entries(v.baseline).every(([k,n])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&Number.isSafeInteger(n)&&n>=0)&&Object.entries(v.entries).every(([id,x])=>activityId(id)&&object(x)&&Object.keys(x).length===1&&Object.hasOwn(x,'date')&&(x.date===null||typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)));}
 // Preserve unattributable legacy history in baseline and count each task ID
 // once. Deleted tasks keep their ledger entry, so history survives deletion.
 function activitySnapshot(input,seed){
  if(!object(input)||!Object.hasOwn(input,activityKey)&&!Object.hasOwn(input,'yks_v3_tasks')&&!Object.hasOwn(input,'yks_v6_activity'))return input;
  const doc=clone(input),legacy=!Object.hasOwn(doc,activityKey),tasks=doc.yks_v3_tasks||[];let ledger;
  if(!legacy)ledger=clone(doc[activityKey]);
  else if(seed)ledger=clone(seed);
  else{ledger={version:1,baseline:{...(doc.yks_v6_activity||{})},entries:{}};for(const task of tasks){const date=taskDate(task);if(date)ledger.baseline[date]=Math.max(0,(ledger.baseline[date]||0)-1);}}
  if(!validActivity(ledger))return input;
  for(const task of tasks){const date=taskDate(task),id=String(task.id);if(date||Object.hasOwn(ledger.entries,id))ledger.entries[id]={date};if(Object.hasOwn(task,'activityDate')||date)task.activityDate=date;}
  doc[activityKey]=ledger;doc.yks_v6_activity=totals(ledger);return doc;
 }
 function resetActivity(input,tasks){return activitySnapshot({...input,yks_v3_tasks:tasks.map(t=>({...t,activityDate:null,completedDate:null})),[activityKey]:{version:1,baseline:{},entries:{}}});}
 // Item order is a separate edit from an item's title/status. Compare only
 // retained base IDs, then anchor concurrent additions around their neighbors.
 function order(base,local,remote,available,path,conflicts){
  const allowed=new Set(available),b=base.filter(x=>allowed.has(x)),l=local.filter(x=>allowed.has(x)),r=remote.filter(x=>allowed.has(x));
  const ls=new Set(l),rs=new Set(r),shared=new Set(b.filter(x=>ls.has(x)&&rs.has(x)));
  const project=a=>a.filter(x=>shared.has(x)),bp=project(b),lp=project(l),rp=project(r),lc=!same(bp,lp),rc=!same(bp,rp);
  if(lc&&rc&&!same(lp,rp))conflicts.push(path+'.order');
  const preferred=lc?l:r,other=lc?r:l,baseSet=new Set(b),core=preferred.filter(x=>baseSet.has(x)),coreSet=new Set(core),before=new Map(),after=new Map();
  for(const id of b)if(!coreSet.has(id)){core.push(id);coreSet.add(id);}
  const assigned=new Set(),buckets=new Map();
  for(const source of [preferred,other]){let previous=null;
   const nexts=new Array(source.length);let following=null;for(let i=source.length-1;i>=0;i--){nexts[i]=following;if(coreSet.has(source[i]))following=source[i];}
   for(let i=0;i<source.length;i++){
    const id=source[i];if(coreSet.has(id)){previous=id;continue;}if(assigned.has(id))continue;assigned.add(id);
    const map=previous!==null?after:before,anchor=previous!==null?previous:nexts[i];if(!map.has(anchor))map.set(anchor,[]);const bucket=map.get(anchor);bucket.push(id);buckets.set(id,bucket);
   }
  }
  const edges=new Map(),indegree=new Map();for(const id of assigned){edges.set(id,new Set());indegree.set(id,0);}
  for(const source of [local,remote]){const last=new Map();for(const id of source){const bucket=buckets.get(id);if(!bucket)continue;const prior=last.get(bucket);if(prior!==undefined&&prior!==id&&!edges.get(prior).has(id)){edges.get(prior).add(id);indegree.set(id,indegree.get(id)+1);}last.set(bucket,id);}}
  for(const bucket of [...before.values(),...after.values()]){const result=[],ready=bucket.filter(id=>!indegree.get(id)).sort((a,b)=>a-b);while(ready.length){const id=ready.shift();result.push(id);for(const next of edges.get(id)){indegree.set(next,indegree.get(next)-1);if(!indegree.get(next)){ready.push(next);ready.sort((a,b)=>a-b);}}}if(result.length!==bucket.length){conflicts.push(path+'.order');for(const id of bucket)if(!result.includes(id))result.push(id);}bucket.splice(0,bucket.length,...result);}
  const result=[],seen=new Set(),push=id=>{if(allowed.has(id)&&!seen.has(id)){seen.add(id);result.push(id);}};
  for(const id of core){for(const extra of before.get(id)||[])push(extra);push(id);for(const extra of after.get(id)||[])push(extra);}
  for(const id of before.get(null)||[])push(id);
  for(const id of [...available].sort((a,b)=>a-b))push(id);
  return result;
 }
 function merge(base,local,remote,path,conflicts){
  if(same(local,remote)||same(base,remote))return local;
  if(same(base,local))return remote;
  if(path==='.procats_timer'||path==='.procats_sw'){conflicts.push(path);return local;}
  if(Array.isArray(local)&&Array.isArray(remote)&&(base===undefined||Array.isArray(base))&&[...(base||[]),...local,...remote].every(x=>object(x)&&Number.isSafeInteger(x.id))){
   base=base||[];
   const b=new Map(base.map(x=>[x.id,x])),l=new Map(local.map(x=>[x.id,x])),r=new Map(remote.map(x=>[x.id,x])),items=new Map();
   for(const id of new Set([...remote,...local].map(x=>x.id))){const value=merge(b.get(id),l.get(id),r.get(id),path+'.'+id,conflicts);if(value!==undefined)items.set(id,value);}
   if(path==='.yks_v3_tasks'){
    const groups=new Map();for(const item of items.values()){if(!groups.has(item.dayId))groups.set(item.dayId,[]);groups.get(item.dayId).push(item.id);}
    const groupOrders=new Map();for(const [day,ids]of groups){const idsFor=a=>a.filter(x=>x.dayId===day).map(x=>x.id);groupOrders.set(day,order(idsFor(base),idsFor(local),idsFor(remote),ids,path+'.day.'+day,conflicts));}
    const offsets=new Map();return order(base.map(x=>x.id),local.map(x=>x.id),remote.map(x=>x.id),[...items.keys()],path,[]).map(id=>{const day=items.get(id).dayId,index=offsets.get(day)||0;offsets.set(day,index+1);return items.get(groupOrders.get(day)[index]);});
   }
   return order(base.map(x=>x.id),local.map(x=>x.id),remote.map(x=>x.id),[...items.keys()],path,conflicts).map(id=>items.get(id));
  }
  if(object(local)&&object(remote)&&(base===undefined||object(base))){
   base=base||{};const result={};
   // Completion/cancellation and their dates form one logical state. Exemption
   // may merge independently, but can never leave a heatmap contribution.
   if(/^\.procats_knowledge_v1\.\d+$/.test(path)){
    const edited=v=>['question','answer','image'].some(k=>!same(v[k],base[k]));
    if(edited(local)&&!edited(remote)&&!same(remote.review,base.review)||edited(remote)&&!edited(local)&&!same(local.review,base.review))conflicts.push(path+'.review');
   }
   const task=/^\.yks_v3_tasks\.\d+$/.test(path),statusKeys=['completed','missed','completedDate','activityDate'];
   if(task){const state=v=>({completed:!!v.completed,missed:!!v.missed,completedDate:v.completedDate||v.activityDate||null});const b=state(base),l=state(local),r=state(remote);let chosen=l;if(same(l,b))chosen=r;else if(!same(r,b)&&!same(l,r))conflicts.push(path+'.status');Object.assign(result,chosen);}
   for(const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
    if(task&&statusKeys.includes(key))continue;
    const value=merge(base[key],local[key],remote[key],path+'.'+key,conflicts);if(value!==undefined)result[key]=value;
   }if(task)result.activityDate=result.completed&&!result.missed&&!result.isExempt?result.completedDate||null:null;return result;
  }
  conflicts.push(path);return local;
 }
 root.ProcatsActivity={key:activityKey,valid:validActivity,snapshot:activitySnapshot,reset:resetActivity,totals};
 root.ProcatsMerge={mergeDocuments(base,local,remote){const conflicts=[];
  const hasActivity=[base,local,remote].some(d=>object(d)&&(Object.hasOwn(d,activityKey)||Object.hasOwn(d,'yks_v3_tasks')||Object.hasOwn(d,'yks_v6_activity')));
  if(hasActivity){base=activitySnapshot(base);const seed=base[activityKey];local=activitySnapshot(local,seed);remote=activitySnapshot(remote,seed);base={...base,yks_v6_activity:{}};local={...local,yks_v6_activity:{}};remote={...remote,yks_v6_activity:{}};}
  let data=merge(base,local,remote,'',conflicts);if(hasActivity)data=activitySnapshot(data);return {data,conflicts};
 },same};
})(globalThis);
