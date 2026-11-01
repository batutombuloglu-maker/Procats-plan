/* Presentation math only. Scheduling and alarms remain in the existing timer. */
(()=>{'use strict';
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
 function model(state,now=Date.now()){
  // The app supplies duration-clock seconds. The wall deadline remains only a
  // compatibility fallback for older callers and portable saved records.
  const remaining=Number.isFinite(state.remaining)?Math.max(0,state.remaining):state.running?Math.max(0,Math.ceil((state.endTime-now)/1000)):0;
  const duration=Math.max(remaining,Number.isFinite(state.duration)?state.duration:0);
  const end=remaining>0?now+remaining*1000:0;
  const d=new Date(now),hours=d.getHours()%12+d.getMinutes()/60+d.getSeconds()/3600,minute=d.getMinutes()*6+d.getSeconds()/10;
  // Keep the selected hand for this timer's complete duration: a 90-minute
  // countdown must not change its scale when only 59 minutes remain.
  const sectorHand=duration<=3600?'minute':'hour',sectorStart=sectorHand==='minute'?minute:hours*30;
  return {remaining,duration,fraction:duration?clamp(remaining/duration,0,1):0,end,hour:hours*30,minute,second:d.getSeconds()*6,sectorHand,sectorStart,span:clamp(remaining/(sectorHand==='minute'?3600:43200)*360,0,360)};
 }
 function point(angle,r=130){const a=(angle-90)*Math.PI/180;return [160+Math.cos(a)*r,160+Math.sin(a)*r];}
 function sector(start,span,r=130){
  if(span<=0)return '';const [x,y]=point(start,r);
  if(span>=359.999){const [a,b]=point(start+180,r);return `M160 160 L${x} ${y} A${r} ${r} 0 1 1 ${a} ${b} A${r} ${r} 0 1 1 ${x} ${y} Z`;}
  const [a,b]=point(start+span,r);return `M160 160 L${x} ${y} A${r} ${r} 0 ${span>180?1:0} 1 ${a} ${b} Z`;
 }
 function digits(seconds){const s=Math.max(0,Math.floor(seconds)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}
 // The complete OLED dial moves, including its numbers, not only the progress arc.
 function shift(now){const points=[[0,0],[14,-10],[-12,12],[16,10],[-15,-12],[3,16],[-16,2],[8,-16]];return points[Math.floor(now/40000)%points.length];}
 globalThis.ProcatsTimerViewCore={model,point,sector,digits,shift};
})();
