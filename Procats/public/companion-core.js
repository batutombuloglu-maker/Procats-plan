// Device actions use explicit states, never toggles. All writes still pass through
// the existing workspace journal, quota checks and activity reconciliation.
export const status = t => t.completed ? 1 : t.missed ? 2 : 0;
export function identity(t) {
  const text=JSON.stringify([t.id,t.dayId,t.title,t.desc,!!t.isExempt]);
  let a=2166136261,b=5381;
  for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i);}
  return (a>>>0).toString(16)+'-'+(b>>>0).toString(16);
}
export function todaySnapshot(data,date,colors={}) {
  const ids=new Set((data.yks_v3_days||[]).filter(d=>d.date===date).map(d=>d.id));
  const all=(data.yks_v3_tasks||[]).filter(t=>ids.has(t.dayId));
  // Cap the device payload; the full plan always remains available in Procats.
  const chosen=all.filter(t=>status(t)===0).concat(all.filter(t=>status(t)!==0)).slice(0,100);
  const chosenIDs=new Set(chosen.map(t=>t.id));
  const result={schema:1,date,total:all.length,done:all.filter(t=>t.completed).length,missed:all.filter(t=>!t.completed&&t.missed).length,
    truncated:all.length>chosen.length,colors,
    tasks:all.filter(t=>chosenIDs.has(t.id)).map(t=>({id:String(t.id),title:String(t.title||'').slice(0,180),desc:String(t.desc||'').slice(0,240),
      identity:identity(t),status:status(t),completedDate:t.completedDate||null,activityDate:t.activityDate||null}))};
  while(new TextEncoder().encode(JSON.stringify(result)).length>60000&&result.tasks.length){const complete=result.tasks.findLastIndex(t=>t.status!==0);result.tasks.splice(complete<0?result.tasks.length-1:complete,1);result.truncated=true;}
  return result;
}
export function applyOperations(data,ops,scope,receipts={}) {
  const tasks=(data.yks_v3_tasks||[]).map(t=>({...t})),results=[];
  const dates=new Map((data.yks_v3_days||[]).map(d=>[d.id,d.date]));
  const seen={...receipts};
  for(const op of ops.slice(0,200)) {
    if(typeof op?.id!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(op.id))continue;
    if(seen[op.id]){results.push({id:op.id,result:seen[op.id]});continue;}
    let result='changed';const t=tasks.find(t=>String(t.id)===op.task);
    if(op.scope!==scope)result='account';
    else if(!t||dates.get(t.dayId)!==op.date||identity(t)!==op.identity)result='changed';
    else if(![0,1,2].includes(op.after)||![0,1,2].includes(op.before))result='invalid';
    else if(status(t)===op.after)result='applied';
    else if(status(t)!==op.before)result='changed';
    else {
      t.completed=op.after===1;t.missed=op.after===2;
      t.completedDate=op.after===1?op.date:null;
      t.activityDate=op.after===1&&!t.isExempt?op.date:null;
      result='applied';
    }
    seen[op.id]=result;results.push({id:op.id,result});
  }
  return {tasks,results,receipts:Object.fromEntries(Object.entries(seen).slice(-600))};
}
