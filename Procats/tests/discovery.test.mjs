import test from 'node:test';import assert from 'node:assert/strict';
import {cleanDiscovery as clean,discoveryQueue as queue,markDiscovered as mark} from '../public/discovery-core.js';
const pool=Array.from({length:53},(_,i)=>i+1);
test('a shuffle bag visits all 53 cards once across 20-card sessions before restarting',()=>{
 let state=clean(null,pool),visited=[];for(let round=0;round<3;round++){const draw=queue(pool,state,{random:()=>.4});assert.equal(draw.reset,false);for(const id of draw.ids){state=mark(state,id,pool);visited.push(id);}}
 assert.equal(visited.length,53);assert.equal(new Set(visited).size,53);const next=queue(pool,state,{random:()=>.99});assert.equal(next.reset,true);assert.notEqual(next.ids[0],state.last);state=mark(state,next.ids[0],pool,{reset:true});assert.deepEqual(state.seen,[next.ids[0]]);
});
test('quitting a round only consumes displayed cards, not the whole queued batch',()=>{let state=clean(null,pool);const first=queue(pool,state);state=mark(state,first.ids[0],pool);const next=queue(pool,state);assert.ok(!next.ids.includes(first.ids[0]));assert.equal(state.seen.length,1);});
test('filtered cycles retain other-topic history, new cards enter and deleted IDs are pruned',()=>{
 let state=mark(mark(clean(null,pool),1,pool),2,pool);const draw=queue([1],state);assert.equal(draw.reset,true);state=mark(state,1,pool,{reset:true,resetPool:[1]});assert.ok(state.seen.includes(2));assert.ok(queue([1,2,54],state).ids.includes(54));assert.deepEqual(clean(state,[2]).seen,[2]);
});
test('one-card and empty archives are bounded, malformed local history cannot produce unknown IDs',()=>{assert.deepEqual(queue([],null).ids,[]);assert.deepEqual(queue([1,1],{seen:[1],last:1}).ids,[1]);assert.deepEqual(clean({seen:[1,1,-1,999,'2',{}],last:'bad'},[1,2]),{version:1,seen:[1],last:null});assert.equal(queue([1,2],null,{random:()=>NaN}).ids.length,2);});
