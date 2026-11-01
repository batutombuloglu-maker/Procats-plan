/* Local civil dates: noon avoids UTC/daylight-saving date shifts. */
(()=>{
 const dateKey=d=>`${String(d.getFullYear()).padStart(4,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 function parse(key){if(typeof key!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(key)||key.startsWith('0000'))return null;const d=new Date(key+'T12:00:00');return Number.isFinite(d.getTime())&&dateKey(d)===key?d:null;}
 function add(key,count){const d=parse(key);if(!d)return null;d.setDate(d.getDate()+count);const result=dateKey(d);return parse(result)?result:null;}
 function month(key,delta=0){const d=parse(key);if(!d)return null;d.setDate(1);d.setMonth(d.getMonth()+delta);const result=dateKey(d);return parse(result)?result:null;}
 function range(first,last){if(!parse(first)||!parse(last)||first>last)return [];const out=[];for(let key=first;key&&key<=last&&out.length<366;key=add(key,1))out.push(key);return out;}
 function week(key){const d=parse(key);if(!d)return [];const first=add(key,-((d.getDay()+6)%7))||key;return range(first,add(first,6)||'9999-12-31');}
 function monthDays(key){const first=month(key),next=month(key,1);return first?range(first,next?add(next,-1):'9999-12-31'):[];}
 function grid(key){const first=month(key),d=parse(first);if(!d)return [];const offset=(d.getDay()+6)%7;return Array.from({length:42},(_,i)=>add(first,i-offset));}
 const id=key=>4000000000000+Number(key.replaceAll('-',''));
 const stats=list=>({done:list.filter(t=>t.completed).length,missed:list.filter(t=>!t.completed&&t.missed).length,pending:list.filter(t=>!t.completed&&!t.missed).length,total:list.length});
 // Same thresholds as the existing focus heatmap; only completed tasks count.
 const heat=count=>count>=20?5:count>=18?4:count>=10?3:count>=4?2:count>=1?1:0;
 function normalize(records,today){const used=new Set(records.map(d=>d.date).filter(k=>parse(k)));let candidate=today;return records.map(day=>{if(parse(day.date))return day;const named=parse(day.name)?day.name:null;while(used.has(candidate))candidate=add(candidate,1);const date=named&&!used.has(named)?named:candidate;if(!date)return day;used.add(date);return {...day,date};});}
 function snapshot(keys,records,tasks,name,lang='tr'){return {folder:{name},days:[...new Set(keys)].filter(parse).sort().map(date=>{const matches=records.filter(d=>d.date===date),ids=new Set(matches.map(d=>d.id));return {id:id(date),date,name:format(date,lang),tasks:tasks.filter(t=>ids.has(t.dayId)).map(t=>({...t}))};})};}
 function format(key,lang='tr',options={weekday:'long',day:'numeric',month:'long',year:'numeric'}){const d=parse(key);return d?d.toLocaleDateString(lang,options):key;}
 globalThis.ProcatsCalendarCore={dateKey,parse,add,month,range,week,monthDays,grid,id,stats,heat,normalize,snapshot,format};
})();
