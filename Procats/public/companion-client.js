import {Capacitor,registerPlugin} from '@capacitor/core';
import {todaySnapshot,applyOperations} from './companion-core.js';
import {companionAccountHash as accountHash} from './companion-cleanup.js';
export {eraseCompanionAccount} from './companion-cleanup.js';
const bridge=Capacitor.getPlatform()==='android'?registerPlugin('ProcatsCompanion'):null;
let active=false,scope='',busy=false,again=false,timer,last='',paused=false;
const RECEIPTS='procats_companion_receipts_v1';
const notify=text=>window.showCustomAlert?.(text);
async function pump(){
 if(!active||paused||!bridge)return;
 if(busy){again=true;return;}busy=true;
 try{
  const S=window.ProcatsSync,state=S.getState();
  if(state.conflict||!state.localSaved||state.status==='signin')return;
  const pending=await bridge.pending();
  if(pending.scope!==scope)return;
  let results=[];
  if(pending.operations?.length){
   const before=S.getData();let receipts={};try{receipts=JSON.parse(window.procatsStorage.getItem(RECEIPTS)||'{}');}catch{}
   const applied=applyOperations(before,pending.operations,scope,receipts);
   S.commitSections({yks_v3_tasks:applied.tasks});
   window.procatsStorage.setItem(RECEIPTS,JSON.stringify(applied.receipts));
   await S.flush();if(!S.getState().localSaved)throw Error('Device save failed');
   window.procatsApplyRemote?.(before,S.getData());results=applied.results;
  }
  const css=getComputedStyle(document.documentElement),colors={};
  for(const [name,key]of [['accent','--accent-color'],['background','--bg-card'],['text','--text-main']]){
   const v=css.getPropertyValue(key).trim();if(/^#[0-9a-f]{6}$/i.test(v))colors[name]=v;
  }
  const snap=todaySnapshot(S.getData(),window.ProcatsCalendarCore.dateKey(new Date()),colors);
  snap.cloudPending=S.getState().pending;snap.lang=['tr','en','de'].includes(document.documentElement.lang)?document.documentElement.lang:'tr';
  const raw=JSON.stringify(snap);
  if(raw!==last||results.length){await bridge.publish({scope,snapshot:snap,results});last=raw;}
  if(results.some(r=>r.result!=='applied'))notify('Bazı saat/araç işlemleri uygulanmadı: ilgili görev başka yerde değişmiş veya silinmiş. Güncel planın korundu.');
  if(results.length)void S.sync(true);
 }catch{last='';}finally{busy=false;if(again){again=false;schedule();}}
}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>void pump(),250);}
export async function startCompanion(uid){
 if(!bridge)return;
 const account=await accountHash(uid);
 ({scope}=await bridge.bind({account}));active=true;paused=false;
 window.addEventListener('procats-companion-change',schedule);window.addEventListener('procats-sync-status',schedule);
 window.addEventListener('focus',schedule);document.addEventListener('visibilitychange',schedule);
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['style','data-theme','data-theme-tone']});
 setInterval(()=>{if(document.visibilityState==='visible')schedule();},30000);
 await pump();
 window.addEventListener('procats-companion-open',()=>void openTasks());
 await openTasks();
}
async function openTasks(){const result=await bridge.takeOpen();if(result.open){window.switchView?.('tasks');document.getElementById('calendarToday')?.click();}}
export async function lockCompanion(){if(!bridge)return;paused=true;active=false;last='';await bridge.lock();}
export async function drainCompanion(){
 if(!active||!bridge)return;
 await pump();while(busy)await new Promise(r=>setTimeout(r,30));
 const p=await bridge.pending();if(p.operations?.length)throw Object.assign(Error('Pending device actions'),{code:'pending-records'});
}
window.ProcatsCompanionUI={available:!!bridge,async open(){
 const old=document.getElementById('companionHelp');if(old){old.classList.add('active');return;}
 const overlay=document.createElement('div');overlay.id='companionHelp';overlay.className='modal-overlay active';
 const card=document.createElement('section');card.className='modal-content';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Saat ve ana ekran araçları');
 card.style.cssText='max-width:440px;max-height:85dvh;overflow:auto;line-height:1.6';
 const title=document.createElement('h2');title.textContent='Planın bir dokunuş uzağında';
 const desc=document.createElement('p');desc.textContent='Ana ekranında sıradaki görevi veya bugünün özetini gör. Saatte Procats kartından Yapıldı / Yapılmadı seç; sıradaki göreve geç. Son işareti Geri al ile düzeltebilirsin.';
 const detail=document.createElement('p');detail.textContent='Saat eşitlemesini açtığında görevlerin ve tema renklerin eşlenmiş Android saatine aktarılır. Telefon uygulaması kapalıyken işaretlerin cihazda bekler; Procats’ı açınca hesabına eşitlenir. Gün değiştiğinde güncel plan için telefonda Procats’ı aç. Bu özellik Android içindir.';
 const hint=document.createElement('p');hint.textContent='Saatine ayrıca Procats Wear OS uygulamasını yükle. Galaxy Wearable → Kartlar bölümünden Procats’ı ekle. Kişisel görevlerin araçta ve eşlenmiş saatte görünür.';
 card.append(title,desc,detail,hint);
 const wear=document.createElement('button');wear.type='button';wear.className='btn-primary';wear.style.cssText='display:block;width:100%;margin:12px 0;padding:14px';
 const refreshWear=async()=>{const {enabled}=await bridge.wearStatus();wear.dataset.enabled=String(enabled);wear.textContent=enabled?'Saat eşitlemesini kapat':'Saat eşitlemesini aç';};
 wear.onclick=async()=>{wear.disabled=true;try{const r=await bridge.setWear({enabled:wear.dataset.enabled!=='true'});scope=r.scope;last='';await pump();await refreshWear();}catch{notify('Saat ayarı kaydedilemedi. Yeniden dene.');}finally{wear.disabled=false;}};
 card.append(wear);await refreshWear();
 for(const [label,kind]of [['Sıradaki görev aracını ekle','focus'],['Bugünün özeti aracını ekle','today']]){
  const b=document.createElement('button');b.type='button';b.className='btn-primary';b.style.cssText='display:block;width:100%;margin:12px 0;padding:14px';b.textContent=label;
  b.onclick=async()=>{try{const r=await bridge.pin({kind});if(!r.supported)notify('Ana ekrana basılı tut → Araçlar → Procats yolundan ekleyebilirsin.');}catch{notify('Ana ekranın Araçlar menüsünden Procats’ı ekleyebilirsin.');}};card.append(b);
 }
 const close=document.createElement('button');close.textContent='Kapat';close.className='btn-primary';close.style.cssText='padding:12px;width:100%';close.onclick=()=>overlay.remove();card.append(close);overlay.append(card);document.body.append(overlay);close.focus();
}};
