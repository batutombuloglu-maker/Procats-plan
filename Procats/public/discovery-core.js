/* A local shuffle bag. Discovery never writes review progress. */
const validID=id=>Number.isSafeInteger(id)&&id>0;
export function cleanDiscovery(value,pool){
 const ids=new Set(pool.filter(validID));
 return {version:1,seen:[...new Set(Array.isArray(value?.seen)?value.seen:[])].filter(id=>ids.has(id)),last:validID(value?.last)?value.last:null};
}
export function discoveryQueue(pool,state,{limit=20,random=Math.random}={}){
 const ids=[...new Set(pool.filter(validID))],seen=new Set(state?.seen||[]);
 let remaining=ids.filter(id=>!seen.has(id)),reset=false;
 if(!remaining.length){remaining=[...ids];reset=ids.length>0;}
 for(let i=remaining.length-1;i>0;i--){const r=random(),j=Math.floor((Number.isFinite(r)?Math.max(0,Math.min(.999999999,r)):0)*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}
 if(reset&&remaining.length>1&&remaining[0]===state?.last)[remaining[0],remaining[1]]=[remaining[1],remaining[0]];
 return {ids:remaining.slice(0,Math.max(1,Math.min(2000,Math.floor(limit)||20))),reset};
}
export function markDiscovered(state,id,pool,{reset=false,resetPool=pool}={}){
 const next=cleanDiscovery(state,pool);if(!pool.includes(id))return next;
 // Reset only the completed filtered pool, retaining history for other topics.
 if(reset){const inPool=new Set(resetPool);next.seen=next.seen.filter(x=>!inPool.has(x));}
 if(!next.seen.includes(id))next.seen.push(id);next.last=id;return next;
}
globalThis.ProcatsDiscovery={clean:cleanDiscovery,queue:discoveryQueue,mark:markDiscovered};
