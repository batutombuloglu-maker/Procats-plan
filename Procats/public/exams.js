/* Selection and format UI for the existing practice-exam screen. */
const examUIStrings = {
 tr:{choose:'Hangi sınavlara girmek istersiniz?',help:'Takip etmek istediğin sınavları seç. Seçimlerini daha sonra değiştirebilirsin.',select:'Alanları Seç',options:'Deneme seçenekleri',save:'Seçimleri Kaydet',keep:'Seçimden çıkardığın sınavların kayıtları saklanır; tekrar seçtiğinde görünür.',empty:'Henüz bir sınav seçmedin.',result:'Değerlendirilmiş sonuç',manual_saved:'Yazılı sınav sonucu · 100 üzerinden',manual_error:'0 ile 100 arasında değerlendirilmiş bir sonuç gir.',progress:'Gelişim',general:'Test sonuçları',verbal:'Sözel bölüm',quantitative:'Sayısal bölüm',duration:'Standart süre',minute:'dk',no_penalty:'Yanlış cevaplar doğru sayısını azaltmaz.',not_score:'Deneme takibi içindir; resmî yerleştirme puanı hesaplanmaz.',saved:'Seçimlerin kaydedildi.'},
 en:{choose:'Which exams would you like to take?',help:'Choose the exams you want to track. You can change your selection later.',select:'Select Exams',options:'Exam options',save:'Save Selection',keep:'Records for deselected exams are kept and reappear when you select them again.',empty:'You have not selected an exam yet.',result:'Assessed result',manual_saved:'Written exam result · out of 100',manual_error:'Enter an assessed result between 0 and 100.',progress:'Progress',general:'Test results',verbal:'Verbal section',quantitative:'Quantitative section',duration:'Standard duration',minute:'min',no_penalty:'Wrong answers do not reduce the correct-answer count.',not_score:'Practice tracking only; official placement scores are not calculated.',saved:'Selection saved.'},
 de:{choose:'Welche Prüfungen möchtest du ablegen?',help:'Wähle die Prüfungen aus, die du verfolgen möchtest. Du kannst deine Auswahl später ändern.',select:'Prüfungen auswählen',options:'Prüfungsoptionen',save:'Auswahl speichern',keep:'Aufzeichnungen abgewählter Prüfungen bleiben erhalten und erscheinen bei erneuter Auswahl.',empty:'Du hast noch keine Prüfung ausgewählt.',result:'Bewertetes Ergebnis',manual_saved:'Schriftliches Ergebnis · von 100',manual_error:'Ein bewertetes Ergebnis zwischen 0 und 100 eingeben.',progress:'Entwicklung',general:'Testergebnisse',verbal:'Sprachlicher Teil',quantitative:'Quantitativer Teil',duration:'Standarddauer',minute:'Min.',no_penalty:'Falsche Antworten verringern die Anzahl richtiger Antworten nicht.',not_score:'Nur zur Übungsverfolgung; keine offiziellen Platzierungspunkte.',saved:'Auswahl gespeichert.'}
};
function examText(key) { return (globalThis.ProcatsLocale?.messages(examUIStrings,currentLang) || examUIStrings[currentLang] || examUIStrings.tr)[key] || key; }
function getSelectedExams() { return readStoredJSON('procats_exam_selection_v1', []); }
function examGroupLabel(group) { return ['general','verbal','quantitative'].includes(group) ? examText(group) : t('exam_group_'+group); }
let examSelectionReturnFocus = null;

