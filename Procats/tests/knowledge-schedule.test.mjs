import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/knowledge-core.js';
const C=globalThis.ProcatsKnowledgeCore;
const now=new Date(2026,10,1,21,30).getTime();
const make=(id=1,type='fact',extra={})=>C.make(C.withType({id,question:'Question '+id,answer:'Answer '+id,category:[],tags:[],...extra},type),now-1000);

test('scheduled answers advance exactly 1, 3, 7, 30, 30 days at local day boundaries',()=>{
 let c=make(),at=now;
 for(const days of [1,3,7,30,30,30]){c=C.rate(c,'knew',at);assert.equal(c.review.interval,days);assert.equal(c.review.dueAt,C.calendarDue(at,days));assert.equal(new Date(c.review.dueAt).getHours(),0);assert.deepEqual(C.queue([c],{now:c.review.dueAt-1}),[]);assert.deepEqual(C.queue([c],{now:c.review.dueAt}),[1]);at=c.review.dueAt+43200000;}
});
test('hard and forgot always restart tomorrow, even after the monthly stage',()=>{
 for(const grade of ['hard','again']){let c=make();c.review={...c.review,grade:'knew',at:now-100000,interval:30,dueAt:now,count:8};c=C.rate(c,grade,now);assert.equal(c.review.interval,1);assert.equal(c.review.dueAt,C.calendarDue(now,1));c=C.rate(c,'knew',c.review.dueAt+1000);assert.equal(c.review.interval,1);c=C.rate(c,'knew',c.review.dueAt+1000);assert.equal(c.review.interval,3);}
});
test('legacy dates are interpreted without mutating records; edited answers are immediately due',()=>{
 for(const [grade,interval,expected]of [['again',0,0],['hard',200,1],['knew',6,7],['knew',365,30]]){const c=make();c.review={dueAt:interval?now+9999999999:0,interval,count:1,lapses:0,at:now,grade};const original=JSON.stringify(c),schedule=C.schedule(c);assert.equal(schedule.interval,expected);assert.equal(schedule.dueAt,expected?C.calendarDue(now,expected):0);assert.equal(JSON.stringify(c),original);assert.equal(C.valid([c]),true);}
 const forgotten=make();forgotten.review={...forgotten.review,dueAt:now+120000,interval:0,at:now,grade:'again'};const original=JSON.stringify(forgotten);assert.equal(C.schedule(forgotten).dueAt,C.calendarDue(now,1));assert.equal(JSON.stringify(forgotten),original);
 let c=C.rate(make(),'knew',now);c=C.make({...c,answer:'Changed answer'},now+1,c);assert.equal(C.schedule(c).dueAt,0);
});
test('content types and multiple subjects retain the existing backup schema',()=>{
 const newton=make(1,'scientist',{question:'Who was Newton?',tags:['Fizik','Matematik']}),film=make(2,'film'),poem=make(3,'poem');C.check([newton,film,poem]);
 assert.equal(newton.kind,'fact');assert.equal(poem.kind,'quote');assert.equal(C.typeOf(poem),'poem');
 for(const type of ['scientist','physics','math'])assert.deepEqual(C.filter([newton,film,poem],{kind:type}).map(c=>c.id),[1]);
 assert.deepEqual(C.filter([newton],{kind:'scientist',category:'Fizik'}).map(c=>c.id),[1]);assert.equal(C.filter([newton],{kind:'chemistry'}).length,0);
 assert.deepEqual(C.filter([film,poem],{kind:'film'}).map(c=>c.id),[2]);assert.deepEqual(C.filter([film,poem],{kind:'poem'}).map(c=>c.id),[3]);
 for(const type of C.contentTypes)assert.equal(C.valid([make(100,type.id)]),true);
 assert.throws(()=>C.withType({category:['a','b','c','d','e']},'film'),/depth/);
});
