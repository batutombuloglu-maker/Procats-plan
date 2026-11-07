/* Render selected calendar weeks locally without changing records. */
(() => {
 const labels={
  tr:{menu:'Özet çıkar · PNG / PDF',title:'Plan özeti',download:'PNG indir',share:'Paylaş',close:'Kapat',loading:'Özet hazırlanıyor…',empty:'Bu klasörde henüz gün yok.',noTasks:'Görev eklenmemiş.',excluded:'Seçim dışında',done:'Tamamlandı',missed:'Yapılmadı',pending:'Bekliyor',days:'gün',tasks:'görev',rating:'Değerlendirme',hint:'Seçtiğin tarihler, görevler, durumları ve /10 değerlendirmeleri.',failed:'Görsel oluşturulamadı. Tekrar dene.',large:'Bu seçim tek bir okunaklı görsel için çok büyük. Daha az gün seçip tekrar dene.',created:'Oluşturulma',footer:'Görevlerin kayıtlı durumu',preview:'Haftalık görev özeti önizlemesi'},
  en:{menu:'Export summary · PNG / PDF',title:'Plan summary',download:'Download PNG',share:'Share',close:'Close',loading:'Preparing your summary…',empty:'This folder has no days yet.',noTasks:'No tasks added.',excluded:'Outside selection',done:'Completed',missed:'Not done',pending:'Pending',days:'days',tasks:'tasks',rating:'Rating',hint:'Selected dates, tasks, their status and /10 ratings.',failed:'Unable to create the image. Try again.',large:'This selection is too large for one readable image. Select fewer days and try again.',created:'Created',footer:'Recorded task status',preview:'Weekly task summary preview'},
  de:{menu:'Übersicht exportieren · PNG / PDF',title:'Planübersicht',download:'PNG herunterladen',share:'Teilen',close:'Schließen',loading:'Übersicht wird erstellt…',empty:'Dieser Ordner enthält noch keine Tage.',noTasks:'Keine Aufgaben vorhanden.',excluded:'Nicht ausgewählt',done:'Erledigt',missed:'Nicht erledigt',pending:'Offen',days:'Tage',tasks:'Aufgaben',rating:'Bewertung',hint:'Ausgewählte Tage, Aufgaben, Status und /10-Bewertungen.',failed:'Das Bild konnte nicht erstellt werden. Versuche es erneut.',large:'Die Auswahl ist zu groß für ein lesbares Bild. Wähle weniger Tage.',created:'Erstellt',footer:'Gespeicherter Aufgabenstatus',preview:'Vorschau der Wochenübersicht'}
 };
 for(const lang of Object.keys(labels))dict[lang].ctx_summary=labels[lang].menu;
 const words=lang=>globalThis.ProcatsLocale?.messages(labels,lang) || labels[lang]||labels.en;
 const font='ProcatsReport, sans-serif';let fontsReady;
 async function fonts(){return fontsReady||=(async()=>{for(const [file,weight]of [['regular','400'],['bold','700']]){const f=new FontFace('ProcatsReport',`url(/report-assets/${file}.ttf)`,{weight});document.fonts.add(await f.load());}})();}
 function recordContext(ctx){const commands=[];let shape=null;const rect=ctx.fillRect.bind(ctx);ctx.fillRect=(x,y,w,h)=>{commands.push({type:'rect',x,y,w,h,r:0,color:ctx.fillStyle});rect(x,y,w,h);};const round=ctx.roundRect.bind(ctx);ctx.roundRect=(x,y,w,h,r)=>{shape={type:'rect',x,y,w,h,r};round(x,y,w,h,r);};const fill=ctx.fill.bind(ctx);ctx.fill=()=>{if(shape){commands.push({...shape,color:ctx.fillStyle});shape=null;}fill();};const text=ctx.fillText.bind(ctx);ctx.fillText=(value,x,y)=>{const size=Number(ctx.font.match(/([\d.]+)px/)[1]),bold=/^(600|650|700|750|800|bold)/.test(ctx.font);commands.push({type:'text',text:String(value),x:ctx.textAlign==='right'?x-ctx.measureText(value).width:x,y,size,bold,color:ctx.fillStyle});text(value,x,y);};return commands;}

 function wrap(ctx,text,width,size,weight=400){
  ctx.font=`${weight} ${size}px ${font}`;
  const lines=[];
  for(const paragraph of String(text??'').replace(/\r\n?/g,'\n').split('\n')){
   let line='';
   for(const word of paragraph.split(/\s+/u)){
    const candidate=line?line+' '+word:word;
    if(ctx.measureText(candidate).width<=width){line=candidate;continue;}
    if(line){lines.push(line);line='';}
    for(const char of word){if(line&&ctx.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}
   }
   lines.push(line);
  }
  return lines;
 }
 function palette(){const css=getComputedStyle(document.documentElement);return Object.fromEntries(['bg-main','bg-card','bg-nav','text-main','text-secondary','accent-color','accent-success','accent-danger'].map(key=>[key,css.getPropertyValue('--'+key).trim()]));}
 function round(ctx,x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
 function lines(ctx,rows,x,y,size,color,weight=400){ctx.font=`${weight} ${size}px ${font}`;ctx.fillStyle=color;ctx.textBaseline='top';for(const row of rows){ctx.fillText(row,x,y);y+=size*1.45;}return y;}
 function layout(ctx,snapshot,width){
  const columns=Math.min(7,snapshot.days.length),gap=14,margin=42,columnWidth=(width-margin*2-gap*(columns-1))/columns,inner=columnWidth-32;
  const heading=wrap(ctx,snapshot.folder.name,width-360,32,650);
  const top=136+heading.length*46;
  const mapped=snapshot.days.map(day=>{
   const name=wrap(ctx,day.name,inner,18,650);
   const cards=day.tasks.map(task=>{
    const title=wrap(ctx,task.title,inner-26,22,700),desc=wrap(ctx,task.desc,inner-26,18);
    return {task,title,desc,height:32+title.length*31.9+14+desc.length*26.1+64};
   });
   const header=26+name.length*26.1+36;
   return {day,name,cards,header,height:header+cards.reduce((sum,card)=>sum+card.height+12,0)+(cards.length?16:66)};
  });
  const rows=[];for(let index=0;index<mapped.length;index+=columns){const items=mapped.slice(index,index+columns);rows.push({items,height:Math.max(...items.map(item=>item.height))});}
  return {columns,columnWidth,gap,margin,heading,top,rows,required:top+rows.reduce((sum,row)=>sum+row.height+20,0)+68};
 }
 async function build(snapshot,lang=currentLang,colors=palette()){
  if(!snapshot.days.length)throw new Error('empty');
  const totalCharacters=snapshot.days.reduce((n,d)=>n+d.name.length+d.tasks.reduce((m,t)=>m+t.title.length+(t.desc||'').length,0),snapshot.folder.name.length);
  if(totalCharacters>120000||snapshot.days.length>49)throw new Error('large');
  await fonts();await document.fonts.ready;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw new Error('failed');const commands=recordContext(ctx);
  const width=2450;const plan=layout(ctx,snapshot,width),height=Math.max(1732,Math.ceil(plan.required));
  if(height>28000)throw new Error('large');
  const scale=Math.min(2,Math.sqrt(8000000/(width*height)));
  canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);ctx.scale(scale,scale);
  const w=words(lang),c=colors,all=snapshot.days.flatMap(day=>day.tasks),completed=all.filter(task=>task.completed).length,missed=all.filter(task=>!task.completed&&task.missed).length,pending=all.length-completed-missed;
  ctx.fillStyle=c['bg-main'];ctx.fillRect(0,0,width,height);
  round(ctx,42,36,36,36,10,c['accent-color']);lines(ctx,['P'],52,41,25,'#ffffff',750);
  lines(ctx,['PROCATS  /  '+w.title],92,46,16,c['text-main'],600);
  lines(ctx,plan.heading,42,92,32,c['text-main'],650);
  lines(ctx,[`${snapshot.days.filter(d=>!d.excluded).length} ${w.days}  ·  ${all.length} ${w.tasks}  ·  ${completed}/${all.length} ${w.done.toLocaleLowerCase(lang)}  ·  ${missed} ${w.missed.toLocaleLowerCase(lang)}  ·  ${pending} ${w.pending.toLocaleLowerCase(lang)}`],42,106+plan.heading.length*46,15,c['text-secondary']);
  const date=new Date().toLocaleDateString(lang,{year:'numeric',month:'short',day:'numeric'});
  ctx.font=`400 14px ${font}`;ctx.fillStyle=c['text-secondary'];ctx.textAlign='right';ctx.fillText(w.created+' · '+date,width-42,49);ctx.textAlign='left';
  let y=plan.top;
  for(const row of plan.rows){
   row.items.forEach((item,index)=>{
    const x=plan.margin+index*(plan.columnWidth+plan.gap);
    round(ctx,x,y,plan.columnWidth,row.height,16,c['bg-nav']);
    round(ctx,x+16,y+17,22,3,1.5,c['accent-color']);
    lines(ctx,item.name,x+16,y+32,18,c['text-main'],650);
    const count=item.day.tasks.filter(task=>task.completed).length;
    if(!item.day.excluded)lines(ctx,[`${count}/${item.day.tasks.length} ${w.done.toLocaleLowerCase(lang)}`],x+16,y+40+item.name.length*26.1,12,c['text-secondary']);
    let cy=y+item.header;
    if(!item.cards.length)lines(ctx,wrap(ctx,item.day.excluded?w.excluded:w.noTasks,plan.columnWidth-32,14),x+16,cy+10,14,c['text-secondary']);
    for(const card of item.cards){
     round(ctx,x+12,cy,plan.columnWidth-24,card.height,12,c['bg-card']);
     let ty=lines(ctx,card.title,x+25,cy+20,22,c['text-main'],650);
     ty=lines(ctx,card.desc,x+25,ty+14,18,c['text-main']);
     const status=card.task.completed?'done':card.task.missed?'missed':'pending';
     const color=status==='done'?'#147a3e':status==='missed'?'#bd283b':'#586375';
     if(status!=='pending')round(ctx,x+12,cy+10,5,card.height-20,2,color);
     const statusY=cy+card.height-34;
     ctx.font=`700 13px ${font}`;const badgeWidth=ctx.measureText(w[status]).width+18;
     round(ctx,x+25,statusY-4,badgeWidth,25,6,color);
     lines(ctx,[w[status]],x+34,statusY,13,'#ffffff',700);
     const rating=Number(card.task.rating)>0?String(card.task.rating):'—';
     ctx.textAlign='right';lines(ctx,[rating+' / 10'],x+plan.columnWidth-25,statusY,12,c['text-main'],650);ctx.textAlign='left';
     cy+=card.height+12;
    }
   });
   y+=row.height+20;
  }
  lines(ctx,[w.footer+' · '+w.rating+' / 10'],42,height-36,12,c['text-secondary']);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('failed');
  const dimensions={width:canvas.width,height:canvas.height};canvas.width=1;canvas.height=1;return {blob,...dimensions,plan,commands,logicalWidth:width,logicalHeight:height};
 }
 let objectURL=null,focusBefore=null,generation=0;
 const modal=document.createElement('div');modal.id='weeklySummary';modal.className='modal-overlay';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','weeklyTitle');
 modal.innerHTML='<section class="weekly-panel"><header><div><span>PROCATS</span><h2 id="weeklyTitle"></h2></div><button id="weeklyClose" type="button">×</button></header><p id="weeklyHint"></p><p id="weeklyStatus" role="status"></p><nav id="weeklyPages"></nav><button id="weeklyZoom" type="button" hidden></button><div class="weekly-preview" tabindex="0"><img id="weeklyImage" hidden></div><footer><button id="weeklyDownload" type="button" disabled></button><button id="weeklyPdf" type="button" disabled>PDF</button><button id="weeklyAllPng" type="button" hidden></button><button id="weeklyShare" type="button" hidden></button></footer></section>';
 document.body.append(modal);
 function close(){if(modal.dataset.busy==='true')return;generation++;modal.classList.remove('active');if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}document.getElementById('weeklyImage').removeAttribute('src');document.getElementById('weeklyPages').replaceChildren();for(const id of ['weeklyDownload','weeklyPdf','weeklyAllPng','weeklyShare','weeklyZoom'])document.getElementById(id).onclick=null;focusBefore?.focus();}
 document.getElementById('weeklyClose').onclick=close;modal.onclick=event=>{if(event.target===modal)close();};
 modal.addEventListener('keydown',event=>{if(event.key==='Escape')close();if(event.key==='Tab'){const buttons=[...modal.querySelectorAll('button:not([hidden]):not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
 async function open(folderId){
  const folder=folders.find(item=>item.id===folderId);if(!folder)return;
  return openSnapshot({folder,days:days.filter(day=>day.folderId===folderId).map(day=>({...day,tasks:tasks.filter(task=>task.dayId===day.id)}))});
 }
 async function openSnapshot(input){
  const snapshot=structuredClone(input),folder=snapshot.folder;
  const lang=currentLang,w=words(lang);
  const ticket=++generation;focusBefore=document.activeElement;modal.classList.add('active');
  if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}
  const $=id=>document.getElementById(id),download=$('weeklyDownload'),share=$('weeklyShare'),preview=$('weeklyImage');
  $('weeklyTitle').textContent=folder.name;$('weeklyHint').textContent=w.hint;$('weeklyStatus').textContent=w.loading;$('weeklyClose').setAttribute('aria-label',w.close);$('weeklyClose').focus();
  $('weeklyPages').replaceChildren();$('weeklyAllPng').hidden=true;download.textContent=w.download;download.disabled=true;$('weeklyPdf').disabled=true;$('weeklyZoom').hidden=true;preview.style.width='100%';share.textContent=w.share;share.hidden=true;preview.hidden=true;preview.alt=w.preview;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try{
   const {splitWeeks}=await import('/report-pages.js');
   const parts=splitWeeks(snapshot,lang),results=[];
   for(const part of parts){results.push(await build(part,lang));if(ticket!==generation)return;}
   const extra={tr:{page:'Hafta',all:'Tüm PNG’ler · ZIP',pdf:'Tüm haftalar · tek PDF',zoom:'Yakınlaştır',whole:'Sayfayı sığdır',hint:'Her hafta ayrı bir PDF sayfasıdır. İstediğin haftanın PNG’sini indir veya tüm PNG dosyalarını ZIP olarak al.'},en:{page:'Week',all:'All PNGs · ZIP',pdf:'All weeks · one PDF',zoom:'Zoom in',whole:'Fit page',hint:'Each week is a separate PDF page. Download one week as PNG or all PNG files as ZIP.'},de:{page:'Woche',all:'Alle PNGs · ZIP',pdf:'Alle Wochen · eine PDF',zoom:'Vergrößern',whole:'Seite einpassen',hint:'Jede Woche ist eine PDF-Seite. Einzelne Wochen als PNG oder alle PNG-Dateien als ZIP herunterladen.'}}[lang];
   if(snapshot.period==='monthly'){const monthly={tr:{pdf:'Aylık PDF',all:'Aylık PNG’ler · ZIP',hint:'Yalnızca bu ayın günleri. PDF’de her hafta ayrı sayfadır. PNG’leri haftalık indirebilir veya tamamını ZIP olarak alabilirsin.'},en:{pdf:'Monthly PDF',all:'Monthly PNGs · ZIP',hint:'Only days in this month. Each week is a PDF page. Download weekly PNGs separately or together in a ZIP.'},de:{pdf:'Monats-PDF',all:'Monats-PNGs · ZIP',hint:'Nur Tage dieses Monats. Jede Woche ist eine PDF-Seite. Wochen-PNGs einzeln oder zusammen als ZIP herunterladen.'}}[lang];Object.assign(extra,monthly);} const stem=('Procats-'+folder.name).replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').slice(0,100);
   const filename=i=>stem+'-'+String(i+1).padStart(2,'0')+'.png';let current=0;
   $('weeklyHint').textContent=extra.hint;download.disabled=false;$('weeklyPdf').disabled=false;$('weeklyZoom').hidden=false;$('weeklyPdf').textContent=extra.pdf;$('weeklyAllPng').textContent=extra.all;$('weeklyAllPng').hidden=results.length<2;
   function show(index){current=index;const result=results[index];if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(result.blob);preview.src=objectURL;preview.hidden=false;preview.style.width='100%';preview.alt=parts[index].folder.name;$('weeklyZoom').textContent=extra.zoom;$('weeklyStatus').textContent=extra.page+' '+(index+1)+' / '+results.length+' · '+result.width+' × '+result.height+' px';[...$('weeklyPages').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));}
   for(let i=0;i<results.length;i++){const b=document.createElement('button');b.type='button';b.textContent=extra.page+' '+(i+1);b.onclick=()=>show(i);$('weeklyPages').append(b);}show(0);
   download.onclick=async()=>{try{await window.ProcatsFiles.save(results[current].blob,filename(current));}catch(error){if(error.name!=='AbortError')$('weeklyStatus').textContent=w.failed;}};
   $('weeklyZoom').onclick=()=>{const zoom=preview.style.width==='100%';preview.style.width=zoom?results[current].logicalWidth+'px':'100%';$('weeklyZoom').textContent=zoom?extra.whole:extra.zoom;};
   async function saveAll(kind){modal.dataset.busy='true';$('weeklyClose').disabled=true;$('weeklyPdf').disabled=true;$('weeklyAllPng').disabled=true;try{let blob;if(kind==='pdf'){const {buildPDF}=await import('/report-pdf.js');blob=await buildPDF(results,folder.name,lang);}else{const {zipImages}=await import('/report-zip.js');blob=await zipImages(results.map((r,i)=>({name:filename(i),blob:r.blob})));}await window.ProcatsFiles.save(blob,stem+'.'+kind);}catch(error){if(error.name!=='AbortError')$('weeklyStatus').textContent=w.failed;}finally{modal.dataset.busy='false';$('weeklyClose').disabled=false;$('weeklyPdf').disabled=false;$('weeklyAllPng').disabled=false;}}
   $('weeklyPdf').onclick=()=>saveAll('pdf');$('weeklyAllPng').onclick=()=>saveAll('zip');
   const file=new File([results[current].blob],filename(current),{type:'image/png'});
   if(navigator.canShare?.({files:[file]})){share.hidden=false;share.onclick=async()=>{try{await navigator.share({files:[new File([results[current].blob],filename(current),{type:'image/png'})],title:w.title});}catch(error){if(error.name!=='AbortError')$('weeklyStatus').textContent=w.failed;}};}
  }catch(error){if(ticket===generation)$('weeklyStatus').textContent=w[error.message]||w.failed;}
 }
 window.ProcatsWeekly={open,openSnapshot,close,build,wrap};
})();

