import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import '../public/resources-core.js';import '../public/theme-colors.js';
import {validateSnapshot} from '../public/validation.js';
const R=globalThis.ProcatsResourcesCore,C=globalThis.ProcatsThemeColors;
test('shared playlists retain list identity, strip trackers and deduplicate watch links',()=>{
 const list='PL590L5WQmH8fJ54F369BLDSqIwcs-TCfs',expected='https://www.youtube.com/playlist?list='+list;
 assert.equal(R.canonical('https://www.youtube.com/watch?v=A0I6pNSM14o&list='+list+'&si=track'),expected);
 assert.equal(R.shared('Kamp: '+expected+'\n', 'Matematik').title,'Matematik');
 assert.equal(R.shared('https://youtu.be/A0I6pNSM14o?si=track').url,'https://www.youtube.com/watch?v=A0I6pNSM14o');
 assert.equal(R.youtube('https://www.youtube.com/shorts/A0I6pNSM14o').id,'A0I6pNSM14o');
});

test('resource previews remain backward compatible with the cloud and existing bookmarks',()=>{
 const data={yks_v7_bookmarks:[{id:1,title:'Existing',url:'https://example.com/'},{id:2,title:'Course',url:'https://www.youtube.com/watch?v=A0I6pNSM14o',resource:{url:'https://www.youtube.com/watch?v=A0I6pNSM14o',thumbnail:'https://i.ytimg.com/vi/A0I6pNSM14o/hqdefault.jpg',author:'Teacher'}}]};
 assert.equal(validateSnapshot(data),true);
});

test('custom theme survives reload; failed storage preserves it when switching back to a built-in theme',async()=>{
 const slot={name:'My image',image:'data:image/webp;base64,AA==',color:[40,100,170],tone:'auto',dim:56,blur:0,x:50,y:50};
 let stored={slots:[slot,null],active:0},fail=false,alerts=0,selected;
 const styles=new Map(),root={dataset:{},style:{setProperty:(k,v)=>styles.set(k,v),removeProperty:k=>styles.delete(k)},removeAttribute(){}};
 const context={ProcatsFeatureUI:{},ProcatsThemeColors:C,PROCATS_BOOT:{user:'tester'},currentLang:'tr',document:{documentElement:root,querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null},showCustomAlert:()=>alerts++,setTheme:value=>selected=value,ProcatsDeviceStore:{meta:async(k,value)=>{assert.equal(k,'custom-themes:tester');if(value===undefined)return structuredClone(stored);if(fail)throw Error('Disk full');stored=structuredClone(value);}}};
 context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../public/custom-themes.js',import.meta.url),'utf8'),context);
 await context.ProcatsCustomThemes.ready();assert.equal(context.ProcatsCustomThemes.active,true);assert.equal(root.dataset.customTheme,'0');assert.ok(styles.has('--theme-image'));
 fail=true;await context.setTheme('light');assert.equal(context.ProcatsCustomThemes.active,true);assert.equal(selected,undefined);assert.equal(alerts,1);
 fail=false;await context.setTheme('light');assert.equal(context.ProcatsCustomThemes.active,false);assert.equal(stored.active,null);assert.equal(stored.slots[0].name,'My image');assert.equal(selected,'light');assert.equal(styles.has('--bg-card'),false);
 assert.equal(context.ProcatsCustomThemes.valid({slots:[slot,slot,slot],active:0}),false);
 assert.equal(context.ProcatsCustomThemes.valid({slots:[{...slot,image:'https://example.com/private.png'},null],active:0}),false);
});
test('untrusted shared data rejects executable URLs and credentials; YouTube lookalikes never fetch metadata',()=>{
 for(const bad of ['javascript:alert(1)','file:///secret','https://a:b@example.com/','data:text/html,hi','https://example.com/\n'])assert.equal(R.normalize(bad==='https://example.com/\n'?'https://exa\nmple.com':bad),null);
 assert.equal(R.shared('hello without link'),null);assert.equal(R.shared('x'.repeat(16001)),null);
 assert.equal(R.youtube('https://www.youtube.com.evil.test/watch?v=A0I6pNSM14o'),null);
 assert.equal(R.youtube('https://www.youtube.com:444/watch?v=A0I6pNSM14o'),null);
 assert.equal(R.thumbnail('https://i.ytimg.com.evil.test/a'),null);assert.equal(R.thumbnail('javascript:hi'),null);
});
const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16));
test('generated palettes preserve readable text and action contrast for light, dark and saturated pictures',()=>{
 for(const color of [[0,0,0],[255,255,255],[255,0,0],[0,255,0],[0,0,255],[120,120,120],[200,145,20]])for(const mode of ['auto','light','dark']){
  const p=C.palette(color,mode).vars,bg=rgb(p['--bg-card']),accent=rgb(p['--accent-color']);
  assert.ok(C.contrast(rgb(p['--text-main']),bg)>=4.5);assert.ok(C.contrast(rgb(p['--text-secondary']),bg)>=4.5);
  assert.ok(C.contrast(accent,bg)>=4.5);assert.ok(C.contrast(accent,rgb(p['--theme-on-accent']))>=4.5);
 }
});
test('Android manual resource save persists instead of opening a browser; failed persistence leaves existing records intact',()=>{
 const text=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');const fn=text.slice(text.indexOf('        function saveLink() {'),text.indexOf('                // Retain legacy archive records'));
 const records=[{id:1,title:'Old',url:'https://example.com/old'}];let saved,closed=false;
 const context={window:{ProcatsNative:{isNative:true},ProcatsResourcesCore:R,ProcatsOpenResource(){throw Error('Saving must not launch');}},bookmarks:records,editingId:null,currentLang:'tr',createId:()=>2,canSaveSection:()=>true,normalizeBookmarkUrl:R.normalize,document:{getElementById:id=>({value:id==='mLinkTitle'?'New':'https://example.com/new'})},appStorage:{setItem:(k,v)=>{saved=JSON.parse(v);return true;}},closeModal:()=>closed=true,renderBookmarks(){},showCustomAlert(){},t:x=>x};
 vm.createContext(context);vm.runInContext(fn+'\nsaveLink();',context);assert.equal(saved.length,2);assert.equal(context.bookmarks[0].title,'Old');assert.equal(closed,true);
 context.bookmarks=records;context.appStorage.setItem=()=>false;vm.runInContext('saveLink();',context);assert.equal(context.bookmarks,records);
});
