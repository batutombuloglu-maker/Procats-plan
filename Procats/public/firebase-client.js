import * as appSDK from 'firebase/app';
import * as authSDK from 'firebase/auth';
import * as firestoreSDK from 'firebase/firestore';
import {createDemoAdapter} from './demo-adapter.js';
import {clearAccountStorage,isDeletionPending} from './account-deletion.js';
import './native.js';
import {startCompanion,lockCompanion,drainCompanion,eraseCompanionAccount} from './companion-client.js';
import './security-limits.js';
import './data-add-core.js';
import './data-add-ui.js';
import './backup-crypto.js';
import './backup-ui.js';
import {DeviceStore} from './device-store.js';
import {privacyGate} from './privacy-gate.js';
import {createCloudAdapter} from './cloud-adapter.js';
import {createListsStore} from './lists-store.js';
import {createKnowledgeStore} from './knowledge-store.js';
import {createKnowledgeCloud} from './knowledge-cloud.js';
import './knowledge-image.js';
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();window.procatsInstallPrompt=event;});
const root=document.getElementById('authRoot');
const translations={
 tr:{login:'Giriş yap',signup:'Hesap oluştur',email:'E-posta',password:'Şifre',repeat:'Şifreyi tekrar yaz',forgot:'Şifremi unuttum',reset:'Sıfırlama bağlantısı gönder',back:'Girişe dön',intro:'Görevlerin, notların ve planların tüm cihazlarında.',verify:'E-postanı doğrula',verifyHelp:'E-postana gelen bağlantıyı aç. Ardından buraya dönüp aşağıdaki düğmeye bas.',checked:'Doğruladım, devam et',resend:'E-postayı yeniden gönder',sent:'E-posta gönderildi. Gelen kutunu ve spam klasörünü kontrol et.',resetSent:'Bu e-posta için bir hesap varsa sıfırlama bağlantısı gönderildi.',logout:'Başka hesapla giriş yap',mismatch:'Şifreler aynı değil.',weak:'En az 12 karakterli bir şifre belirle.',invalid:'E-posta veya şifre hatalı.',network:'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.',wait:'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.',exists:'Bu e-posta kullanılamıyor. Giriş yapmayı veya şifre sıfırlamayı deneyebilirsin.',notVerified:'E-posta henüz doğrulanmadı. Bağlantıyı açıp yeniden dene.',loading:'Kayıtların açılıyor…',setup:'Kurulum henüz tamamlanmadı',setupHelp:'Uygulama sahibinin Firebase bağlantısını tamamlaması gerekiyor. Kurulum paketindeki KURULUM.html dosyası adımları açıklıyor.',storage:'Kayıtlara ulaşılamadı. Proje bağlantısını, yetkileri veya kullanım kotasını kontrol edip tekrar dene.',retry:'Tekrar dene',quota:'Ücretsiz kullanım sınırına ulaşıldı. Kayıtlar cihazda bekliyor.',saved:'Eşitlenmemiş değişiklikler var. Önce eşitle veya Veri Kasası’ndan yedek al.',configuration:'E-posta ile giriş henüz etkinleştirilmemiş. Uygulama sahibi Firebase ayarlarını tamamlamalı.',configInvalid:'Firebase yapılandırması geçerli değil. Kurulum adımlarını kontrol et.'},
 en:{login:'Sign in',signup:'Create account',email:'Email',password:'Password',repeat:'Repeat password',forgot:'Forgot password',reset:'Send reset link',back:'Back to sign in',intro:'Your tasks, notes and plans across your devices.',verify:'Verify your email',verifyHelp:'Open the link in your email, then return here and continue.',checked:'I verified my email',resend:'Resend verification email',sent:'Email sent. Check your inbox and spam folder.',resetSent:'If an account exists for this email, a reset link has been sent.',logout:'Use another account',mismatch:'The passwords do not match.',weak:'Choose a password with at least 12 characters.',invalid:'Incorrect email or password.',network:'Unable to connect. Check your internet connection and try again.',wait:'Too many attempts. Please wait before trying again.',exists:'This email cannot be used. Try signing in or resetting your password.',notVerified:'Email not yet verified. Open the verification link and try again.',loading:'Opening your records…',setup:'Setup is not complete',setupHelp:'The app owner must connect Firebase. Follow KURULUM.html in the setup package.',storage:'Unable to load records. Check the connection, permissions or quota and retry.',retry:'Try again',quota:'The free usage limit has been reached. Changes remain on this device.',saved:'Changes are not synced yet. Sync or export a Data Vault backup first.',configuration:'Email sign-in is not enabled. The app owner must complete Firebase setup.',configInvalid:'Invalid Firebase configuration. Check the setup steps.'},
 de:{login:'Anmelden',signup:'Konto erstellen',email:'E-Mail',password:'Passwort',repeat:'Passwort wiederholen',forgot:'Passwort vergessen',reset:'Link zum Zurücksetzen senden',back:'Zur Anmeldung',intro:'Aufgaben, Notizen und Pläne auf deinen Geräten.',verify:'E-Mail bestätigen',verifyHelp:'Öffne den Link in deiner E-Mail und kehre anschließend hierher zurück.',checked:'E-Mail bestätigt, weiter',resend:'Bestätigung erneut senden',sent:'E-Mail gesendet. Posteingang und Spam prüfen.',resetSent:'Falls ein Konto existiert, wurde ein Link zum Zurücksetzen gesendet.',logout:'Anderes Konto verwenden',mismatch:'Die Passwörter stimmen nicht überein.',weak:'Wähle ein Passwort mit mindestens 12 Zeichen.',invalid:'E-Mail oder Passwort falsch.',network:'Keine Verbindung. Internet prüfen und erneut versuchen.',wait:'Zu viele Versuche. Bitte etwas warten.',exists:'Diese E-Mail ist nicht verfügbar. Anmeldung oder Passwortzurücksetzung versuchen.',notVerified:'E-Mail noch nicht bestätigt. Link öffnen und erneut versuchen.',loading:'Einträge werden geöffnet…',setup:'Einrichtung noch nicht abgeschlossen',setupHelp:'Der App-Inhaber muss Firebase verbinden. Die Schritte stehen in KURULUM.html.',storage:'Einträge nicht verfügbar. Verbindung, Berechtigungen oder Kontingent prüfen.',retry:'Erneut versuchen',quota:'Kostenloses Kontingent erreicht. Änderungen bleiben auf diesem Gerät.',saved:'Änderungen noch nicht synchronisiert. Zuerst synchronisieren oder eine Sicherung exportieren.',configuration:'E-Mail-Anmeldung noch nicht aktiviert. Firebase-Einrichtung abschließen.',configInvalid:'Ungültige Firebase-Konfiguration. Einrichtung prüfen.'}
};
let language='tr';try{language=localStorage.getItem('procats-login-language')||'tr';}catch{}
if(!translations[language])language='tr';
let mode='loading',auth=null,sdk=null,appLoaded=false,opening=false,activeUID=null,busy=false;
const extra={en:{demo:'Try without an account · this device only',privacy:'Privacy',remove:'Delete my account',deleting:'Finish account deletion'},tr:{demo:'Hesapsız dene · yalnızca bu cihaz',privacy:'Gizlilik',remove:'Hesabımı sil',deleting:'Hesap silmeyi tamamla'},de:{demo:'Ohne Konto testen · nur auf diesem Gerät',privacy:'Datenschutz',remove:'Mein Konto löschen',deleting:'Kontolöschung abschließen'}};for(const l of Object.keys(extra))Object.assign(translations[l],extra[l]);
const t=key=>translations[language][key]||key;
function message(text,error=false){const el=document.getElementById('accountMessage');if(el){el.textContent=text;el.classList.toggle('error',error);}}
function setBusy(value){busy=value;root.querySelectorAll('button,input').forEach(el=>el.disabled=value);}
function render(){
 document.body.classList.add('auth-locked');document.documentElement.lang=language;
 if(mode==='loading'){renderLoading();return;}
 root.innerHTML='<section class="account-card"><div class="account-brand"><img src="/icon-192.png" alt=""><strong>Procats</strong><select id="accountLanguage" aria-label="Language"><option value="tr">Türkçe</option><option value="en">English</option><option value="de">Deutsch</option></select></div><h1 id="accountTitle"></h1><p id="accountIntro"></p><form id="accountForm"><label id="emailLabel" for="accountEmail"></label><input id="accountEmail" type="email" autocomplete="email" maxlength="254" required><div id="passwordField"><label id="passwordLabel" for="accountPassword"></label><input id="accountPassword" type="password" required maxlength="128"></div><div id="repeatField"><label id="repeatLabel" for="accountRepeat"></label><input id="accountRepeat" type="password" autocomplete="new-password" maxlength="128"></div><button id="accountSubmit" type="submit"></button></form><p id="accountMessage" class="account-message" role="status" aria-live="polite"></p><button type="button" id="accountPrimary" class="account-link"></button><button type="button" id="accountSecondary" class="account-link"></button><button type="button" id="accountExit" class="account-link" hidden></button></section>';
 const $=id=>document.getElementById(id);
 $('accountLanguage').value=language;$('accountLanguage').onchange=event=>{language=event.target.value;try{localStorage.setItem('procats-login-language',language);}catch{}if(auth)auth.languageCode=language;render();};
 $('accountTitle').textContent=t(mode==='reset'?'forgot':mode);$('accountIntro').textContent=t(mode==='verify'?'verifyHelp':mode==='setup'?'setupHelp':mode==='loading'?'loading':mode==='storage'?'storage':'intro');
 $('emailLabel').textContent=t('email');$('passwordLabel').textContent=t('password');$('repeatLabel').textContent=t('repeat');
 $('passwordField').hidden=mode==='reset';$('accountPassword').required=mode!=='reset';$('accountPassword').autocomplete=mode==='signup'?'new-password':'current-password';
 $('repeatField').hidden=mode!=='signup';$('accountRepeat').required=mode==='signup';$('accountSubmit').textContent=t(mode);
 $('accountForm').hidden=!['login','signup','reset'].includes(mode);
 $('accountForm').onsubmit=submit;
 $('accountPrimary').hidden=['loading','setup'].includes(mode);
 $('accountSecondary').hidden=['loading','setup','storage'].includes(mode);
 $('accountPrimary').textContent=t(mode==='verify'?'checked':mode==='storage'?'retry':mode==='login'?'signup':'back');
 $('accountSecondary').textContent=t(mode==='verify'?'resend':'forgot');
 $('accountPrimary').onclick=()=>{if(mode==='verify')void verify();else if(mode==='storage')location.reload();else{mode=mode==='login'?'signup':'login';render();}};
 $('accountSecondary').onclick=()=>{if(mode==='verify')void resend();else{mode='reset';render();}};
 $('accountExit').hidden=mode!=='verify'&&mode!=='storage';$('accountExit').textContent=t('logout');$('accountExit').onclick=()=>void window.ProcatsAccount.signOut();
 if(mode==='verify')message(auth?.currentUser?.email||'');
 if(mode==='storage'&&auth?.currentUser?.emailVerified&&window.ProcatsCloud?.recovery){const b=document.createElement('button');b.type='button';b.className='account-link';b.textContent=({tr:'Kayıtların şifreli kurtarma kopyasını indir',en:'Download encrypted recovery copy',de:'Verschlüsselte Wiederherstellungskopie laden'})[language];b.onclick=async()=>{const password=await ProcatsBackupUI.password('create');if(password===null)return;b.disabled=true;try{const raw=await ProcatsCloud.recovery();const encrypted=await ProcatsBackupCrypto.encryptBackup(raw,password);await ProcatsFiles.save(new Blob([JSON.stringify(encrypted)],{type:'application/json'}),'Procats-Recovery-'+Date.now()+'.procats.json');message(({tr:'Kurtarma kopyası hazırlandı. Asıl kayıtlar değiştirilmedi. Bu dosya destekle inceleme içindir; normal yedek değildir.',en:'Recovery copy prepared. Original records remain unchanged. This file is for assisted recovery, not regular import.',de:'Wiederherstellungskopie erstellt. Originaldaten bleiben unverändert. Die Datei dient der unterstützten Wiederherstellung.'})[language]);}catch{message(t('storage'),true);}finally{b.disabled=false;}};root.querySelector('.account-card').append(b);}

 const links=document.createElement('div');links.className='account-legal';for(const [key,page]of [['privacy','privacy.html'],['remove','delete-account.html']]){const a=document.createElement('a');a.textContent=t(key);a.href='/'+page+'?lang='+language;links.append(a);}root.querySelector('.account-card').append(links);
 if(['login','signup','setup','storage'].includes(mode)){const b=document.createElement('button');b.type='button';b.id='accountDemo';b.className='account-demo';b.textContent=t('demo');b.onclick=()=>{localStorage.setItem('procats-demo-active','1');location.reload();};links.before(b);}
 if(mode==='deleting'){$('accountForm').hidden=true;$('accountPrimary').hidden=true;$('accountSecondary').hidden=true;}

}
function renderLoading(){
 root.innerHTML='<section class="launch-screen" role="status" aria-live="polite"><img class="launch-logo" src="/icon-192.png" alt=""><h1>Procats</h1><p id="launchMessage"></p><div class="launch-track" aria-hidden="true"><span></span></div><button type="button" id="launchRetry" hidden></button></section>';
 document.getElementById('launchMessage').textContent=t('loading');
 const retry=document.getElementById('launchRetry');retry.textContent=t('retry');retry.onclick=()=>location.reload();
 clearTimeout(window.procatsBootTimer);
 window.procatsBootTimer=setTimeout(()=>{if(mode==='loading'){document.getElementById('launchMessage').textContent=t('network');retry.hidden=false;}},20000);
}
function authError(error){
 const map={'auth/invalid-credential':'invalid','auth/wrong-password':'invalid','auth/user-not-found':'invalid','auth/invalid-email':'invalid','auth/weak-password':'weak','auth/password-does-not-meet-requirements':'weak','auth/email-already-in-use':'exists','auth/too-many-requests':'wait','auth/network-request-failed':'network','auth/operation-not-allowed':'configuration','auth/invalid-api-key':'configInvalid','auth/unauthorized-domain':'configInvalid'};
 return t(map[error.code]||'storage');
}
async function submit(event){
 event.preventDefault();if(busy||!auth)return;
 const email=document.getElementById('accountEmail').value.trim(),password=document.getElementById('accountPassword').value;
 if(mode==='signup'&&(password.length<12||password!==document.getElementById('accountRepeat').value)){message(t(password.length<12?'weak':'mismatch'),true);return;}
 const action=mode;setBusy(true);message('');
 try{
  if(action==='reset'){await sdk.sendPasswordResetEmail(auth,email);message(t('resetSent'));}
  else if(action==='signup'){const credential=await sdk.createUserWithEmailAndPassword(auth,email,password);mode='verify';render();await sdk.sendEmailVerification(credential.user);message(t('sent'));}
  else await sdk.signInWithEmailAndPassword(auth,email,password);
 }catch(error){message(authError(error),true);}finally{setBusy(false);}
}
async function resend(){if(busy)return;setBusy(true);try{await sdk.sendEmailVerification(auth.currentUser);message(t('sent'));}catch(error){message(authError(error),true);}finally{setBusy(false);}}
async function verify(){
 if(busy)return;setBusy(true);
 try{await sdk.reload(auth.currentUser);if(!auth.currentUser.emailVerified){message(t('notVerified'),true);return;}await sdk.getIdToken(auth.currentUser,true);await openWorkspace(auth.currentUser);}
 catch(error){message(authError(error),true);}finally{setBusy(false);}
}
function loadScript(src){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.append(script);});}
async function openWorkspace(user,demo=false){
 if(opening||appLoaded)return;opening=true;mode='loading';render();
 try{
  activeUID=user.uid;
  window.PROCATS_DEMO=demo;
  const journal=await DeviceStore.load(user.uid);
  const cloud=demo?createDemoAdapter(journal):createCloudAdapter({sdk:window.ProcatsFirestoreSDK,db:window.ProcatsDB,auth,user,cached:journal});
  window.ProcatsCloud=cloud;
  const initial=await cloud.read();
  if(auth.currentUser?.uid!==user.uid)throw new Error('Account changed');
  window.PROCATS_BOOT={...initial,journal,user:user.uid,email:user.email};
  await loadScript('/sync-merge.js');await loadScript('/sync-storage.js');
  window.ProcatsListsStore=createListsStore({recovered:journal?.recovered||[],storage:window.procatsStorage,flush:()=>window.ProcatsSync.flush(),isLocalSaved:()=>window.ProcatsSync.getState().localSaved,merge:ProcatsMerge.mergeDocuments,demo,
   cloudFactory:cached=>demo?createDemoAdapter(cached,ProcatsListsCore.snapshot):createCloudAdapter({sdk:window.ProcatsFirestoreSDK,db:window.ProcatsDB,auth,user,cached,documentId:'lists',validate:ProcatsListsCore.snapshot}),
   notify:()=>window.dispatchEvent(new CustomEvent('procats-lists-change'))});
  window.ProcatsKnowledgeStore=createKnowledgeStore({recovered:journal?.recovered||[],storage:window.procatsStorage,flush:()=>window.ProcatsSync.flush(),isLocalSaved:()=>window.ProcatsSync.getState().localSaved,merge:ProcatsMerge.mergeDocuments,demo,
   cloudFactory:cached=>demo?createDemoAdapter(cached,ProcatsKnowledgeCore.snapshot):createKnowledgeCloud({sdk:window.ProcatsFirestoreSDK,db:window.ProcatsDB,auth,user,cached}),
   notify:()=>window.dispatchEvent(new CustomEvent('procats-knowledge-change'))});
  window.addEventListener('procats-sync-status',()=>window.ProcatsKnowledgeStore.refresh());
  for(const event of ['online','focus'])window.addEventListener(event,()=>void window.ProcatsKnowledgeStore.sync());
  document.addEventListener('visibilitychange',()=>void window.ProcatsKnowledgeStore.sync());
  window.addEventListener('procats-sync-status',()=>window.ProcatsListsStore.refresh());
  window.addEventListener('online',()=>void window.ProcatsListsStore.sync());
  window.addEventListener('focus',()=>void window.ProcatsListsStore.sync());
  document.addEventListener('visibilitychange',()=>void window.ProcatsListsStore.sync());
  if(!window.procatsStorage.getItem('procats_lang'))window.procatsStorage.setItem('procats_lang',language);
  await loadScript('/quotes.js');await loadScript('/daily-quote.js');await loadScript('/planning-core.js');await loadScript('/calendar-core.js');await loadScript('/navigation.js');await loadScript('/exams-data.js');await loadScript('/app.js');await loadScript('/exams.js');await loadScript('/themes.js');await loadScript('/sync-ui.js?v=1.7.7');await loadScript('/weekly-summary.js?v=1.7.7');await loadScript('/mobile.js?v=1.7.7');await loadScript('/experience.js');await loadScript('/release-ui.js');window.renderHeatmap?.();await loadScript('/calendar.js');await loadScript('/task-touch.js');await loadScript('/free-plan-mobile.js');await loadScript('/tour.js');await loadScript('/resources-core.js');await loadScript('/theme-colors.js');await loadScript('/resources.js');await loadScript('/custom-themes.js');await loadScript('/lists.js');await loadScript('/lists-drag.js');await loadScript('/timer-views-core.js');await loadScript('/timer-views.js');
  await window.ProcatsTimerClockReady;window.procatsInitialize();await window.ProcatsCustomThemes.ready();await window.procatsInitializeSyncUI();window.ProcatsListsStore.start();window.ProcatsKnowledgeStore.start();
  window.dispatchEvent(new CustomEvent('procats-sync-status'));
  await startCompanion(user.uid).catch(()=>{});
  appLoaded=true;clearTimeout(window.procatsBootTimer);document.body.classList.remove('auth-locked');root.replaceChildren();window.ProcatsWelcome?.start();void window.ProcatsResources.ready();void window.ProcatsTimerAlerts?.resume();
 }catch(error){if(!demo&&error.code==='permission-denied'&&await isDeletionPending(firestoreSDK,window.ProcatsDB,user.uid).catch(()=>false)){clearAccountStorage(user.uid);try{await sdk.reload(user);mode='deleting';render();}catch{await lockCompanion();await sdk.signOut(auth);mode='login';render();}}else{console.error('Workspace initialization failed:',error.code||error.message);mode='storage';render();}}
 finally{opening=false;}
}
window.ProcatsAccount={
 async onAccessDenied(){const user=auth?.currentUser;if(!user||window.PROCATS_DEMO)return;if(await isDeletionPending(firestoreSDK,window.ProcatsDB,user.uid).catch(()=>false)){await window.ProcatsKnowledgeStore?.stop();await window.ProcatsListsStore?.stop();window.ProcatsSync?.stop();await window.ProcatsSync?.flush();await window.ProcatsTimerAlerts?.cancel();await DeviceStore.remove(user.uid);clearAccountStorage(user.uid);await eraseCompanionAccount(user.uid);await lockCompanion();await sdk.signOut(auth);location.reload();}},
 async clearDemo(){await eraseCompanionAccount('demo-local');await window.ProcatsTimerAlerts?.cancel();await window.ProcatsKnowledgeStore?.stop();await window.ProcatsListsStore?.stop();window.ProcatsSync?.stop();await window.ProcatsSync?.flush();await DeviceStore.remove('demo-local');clearAccountStorage('demo-local');localStorage.removeItem('procats-demo-workspace-v1');localStorage.removeItem('procats-demo-active');location.reload();},
 async signOut(){
  if(busy)return;busy=true;let stoppedForExit=false;
  try{
   await drainCompanion();
   await window.ProcatsKnowledgeStore?.beforeExit();await window.ProcatsListsStore?.beforeExit();
   await window.ProcatsSync?.pause();
   const state=window.ProcatsSync?.getState(),uid=auth?.currentUser?.uid;
   const journal=!state&&uid?await DeviceStore.load(uid):null;
   if(window.ProcatsKnowledgeStore?.getState().pending||window.ProcatsKnowledgeStore?.getState().conflict||window.ProcatsListsStore?.getState().pending||state&&(state.pending||state.conflict||!state.localSaved)||journal&&JSON.stringify(journal.data)!==JSON.stringify(journal.base)||uid&&await DeviceStore.hasOtherPending(uid,window.ProcatsSync?.getData()||journal?.data||{},window.ProcatsListsStore?.get(),window.ProcatsKnowledgeStore?.get())){alert(t('saved'));return;}
   await window.ProcatsKnowledgeStore?.stop();await window.ProcatsListsStore?.stop();window.ProcatsSync?.stop();stoppedForExit=true;await window.ProcatsSync?.flush();await window.ProcatsTimerAlerts?.cancel();await window.ProcatsFiles?.clear();
   if(window.PROCATS_DEMO){await lockCompanion();localStorage.removeItem('procats-demo-active');location.reload();return;}
   // Writers are stopped and drained above. Conditional removal atomically
   // refuses other unsynced drafts and fences stale writers before signing out.
   if(uid){await DeviceStore.remove(uid,{expectedData:window.ProcatsSync?.getData()||journal?.data||{},expectedLists:window.ProcatsListsStore?.get(),expectedKnowledge:window.ProcatsKnowledgeStore?.get(),preserveLegacyArchives:true});clearAccountStorage(uid);}
   await lockCompanion();await sdk.signOut(auth);
   location.reload();
  }catch(error){const text=t(error.code==='pending-records'?'saved':'storage');message(text,true);if(stoppedForExit){alert(text);location.reload();}else window.showCustomAlert?.(text);}finally{window.ProcatsSync?.resume();busy=false;}
 },
 async resetPassword(){try{auth.languageCode=document.documentElement.lang;if(auth.currentUser?.email){await sdk.sendPasswordResetEmail(auth,auth.currentUser.email);window.showCustomAlert?.(t('resetSent'));}}catch(error){window.showCustomAlert?.(authError(error));}},
 canImportLegacy(data){return Object.entries(data).every(([key,value])=>key==='yks_v3_days'?Array.isArray(value)&&value.every(day=>day.id===1&&day.name==='Plan'):Array.isArray(value)?value.length===0:value&&typeof value==='object'?Object.keys(value).length===0:false);}
};
await privacyGate(language);
render();
const config=window.PROCATS_FIREBASE;
if(localStorage.getItem('procats-demo-active')==='1'){const user={uid:'demo-local',email:'Demo',emailVerified:true};auth={currentUser:user};await openWorkspace(user,true);}
else if(!config?.apiKey||!config?.projectId||!config?.appId){mode='setup';render();}
else{
 try{

  const app=appSDK.initializeApp(config);sdk=authSDK;auth=sdk.initializeAuth(app,{persistence:[sdk.indexedDBLocalPersistence,sdk.browserLocalPersistence]});auth.languageCode=language;
  window.ProcatsFirestoreSDK=firestoreSDK;window.ProcatsDB=firestoreSDK.getFirestore(app);
  
  sdk.onAuthStateChanged(auth,async user=>{
   if(!busy&&(appLoaded||opening)&&user?.uid!==activeUID){await lockCompanion();document.body.classList.add('auth-locked');await window.ProcatsKnowledgeStore?.stop();await window.ProcatsListsStore?.stop();window.ProcatsSync?.stop();window.ProcatsCloud?.stop();await window.ProcatsSync?.flush();try{const state=window.ProcatsSync?.getState();if((!state||(!state.pending&&!state.conflict&&state.localSaved))&&!window.ProcatsListsStore?.getState().pending&&!window.ProcatsListsStore?.getState().conflict&&!window.ProcatsKnowledgeStore?.getState().pending&&!window.ProcatsKnowledgeStore?.getState().conflict){await DeviceStore.remove(activeUID,{expectedData:window.ProcatsSync?.getData()||{},expectedLists:window.ProcatsListsStore?.get(),expectedKnowledge:window.ProcatsKnowledgeStore?.get(),preserveLegacyArchives:true});clearAccountStorage(activeUID);}location.reload();}catch{mode='storage';render();message(t('storage'),true);}return;}
   if(!user){await lockCompanion();mode='login';render();return;}
   if(!user.emailVerified){mode='verify';render();return;}
   void openWorkspace(user);
  });
 }catch(error){mode='storage';render();message(authError(error),true);}
}
