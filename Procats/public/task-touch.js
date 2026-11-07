/* HTML drag/drop doesn't reorder cards on Android WebView. Touch scrolling
   stays native until a stationary hold arms this separate gesture. */
(()=>{'use strict';
 const grid=document.getElementById('tasksGrid'),scrollArea=grid.closest('.main-content');
 const words={tr:{move:'Sıralamak için basılı tut ve sürükle',drag:'Görevi yeni yerine sürükle',saved:'Görev sırası kaydedildi'},en:{move:'Hold and drag to reorder',drag:'Drag the task to its new position',saved:'Task order saved'},de:{move:'Zum Sortieren gedrückt halten und ziehen',drag:'Aufgabe an die neue Position ziehen',saved:'Aufgabenreihenfolge gespeichert'}};
 const L=k=>(globalThis.ProcatsLocale?.messages(words,currentLang) || words[currentLang]||words.tr)[k];
 let hold=null,drag=null,frame=0,suppressUntil=0;
 const status=document.createElement('div');status.className='sr-only';status.setAttribute('role','status');document.body.append(status);
 function clearHold(){clearTimeout(hold?.timer);if(hold?.card.isConnected)hold.card.draggable=true;hold=null;}
 function finish(){clearHold();cancelAnimationFrame(frame);frame=0;if(drag?.card.isConnected)drag.card.draggable=true;drag=null;document.body.classList.remove('task-touch-dragging');document.getElementById('taskTouchGhost')?.remove();grid.querySelectorAll('.touch-drag-source,.touch-drop-target').forEach(c=>c.classList.remove('touch-drag-source','touch-drop-target'));}
 function cancel(){if(drag)suppressUntil=Date.now()+600;finish();}
 function markTarget(){
  if(!drag)return;
  const bounds=scrollArea.getBoundingClientRect();
  if(drag.x<bounds.left||drag.x>bounds.right||drag.y<bounds.top-28||drag.y>bounds.bottom+28){drag.target=null;}
  else{
   const cards=[...grid.querySelectorAll('.task-card')];
   // A nearest-card hit also works in the spacing between two cards.
   const ranked=cards.map(card=>{const r=card.getBoundingClientRect();return {card,d:Math.hypot(Math.max(r.left-drag.x,0,drag.x-r.right),Math.max(r.top-drag.y,0,drag.y-r.bottom))};}).sort((a,b)=>a.d-b.d);
   drag.target=ranked[0]?.card||null;
  }
  grid.querySelectorAll('.task-card').forEach(c=>c.classList.toggle('touch-drop-target',c===drag.target&&c!==drag.card));
 }
 function move(x,y){if(!drag)return;drag.x=x;drag.y=y;const ghost=document.getElementById('taskTouchGhost');ghost.style.left=Math.max(12,Math.min(x,innerWidth-12))+'px';ghost.style.top=Math.max(20,y-26)+'px';markTarget();}
 function autoscroll(){
  if(!drag)return;
  if(!drag.card.isConnected||!document.getElementById('view-tasks').classList.contains('active')){cancel();return;}
  const r=scrollArea.getBoundingClientRect(),edge=60;
  const speed=drag.y<r.top+edge?-Math.min(14,(r.top+edge-drag.y)/4):drag.y>r.bottom-edge?Math.min(14,(drag.y-r.bottom+edge)/4):0;
  if(speed){scrollArea.scrollTop+=speed;markTarget();}
  frame=requestAnimationFrame(autoscroll);
 }
 function begin(event){
  if(event.touches.length!==1){cancel();return;}
  const card=event.target.closest('.task-card');
  if(!card||event.target.closest('button,select,input,textarea,[contenteditable],.task-options'))return;
  finish();const point=event.touches[0];card.draggable=false;
  hold={card,id:point.identifier,x:point.clientX,y:point.clientY,timer:setTimeout(()=>{
   if(!hold||!card.isConnected)return;
   const {id,x,y}=hold;hold=null;drag={card,id,x,y,dayId:activeDayId,sourceId:Number(card.dataset.taskId),target:card};
   suppressUntil=Date.now()+1000;card.classList.add('touch-drag-source');document.body.classList.add('task-touch-dragging');
   const ghost=document.createElement('div');ghost.id='taskTouchGhost';ghost.textContent=card.querySelector('.task-title').textContent;document.body.append(ghost);status.textContent=L('drag');
   move(x,y);frame=requestAnimationFrame(autoscroll);
  },450)};
 }
 grid.addEventListener('touchstart',begin,{passive:true});
 document.addEventListener('touchstart',event=>{if(event.touches.length>1)cancel();},{passive:true});
 document.addEventListener('touchmove',event=>{
  if(event.touches.length!==1){cancel();return;}
  const p=event.touches[0];
  if(hold&&Math.hypot(p.clientX-hold.x,p.clientY-hold.y)>10)clearHold();
  if(!drag||p.identifier!==drag.id)return;
  if(!event.cancelable){cancel();return;}
  event.preventDefault();move(p.clientX,p.clientY);
 },{passive:false});
 document.addEventListener('touchend',event=>{
  clearHold();if(!drag)return;
  const point=[...event.changedTouches].find(p=>p.identifier===drag.id);if(!point)return;
  if(event.cancelable)event.preventDefault();move(point.clientX,point.clientY);
  const source=drag.sourceId,target=Number(drag.target?.dataset.taskId),day=drag.dayId;suppressUntil=Date.now()+650;finish();
  if(day!==activeDayId||!target||source===target)return;
  const next=ProcatsPlanning.reorder(tasks,day,source,target);
  if(canSaveSection('yks_v3_tasks',next)&&appStorage.setItem('yks_v3_tasks',JSON.stringify(next))){tasks=next;renderApp();status.textContent=L('saved');}
 },{passive:false});
 document.addEventListener('touchcancel',cancel,{passive:true});
 grid.addEventListener('contextmenu',event=>{if(hold||drag||Date.now()<suppressUntil)event.preventDefault();});
 grid.addEventListener('click',event=>{if(Date.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
 scrollArea.addEventListener('scroll',()=>{if(hold)clearHold();},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});window.addEventListener('blur',cancel);
 const prior=renderTasks;renderTasks=function(){cancel();prior();grid.querySelectorAll('.task-card').forEach(card=>card.setAttribute('aria-description',L('move')));};
})();
