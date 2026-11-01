// Calendar weeks start on Monday. Unselected dates only keep weekday alignment.
export function splitWeeks(snapshot,lang='tr',C=globalThis.ProcatsCalendarCore){
 const groups=new Map(),dated=snapshot.days.every(day=>C.parse(day.date));
 if(!dated){for(let i=0;i<snapshot.days.length;i+=7)groups.set(i,snapshot.days.slice(i,i+7));}
 else for(const day of [...snapshot.days].sort((a,b)=>a.date.localeCompare(b.date))){const key=C.week(day.date)[0];if(!groups.has(key))groups.set(key,[]);groups.get(key).push(day);}
 const weekWord={tr:'hafta',en:'week',de:'Woche'}[lang]||'week';
 return [...groups].map(([key,selected],index)=>({period:snapshot.period,folder:{name:snapshot.folder.name+' · '+(index+1)+'. '+weekWord},days:dated?C.week(key).map(date=>selected.find(day=>day.date===date)||{date,name:C.format(date,lang,{weekday:'long'}),tasks:[],excluded:true}):selected}));
}
