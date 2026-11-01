/* Pure planning operations shared by touch, mouse and calendar actions. */
(()=>{'use strict';
 function reorder(tasks,dayId,sourceId,targetId){
  const group=tasks.filter(t=>t.dayId===dayId),from=group.findIndex(t=>t.id===sourceId),to=group.findIndex(t=>t.id===targetId);
  if(from<0||to<0||from===to)return tasks;
  group.splice(to,0,group.splice(from,1)[0]);let cursor=0;
  return tasks.map(t=>t.dayId===dayId?group[cursor++]:t);
 }
 function paste(days,tasks,copied,key,makeId){
  const C=globalThis.ProcatsCalendarCore;
  if(!C.parse(key)||!copied.length)return null;
  const used=new Set(tasks.map(t=>t.id)),dayIds=new Set(days.map(d=>d.id));
  let day=days.find(d=>d.date===key),nextDays=days;
  if(!day){let id=C.id(key);while(dayIds.has(id))id=makeId();day={id,name:key,date:key,folderId:null,completed:false};nextDays=[...days,day];}
  const added=copied.map(task=>{let id=makeId();while(used.has(id))id=makeId();used.add(id);
   // A copy preserves the plan's status, but is not a new historical activity.
   return {...task,id,dayId:day.id,activityDate:null,completedDate:null};
  });
  return {days:nextDays.map(d=>d.id===day.id?{...d,completed:added.every(t=>t.completed)}:d),tasks:[...tasks.filter(t=>t.dayId!==day.id),...added],dayId:day.id};
 }
 globalThis.ProcatsPlanning={reorder,paste};
})();
