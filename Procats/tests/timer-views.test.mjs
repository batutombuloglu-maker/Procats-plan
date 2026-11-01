import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import '../public/timer-views-core.js';import {validateSnapshot} from '../public/validation.js';
const C=globalThis.ProcatsTimerViewCore;
test('analog real clock and finish time span across hour and date boundaries',()=>{const now=new Date(2026,9,3,23,30,0).getTime(),m=C.model({running:true,endTime:now+90*60000,remaining:5400,duration:5400},now);assert.equal(m.remaining,5400);assert.equal(m.hour,345);assert.equal(m.span,45);assert.equal(new Date(m.end).getDate(),4);assert.equal(new Date(m.end).getHours(),1);assert.equal(m.fraction,1);assert.equal(C.model({running:true,endTime:now+5400000,duration:5400},now+2700000).fraction,.5);});
test('clock face follows monotonic remaining time after the displayed wall clock jumps',()=>{const now=1800000000000,m=C.model({running:true,endTime:now-3600000,remaining:1799,duration:1800},now);assert.equal(m.remaining,1799);assert.equal(m.end,now+1799000);assert.equal(m.span,1799/3600*360);});
test('15 and 60 minute timers shade from the minute hand while 90 minutes uses the hour hand',()=>{
 const now=new Date(2026,9,21,10,20,0).getTime();
 const short=C.model({running:true,remaining:900,duration:900},now);assert.equal(short.sectorHand,'minute');assert.equal(short.sectorStart,120);assert.equal(short.span,90);
 const hour=C.model({running:true,remaining:3600,duration:3600},now);assert.equal(hour.sectorHand,'minute');assert.equal(hour.span,360);
 const long=C.model({running:true,remaining:5400,duration:5400},now);assert.equal(long.sectorHand,'hour');assert.equal(long.sectorStart,310);assert.equal(long.span,45);
});
test('selected total duration keeps sector scale through countdown and pause',()=>{
 const now=new Date(2026,9,21,10,20,0).getTime();
 for(const running of [true,false]){const long=C.model({running,remaining:1800,duration:5400},now);assert.equal(long.sectorHand,'hour');assert.equal(long.span,15);const short=C.model({running,remaining:600,duration:3600},now);assert.equal(short.sectorHand,'minute');assert.equal(short.span,60);}
});
test('paused timer keeps remaining seconds, estimates finish, clamps elapsed timer to zero',()=>{const state={running:false,remaining:600,duration:1200};assert.equal(C.model(state,1000).remaining,600);assert.equal(C.model(state,5000).fraction,.5);assert.equal(C.model(state,5000).end,605000);assert.equal(C.model({running:true,endTime:1000,duration:60},5000).fraction,0);assert.equal(C.model({running:false,remaining:0,duration:0}).end,0);});
test('long durations use a full dial and explicit hours; OLED position varies',()=>{assert.equal(C.model({running:false,remaining:60000,duration:60000}).span,360);assert.equal(C.digits(5400),'01:30:00');assert.equal(C.digits(60),'01:00');assert.equal(C.sector(0,0),'');assert.equal((C.sector(90,360).match(/ A/g)||[]).length,2);assert.notDeepEqual(C.shift(0),C.shift(40000));});
test('countdown pause, resume and display switches keep alarm timing and saved duration',()=>{
 const src=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');const block=src.slice(src.indexOf('        // --- TIMERS AND STOPWATCH'),src.indexOf('                // --- OBSIDIAN'));
 let now=1000,saved=null;const scheduled=[],cancelled=[],nodes=new Map();const node={innerText:'',classList:{remove(){},toggle(){}}};nodes.set('timerDisplay',node);
 const ctx={Date:{now:()=>now},Math,Number,JSON,window:{ProcatsTimerAlerts:{schedule:e=>scheduled.push(e),cancel:()=>cancelled.push(true)}},document:{getElementById:id=>nodes.get(id),addEventListener(){}},setInterval:()=>1,clearInterval(){},isTimestamp:()=>true,appStorage:{setItem:(k,v)=>{saved=JSON.parse(v);}}};vm.createContext(ctx);vm.runInContext(block,ctx);
 ctx.setTimer(90);ctx.startTimer();assert.equal(saved.duration,5400);const end=ctx.window.ProcatsTimerState().endTime;assert.equal(end,5401000);
 now+=30000;ctx.tickTimer();for(let i=0;i<3;i++)C.model(ctx.window.ProcatsTimerState(),now);assert.equal(scheduled.length,1);assert.equal(ctx.window.ProcatsTimerState().endTime,end);
 ctx.pauseTimer();assert.equal(saved.remainingTime,5370);assert.equal(saved.duration,5400);now+=10000;ctx.startTimer();assert.equal(scheduled.at(-1),5411000);ctx.resetTimer();assert.equal(saved.duration,0);assert.equal(saved.remainingTime,0);
 assert.equal(validateSnapshot({procats_timer:{isRunning:true,endTime:end,remainingTime:5400,duration:5400}}),true);
});
