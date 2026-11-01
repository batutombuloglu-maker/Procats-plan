import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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
class Node {
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.className='';this.textContent='';this.value='';this.dataset={};this.style={};this.classList={contains:name=>this.className.split(' ').includes(name),toggle:(name,on)=>{const names=new Set(this.className.split(' ').filter(Boolean));if(on??!names.has(name))names.add(name);else names.delete(name);this.className=[...names].join(' ');},add:name=>this.classList.toggle(name,true)};}
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=[...nodes];}get lastChild(){return this.children.at(-1);}get childElementCount(){return this.children.length;}setAttribute(k,v){this.attributes[k]=String(v);}addEventListener(){}focus(){}
 querySelector(selector){return all(this).find(n=>selector==='[data-grade]'?n.dataset.grade:n.className.split(' ').includes(selector.slice(1)))||null;}
}
const all=node=>node.children.flatMap(child=>[child,...all(child)]);
function ui(initial){
 let cards=structuredClone(initial),writes=0;const root=new Node('main'),nav=new Node('button'),ctx={currentLang:'tr',setInterval(){},ProcatsKnowledgeCore:C,document:{hidden:false,addEventListener(){},getElementById:id=>id==='view-knowledge'?root:nav,createElement:tag=>new Node(tag),documentElement:new Node('html')},MutationObserver:class{observe(){}},addEventListener(){},switchView(){},showCustomAlert(message){throw Error(message);}};
 ctx.ProcatsKnowledgeStore={get:()=>structuredClone(cards),commit(next){cards=structuredClone(next);writes++;ctx.ProcatsKnowledgeUI.render();},getState:()=>({status:'synced',invalid:false,conflict:false})};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../public/knowledge.js',import.meta.url),'utf8'),ctx);
 return {root,get:()=>cards,writes:()=>writes,find:fn=>all(root).find(fn),click(text){const b=all(root).find(n=>n.tagName==='button'&&n.textContent===text);assert.ok(b,'Button '+text);b.onclick();},grade(grade){const b=all(root).find(n=>n.dataset.grade===grade);assert.ok(b);b.onclick();}};
}
test('random discovery filters are independent and all grades leave persistent dates untouched',()=>{
 const cards=[make(1,'series'),make(2,'book')],u=ui(cards);u.click('Rastgele keşfet');const type=u.find(n=>n.tagName==='select'&&n.attributes['aria-label']==='İçerik türü');type.value='series';type.onchange();u.click('Keşfe başla · 1');
 u.click('Cevabı göster');u.grade('again');u.click('Cevabı göster');u.grade('hard');u.click('Bir tur daha');u.click('Cevabı göster');u.grade('knew');assert.equal(u.writes(),0);assert.deepEqual(u.get(),cards);
 u.click('Hazinem');assert.equal(all(u.root).filter(n=>n.className.includes('kh-archive-card')).length,2);u.click('Rastgele keşfet');assert.ok(u.find(n=>n.textContent==='Keşfe başla · 1'));
});
test('answering the review inbox persists once and removes the answered card from the due list',()=>{
 const u=ui([make(1),make(2)]);u.click('Tekrar et · 2');assert.equal(all(u.root).filter(n=>n.className==='kh-due-row').length,2);u.click('Yanıtla');u.click('Cevabı göster');u.grade('hard');assert.equal(u.writes(),1);assert.equal(u.get()[0].review.interval,1);assert.equal(u.get()[0].review.dueAt,C.calendarDue(Date.now(),1));u.click('Tekrar kutusuna dön');assert.equal(all(u.root).filter(n=>n.className==='kh-due-row').length,1);assert.ok(u.find(n=>n.className==='kh-upcoming'));
 u.click('Sırayla yanıtla · 1');u.click('Cevabı göster');u.grade('knew');u.click('Tekrar kutusuna dön');assert.equal(all(u.root).filter(n=>n.className==='kh-due-row').length,0);assert.equal(u.writes(),2);
});
