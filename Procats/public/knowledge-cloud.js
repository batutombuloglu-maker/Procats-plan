import './knowledge-core.js';
export const knowledgeDocuments=['knowledge','knowledge_0','knowledge_1','knowledge_2','knowledge_3'];
export function createKnowledgeCloud({sdk,db,auth,user,cached}){
 const C=globalThis.ProcatsKnowledgeCore,refs=knowledgeDocuments.map(id=>sdk.doc(db,'users',user.uid,'state',id));let latest=null,observedRevision=null,active=true,unsubscribe=null,subscribed=false,changed=()=>{},onError=()=>{},seen=cached?.revision??0;
 const check=()=>{if(!active||auth.currentUser?.uid!==user.uid||!auth.currentUser.emailVerified)throw Object.assign(Error('Account changed'),{code:'account-changed'});};
 const invalid=()=>Object.assign(Error('Invalid knowledge archive'),{code:'invalid-data'});
 function decode(docs){
  if(!docs[0].exists()){if(docs.slice(1).some(d=>d.exists()))throw invalid();return {data:{[C.key]:[]},revision:0};}
  const root=docs[0].data();let manifest;try{manifest=JSON.parse(root.payload);}catch{throw invalid();}
  if(manifest.version!==1||manifest.shards!==4||!Number.isSafeInteger(root.revision)||root.revision<1)throw invalid();
  const cards=[];
  for(const doc of docs.slice(1)){if(!doc.exists())throw invalid();const v=doc.data();let part;try{part=JSON.parse(v.payload);}catch{throw invalid();}if(v.revision!==root.revision||!C.snapshot(part))throw invalid();cards.push(...(part[C.key]||[]));}
  try{C.check(cards);}catch{throw invalid();}return {data:{[C.key]:cards},revision:root.revision};
 }
 function watch(){if(unsubscribe||!subscribed||!active)return;unsubscribe=sdk.onSnapshot(refs[0],{includeMetadataChanges:true},d=>{if(d.metadata.hasPendingWrites||d.metadata.fromCache)return;try{check();const rev=d.exists()?d.data().revision:0;if(!Number.isSafeInteger(rev)||rev<0)throw invalid();if(d.exists()){const manifest=JSON.parse(d.data().payload);if(manifest.version!==1||manifest.shards!==4)throw invalid();}observedRevision=rev;if(rev>seen){seen=rev;changed();}}catch(e){observedRevision=null;onError(e);}},e=>{observedRevision=null;unsubscribe=null;onError(e);});}
 return {
  async request(method,payload){check();
   if(method==='GET'){if(unsubscribe&&latest&&observedRevision===latest.revision)return structuredClone(latest);const result=await sdk.runTransaction(db,async tx=>{check();const docs=await Promise.all(refs.map(r=>tx.get(r)));check();return decode(docs);});seen=Math.max(seen,result.revision);latest=structuredClone(result);watch();return result;}
   if(method!=='PUT'||!C.snapshot(payload?.data)||!Number.isSafeInteger(payload.revision)||payload.revision<0)throw invalid();
   const shards=C.pack(payload.data[C.key]||[]);
   return sdk.runTransaction(db,async tx=>{check();const docs=await Promise.all(refs.map(r=>tx.get(r)));check();const remote=decode(docs);if(remote.revision!==payload.revision)return {conflict:true,...remote};const revision=remote.revision+1;
    for(let i=0;i<refs.length;i++)tx.set(refs[i],{payload:JSON.stringify(i===0?{version:1,shards:4}:shards[i-1]),revision,updatedAt:sdk.serverTimestamp()});return {revision};}).then(result=>{if(!result.conflict)latest={data:structuredClone(payload.data),revision:result.revision};return result;});
  },
  subscribe(listener,errorListener){changed=listener;onError=errorListener||(()=>{});subscribed=true;watch();},
  stop(){active=false;unsubscribe?.();unsubscribe=null;}
 };
}
