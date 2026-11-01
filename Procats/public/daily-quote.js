/* One thought per local day; stable text keys enforce a 15-day cooldown. */
(()=>{'use strict';
 const dateKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const dayNumber=s=>{const [y,m,d]=String(s).split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;};
 function shuffled(count,cycle){let seed=2166136261;for(const c of 'Procats-daily-v2:'+cycle)seed=Math.imul(seed^c.charCodeAt(0),16777619);const random=()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;},bag=Array.from({length:count},(_,i)=>i);for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}return bag;}
 function next(state,count,date=new Date(),keys=Array.from({length:count},(_,i)=>String(i))){
  if(!Number.isInteger(count)||count<1||keys.length!==count||keys.some(k=>typeof k!=='string'))throw Error('Empty quote pool');
  const day=dateKey(date),number=dayNumber(day),validDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(dayNumber(s));
  let history=state?.version===2&&Array.isArray(state.history)?state.history.filter(x=>Array.isArray(x)&&x.length===2&&typeof x[0]==='string'&&validDay(x[1])&&number-dayNumber(x[1])<15):[];
  if(state?.version===1&&validDay(state.day)&&Number.isInteger(state.index)&&state.index>=0&&state.index<count&&number-dayNumber(state.day)<15)history.push([keys[state.index],state.day]);
  const selected=state?.selected??(state?.index>=0?keys[state.index]:null),index=keys.indexOf(selected);
  const samePool=state?.count===count&&Array.isArray(state.remaining)&&new Set(state.remaining).size===state.remaining.length&&state.remaining.every(i=>Number.isInteger(i)&&i>=0&&i<count);
  if(state?.version===2&&samePool&&validDay(state.day)&&day<=state.day&&index===state.index)return state;
  let cycle=Number.isSafeInteger(state?.cycle)?state.cycle:Number(day.replaceAll('-','')),remaining=samePool?[...state.remaining]:shuffled(count,cycle);
  if(!remaining.length)remaining=shuffled(count,++cycle);
  const blocked=new Set(history.map(([key])=>key));let position=remaining.findIndex(i=>!blocked.has(keys[i]));
  if(position<0){remaining=shuffled(count,++cycle);position=remaining.findIndex(i=>!blocked.has(keys[i]));}
  const chosen=position<0?-1:remaining.splice(position,1)[0];if(chosen>=0)history.push([keys[chosen],day]);
  return {version:2,count,day,cycle,index:chosen,selected:chosen<0?null:keys[chosen],remaining,history};
 }
 globalThis.ProcatsDailyQuote={next};
})();
