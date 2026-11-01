import test from 'node:test';import assert from 'node:assert/strict';
import {planAddition} from '../public/data-add-core.js';
const C=globalThis.ProcatsKnowledgeCore,key=C.key,clone=structuredClone;
const previous=C.make({id:1,kind:'visual',question:'Kamerun ülkesinin başkenti neresidir?',answer:'Yaounde',category:['Coğrafya','Afrika'],tags:['Başkentler','Kamerun'],image:'data:image/jpeg;base64,/9j/AAAA'},1000);
const replacement={...clone(previous),image:'',explanation:'Nüfus: 30 milyon (örnek test).',tags:[...previous.tags,'@map/world-2026/CM']};
const pack=()=>({format:'procats-knowledge-refresh',version:1,title:'Maps',items:[{previous:clone(previous),card:clone(replacement)}]});
test('refresh matches content after ID reassignment and preserves every review/link field and other sections',()=>{
 const prior={...C.rate(previous,'hard',1800000000000),id:91,related:[92]},personal=C.make({id:92,question:'My private card',answer:'Untouched'},1000),current={[key]:[prior,personal],yks_v5_notes:[{id:1,text:'Existing note'}]},before=clone(current),p=planAddition(current,pack(),{now:1800000100000});
 assert.equal(p.totalChanged,1);assert.equal(p.totalAdded,0);assert.deepEqual(Object.keys(p.updates),[key]);const next=p.updates[key];assert.equal(next[0].id,91);assert.equal(next[0].createdAt,prior.createdAt);assert.deepEqual(next[0].related,[92]);assert.deepEqual(next[0].review,prior.review);assert.deepEqual(next[1],personal);assert.deepEqual(current,before);C.check(next);
});
test('refresh is idempotent after grades and protects customized explanations, tags, images and titles',()=>{
 const p=planAddition({[key]:[previous]},pack(),{now:4000});const graded=p.updates[key].map(c=>C.rate(c,'knew',1800000100000));assert.equal(planAddition({[key]:graded},pack()).totalChanged,0);
 for(const change of [{explanation:'My own notes'},{question:'My question'},{image:'data:image/jpeg;base64,/9j/BBBB'},{tags:['Kamerun','My tag']}]){const c={...clone(previous),...change},current={[key]:[c]},p=planAddition(current,pack());assert.equal(p.protected,1);assert.equal(p.totalChanged,0);assert.equal(p.totalAdded,0);assert.deepEqual(p.updates,{});}
 const edited={...graded[0],explanation:'My edited new card'};assert.equal(planAddition({[key]:[edited]},pack()).protected,1);
});
test('a missing country is appended once, missing IDs are allocated and preview changes are detectable',()=>{const current={[key]:[]},file=pack(),p=planAddition(current,file,{now:9000});assert.equal(p.totalAdded,1);assert.equal(p.updates[key][0].id,9000);assert.notEqual(p.signature,planAddition({[key]:p.updates[key]},file).signature);assert.equal(planAddition({[key]:p.updates[key]},file).totalAdded,0);});
test('refresh rejects unknown envelope fields, duplicate countries, executable images and oversized results before mutation',()=>{
 const current={[key]:[previous]},before=clone(current);const bad=[{...pack(),other:1},{...pack(),version:2}];const duplicate=pack();duplicate.items.push(clone(duplicate.items[0]));bad.push(duplicate);const unsafe=pack();unsafe.items[0].card.image='data:image/svg+xml,<svg onload="x"/>';bad.push(unsafe);
 for(const file of bad)assert.throws(()=>planAddition(current,file));assert.deepEqual(current,before);
});
test('stable map references keep the existing schema, remain hidden from visible tags and distinguish map records',()=>{
 C.check([replacement]);assert.equal(C.mapOf(replacement),'CM');assert.deepEqual(C.visibleTags(replacement),['Başkentler','Kamerun']);for(const tag of ['@map/world-2026/../../','@map/world-2026/cm','@map/world-2026/<svg>'])assert.equal(C.mapOf({...replacement,tags:[tag]}),null);
 const current={[key]:[{...clone(replacement),tags:['@map/world-2026/FR']}]},file={format:'procats-data-pack',version:1,data:{[key]:[replacement]}};assert.equal(planAddition(current,file,{now:9000}).totalAdded,1);
});
