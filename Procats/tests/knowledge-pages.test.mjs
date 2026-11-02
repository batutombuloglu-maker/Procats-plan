import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/knowledge-core.js';
const C=globalThis.ProcatsKnowledgeCore;
const sample=()=>Array.from({length:2000},(_,i)=>C.make({id:i+1,question:'Kart '+i,answer:'Kısa cevap '+i,category:['Bilim'],tags:['örnek']},1000));
test('2,000 cards are covered exactly once in bounded pages without changing the archive',()=>{
 const cards=sample(),ids=[];C.check(cards);for(let i=0;i<56;i++){const page=C.paginate(cards,i);assert.ok(page.items.length<=36);ids.push(...page.items.map(c=>c.id));}assert.deepEqual(ids,cards.map(c=>c.id));assert.equal(cards.length,2000);
 assert.deepEqual({...C.paginate(cards,55),items:undefined},{items:undefined,page:55,pages:56,total:2000,start:1981,end:2000});
});
test('empty, filtered and shortened archives clamp old page selections safely',()=>{
 assert.equal(C.paginate([],99).page,0);assert.equal(C.paginate([],99).start,0);assert.equal(C.paginate([],99).end,0);
 assert.equal(C.paginate([1,2],-1).page,0);assert.equal(C.paginate([1,2],99).page,0);assert.equal(C.paginate([1,2],NaN).page,0);assert.throws(()=>C.paginate([],0,0));
 const cards=sample(),filtered=C.filter(cards,{query:'Kart 1999'});assert.equal(C.paginate(filtered,55).items[0].id,2000);assert.equal(C.paginate(cards.slice(0,1950),55).page,54);
});
