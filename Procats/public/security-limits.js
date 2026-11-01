// Applied to imports before mutation; existing records remain readable/exportable.
export const limits = Object.freeze({cloudBytes:850000,fileBytes:12*1024*1024,textLength:850000,records:50000});
export function checkStructure(value) {
 let nodes=0;
 function visit(v,depth=0){
  if(++nodes>100000||depth>32)throw Error('backup-size');
  if(typeof v==='string'&&v.length>limits.textLength)throw Error('backup-size');
  if(Array.isArray(v)&&v.length>limits.records)throw Error('backup-size');
  if(v&&typeof v==='object')for(const [k,x]of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(k))throw Error('backup-invalid');visit(x,depth+1);}
 }
 visit(value);
}
export function checkSnapshot(value){checkStructure(value);if(new TextEncoder().encode(JSON.stringify(value)).length>limits.cloudBytes)throw Error('backup-size');}
export function checkChange(snapshot,next){
 const bytes=v=>new TextEncoder().encode(JSON.stringify(v)).length;
 // Let existing oversized documents shrink so the user can recover them.
 if(bytes(next)>limits.cloudBytes&&bytes(next)>=bytes(snapshot))throw Error('backup-size');
 checkStructure(next);
}
export function checkReplacement(snapshot,key,value){checkChange(snapshot,{...snapshot,[key]:value});}
if(typeof window!=='undefined')window.ProcatsLimits={...limits,checkStructure,checkSnapshot,checkReplacement,checkChange};
