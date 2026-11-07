/* Task planning uses dates; the separate free-form notes folders are unchanged. */
(()=>{'use strict';
 const C=ProcatsCalendarCore,copy={
 tr:{calendar:'Takvim',today:'Bugün',summary:'Özet çıkar',pick:'Planlamak istediğin günü seç.',month:'Ay',year:'Yıl',previous:'Önceki ay',next:'Sonraki ay',close:'Kapat',plan:'Günün planını aç',day:'Günlük',week:'Haftalık',monthly:'Aylık',custom:'Gün seç',selection:'Özete alınacak günler',selected:'gün seçildi',export:'Özeti hazırla',hint:'Eski ay ve yılları yukarıdan seçebilirsin. Aylık özet yalnızca seçilen ayın günlerini içerir; her hafta ayrı sayfadır.',empty:'En az bir gün seç.',limit:'Bir özette en fazla 31 gün seçebilirsin.',planned:'Yeşil yoğunluğu: tamamlanan görev sayısı · ✓ Gün tamamlandı',done:'tamamlandı',missed:'yapılmadı',pending:'bekliyor',copy:'Görevleri başka güne kopyala',target:'Hedef tarih',copied:'Görevler seçtiğin güne kopyalandı.',invalid:'Geçerli bir tarih seç.',progress:'Seçili gündeki ilerleme',range:'Seçili günler'},
 en:{calendar:'Calendar',today:'Today',summary:'Export summary',pick:'Choose a day to plan.',month:'Month',year:'Year',previous:'Previous month',next:'Next month',close:'Close',plan:'Open day plan',day:'Day',week:'Week',monthly:'Month',custom:'Pick days',selection:'Days in your summary',selected:'days selected',export:'Create summary',hint:'Weeks start on Monday. Pick days to select multiple dates.',empty:'Select at least one day.',limit:'Select up to 31 days per summary.',planned:'Green intensity: completed tasks · ✓ Day complete',done:'completed',missed:'not done',pending:'pending',copy:'Copy tasks to another day',target:'Target date',copied:'Tasks copied to the selected day.',invalid:'Choose a valid date.',progress:'Selected day progress',range:'Selected days'},
 de:{calendar:'Kalender',today:'Heute',summary:'Übersicht erstellen',pick:'Wähle einen Tag zum Planen.',month:'Monat',year:'Jahr',previous:'Vorheriger Monat',next:'Nächster Monat',close:'Schließen',plan:'Tagesplan öffnen',day:'Tag',week:'Woche',monthly:'Monat',custom:'Tage wählen',selection:'Tage für die Übersicht',selected:'Tage ausgewählt',export:'Übersicht erstellen',hint:'Die Woche beginnt montags. Mit Tage wählen sind mehrere Daten möglich.',empty:'Wähle mindestens einen Tag.',limit:'Wähle höchstens 31 Tage je Übersicht.',planned:'Grünstärke: erledigte Aufgaben · ✓ Tag abgeschlossen',done:'erledigt',missed:'nicht erledigt',pending:'offen',copy:'Aufgaben in einen anderen Tag kopieren',target:'Zieldatum',copied:'Aufgaben zum gewählten Tag kopiert.',invalid:'Wähle ein gültiges Datum.',progress:'Fortschritt des gewählten Tages',range:'Ausgewählte Tage'}};
 const L=k=>(globalThis.ProcatsLocale?.messages(copy,currentLang) || copy[currentLang]||copy.tr)[k],E=escapeHtml;
 let selected=C.dateKey(new Date()),visible=C.month(selected),mode='day',exporting=false,chosen=new Set([selected]),returnFocus=null;
 days=C.normalize(days,selected);
 const section=document.getElementById('view-tasks'),toolbar=document.createElement('section');toolbar.className='calendar-toolbar';
 toolbar.innerHTML='<div class="calendar-actions"><button type="button" id="calendarOpen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/></svg><span></span><b>⌄</b></button><button type="button" id="calendarToday"></button><button type="button" id="calendarSummary"></button></div><nav class="calendar-week-strip"></nav>';
 section.prepend(toolbar);
 const modal=document.createElement('div');modal.id='calendarModal';modal.className='modal-overlay';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','calendarTitle');
 modal.innerHTML='<section class="calendar-panel"><header><div><small>PROCATS</small><h2 id="calendarTitle"></h2></div><button type="button" id="calendarClose">×</button></header><p id="calendarHint"></p><div class="calendar-modes" role="group"></div><div class="calendar-month-controls"><button type="button" id="calendarPrev">‹</button><label><span class="sr-only" id="calendarMonthLabel"></span><select id="calendarMonth"></select></label><label><span class="sr-only" id="calendarYearLabel"></span><input id="calendarYear" type="number" min="1" max="9999" inputmode="numeric"></label><button type="button" id="calendarNext">›</button></div><div class="calendar-weekdays" aria-hidden="true"></div><div class="calendar-grid" role="group"></div><div class="calendar-legend"><div class="calendar-scale" aria-hidden="true"><i data-heat="1"></i><i data-heat="2"></i><i data-heat="3"></i><i data-heat="4"></i><i data-heat="5"></i></div><span></span></div><p id="calendarSelection" role="status"></p><p id="calendarError" role="alert"></p><footer><button type="button" id="calendarModalToday"></button><button type="button" id="calendarConfirm"></button></footer></section>';
 document.body.append(modal);
 const $=id=>document.getElementById(id),active=()=>days.find(d=>d.id===activeDayId),forDate=key=>{const ids=new Set(days.filter(d=>d.date===key).map(d=>d.id));return tasks.filter(t=>ids.has(t.dayId));};
 function progress(button,stats){button.dataset.heat=C.heat(stats.done);button.classList.toggle('day-complete',stats.total>0&&stats.done===stats.total);if(stats.total>0&&stats.done===stats.total){const tick=document.createElement('em');tick.className='calendar-tick';tick.setAttribute('aria-hidden','true');tick.textContent='✓';button.append(tick);}}
 function ensure(key){let day=days.find(d=>d.date===key);if(!day){day={id:C.id(key),name:key,date:key,folderId:null,completed:false};while(days.some(d=>d.id===day.id))day.id=createId();days.push(day);}return day;}
 function select(key,{persist=true}={}){if(!C.parse(key))return;selected=key;visible=C.month(key);activeDayId=ensure(key).id;if(persist)renderApp();else renderToolbar();}
 function close(){closeDayMenu();modal.classList.remove('active');returnFocus?.focus();}
 function updateSelection(key){selected=key;if(mode==='week')chosen=new Set(C.week(key));else if(mode==='monthly')chosen=new Set(C.monthDays(key));else if(mode==='day')chosen=new Set([key]);else if(chosen.has(key))chosen.delete(key);else if(chosen.size<31)chosen.add(key);else $('calendarError').textContent=L('limit');}
 function open(summary=false){closeDayMenu();hideAllMenus();returnFocus=document.activeElement;exporting=summary;selected=active()?.date||selected;visible=C.month(selected);mode=summary?'week':'day';updateSelection(selected);modal.classList.add('active');renderModal();$('calendarClose').focus();}
 function renderModal(){
  $('calendarTitle').textContent=L(exporting?'summary':'calendar');$('calendarHint').textContent=L(exporting?'hint':'pick');$('calendarClose').setAttribute('aria-label',L('close'));$('calendarPrev').setAttribute('aria-label',L('previous'));$('calendarNext').setAttribute('aria-label',L('next'));$('calendarPrev').disabled=!C.month(visible,-1);$('calendarNext').disabled=!C.month(visible,1);
  $('calendarMonthLabel').textContent=L('month');$('calendarYearLabel').textContent=L('year');$('calendarMonth').setAttribute('aria-label',L('month'));$('calendarYear').setAttribute('aria-label',L('year'));
  $('calendarMonth').replaceChildren();for(let m=0;m<12;m++){const option=document.createElement('option');option.value=m;option.textContent=new Date(2024,m,1).toLocaleDateString(currentLang,{month:'long'});$('calendarMonth').append(option);}
  $('calendarMonth').value=C.parse(visible).getMonth();$('calendarYear').value=C.parse(visible).getFullYear();
  const modes=modal.querySelector('.calendar-modes');modes.replaceChildren();modes.hidden=!exporting;modes.setAttribute('aria-label',L('selection'));for(const value of ['day','week','monthly','custom']){const b=document.createElement('button');b.type='button';b.textContent=L(value);b.setAttribute('aria-pressed',String(mode===value));b.onclick=()=>{mode=value;chosen=new Set();updateSelection(mode==='monthly'||C.month(selected)!==visible?visible:selected);renderModal();};modes.append(b);}
  const weekdays=modal.querySelector('.calendar-weekdays');weekdays.replaceChildren();for(let i=0;i<7;i++){const el=document.createElement('span');el.textContent=new Date(2024,0,1+i).toLocaleDateString(currentLang,{weekday:'short'});el.classList.toggle('weekend',i>4);weekdays.append(el);}
  const grid=modal.querySelector('.calendar-grid');grid.setAttribute('aria-label',C.format(visible,currentLang,{month:'long',year:'numeric'}));grid.replaceChildren();
  for(const key of C.grid(visible)){if(!key){grid.append(document.createElement('span'));continue;}const b=document.createElement('button');b.type='button';b.dataset.date=key;const stats=C.stats(forDate(key));b.className='calendar-day';b.classList.toggle('weekend',[0,6].includes(C.parse(key).getDay()));b.classList.toggle('outside',key.slice(0,7)!==visible.slice(0,7));b.classList.toggle('has-plan',stats.total>0);b.classList.toggle('today',key===C.dateKey(new Date()));b.setAttribute('aria-pressed',String(chosen.has(key)));if(key===C.dateKey(new Date()))b.setAttribute('aria-current','date');b.setAttribute('aria-label',C.format(key,currentLang)+(stats.total?`, ${stats.done} ${L('done')}, ${stats.missed} ${L('missed')}, ${stats.pending} ${L('pending')}`:''));b.innerHTML=`<span>${Number(key.slice(-2))}</span><small>${stats.total?(stats.done+'/'+stats.total):' '}</small>`;progress(b,stats);b.onclick=()=>{$('calendarError').textContent='';updateSelection(key);if(key.slice(0,7)!==visible.slice(0,7))visible=C.month(key);renderModal();modal.querySelector(`[data-date="${key}"]`)?.focus();};bindDayMenu(b,key);grid.append(b);}
  const ordered=[...chosen].sort(),short=key=>C.format(key,currentLang,{day:'numeric',month:'short',year:'numeric'});
  modal.querySelector('.calendar-legend span').textContent=L('planned');$('calendarSelection').textContent=exporting?`${chosen.size} ${L('selected')}${ordered.length?' · '+short(ordered[0])+(ordered.length>1?' – '+short(ordered.at(-1)):''):''}`:C.format(selected,currentLang);$('calendarConfirm').textContent=L(exporting?'export':'plan');$('calendarConfirm').disabled=!chosen.size;$('calendarModalToday').textContent=L('today');
 }
 function renderToolbar(){const current=active(),day=C.parse(current?.date)?current.date:selected;if(!modal.classList.contains('active'))selected=day;$('calendarOpen').querySelector('span').textContent=L('calendar')+' · '+C.format(day,currentLang,{month:'long',year:'numeric'});$('calendarToday').textContent=L('today');$('calendarSummary').textContent=L('summary');const strip=toolbar.querySelector('nav');strip.setAttribute('aria-label',L('week'));strip.replaceChildren();for(const key of C.week(day)){const stats=C.stats(forDate(key)),b=document.createElement('button');b.type='button';b.dataset.date=key;b.classList.toggle('selected',key===day);b.classList.toggle('outside',key.slice(0,7)!==day.slice(0,7));b.classList.toggle('weekend',[0,6].includes(C.parse(key).getDay()));b.classList.toggle('has-plan',forDate(key).length>0);b.setAttribute('aria-label',C.format(key,currentLang)+(stats.total?`, ${stats.done} ${L('done')}, ${stats.missed} ${L('missed')}, ${stats.pending} ${L('pending')}`:''));b.setAttribute('aria-pressed',String(key===day));b.innerHTML=`<span>${E(C.format(key,currentLang,{weekday:'short'}))}</span><strong>${Number(key.slice(-2))}</strong><i></i>`;progress(b,stats);b.onclick=()=>{select(key);section.querySelector('.main-content').scrollTop=0;};bindDayMenu(b,key);strip.append(b);}}
 $('calendarOpen').onclick=()=>open();$('calendarSummary').onclick=()=>open(true);$('calendarToday').onclick=()=>select(C.dateKey(new Date()));$('calendarClose').onclick=close;
 for(const [id,offset]of [['calendarPrev',-1],['calendarNext',1]])$(id).onclick=()=>{const next=C.month(visible,offset);if(next){visible=next;if(exporting&&mode!=='custom')updateSelection(next);renderModal();}};
 function changeMonth(){const year=Number($('calendarYear').value),month=Number($('calendarMonth').value)+1,key=`${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-01`;if(!Number.isInteger(year)||!C.parse(key)){ $('calendarError').textContent=L('invalid');return;}visible=key;if(exporting&&mode!=='custom')updateSelection(key);$('calendarError').textContent='';renderModal();}
 $('calendarMonth').onchange=changeMonth;$('calendarYear').onchange=changeMonth;
 $('calendarModalToday').onclick=()=>{selected=C.dateKey(new Date());visible=C.month(selected);if(mode==='custom'){if(!chosen.has(selected)&&chosen.size<31)chosen.add(selected);}else updateSelection(selected);renderModal();};
 $('calendarConfirm').onclick=()=>{if(!chosen.size)return;if(!exporting){select(selected);close();return;}const keys=[...chosen].sort(),name=mode==='monthly'?C.format(keys[0],currentLang,{month:'long',year:'numeric'}):keys.length===1?C.format(keys[0],currentLang):`${C.format(keys[0],currentLang)} – ${C.format(keys.at(-1),currentLang)}`;const snapshot=C.snapshot(keys,days,tasks,name,currentLang);snapshot.period=mode;close();void ProcatsWeekly.openSnapshot(snapshot);};
 modal.onclick=e=>{if(e.target===modal)close();};modal.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const nodes=[...modal.querySelectorAll('button,input,select')].filter(n=>!n.disabled&&n.getClientRects().length),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}if(e.target.matches('.calendar-day')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const key=C.add(e.target.dataset.date,{ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key]);if(key){if(!modal.querySelector(`[data-date="${key}"]`)){visible=C.month(key);renderModal();}modal.querySelector(`[data-date="${key}"]`)?.focus();}}});
 const dayWords={
  tr:{copy:'Günü kopyala',paste:'Yapıştır',tasks:'görev',copied:'Günün görevleri kopyalandı. Başka bir güne yapıştırabilirsin.',pasted:'Günün görevleri kopyaladığın planla değiştirildi.',help:'Bu gündeki görevler kaldırılır ve kopyaladığın görevler yerlerine gelir.',error:'Yapıştırılamadı. Kayıt sınırını veya eşitleme durumunu kontrol edip tekrar dene.',menu:'Gün işlemleri'},
  en:{copy:'Copy day',paste:'Paste',tasks:'tasks',copied:'Day copied. You can paste into another day.',pasted:'Day replaced with the copied tasks.',help:'Replaces all tasks in this day with the copied tasks.',error:'Could not paste. Check the storage limit or sync status and try again.',menu:'Day actions'},
  de:{copy:'Tag kopieren',paste:'Einfügen',tasks:'Aufgaben',copied:'Tag kopiert. Du kannst ihn an einem anderen Tag einfügen.',pasted:'Tag durch die kopierten Aufgaben ersetzt.',help:'Ersetzt alle Aufgaben dieses Tages durch die kopierten Aufgaben.',error:'Einfügen fehlgeschlagen. Speichergrenze oder Synchronisierung prüfen und erneut versuchen.',menu:'Tagesaktionen'}
 },D=k=>(globalThis.ProcatsLocale?.messages(dayWords,currentLang) || dayWords[currentLang]||dayWords.tr)[k];
 let clipboard=null,menuReturn=null,holdDay=null,suppressDayUntil=0,toastTimer;
 const dayMenu=document.createElement('div');dayMenu.className='calendar-day-menu';dayMenu.hidden=true;dayMenu.setAttribute('role','menu');
 const toast=document.createElement('div');toast.className='planning-toast';toast.setAttribute('role','status');toast.hidden=true;document.body.append(dayMenu,toast);
 function announce(message){clearTimeout(toastTimer);toast.textContent=message;toast.hidden=false;toastTimer=setTimeout(()=>toast.hidden=true,4200);}
 function closeDayMenu(restore=false){dayMenu.hidden=true;if(restore&&menuReturn?.isConnected)menuReturn.focus();}
 function openDayMenu(button,key,x,y){
  if(exporting&&modal.classList.contains('active'))return;
  clearTimeout(holdDay?.timer);holdDay=null;hideAllMenus();menuReturn=button;
  (modal.classList.contains('active')?modal.querySelector('.calendar-panel'):document.body).append(dayMenu);
  dayMenu.replaceChildren();dayMenu.setAttribute('aria-label',D('menu'));dayMenu.hidden=false;
  const title=document.createElement('strong');title.textContent=C.format(key,currentLang,{day:'numeric',month:'long',year:'numeric'});dayMenu.append(title);
  const source=forDate(key),copyButton=document.createElement('button');copyButton.type='button';copyButton.setAttribute('role','menuitem');copyButton.textContent=D('copy')+' · '+source.length+' '+D('tasks');copyButton.disabled=!source.length;
  copyButton.onclick=()=>{clipboard={date:key,tasks:JSON.parse(JSON.stringify(forDate(key)))};closeDayMenu(true);announce(D('copied'));};dayMenu.append(copyButton);
  if(clipboard?.tasks.length){
   const pasteButton=document.createElement('button');pasteButton.type='button';pasteButton.setAttribute('role','menuitem');pasteButton.textContent=D('paste')+' · '+clipboard.tasks.length+' '+D('tasks');pasteButton.disabled=clipboard.date===key;
   pasteButton.onclick=()=>{
    try{
     if(dataImportPending||['yks_v3_days','yks_v3_tasks'].some(k=>blockedStorageKeys.has(k)))throw Error('Storage locked');
     const next=ProcatsPlanning.paste(days,tasks,clipboard.tasks,key,createId);if(!next)return;
     ProcatsSync.commitSections({yks_v3_days:next.days,yks_v3_tasks:next.tasks});
     days=next.days;tasks=next.tasks;closeDayMenu();
     if(modal.classList.contains('active')){updateSelection(key);visible=C.month(key);renderApp();renderModal();modal.querySelector(`[data-date="${key}"]`)?.focus();}
     else{activeDayId=next.dayId;select(key);toolbar.querySelector(`[data-date="${key}"]`)?.focus();}
     announce(D('pasted'));
    }catch{closeDayMenu(true);announce(D('error'));}
   };dayMenu.append(pasteButton);
   const hint=document.createElement('p');hint.textContent=D('help');dayMenu.append(hint);
  }
  dayMenu.style.left='8px';dayMenu.style.top='8px';const r=dayMenu.getBoundingClientRect();
  dayMenu.style.left=Math.max(8,Math.min(x,innerWidth-r.width-8))+'px';dayMenu.style.top=Math.max(8,Math.min(y,innerHeight-r.height-8))+'px';
  dayMenu.tabIndex=-1;(dayMenu.querySelector('button:not(:disabled)')||dayMenu).focus();
 }
 function cancelDayHold(){clearTimeout(holdDay?.timer);holdDay=null;}
 function bindDayMenu(button,key){
  if(exporting&&button.classList.contains('calendar-day'))return;
  button.setAttribute('aria-haspopup','menu');
  button.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();openDayMenu(button,key,e.clientX,e.clientY);});
  button.addEventListener('keydown',e=>{if(e.key==='ContextMenu'||e.shiftKey&&e.key==='F10'){e.preventDefault();e.stopPropagation();const r=button.getBoundingClientRect();openDayMenu(button,key,r.left,r.bottom);}});
  button.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.button!==0)return;cancelDayHold();holdDay={id:e.pointerId,x:e.clientX,y:e.clientY,timer:setTimeout(()=>{suppressDayUntil=Date.now()+1000;openDayMenu(button,key,e.clientX,e.clientY);},450)};});
  button.addEventListener('click',e=>{if(Date.now()<suppressDayUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
 }
 document.addEventListener('pointermove',e=>{if(holdDay&&(e.pointerId!==holdDay.id||Math.hypot(e.clientX-holdDay.x,e.clientY-holdDay.y)>10))cancelDayHold();});
 document.addEventListener('pointerup',cancelDayHold);document.addEventListener('pointercancel',cancelDayHold);
 document.addEventListener('pointerdown',e=>{if(!dayMenu.hidden&&!dayMenu.contains(e.target))closeDayMenu();},true);
 document.addEventListener('scroll',e=>{if(!dayMenu.contains(e.target))closeDayMenu();cancelDayHold();},true);
 window.addEventListener('resize',()=>{closeDayMenu();cancelDayHold();});
 dayMenu.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeDayMenu(true);}
  if(e.key==='Tab'){e.preventDefault();e.stopPropagation();closeDayMenu(true);}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const nodes=[...dayMenu.querySelectorAll('button:not(:disabled)')];if(!nodes.length)return;const index=nodes.indexOf(document.activeElement);nodes[e.key==='Home'?0:e.key==='End'?nodes.length-1:(index+(e.key==='ArrowDown'?1:-1)+nodes.length)%nodes.length].focus();}
 });

 renderDays=function(){renderToolbar();};
 const oldTasks=renderTasks;renderTasks=function(){oldTasks();const day=active();if(day?.date){$('activeMainTitle').textContent=C.format(day.date,currentLang,{weekday:'long',day:'numeric',month:'long'});$('activeSubTitle').textContent=day.date.slice(0,4);}};
 const originalRemote=window.procatsApplyRemote;window.procatsApplyRemote=function(previous,data){const activeDate=active()?.date;originalRemote(previous,data);days=C.normalize(days,C.dateKey(new Date()));const current=days.find(d=>d.date===activeDate);if(current)activeDayId=current.id;renderToolbar();renderTasks();if(modal.classList.contains('active'))renderModal();};
 for(const lang of Object.keys(copy))dict[lang].progress_text=copy[lang].progress;
 window.ProcatsCalendar={open,close,select,format:key=>C.format(key,currentLang),get selected(){return selected;},refresh:renderToolbar};
 select(selected,{persist:false});
 new MutationObserver(()=>{renderToolbar();if(modal.classList.contains('active'))renderModal();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
