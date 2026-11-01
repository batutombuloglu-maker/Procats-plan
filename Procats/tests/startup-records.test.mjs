import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const render=app.slice(app.indexOf('function renderBookmarks()'),app.indexOf('function handleBmMenu('));
const initialize=app.slice(app.indexOf('window.procatsInitialize = () =>'));
function setup(bookmarks){
 const cards=[],saved=[],opened=[];
 const grid={set innerHTML(v){cards.length=0;},appendChild(card){cards.push(card);}};
 const context=vm.createContext({bookmarks:structuredClone(bookmarks),draggedBmIndex:null,
  document:{getElementById:id=>id==='bookmarksGrid'?grid:null,createElement:()=>({dataset:{},classList:{add(){},remove(){}},handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}})},
  escapeHtml:v=>String(v).replaceAll('<','&lt;'),normalizeBookmarkUrl:url=>url,
  setTimeout:fn=>fn(),appStorage:{setItem(key,value){saved.push({key,value:JSON.parse(value)});return true;}},
  t:key=>key,showCustomAlert(){throw Error('Unexpected alert');},
  loadTheme(){},setLang(){},currentLang:'tr',renderHeatmap(){},renderNotes(){},renderApp(){},renderObsidian(){},readStoredJSON:()=>null,
 });context.window=context;context.open=(...args)=>opened.push(args);vm.runInContext(render,context);vm.runInContext(initialize,context);
 return {context,cards,saved,opened};
}
const bookmarks=[{id:10,title:'Ders sitesi',url:'https://example.com/study'},{id:20,title:'Notlar',url:'https://example.com/notes'}];
test('startup completes with stored bookmarks without mutating the account records',()=>{
 const s=setup(bookmarks);assert.doesNotThrow(()=>s.context.procatsInitialize());
 assert.equal(s.cards.length,2);assert.ok(s.cards[0].innerHTML.includes('Ders sitesi'));
 assert.deepEqual(JSON.parse(JSON.stringify(s.context.bookmarks)),bookmarks);assert.equal(s.saved.length,0);
});
test('stored bookmarks still open and reorder independently of task gestures',()=>{
 const s=setup(bookmarks);s.context.procatsInitialize();
 s.cards[0].onclick({target:{closest:()=>null}});assert.deepEqual(s.opened,[['https://example.com/study','_blank','noopener,noreferrer']]);
 const transfer=new Map(),event={target:{closest:()=>null},preventDefault(){},dataTransfer:{setData:(k,v)=>transfer.set(k,v),getData:k=>transfer.get(k)}};
 s.cards[0].handlers.dragstart(event);s.cards[1].handlers.drop(event);
 assert.deepEqual(JSON.parse(JSON.stringify(s.context.bookmarks)).map(b=>b.id),[20,10]);assert.equal(s.saved[0].key,'yks_v7_bookmarks');assert.equal(s.cards.length,2);
});
