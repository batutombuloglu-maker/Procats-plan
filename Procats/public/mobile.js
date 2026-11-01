/* Touch navigation uses the existing views and actions; no cloud data is changed. */
(() => {
 const words={
  tr:{knowledge:'Bilgi Hazinesi',lists:'Listeler',home:'Ana sayfa',tasks:'Görevler',obsidian:'Plan',exams:'Denemeler',more:'Diğer',timers:'Sayaç',notes:'Hızlı notlar',bookmarks:'Kaynaklar',archive:'Yaşam arşivi',vault:'Veri kasası',settings:'Ayarlar',close:'Kapat',days:'Günler ve klasörler',pages:'Sayfalar ve klasörler',folder:'Yeni klasör',choose:'Bir gün seç',browse:'Bir sayfa seç',focus:'ODAK ZAMANI',clock:'ŞİMDİ',reflection:'GÜNÜN DÜŞÜNCESİ'},
  en:{knowledge:'Knowledge treasury',lists:'Lists',home:'Home',tasks:'Tasks',obsidian:'Plan',exams:'Exams',more:'More',timers:'Timers',notes:'Quick notes',bookmarks:'Resources',archive:'Life archive',vault:'Data vault',settings:'Settings',close:'Close',days:'Days and folders',pages:'Pages and folders',folder:'New folder',choose:'Choose a day',browse:'Choose a page',focus:'FOCUS TIME',clock:'RIGHT NOW',reflection:'TODAY’S REFLECTION'},
  de:{knowledge:'Wissensschatz',lists:'Listen',home:'Start',tasks:'Aufgaben',obsidian:'Plan',exams:'Prüfungen',more:'Mehr',timers:'Timer',notes:'Kurznotizen',bookmarks:'Ressourcen',archive:'Lebensarchiv',vault:'Datentresor',settings:'Einstellungen',close:'Schließen',days:'Tage und Ordner',pages:'Seiten und Ordner',folder:'Neuer Ordner',choose:'Tag auswählen',browse:'Seite auswählen',focus:'FOKUSZEIT',clock:'JETZT',reflection:'GEDANKE DES TAGES'}
 };
 const text=key=>(words[currentLang]||words.en)[key];
 const mobile=matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 1024px)');
 const iconFor=view=>document.querySelector(`.obsidian-nav [data-action-click="switchView('${view}')"] svg`)?.outerHTML||'';
 const moreIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
 const settingsIcon=document.querySelector('.obsidian-nav [data-action-click="toggleThemeMenu(event)"] svg').outerHTML;
 const header=document.createElement('header');header.className='mobile-header';
 header.innerHTML='<div class="mobile-brand"><img src="/icon-192.png" alt=""><div><span>Procats</span><strong id="mobilePageTitle"></strong></div></div><button id="mobileSettings" type="button">'+settingsIcon+'</button>';
 document.body.append(header);
 const bar=document.createElement('nav');bar.className='mobile-tabs';
 const navModel=ProcatsNavigation;
 let savedTabs;try{savedTabs=JSON.parse(appStorage.getItem(navModel.key)||'null');}catch{}
 let tabs=navModel.normalize(savedTabs),suppressClickUntil=0;
 const navWords={tr:{edit:'Alt barı düzenle',help:'Basılı tutup bir alt bar yuvasına sürükle. Oklarla da sıralayabilir veya Sabitle ile bir yuva seçebilirsin.',pin:'Sabitle',replace:'Yerine sabitle',remove:'Kaldır',left:'Sola taşı',right:'Sağa taşı',reset:'Varsayılanı yükle',saved:'Alt bar kaydedildi',cancel:'Vazgeç',drop:'Bırakarak sabitle'},en:{edit:'Customize bottom tabs',help:'Hold and drag to a bottom tab. You can also use the arrows or Pin to choose a slot.',pin:'Pin',replace:'Replace this tab',remove:'Remove',left:'Move left',right:'Move right',reset:'Restore default',saved:'Tabs saved',cancel:'Cancel',drop:'Drop to pin'},de:{edit:'Untere Leiste anpassen',help:'Gedrückt halten und auf einen Tab ziehen. Alternativ Pfeile oder Anheften verwenden.',pin:'Anheften',replace:'Diesen Tab ersetzen',remove:'Entfernen',left:'Nach links',right:'Nach rechts',reset:'Standard wiederherstellen',saved:'Tabs gespeichert',cancel:'Abbrechen',drop:'Zum Anheften loslassen'}};
 const navText=key=>(navWords[currentLang]||navWords.tr)[key];
 function visibleTabs(){return tabs.filter(v=>v!=='exams'||window.ProcatsPreferences?.get().examsVisible!==false);}
 function activate(view){if(Date.now()<suppressClickUntil)return;if(view==='more')openMore();else if(view==='settings'){closeMore(false);window.ProcatsUI?.settings();}else{closeMore(false);switchView(view);}}
 function renderBar(){bar.replaceChildren();for(const view of visibleTabs()){const b=document.createElement('button');b.type='button';b.dataset.mobileView=view;b.innerHTML=(view==='more'?moreIcon:view==='settings'?settingsIcon:iconFor(view))+'<span></span>';b.onclick=()=>activate(view);b.addEventListener('pointerdown',e=>beginHold(e,view));bar.append(b);}bar.style.gridTemplateColumns='repeat('+visibleTabs().length+',minmax(0,1fr))';}
 renderBar();
 document.body.append(bar);
 document.addEventListener('click',event=>{if(Date.now()<suppressClickUntil&&event.target.closest('.mobile-tabs,.mobile-more-grid')){event.preventDefault();event.stopImmediatePropagation();}},true);
 const overlay=document.createElement('div');overlay.className='modal-overlay mobile-more';overlay.id='mobileMore';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','mobileMoreTitle');
 overlay.innerHTML='<div class="modal-content"><div class="mobile-sheet-heading"><h2 id="mobileMoreTitle"></h2><button type="button" id="mobileMoreClose">×</button></div><div class="mobile-more-grid"></div></div>';
 for(const view of ['home','tasks','obsidian','exams','timers','notes','bookmarks','lists','knowledge','vault']){
  const button=document.createElement('button');button.type='button';button.dataset.mobileTarget=view;button.innerHTML=iconFor(view)+'<span></span>';button.onclick=()=>activate(view);button.addEventListener('pointerdown',e=>beginHold(e,view));overlay.querySelector('.mobile-more-grid').append(button);
 }
 const settings=document.createElement('button');settings.type='button';settings.dataset.mobileTarget='settings';settings.innerHTML=settingsIcon+'<span></span>';settings.onclick=()=>activate('settings');settings.addEventListener('pointerdown',e=>beginHold(e,'settings')); overlay.querySelector('.mobile-more-grid').append(settings);
 document.body.append(overlay);
 let priorFocus=null;
 function openMore(){hideAllMenus();renderEditor();priorFocus=document.activeElement;overlay.classList.add('active');overlay.querySelector('button').focus();}
 function closeMore(restore=true){overlay.classList.remove('active');cancelDrag();if(restore)priorFocus?.focus();}
 document.getElementById('mobileMoreClose').onclick=()=>closeMore();
 overlay.addEventListener('click',event=>{if(event.target===overlay)closeMore();});
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeMore();}
  if(event.key==='Tab'){const buttons=[...overlay.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length);const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 });

 const editButton=document.createElement('button');editButton.type='button';editButton.className='navigation-edit-toggle';overlay.querySelector('.modal-content').append(editButton);
 const editor=document.createElement('section');editor.className='navigation-editor';editor.hidden=true;editor.id='navigationEditor';editButton.setAttribute('aria-controls',editor.id);editButton.setAttribute('aria-expanded','false');overlay.querySelector('.modal-content').append(editor);
 const editHelp=document.createElement('p');editHelp.className='navigation-help';overlay.querySelector('.mobile-more-grid').before(editHelp);
 const announcement=document.createElement('p');announcement.className='navigation-announcement';announcement.setAttribute('role','status');editor.after(announcement);
 let pinCandidate=null;
 function persistTabs(next){if(!navModel.valid(next)||!appStorage.setItem(navModel.key,JSON.stringify(next)))return;tabs=next;renderBar();renderEditor();refresh();announcement.textContent=navText('saved');}
 function control(label,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;return b;}
 function renderEditor(){editor.replaceChildren();const heading=document.createElement('h3');heading.textContent=pinCandidate?navText('pin')+': '+text(pinCandidate):navText('edit');editor.append(heading);
  tabs.forEach((view,index)=>{const row=document.createElement('div');row.className='navigation-slot';const title=document.createElement('span');title.textContent=(index+1)+'. '+text(view);row.append(title);
   if(pinCandidate){const b=control(navText('replace'),()=>{persistTabs(navModel.place(tabs,pinCandidate,index));pinCandidate=null;renderEditor();});b.disabled=view==='more'&&!tabs.includes(pinCandidate)&&tabs.length===5;row.append(b);}
   else{const left=control('←',()=>persistTabs(navModel.place(tabs,view,index-1)));left.setAttribute('aria-label',text(view)+' · '+navText('left'));left.disabled=index===0;const right=control('→',()=>persistTabs(navModel.place(tabs,view,index+1)));right.setAttribute('aria-label',text(view)+' · '+navText('right'));right.disabled=index===tabs.length-1;row.append(left,right);if(view!=='more'){const remove=control('×',()=>persistTabs(navModel.remove(tabs,view)));remove.setAttribute('aria-label',text(view)+' · '+navText('remove'));row.append(remove);}}
   editor.append(row);
  });
  if(pinCandidate){editor.append(control(navText('cancel'),()=>{pinCandidate=null;renderEditor();}));}
  else{const available=document.createElement('div');available.className='navigation-pin-options';for(const view of navModel.allowed.filter(v=>!tabs.includes(v)&&!(v==='exams'&&window.ProcatsPreferences?.get().examsVisible===false))){available.append(control(text(view)+' · '+navText('pin'),()=>{if(tabs.length<5)persistTabs(navModel.place(tabs,view,tabs.length-1));else{pinCandidate=view;renderEditor();}}));}editor.append(available,control(navText('reset'),()=>persistTabs([...navModel.defaults])));}
 }
 editButton.onclick=()=>{editor.hidden=!editor.hidden;pinCandidate=null;editButton.setAttribute('aria-expanded',String(!editor.hidden));renderEditor();};
 let hold=null,drag=null;
 function beginHold(event,view){if(event.button!==0||!mobile.matches)return;const start={x:event.clientX,y:event.clientY,id:event.pointerId,view,target:event.currentTarget};clearTimeout(hold?.timer);hold={...start,timer:setTimeout(()=>{drag=start;hold=null;document.body.classList.add('navigation-dragging');suppressClickUntil=Date.now()+1000;const ghost=document.createElement('div');ghost.id='navigationGhost';ghost.textContent=text(view);document.body.append(ghost);moveGhost(event.clientX,event.clientY);},420)};}
 function moveGhost(x,y){const ghost=document.getElementById('navigationGhost');if(ghost){ghost.style.left=x+'px';ghost.style.top=y+'px';}}
 function targetSlot(x,y){return document.elementFromPoint(x,y)?.closest('.mobile-tabs [data-mobile-view]');}
 function cancelDrag(){clearTimeout(hold?.timer);hold=null;drag=null;document.body.classList.remove('navigation-dragging');document.getElementById('navigationGhost')?.remove();bar.querySelectorAll('.navigation-drop').forEach(b=>b.classList.remove('navigation-drop'));}
 document.addEventListener('pointermove',event=>{if(hold&&Math.hypot(event.clientX-hold.x,event.clientY-hold.y)>10){clearTimeout(hold.timer);hold=null;}if(!drag)return;event.preventDefault();moveGhost(event.clientX,event.clientY);const slot=targetSlot(event.clientX,event.clientY);bar.querySelectorAll('button').forEach(b=>b.classList.toggle('navigation-drop',b===slot));},{passive:false});
 document.addEventListener('pointerup',event=>{if(!drag){cancelDrag();return;}const view=drag.view,slot=targetSlot(event.clientX,event.clientY);suppressClickUntil=Date.now()+500;cancelDrag();if(slot){persistTabs(navModel.place(tabs,view,tabs.indexOf(slot.dataset.mobileView)));}else{pinCandidate=tabs.includes(view)?null:view;editor.hidden=false;editButton.setAttribute('aria-expanded','true');if(!overlay.classList.contains('active'))openMore();renderEditor();}});
 document.addEventListener('pointercancel',cancelDrag);
 document.addEventListener('contextmenu',event=>{if(event.target.closest('.mobile-tabs,.mobile-more-grid'))event.preventDefault();});
 window.ProcatsMobileNavigation={refresh(){try{tabs=navModel.normalize(JSON.parse(appStorage.getItem(navModel.key)||'null'));}catch{}renderBar();renderEditor();refresh();},get:()=>[...tabs]};

 document.getElementById('mobileSettings').onclick=event=>toggleThemeMenu(event);
 for(const [view,sidebarId,key] of [['obsidian','obsSidebar','pages']]){
  const section=document.getElementById('view-'+view),sidebar=document.getElementById(sidebarId);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='mobile-picker';toggle.dataset.picker=view;toggle.setAttribute('aria-controls',sidebarId);toggle.innerHTML='<span></span><b aria-hidden="true">⌄</b>';
  toggle.onclick=()=>{section.classList.toggle('mobile-list-open');refresh();};section.prepend(toggle);
  const folder=document.createElement('button');folder.type='button';folder.className='btn-sidebar-add mobile-folder-add';folder.onclick=()=>openModal(view==='tasks'?'folderModal':'obsFolderModal');sidebar.append(folder);
  // Selecting a record collapses the list, leaving room for editing.
  sidebar.addEventListener('click',event=>{
   if(!mobile.matches||event.target.closest('.three-dots,.folder-header,.checkbox-custom,button'))return;
   if(event.target.closest('.subject-item,.obs-note-item')){section.classList.remove('mobile-list-open');refresh();}
  });
  if(view==='tasks')section.classList.add('mobile-list-open');
  if(view==='obsidian'){
   section.classList.add('mobile-list-open');
   const add=document.createElement('button');add.type='button';add.className='btn-sidebar-add mobile-new-note';add.onclick=()=>{activeObsFolderId=null;openModal('obsNoteModal');};sidebar.append(add);
  }
 }
 const refresh=()=>{
  const view=document.querySelector('.view.active')?.id.replace('view-','')||'home';
  document.getElementById('mobilePageTitle').textContent=text(view);bar.setAttribute('aria-label',text('more'));
  for(const button of bar.querySelectorAll('button')){
   const target=button.dataset.mobileView;button.querySelector('span').textContent=text(target);
   const selected=target===view||(target==='more'&&!visibleTabs().includes(view));button.classList.toggle('active',selected);
   if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  }
  for(const button of overlay.querySelectorAll('[data-mobile-target]')){button.querySelector('span').textContent=text(button.dataset.mobileTarget);button.hidden=button.dataset.mobileTarget==='exams'&&window.ProcatsPreferences?.get().examsVisible===false;}editButton.textContent=navText('edit');editHelp.textContent=navText('help');
  document.getElementById('mobileMoreTitle').textContent=text('more');document.getElementById('mobileMoreClose').setAttribute('aria-label',text('close'));
  document.getElementById('mobileSettings').setAttribute('aria-label',text('settings'));
  for(const [view,key] of [['obsidian','pages']]){
   const section=document.getElementById('view-'+view),toggle=section.querySelector('.mobile-picker');
   const name=view==='tasks'?days.find(item=>item.id===activeDayId)?.name:obsNotes.find(item=>item.id===activeObsNoteId)?.name;
   toggle.querySelector('span').textContent=name||text(key);toggle.setAttribute('aria-expanded',String(section.classList.contains('mobile-list-open')));
   section.querySelector('.mobile-folder-add').textContent='+ '+text('folder');
  }
  document.querySelector('#view-home .stopwatch-widget').dataset.mobileLabel=text('focus');
  document.getElementById('liveClockHome').dataset.mobileLabel=text('clock');
  document.getElementById('homeQuoteContainer').dataset.mobileLabel=text('reflection');
  document.querySelector('.mobile-new-note').textContent='+ '+{tr:'Yeni sayfa',en:'New page',de:'Neue Seite'}[currentLang];
  const table=document.querySelector('.exam-input-table');
  for(const key of ['correct','wrong','blank'])table.style.setProperty('--mobile-'+key,JSON.stringify(t('exam_'+key)));
 };
 new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 new MutationObserver(refresh).observe(document.getElementById('dayList'),{childList:true});
 const viewObserver=new MutationObserver(refresh);
 document.querySelectorAll('.view').forEach(view=>viewObserver.observe(view,{attributes:true,attributeFilter:['class']}));
 mobile.addEventListener('change',()=>{closeMore(false);refresh();});
 window.procatsMobileRefresh=refresh;
 refresh();
})();
