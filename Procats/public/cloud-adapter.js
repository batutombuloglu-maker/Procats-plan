// Authentication is enforced again by Firestore rules for every read and write.
import {validateSnapshot} from './validation.js';
export function createCloudAdapter({sdk,db,auth,user,onError,cached,documentId='main',validate=validateSnapshot}){
 const reference=sdk.doc(db,'users',user.uid,'state',documentId);
 let streamFailed=false;
 let latest=cached?{data:structuredClone(cached.base),revision:cached.revision}:{data:{},revision:0},unsubscribe=null,changed=()=>{},active=true;
 function check(){if(!active||auth.currentUser?.uid!==user.uid||!auth.currentUser.emailVerified)throw Object.assign(new Error('Account changed'),{code:'account-changed'});}
 function decode(snapshot){
  if(!snapshot.exists())return {data:{},revision:0};
  const value=snapshot.data();let data;try{data=JSON.parse(value.payload);}catch{throw Object.assign(new Error('Invalid stored data'),{code:'invalid-data'});}
  if(!Number.isSafeInteger(value.revision)||value.revision<1||!validate(data))throw Object.assign(new Error('Invalid stored data'),{code:'invalid-data'});
  return {data,revision:value.revision};
 }
 async function refresh(){check();const next=decode(await sdk.getDocFromServer(reference));check();if(next.revision>=latest.revision)latest=next;return structuredClone(latest);}
 async function read(){check();return cached?structuredClone(latest):refresh();}
 return {
  read,
  async recovery(){check();const snapshot=await sdk.getDocFromServer(reference);check();return {format:"procats-raw-recovery",version:1,exportDate:new Date().toISOString(),document:snapshot.exists()?snapshot.data():null};},
  async request(method,payload){
   check();if(method==='GET'){const result=await refresh();if(streamFailed){streamFailed=false;this.subscribe(changed);}return result;}
   if(method!=='PUT'||!payload||!validate(payload.data)||!Number.isSafeInteger(payload.revision)||payload.revision<0)throw Object.assign(new Error('Invalid data'),{code:'invalid-data'});
   const encoded=JSON.stringify(payload.data);
   if(new TextEncoder().encode(encoded).length>850000)throw Object.assign(new Error('Document too large'),{code:'invalid-data'});
   return sdk.runTransaction(db,async transaction=>{
    check();const remote=decode(await transaction.get(reference));check();
    if(remote.revision!==payload.revision){latest=remote;return {conflict:true,...remote};}
    const revision=remote.revision+1;
    transaction.set(reference,{payload:encoded,revision,updatedAt:sdk.serverTimestamp()});
    return {revision};
   }).then(result=>{
    if(!result.conflict&&result.revision>=latest.revision)latest={data:structuredClone(payload.data),revision:result.revision};
    return result;
   });
  },
  subscribe(listener,errorListener){
   changed=listener;if(unsubscribe)return;
   unsubscribe=sdk.onSnapshot(reference,{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.hasPendingWrites||snapshot.metadata.fromCache)return;
    try{check();const next=decode(snapshot);if(next.revision>latest.revision){latest=next;changed();}}
    catch(error){(errorListener||onError)?.(error);}
   },error=>{streamFailed=true;unsubscribe=null;(errorListener||onError)?.(error);});
  },
  stop(){active=false;unsubscribe?.();unsubscribe=null;}
 };
}

