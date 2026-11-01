import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateSnapshot} from '../public/validation.js';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),clock=fs.readFileSync(new URL('../public/duration-clock.js',import.meta.url),'utf8');
const timers=app.slice(app.indexOf('        // --- TIMERS AND STOPWATCH'),app.indexOf('                // --- OBSIDIAN'));
const initialize=app.slice(app.indexOf('window.procatsInitialize = () =>'));
function fixture(options={}){
 let wall=options.wall??1800000000000,mono=options.mono??1000,intervalId=0,finished=0,nativeElapsed=options.nativeElapsed??100000;
 const records=options.records??new Map(),intervals=new Map(),documentEvents=new Map(),windowEvents=new Map(),observers=[],active=new Set(['view-home']);
 const node=id=>{let text='';return {textWrites:0,innerTextReads:0,get innerText(){this.innerTextReads++;return text;},set innerText(value){text=value;this.textWrites++;},get textContent(){return text;},set textContent(value){text=value;this.textWrites++;},style:{},classList:{contains:name=>name==='active'&&active.has(id),remove(){},toggle(){}}};};
 const nodes=new Map(['swDisplay','swStartBtn','timerDisplay','view-home','view-timers'].map(id=>[id,node(id)]));
 const document={hidden:false,getElementById:id=>nodes.get(id),addEventListener:(name,fn)=>{if(!documentEvents.has(name))documentEvents.set(name,[]);documentEvents.get(name).push(fn);}};
 const ctx=vm.createContext({Date:class extends Date{static now(){return wall;}},performance:{now:()=>mono},Math,Number,JSON,Map,Set,
  document,setInterval:(fn,ms)=>{const id=++intervalId;intervals.set(id,{fn,ms});return id;},clearInterval:id=>intervals.delete(id),
  MutationObserver:class{constructor(callback){this.callback=callback;}observe(target){observers.push({callback:this.callback,target});}},
  addEventListener:(name,fn)=>{if(!windowEvents.has(name))windowEvents.set(name,[]);windowEvents.get(name).push(fn);},
  dispatchEvent:event=>{for(const fn of windowEvents.get(event.type)||[])fn(event);},
  appStorage:{getItem:k=>records.get(k),setItem:(k,v)=>{records.set(k,v);return true;},removeItem:k=>records.delete(k)},
  PROCATS_BOOT:{user:'timer-test'},ProcatsNative:{isNative:!!options.native},isTimestamp:()=>true,t:key=>key,
  loadTheme(){},setLang(){},currentLang:'tr',renderHeatmap(){},renderNotes(){},renderBookmarks(){},renderApp(){},renderObsidian(){},
  readStoredJSON:(key,fallback)=>records.has(key)?JSON.parse(records.get(key)):fallback,
 });
 ctx.window=ctx;ctx.procatsStorage=ctx.appStorage;vm.runInContext(clock,ctx);
 const calibration=()=>ctx.ProcatsDurationClock.calibrate({elapsedRealtimeMs:nativeElapsed,bootId:'10'});
 if(options.native)calibration();
 ctx.ProcatsTimerAlerts={schedule(){},cancel(){ctx.ProcatsDurationClock.forget('timer');},finish(){finished++;},resume:async()=>calibration()};
 vm.runInContext(timers,ctx);ctx.fireParticles=()=>{};vm.runInContext(initialize,ctx);
 return {ctx,records,intervals,nodes,calibration,get finished(){return finished;},get wall(){return wall;},
  advance(ms,wallDelta=ms,nativeDelta=ms){wall+=wallDelta;mono+=ms;nativeElapsed+=nativeDelta;},
  pulse(){for(const {fn}of [...intervals.values()])fn();},
  view(id){active.clear();active.add(id);for(const entry of observers)entry.callback();},
  async hidden(value){document.hidden=value;for(const fn of documentEvents.get('visibilitychange')||[])await fn();},
 };
}
test('home stopwatch continues while other views and hidden tabs stop its display interval',async()=>{
 const f=fixture();f.ctx.swToggle();assert.equal([...f.intervals.values()].filter(v=>v.ms===50).length,1);
 f.advance(1000);f.pulse();assert.equal(f.nodes.get('swDisplay').innerText,'00:01.00');
 f.view('view-tasks');assert.equal([...f.intervals.values()].filter(v=>v.ms===50).length,0);f.advance(59000);f.view('view-home');assert.equal(f.nodes.get('swDisplay').innerText,'01:00.00');
 await f.hidden(true);assert.equal([...f.intervals.values()].filter(v=>v.ms===50).length,0);f.advance(10000);await f.hidden(false);assert.equal(f.nodes.get('swDisplay').innerText,'01:10.00');
 f.ctx.swToggle();const saved=JSON.parse(f.records.get('procats_sw'));assert.equal(saved.isRunning,false);assert.equal(saved.savedTime,70000);
});
test('stopwatch updates never read innerText or replace unchanged centisecond text',()=>{
 const f=fixture(),display=f.nodes.get('swDisplay');f.ctx.swUpdateDisplay(1000);f.ctx.swUpdateDisplay(1000.1);assert.equal(display.textContent,'00:01.00');assert.equal(display.textWrites,1);assert.equal(display.innerTextReads,0);
 f.ctx.swUpdateDisplay(1099);assert.equal(display.textContent,'00:01.09');assert.equal(display.textWrites,2);assert.equal(display.innerTextReads,0);
});
test('application countdown and stopwatch survive a wall clock jump and retain portable state',()=>{
 const f=fixture();f.view('view-timers');f.ctx.setTimer(30);f.ctx.startTimer();f.ctx.swToggle();f.advance(1000,3601000);f.pulse();
 assert.equal(f.ctx.ProcatsTimerState().remaining,1799);assert.equal(f.finished,0);const timer=JSON.parse(f.records.get('procats_timer'));assert.equal(timer.endTime,f.wall+1799000);
 f.ctx.swToggle();assert.equal(JSON.parse(f.records.get('procats_sw')).savedTime,1000);
 f.advance(1000,-7199000);f.pulse();assert.equal(f.ctx.ProcatsTimerState().remaining,1798);assert.equal(f.finished,0);
});
test('fractional monotonic milliseconds are rounded safely in persisted stopwatch records',()=>{
 const f=fixture();f.ctx.swToggle();f.advance(1000.125,1000);f.ctx.swToggle();const state=JSON.parse(f.records.get('procats_sw'));assert.equal(state.savedTime,1000);assert.equal(validateSnapshot({procats_sw:state}),true);
});
test('native resume recalibrates deep sleep before deciding whether the countdown expired',async()=>{
 const f=fixture({native:true});f.view('view-timers');f.ctx.setTimer(10);f.ctx.startTimer();f.ctx.swToggle();await f.hidden(true);
 f.advance(0,3600000,300000);f.pulse();assert.equal(f.finished,0);await f.hidden(false);assert.equal(f.ctx.ProcatsTimerState().remaining,300);assert.equal(f.finished,0);assert.equal(JSON.parse(f.records.get('procats_sw')).savedTime,300000);
 f.advance(0,0,300000);await f.ctx.ProcatsTimerAlerts.resume();f.ctx.refreshDurationDisplays();assert.equal(f.finished,1);f.ctx.refreshDurationDisplays();assert.equal(f.finished,1);
});
test('same-boot native restore uses persisted elapsed time even when wall deadline appears expired',()=>{
 const first=fixture({native:true});first.ctx.setTimer(30);first.ctx.startTimer();first.ctx.swToggle();
 const second=fixture({native:true,records:first.records,wall:first.wall+3600000,mono:300,nativeElapsed:160000});second.ctx.procatsInitialize();
 assert.equal(second.ctx.ProcatsTimerState().remaining,1740);second.ctx.swToggle();assert.equal(JSON.parse(second.records.get('procats_sw')).savedTime,60000);
});
test('backup captures running duration against current wall time without losing accumulated stopwatch time',()=>{
 const f=fixture();f.ctx.setTimer(10);f.ctx.startTimer();f.ctx.swToggle();f.advance(30000,3630000);
 Object.assign(f.ctx,{folders:[],days:[],tasks:[],notes:[],activityData:{},bookmarks:[],archives:[],obsFolders:[],obsNotes:[],reminders:[],examRecords:[],getSelectedExams:()=>[],ProcatsListsStore:{get:()=>({lists:[]})},ProcatsKnowledgeStore:{get:()=>[]},ProcatsSync:{getData:()=>({})},ProcatsNavigation:{defaults:[]},ProcatsPreferences:{get:()=>({})},blockedStorageKeys:new Set()});
 vm.runInContext("const backupJSONKeys=['procats_sw','procats_timer'],backupTextKeys=[];"+app.slice(app.indexOf('        function createBackupData()'),app.indexOf('        async function exportData()')),f.ctx);
 const backup=f.ctx.createBackupData(),sw=JSON.parse(backup.procats_sw),timer=JSON.parse(backup.procats_timer);assert.equal(sw.savedTime,30000);assert.equal(sw.startTime,f.wall);assert.equal(timer.remainingTime,570);assert.equal(timer.endTime,f.wall+570000);
});