function initializeExamSelection() {
 const section=document.getElementById('view-exams');
 if (!section || document.getElementById('examSelectionPanel')) return;
 const header=section.querySelector('.main-header'),add=header.querySelector('button');
 add.id='examNewButton';
 const actions=createExamElement('div','exam-header-actions');add.before(actions);actions.append(add);
 const menu=createExamElement('details','exam-options');menu.id='examOptions';
 const trigger=createExamElement('summary','exam-options-trigger','⋯');trigger.id='examOptionsTrigger';
 const choose=createExamElement('button','exam-options-action');choose.type='button';choose.onclick=()=>{menu.open=false;openExamSelection();};
 menu.append(trigger,choose);actions.append(menu);
 const panel=createExamElement('div','exam-selection-panel');panel.id='examSelectionPanel';
 panel.innerHTML='<h2></h2><p class="exam-selection-intro"></p><div class="exam-choice-grid"></div><p class="exam-selection-preserve"></p><p class="exam-selection-error" role="alert"></p><button class="btn-primary" type="button"></button>';
 panel.querySelector('button').onclick=()=>saveExamSelection('examSelectionPanel');header.after(panel);
 const modal=createExamElement('div','modal-overlay');modal.id='examSelectionModal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','examSelectionTitle');
 modal.innerHTML='<div class="modal-content exam-selection-modal"><h2 id="examSelectionTitle"></h2><p class="exam-selection-intro"></p><div class="exam-choice-grid"></div><p class="exam-selection-preserve"></p><p class="exam-selection-error" role="alert"></p><div class="modal-actions"><button type="button" class="btn-cancel"></button><button type="button" class="btn-save"></button></div></div>';
 modal.querySelector('.btn-cancel').onclick=closeExamSelection;
 modal.querySelector('.btn-save').onclick=()=>saveExamSelection('examSelectionModal');
 modal.onclick=e=>{if(e.target===modal)closeExamSelection();};
 modal.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.stopPropagation();closeExamSelection();}
  if(e.key==='Tab'){
   const controls=[...modal.querySelectorAll('input,button')],first=controls[0],last=controls.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 });
 document.body.append(modal);
 document.addEventListener('click',e=>{if(!menu.contains(e.target))menu.open=false;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){menu.open=false;trigger.focus();}});
}
function renderExamChoices(container,selected) {
 const grid=container.querySelector('.exam-choice-grid');grid.replaceChildren();
 grid.setAttribute('role','group');grid.setAttribute('aria-label',examText('choose'));
 for(const [id,exam] of Object.entries(ProcatsExamData.catalog)){
  const label=createExamElement('label','exam-choice'),input=document.createElement('input');
  input.type='checkbox';input.value=id;input.name='exam-selection';input.checked=selected.includes(id);
  label.append(input,createExamElement('span','',exam.label));grid.append(label);
 }
 container.querySelector('h2').textContent=examText('choose');
 container.querySelector('.exam-selection-intro').textContent=examText('help');
 container.querySelector('.exam-selection-preserve').textContent=examText('keep');
 container.querySelector('.exam-selection-error').textContent='';
 const buttons=container.querySelectorAll('button');buttons[buttons.length-1].textContent=examText('save');
 if(buttons.length>1)buttons[0].textContent=t('btn_cancel');
}
function renderExamSelection() {
 initializeExamSelection();
 const selected=getSelectedExams(),section=document.getElementById('view-exams'),panel=document.getElementById('examSelectionPanel');
 document.getElementById('examOptionsTrigger').setAttribute('aria-label',examText('options'));
 document.querySelector('#examOptions button').textContent=examText('select');
 document.getElementById('examNewButton').hidden=!selected.length;
 panel.hidden=selected.length>0;
 for(const selector of ['.exam-toolbar','.exam-panel','.exam-list-heading','#examRecordList'])section.querySelector(selector).hidden=!selected.length;
 if(!selected.length){activeExamType=null;activeExamTrack=null;activeExamSubject='total';renderExamChoices(panel,selected);return false;}
 if(!selected.includes(activeExamType)){activeExamType=selected[0];activeExamTrack=ProcatsExamData.defaultTrack(activeExamType);activeExamSubject='total';}
 const tabs=section.querySelector('.exam-tabs');tabs.replaceChildren();tabs.setAttribute('aria-label',t('exam_type'));
 for(const type of selected){
  const button=createExamElement('button','exam-tab'+(type===activeExamType?' active':''),ProcatsExamData.catalog[type].label);
  button.type='button';button.dataset.examType=type;button.setAttribute('aria-pressed',String(type===activeExamType));button.onclick=()=>switchExamType(type);tabs.append(button);
 }
 return true;
}
function openExamSelection() {
 initializeExamSelection();
 const modal=document.getElementById('examSelectionModal');examSelectionReturnFocus=document.activeElement;
 renderExamChoices(modal,getSelectedExams());modal.classList.add('active');modal.querySelector('input').focus();
}
function closeExamSelection() {document.getElementById('examSelectionModal').classList.remove('active');examSelectionReturnFocus?.focus();}
function saveExamSelection(containerId) {
 const container=document.getElementById(containerId),selected=[...container.querySelectorAll('input:checked')].map(input=>input.value);
 if(!ProcatsExamData.validSelection(selected))return false;
 if(!appStorage.setItem('procats_exam_selection_v1',JSON.stringify(selected))){container.querySelector('.exam-selection-error').textContent=t('exam_save_error');return false;}
 if(containerId==='examSelectionModal')closeExamSelection();
 renderExams();
 if(selected.length)document.getElementById('examNewButton').focus();
 return true;
}
function renderExamTrackSelect(id,type,track) {
 const select=document.getElementById(id);select.replaceChildren();
 for(const key of ProcatsExamData.tracks(type)){
  const option=document.createElement('option');option.value=key;
  option.textContent=type==='ayt'?t('exam_'+key):ProcatsExamData.catalog[type].tracks[key].label;select.append(option);
 }
 select.value=track||'';
}
function renderExamTypeSelect(type) {
 const select=document.getElementById('mExamType');select.replaceChildren();
 const selected=getSelectedExams();if(type&&!selected.includes(type))selected.push(type);
 for(const id of selected){const option=document.createElement('option');option.value=id;option.textContent=ProcatsExamData.catalog[id].label;select.append(option);}
 select.value=type;
}
function renderExamFormatInfo() {
 const form=document.getElementById('examForm'),profile=ProcatsExamData.profile(examDraft.type,examDraft.track);
 let info=document.getElementById('examFormatInfo');
 if(!info){info=createExamElement('p','exam-format-info');info.id='examFormatInfo';form.querySelector('.exam-form-grid').after(info);}
 const count=getExamSubjects(examDraft.type,examDraft.track).reduce((sum,s)=>sum+s.count,0);
 const duration=examDraft.type==='lgs'?`75 + 80 ${examText('minute')}`:`${profile.duration} ${examText('minute')}`;
 info.textContent=(profile.manual?'':`${count} ${t('exam_questions')} · `)+examText('duration')+': '+duration+(profile.note?' · '+profile.note:'');
 let manual=document.getElementById('examManualField');
 if(!manual){manual=createExamElement('div','input-group exam-manual-field');manual.id='examManualField';manual.innerHTML='<label class="input-label" for="mExamResult"></label><input id="mExamResult" class="input-apple" type="number" min="0" max="100" step="0.01" inputmode="decimal" aria-describedby="examFormError">';info.after(manual);manual.querySelector('input').addEventListener('input',updateExamManualTotal);}
 manual.hidden=!profile.manual;
 manual.querySelector('label').textContent=examText('result')+' (0–100)';
 manual.querySelector('input').value=examDraft.results[examDraftKey()]??'';
 form.querySelector('.exam-table-scroll').hidden=!!profile.manual;
 form.querySelector('.exam-score-head').hidden=!!profile.manual;
 const help=form.querySelector('.exam-input-help');help.hidden=!!profile.manual;
 const formula=form.querySelector('.exam-formula');formula.removeAttribute('data-i18n');
 formula.textContent=profile.divisor?`${t('exam_total')} = ${t('exam_correct')} − ${t('exam_wrong')} / ${profile.divisor}`:examText('no_penalty');
 const total=form.querySelector('.exam-form-total-label');total.removeAttribute('data-i18n');total.textContent=examMetricLabel(examDraft.type,examDraft.track);
 form.querySelector('.exam-input-table thead th:last-child').textContent=profile.divisor?'Net':t('exam_correct');
 let note=document.getElementById('examScoreDisclaimer');if(!note){note=createExamElement('p','exam-score-disclaimer');note.id='examScoreDisclaimer';form.querySelector('.exam-form-total').after(note);}note.textContent=examText('not_score');
}
function updateExamManualTotal() {
 const input=document.getElementById('mExamResult'),value=Number(input.value);
 const valid=input.value.trim()!==''&&!input.validity.badInput&&Number.isFinite(value)&&value>=0&&value<=100;
 input.setAttribute('aria-invalid',String(!valid));document.getElementById('examFormNet').textContent=valid?formatExamNet(value):'—';
 document.getElementById('examFormCounts').textContent=examText('manual_saved');document.getElementById('examFormError').textContent=valid?'':examText('manual_error');return valid;
}
initializeExamSelection();
