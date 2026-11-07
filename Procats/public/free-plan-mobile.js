/* Mobile presentation of the existing free-plan data and editor. */
(()=>{'use strict';
 const section=document.getElementById('view-obsidian'),sidebar=document.getElementById('obsSidebar'),empty=document.getElementById('obsEmptyState');
 const media=matchMedia('(max-width:760px), (pointer:coarse) and (max-width:1024px)');
 const words={tr:{title:'Düşüncelerine yer aç.',help:'Planlarını, fikirlerini ve uzun notlarını kendi sayfalarında tut.',create:'Yeni sayfa',pages:'Sayfalarım',blank:'Henüz not yazılmadı'},en:{title:'Make room for your thoughts.',help:'Keep plans, ideas and longer notes in your own pages.',create:'New page',pages:'My pages',blank:'No notes yet'},de:{title:'Platz für deine Gedanken.',help:'Pläne, Ideen und längere Notizen auf eigenen Seiten festhalten.',create:'Neue Seite',pages:'Meine Seiten',blank:'Noch keine Notizen'}};
 const L=k=>(globalThis.ProcatsLocale?.messages(words,currentLang) || words[currentLang]||words.tr)[k];
 const heading=document.createElement('div');heading.className='free-plan-mobile-heading';heading.innerHTML='<span></span><small></small>';sidebar.prepend(heading);
 const detail=document.createElement('div');detail.className='free-plan-mobile-intro';const title=document.createElement('h2'),help=document.createElement('p'),add=document.createElement('button');add.type='button';add.onclick=()=>{activeObsFolderId=null;openModal('obsNoteModal');};detail.append(title,help,add);empty.append(detail);
 function refresh(){
  title.textContent=L('title');help.textContent=L('help');add.textContent='+ '+L('create');heading.querySelector('span').textContent=L('pages');heading.querySelector('small').textContent=obsNotes.length;
  const nodes=[...sidebar.querySelectorAll('.subject-item')];
  // The list is built in folder order; match the existing label, without touching content.
  for(const node of nodes){const info=node.querySelector('.subject-info'),label=info?.querySelector('span:not(.icon)');if(!label)continue;const idAction=node.querySelector('.three-dots')?.getAttribute('data-action-click'),id=Number(idAction?.match(/,\s*(\d+)\)/)?.[1]),note=obsNotes.find(n=>n.id===id);node.querySelector('.free-plan-preview')?.remove();const preview=document.createElement('small');preview.className='free-plan-preview';preview.textContent=note?.content?.trim().replace(/\s+/g,' ').slice(0,90)||L('blank');label.append(preview);}
  // This dialog edits free-plan pages, not dated task days.
  if(media.matches){const modal=document.getElementById('obsNoteModal');modal.querySelector('.modal-title').textContent={tr:'Serbest Plan sayfası',en:'Free-plan page',de:'Freie Planungsseite'}[currentLang];modal.querySelector('.input-label').textContent={tr:'Sayfa adı',en:'Page name',de:'Seitenname'}[currentLang];}
  window.procatsMobileRefresh?.();
 }
 const previousRender=renderObsidian;renderObsidian=function(){previousRender();refresh();};
 const previousSave=saveObsNote;saveObsNote=function(){
  const before=new Set(obsNotes.map(n=>n.id));previousSave();const created=obsNotes.find(n=>!before.has(n.id));
  if(created&&media.matches){activeObsNoteId=created.id;renderObsEditor();renderObsidian();section.classList.remove('mobile-list-open');window.procatsMobileRefresh?.();document.getElementById('obsEditorArea').focus();}
 };
 new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 new MutationObserver(()=>{if(section.classList.contains('mobile-list-open'))refresh();}).observe(section,{attributes:true,attributeFilter:['class']});refresh();
})();
