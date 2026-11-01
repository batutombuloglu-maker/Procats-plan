/* Only checklist rows move; short swipes retain native scrolling. */
(()=>{'use strict';
 const root=document.getElementById('view-lists'),scrollArea=root.querySelector('.lists-main'),sidebar=root.querySelector('.lists-sidebar');
 const rowAt=target=>target.closest('.lists-item')||target.closest('.lists-group-row');
 const idOf=row=>Number(row.dataset.itemId||row.dataset.listId);
 let hold=null,drag=null,mouse=null,frame=0,suppressUntil=0;
 function clearHold(){clearTimeout(hold?.timer);hold=null;}
 function finish(commit=false){
  clearHold();mouse=null;cancelAnimationFrame(frame);frame=0;if(!drag)return;
  const active=drag,ids=[...active.parent.children].map(idOf);drag=null;
  active.row.classList.remove('lists-drag-source');active.row.draggable=true;active.ghost?.remove();root.classList.remove('lists-dragging');suppressUntil=Date.now()+600;
  if(!commit||!(active.kind==='list'?ProcatsListsUI.reorderLists(ids):ProcatsListsUI.reorder(ids)))for(const id of active.original){const row=active.parent.querySelector(`[data-${active.kind==='list'?'list':'item'}-id="${id}"]`);if(row)active.parent.append(row);}
 }
 function position(x,y){
  if(!drag)return;drag.x=x;drag.y=y;
  if(drag.ghost){drag.ghost.style.left=Math.max(12,Math.min(x,innerWidth-12))+'px';drag.ghost.style.top=Math.max(24,y-28)+'px';}
  const bounds=(drag?.area||scrollArea).getBoundingClientRect();if(x<bounds.left||x>bounds.right)return;
  const before=[...drag.parent.children].find(row=>row!==drag.row&&y<row.getBoundingClientRect().top+row.getBoundingClientRect().height/2);
  drag.parent.insertBefore(drag.row,before||null);
 }
 function scroll(){
  if(!drag)return;if(!drag.row.isConnected||!root.classList.contains('active')){finish();return;}
  const r=drag.area.getBoundingClientRect(),edge=65,speed=drag.y<r.top+edge?-Math.min(13,(r.top+edge-drag.y)/4):drag.y>r.bottom-edge?Math.min(13,(drag.y-r.bottom+edge)/4):0;
  if(speed){drag.area.scrollTop+=speed;position(drag.x,drag.y);}frame=requestAnimationFrame(scroll);
 }
 function begin(row,x,y,touchId=null){
  clearHold();const kind=row.dataset.listId?'list':'item',parent=row.closest(kind==='list'?'.lists-nav':'.lists-items');if(!parent)return;
  drag={row,parent,kind,area:kind==='list'?sidebar:scrollArea,original:[...parent.children].map(idOf),x,y,touchId,ghost:null};row.classList.add('lists-drag-source');root.classList.add('lists-dragging');
  if(touchId!==null){row.draggable=false;const ghost=document.createElement('div');ghost.className='lists-drag-ghost';ghost.textContent=row.querySelector(kind==='list'?'.lists-choice-title':'.lists-item-title').textContent;document.body.append(ghost);drag.ghost=ghost;position(x,y);}
  frame=requestAnimationFrame(scroll);
 }
 root.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||!e.target.closest('.lists-drag-handle'))return;e.preventDefault();const row=rowAt(e.target);mouse={row,x:e.clientX,y:e.clientY};e.target.focus();});
 document.addEventListener('pointermove',e=>{if(!mouse)return;if(!drag&&Math.hypot(e.clientX-mouse.x,e.clientY-mouse.y)>5)begin(mouse.row,mouse.x,mouse.y);if(drag){e.preventDefault();position(e.clientX,e.clientY);}});
 document.addEventListener('pointerup',e=>{if(!mouse)return;const bounds=(drag?.area||scrollArea).getBoundingClientRect();finish(!!drag&&e.clientX>=bounds.left&&e.clientX<=bounds.right&&e.clientY>=bounds.top&&e.clientY<=bounds.bottom);});
 document.addEventListener('pointercancel',()=>finish());
 root.addEventListener('dragstart',e=>{const row=rowAt(e.target);if(!row||e.target.closest('input,summary,.lists-options')){e.preventDefault();return;}begin(row,e.clientX,e.clientY);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(idOf(row)));});
 root.addEventListener('dragover',e=>{if(!drag||drag.touchId!==null)return;e.preventDefault();e.dataTransfer.dropEffect='move';position(e.clientX,e.clientY);});
 root.addEventListener('drop',e=>{if(!drag||drag.touchId!==null)return;e.preventDefault();position(e.clientX,e.clientY);finish(true);});
 root.addEventListener('dragend',()=>finish());
 root.addEventListener('touchstart',e=>{
  if(e.touches.length!==1){finish();return;}const row=rowAt(e.target);if(!row||e.target.closest('input,summary,.lists-options'))return;
  clearHold();const p=e.touches[0];hold={row,x:p.clientX,y:p.clientY,id:p.identifier,timer:setTimeout(()=>{if(!hold||!row.isConnected)return;const p=hold;begin(row,p.x,p.y,p.id);suppressUntil=Date.now()+1000;},400)};
 },{passive:true});
 document.addEventListener('touchstart',e=>{if(e.touches.length>1)finish();},{passive:true});
 document.addEventListener('touchmove',e=>{
  if(e.touches.length!==1){finish();return;}const p=e.touches[0];if(hold&&Math.hypot(p.clientX-hold.x,p.clientY-hold.y)>10)clearHold();
  if(!drag||p.identifier!==drag.touchId)return;if(!e.cancelable){finish();return;}e.preventDefault();position(p.clientX,p.clientY);
 },{passive:false});
 document.addEventListener('touchend',e=>{clearHold();if(!drag||drag.touchId===null)return;const p=[...e.changedTouches].find(p=>p.identifier===drag.touchId);if(!p)return;if(e.cancelable)e.preventDefault();position(p.clientX,p.clientY);const bounds=drag.area.getBoundingClientRect();finish(p.clientX>=bounds.left&&p.clientX<=bounds.right&&p.clientY>=bounds.top&&p.clientY<=bounds.bottom);},{passive:false});
 document.addEventListener('touchcancel',()=>finish(),{passive:true});
 root.addEventListener('click',e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
 root.addEventListener('contextmenu',e=>{if(hold||drag||Date.now()<suppressUntil)e.preventDefault();});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();finish();}});
 sidebar.addEventListener('scroll',()=>{if(hold)clearHold();},{passive:true});
 scrollArea.addEventListener('scroll',()=>{if(hold)clearHold();},{passive:true});
 window.addEventListener('blur',()=>finish());document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
 window.ProcatsListsDrag={cancel:()=>finish()};
})();
