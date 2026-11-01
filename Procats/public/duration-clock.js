/* Duration clocks are device-local. Cloud records retain portable wall timestamps.
 * Native elapsedRealtime includes deep sleep and is only reused within one boot.
 * A new browser process / device boot falls back to the saved wall timestamp. */
(()=>{'use strict';
 function create(options={}){
  const wall=options.wall||(()=>Date.now()),mono=options.monotonic||(()=>globalThis.performance?.now?.()??Date.now());
  const session=options.session||globalThis.crypto?.randomUUID?.()||String(Math.random()),key='procats-duration-clock-v1';
  const storage=()=>options.storage||globalThis.window?.procatsStorage||globalThis.localStorage;
  const owner=()=>options.owner?.()||globalThis.window?.PROCATS_BOOT?.user||'guest';
  let currentOwner,anchors={},calibration=null;
  function load(){const uid=owner();if(uid===currentOwner)return;currentOwner=uid;anchors={};try{const value=JSON.parse(storage()?.getItem(key)||'{}');if(value.owner===uid&&value.anchors&&typeof value.anchors==='object')anchors=value.anchors;}catch{}}
  function persist(){try{storage()?.setItem(key,JSON.stringify({owner:currentOwner,anchors}));}catch{}}
  function nativeNow(){return calibration?calibration.elapsedMs+Math.max(0,mono()-calibration.mono):null;}
  function age(a){
   if(calibration&&a.bootId===calibration.bootId&&Number.isFinite(a.elapsedMs))return Math.max(0,nativeNow()-a.elapsedMs);
   if(a.session===session&&Number.isFinite(a.mono))return Math.max(0,mono()-a.mono);
   return Math.max(0,wall()-a.wall);
  }
  function initial(kind,token){return Math.max(0,kind==='timer'?token-wall():wall()-token);}
  function valid(a,kind,token){return a&&a.kind===kind&&a.token===token&&Number.isFinite(a.baseMs)&&a.baseMs>=0&&Number.isFinite(a.wall);}
  function anchor(kind,token){
   load();let a=anchors[kind];
   if(!valid(a,kind,token)){a=anchors[kind]={kind,token,baseMs:initial(kind,token),wall:wall(),mono:mono(),session,bootId:calibration?.bootId,elapsedMs:nativeNow()};persist();}
   // An old browser session has no valid monotonic reference. Adopt the portable
   // wall deadline once, then use this process's monotonic clock from that point.
   else if(a.session!==session&&!(calibration&&a.bootId===calibration.bootId&&Number.isFinite(a.elapsedMs))){
    const elapsed=age(a);a={...a,baseMs:Math.max(0,a.baseMs+(kind==='timer'?-elapsed:elapsed)),wall:wall(),mono:mono(),session,bootId:calibration?.bootId,elapsedMs:nativeNow()};anchors[kind]=a;persist();
   }
   return a;
  }
  function value(kind,token){if(!Number.isFinite(token)||token<=0)return 0;const a=anchor(kind,token),elapsed=age(a);return Math.max(0,a.baseMs+(kind==='timer'?-elapsed:elapsed));}
  function calibrate(value){
   if(!value||!Number.isFinite(value.elapsedRealtimeMs)||value.elapsedRealtimeMs<0||typeof value.bootId!=='string'||!value.bootId)return false;
   load();const previous=calibration,next={elapsedMs:value.elapsedRealtimeMs,mono:mono(),bootId:value.bootId};
   // Existing anchors from this boot can recover directly after a suspended
   // WebView or process restart; never replace them with a stalled JS reading.
   for(const [kind,a]of Object.entries(anchors))if(valid(a,kind,a.token)&&!(a.bootId===next.bootId&&Number.isFinite(a.elapsedMs))){const elapsed=age(a);anchors[kind]={...a,baseMs:Math.max(0,a.baseMs+(kind==='timer'?-elapsed:elapsed)),wall:wall(),mono:next.mono,session,bootId:next.bootId,elapsedMs:next.elapsedMs};}
   calibration=next;persist();return !previous||previous.bootId!==next.bootId||Math.abs(previous.elapsedMs+Math.max(0,next.mono-previous.mono)-next.elapsedMs)>100;
  }
  return {remaining:end=>value('timer',end),elapsed:start=>value('stopwatch',start),calibrate,forget(kind){load();delete anchors[kind];persist();},checkpoint(){load();persist();}};
 }
 globalThis.ProcatsDurationClock=create();globalThis.ProcatsDurationClock.create=create;
})();
