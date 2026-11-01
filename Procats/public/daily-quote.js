/* A persisted shuffle bag keeps one quote per local day, also offline.
   Every quote is drawn once before refilling. Language doesn't redraw. */
(()=>{'use strict';
 function shuffled(count,cycle){
  let seed=2166136261;
  for(const c of 'Procats-daily-v1:'+cycle)seed=Math.imul(seed^c.charCodeAt(0),16777619);
  const random=()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
  const bag=Array.from({length:count},(_,i)=>i);
  for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
  return bag;
 }
 function next(state,count,date=new Date()){
  if(!Number.isInteger(count)||count<1)throw Error('Empty quote pool');
  const day=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  const valid=state?.version===1&&state.count===count&&Number.isInteger(state.index)&&state.index>=0&&state.index<count&&Number.isSafeInteger(state.cycle)&&/^\d{4}-\d{2}-\d{2}$/.test(state.day)&&Array.isArray(state.remaining)&&state.remaining.length<count&&new Set(state.remaining).size===state.remaining.length&&state.remaining.every(i=>Number.isInteger(i)&&i>=0&&i<count&&i!==state.index);
  if(valid&&day<=state.day)return state;
  let round=valid?state.cycle:Number(day.replaceAll('-','')),remaining=valid?[...state.remaining]:shuffled(count,round);
  if(!remaining.length){remaining=shuffled(count,++round);if(count>1&&remaining[0]===state.index)[remaining[0],remaining[1]]=[remaining[1],remaining[0]];}
  return {version:1,count,day,cycle:round,index:remaining.shift(),remaining};
 }
 globalThis.ProcatsDailyQuote={next};
})();
