import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/firestore';
import {readFile} from 'node:fs/promises';
import {createKnowledgeCloud,knowledgeDocuments as ids} from '../public/knowledge-cloud.js';
import {createKnowledgeStore} from '../public/knowledge-store.js';
import '../public/sync-merge.js';
const env=await initializeTestEnvironment({projectId:'demo-procats',firestore:{rules:await readFile('firestore.rules','utf8')}}),claims={email_verified:true,auth_time:Math.floor(Date.now()/1000)},C=ProcatsKnowledgeCore;
let checks=0;const pass=async p=>{await assertSucceeds(p);checks++;},fail=async p=>{await assertFails(p);checks++;};
const ref=(db,id,uid='knowledge-owner')=>sdk.doc(db,'users',uid,'state',id),wrap=(payload,revision)=>({payload:JSON.stringify(payload),revision,updatedAt:sdk.serverTimestamp()});
function batch(db,revision,{uid='knowledge-owner',omit='',bad='',extra=false}={}){const b=sdk.writeBatch(db);for(const id of ids)if(id!==omit)b.set(ref(db,id,uid),{...wrap(id==='knowledge'?{version:1,shards:4}:{[C.key]:[]},id===bad?revision+1:revision),...(extra?{extra:true}:{})});return b.commit();}
try{
 const db=env.authenticatedContext('knowledge-owner',claims).firestore(),other=env.authenticatedContext('other',claims).firestore(),guest=env.unauthenticatedContext().firestore(),unverified=env.authenticatedContext('knowledge-owner',{...claims,email_verified:false}).firestore();
 await fail(batch(guest,1));await fail(batch(other,1));await fail(batch(unverified,1));await fail(batch(db,1,{omit:'knowledge_3'}));await fail(batch(db,1,{bad:'knowledge_1'}));await fail(batch(db,1,{extra:true}));await pass(batch(db,1));await pass(sdk.getDoc(ref(db,'knowledge_2')));await fail(sdk.getDoc(ref(other,'knowledge')));await fail(sdk.getDoc(ref(unverified,'knowledge_3')));await fail(sdk.getDocs(sdk.collection(db,'users/knowledge-owner/state')));
 await fail(sdk.setDoc(ref(db,'knowledge'),wrap({version:1,shards:4},2)));await fail(sdk.setDoc(ref(db,'knowledge_0'),{...wrap({[C.key]:[]},2),payload:'x'.repeat(850001)}));await pass(batch(db,2));await fail(batch(db,2));await fail(sdk.deleteDoc(ref(db,'knowledge')));await fail(sdk.setDoc(ref(db,'knowledge_4'),wrap({},1)));
 const marker=sdk.doc(db,'users','knowledge-owner','account','deletion');const oldDelete=sdk.writeBatch(db);oldDelete.delete(ref(db,'main'));oldDelete.delete(ref(db,'lists'));oldDelete.set(marker,{requestedAt:sdk.serverTimestamp()});await fail(oldDelete.commit());
 const remove=sdk.writeBatch(db);for(const id of [...ids,'main','lists'])remove.delete(ref(db,id));remove.set(marker,{requestedAt:sdk.serverTimestamp()});await pass(remove.commit());await fail(sdk.getDoc(ref(db,'knowledge')));await fail(batch(db,1));
 const user={uid:'knowledge-sync',emailVerified:true};function device(){const db=env.authenticatedContext(user.uid,claims).firestore(),local=new Map(),cloud=createKnowledgeCloud({sdk,db,auth:{currentUser:user},user}),store=createKnowledgeStore({storage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v)},flush:async()=>{},merge:ProcatsMerge.mergeDocuments,cloudFactory:()=>cloud});return {cloud,store,db};}
 const a=device(),b=device(),image='data:image/jpeg;base64,/9j/'+'A'.repeat(44000),cards=Array.from({length:29},(_,i)=>C.make({id:i+1,question:'Soru '+i,answer:'Cevap '+i,image},1000));a.store.commit(cards);await a.store.sync();assert.equal(a.store.getState().status,'synced');await b.store.sync();assert.deepEqual(b.store.get(),cards);checks++;
 const stale=await b.cloud.request('GET');a.store.commit(C.update(a.store.get(),{type:'rate',id:1,grade:'knew',now:2000}));b.store.commit(C.update(b.store.get(),{type:'save',card:{...cards[1],answer:'Yeni cevap'},now:2000}));await a.store.sync();const collision=await b.cloud.request('PUT',{data:stale.data,revision:stale.revision});assert.equal(collision.conflict,true);checks++;
 await b.store.sync();await a.store.sync();assert.equal(a.store.get()[0].review.grade,'knew');assert.equal(a.store.get()[1].answer,'Yeni cevap');assert.equal(a.store.getState().conflict,false);checks++;
 const main=ref(a.db,'main',user.uid);await pass(sdk.setDoc(main,wrap({yks_v3_days:[],yks_v3_tasks:[]},1)));assert.equal((await sdk.getDoc(main)).data().revision,1);await a.store.stop();await b.store.stop();
 console.log('PASS: '+checks+' knowledge authorization, atomic shard, stale revision, cross-device and deletion checks.');
}finally{await env.cleanup();}
