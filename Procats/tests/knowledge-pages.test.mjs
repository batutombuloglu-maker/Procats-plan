import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../public/knowledge-core.js';
import '../public/discovery-core.js';
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
class Node {
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.className='';this.textContent='';this.value='';this.disabled=false;this.style={};this.classList={contains:name=>this.className.split(' ').includes(name),toggle:(name,on)=>{const names=new Set(this.className.split(' ').filter(Boolean));if(on??!names.has(name))names.add(name);else names.delete(name);this.className=[...names].join(' ');},add:name=>this.classList.toggle(name,true)};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
 get lastChild(){return this.children.at(-1);}
 get childElementCount(){return this.children.length;}
 setAttribute(k,v){this.attributes[k]=String(v);}
 addEventListener(){}
 focus(){this.focused=true;}
 querySelector(selector){return all(this).find(n=>n.className.split(' ').includes(selector.slice(1)))||null;}
}
const all=node=>node.children.flatMap(child=>[child,...all(child)]);
test('actual archive UI keeps only 36 cards mounted; page jump, filtering and deletion stay correct',()=>{
 let cards=sample();const root=new Node('main'),nav=new Node('button'),ctx={currentLang:'tr',setInterval(){},ProcatsKnowledgeCore:C,ProcatsGeography:{country:()=>null,facts:()=>null,prose:c=>c.explanation},ProcatsDiscovery:globalThis.ProcatsDiscovery,ProcatsKnowledgeStore:{get:()=>structuredClone(cards),getState:()=>({status:'synced',invalid:false,conflict:false})},document:{addEventListener(){},getElementById:id=>id==='view-knowledge'?root:nav,createElement:tag=>new Node(tag),documentElement:new Node('html')},MutationObserver:class{observe(){}},addEventListener(){},switchView(){}};ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../public/knowledge.js',import.meta.url),'utf8'),ctx);
 const visible=()=>all(root).filter(n=>n.className.split(' ').includes('kh-archive-card'));
 const pageSelect=()=>all(root).find(n=>n.className==='kh-page-select');
 const search=()=>all(root).find(n=>n.className==='kh-search');
 assert.equal(visible().length,36);assert.equal(pageSelect().children.length,56);
 const jump=pageSelect();jump.value='55';jump.onchange();assert.equal(visible().length,20);assert.equal(visible()[0].querySelector('.kh-card-open').title,'Kart 1980');assert.equal(all(root).find(n=>n.textContent==='Sonraki ›').disabled,true);
 cards=cards.slice(0,1950);ctx.ProcatsKnowledgeUI.render();assert.equal(visible().length,6);assert.equal(pageSelect().value,'54');
 const input=search();input.value='Kart 1949';input.oninput();assert.equal(visible().length,1);assert.equal(pageSelect(),undefined);
 input.value='';input.oninput();assert.equal(visible().length,36);assert.equal(pageSelect().value,'0');
});
