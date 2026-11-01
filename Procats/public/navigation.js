/* Small, deterministic navigation model shared by touch controls and backup validation. */
(()=>{
 const defaults=['home','tasks','timers','notes','more'];
 const allowed=['home','tasks','obsidian','exams','timers','notes','bookmarks','lists','knowledge','vault','settings','more'];
 const valid=value=>Array.isArray(value)&&value.length>=1&&value.length<=5&&value.includes('more')&&new Set(value).size===value.length&&value.every(v=>allowed.includes(v));
 const normalize=value=>valid(value)?[...value]:[...defaults];
 function place(value,view,index){
  const next=normalize(value);if(!allowed.includes(view))return next;
  index=Math.max(0,Math.min(next.length-1,Number.isInteger(index)?index:next.length-1));
  const old=next.indexOf(view);
  if(old>=0){next.splice(old,1);next.splice(index,0,view);}
  else if(next.length<5)next.splice(index,0,view);
  else if(next[index]!=='more')next[index]=view;
  return next;
 }
 function remove(value,view){return normalize(value).filter(v=>v==='more'||v!==view);}
 globalThis.ProcatsNavigation={key:'procats_navigation_v1',defaults,allowed,valid,normalize,place,remove};
})();
