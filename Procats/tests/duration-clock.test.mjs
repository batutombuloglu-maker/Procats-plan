import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/duration-clock.js';

const factory=globalThis.ProcatsDurationClock.create;
function fixture(){let wall=1800000000000,mono=1000,owner='alice';const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};const options={wall:()=>wall,monotonic:()=>mono,storage,owner:()=>owner};return {data,make:session=>factory({...options,session}),advance:(ms,wallDelta=ms)=>{mono+=ms;wall+=wallDelta;},setWall:v=>wall=v,setOwner:v=>owner=v,get wall(){return wall;},get mono(){return mono;}};}
test('active countdown and stopwatch ignore forward/backward system clock jumps',()=>{
 const f=fixture(),c=f.make('one'),end=f.wall+1800000,start=f.wall;
 assert.equal(c.remaining(end),1800000);assert.equal(c.elapsed(start),0);
 f.advance(1000,3601000);assert.equal(c.remaining(end),1799000);assert.equal(c.elapsed(start),1000);
 f.advance(1000,-7199000);assert.equal(c.remaining(end),1798000);assert.equal(c.elapsed(start),2000);
});
test('native elapsed clock catches up after a suspended JS clock and wall jump',()=>{
 const f=fixture(),c=f.make('one'),end=f.wall+1800000,start=f.wall;
 c.calibrate({elapsedRealtimeMs:50000,bootId:'10'});c.remaining(end);c.elapsed(start);
 f.advance(1000,3601000);c.calibrate({elapsedRealtimeMs:350000,bootId:'10'});
 assert.equal(c.remaining(end),1500000);assert.equal(c.elapsed(start),300000);
});
test('native process recreation reuses persisted elapsed anchors in the same boot',()=>{
 const f=fixture(),end=f.wall+1800000,start=f.wall,c=f.make('first');c.calibrate({elapsedRealtimeMs:100000,bootId:'10'});c.remaining(end);c.elapsed(start);
 f.advance(500,-3600000);const next=f.make('second');next.calibrate({elapsedRealtimeMs:400000,bootId:'10'});
 assert.equal(next.remaining(end),1500000);assert.equal(next.elapsed(start),300000);
});
test('new device boot never reuses the old elapsedRealtime counter',()=>{
 const f=fixture(),end=f.wall+1800000,start=f.wall,c=f.make('first');c.calibrate({elapsedRealtimeMs:100000,bootId:'10'});c.remaining(end);c.elapsed(start);
 f.advance(300000);const next=f.make('second');next.calibrate({elapsedRealtimeMs:7000,bootId:'11'});
 assert.equal(next.remaining(end),1500000);assert.equal(next.elapsed(start),300000);
});
test('browser process recreation resumes portable timestamps before reanchoring',()=>{
 const f=fixture(),end=f.wall+1800000,c=f.make('first');c.remaining(end);f.advance(300000);const next=f.make('second');assert.equal(next.remaining(end),1500000);f.advance(1000,3601000);assert.equal(next.remaining(end),1499000);
});
test('foreign timer and account do not inherit another local duration anchor',()=>{
 const f=fixture(),c=f.make('one'),end=f.wall+1800000;c.remaining(end);f.advance(300000,3600000);assert.equal(c.remaining(end),1500000);
 const remoteEnd=f.wall+600000;assert.equal(c.remaining(remoteEnd),600000);f.setOwner('bob');assert.equal(c.remaining(end),0);
});
test('pause/reset creates a fresh duration anchor even for an identical deadline',()=>{
 const f=fixture(),c=f.make('one'),end=f.wall+60000;assert.equal(c.remaining(end),60000);f.advance(1000,5000);c.forget('timer');assert.equal(c.remaining(end),55000);assert.equal(c.remaining(0),0);assert.equal(c.elapsed(NaN),0);
});
