/* Additional controls reuse the supplied application's theme and dialogs. */
const syncTranslations={
 tr:{password:'Şifremi değiştir',quota:'Kullanım kotası doldu · değişiklikler cihazda bekliyor',install:'Kısayol ekle',sync:'Cihaz eşitleme',retry:'Şimdi eşitle',signout:'Çıkış yap',close:'Kapat',both:'İki sürümü indir',local:'Bu cihazdaki sürümü kullan',remote:'Diğer sürümü kullan',conflictHelp:'İki cihazda aynı kayıt değişti. Bir sürüm seçmeden önce iki sürümü de indirebilirsin. Seçimden önce iki sürüm bu cihazda saklanır.',connecting:'Bağlanıyor…',synced:'Eşitlendi',pending:'Değişiklikler bekliyor',saving:'Eşitleniyor…',offline:'Çevrimdışı · değişiklikler bu cihazda bekliyor',waiting:'Yeni kayıtlar var · düzenlemen bitince uygulanacak',conflict:'Çakışma var · sürüm seç',storage:'Cihaza kaydedilemiyor · Veri Kasası’ndan yedek al',invalid:'Kayıt eşitlenemedi · Veri Kasası’ndan yedek al (en fazla 850 KB)',signin:'Oturum sona erdi · yeniden giriş yap',installed:'Kısayol hazır.',ios:'Safari’de Paylaş düğmesine, ardından Ana Ekrana Ekle’ye dokun.',android:'Tarayıcı menüsünden Uygulamayı yükle veya Ana ekrana ekle’yi seç.',desktop:'Chrome veya Edge menüsünden Procats’ı yükle seçeneğini kullan. Adres çubuğunda yükleme simgesi de görünebilir.',already:'Procats zaten uygulama penceresinde açık.',failed:'Kısayol oluşturulamadı. Tekrar deneyebilirsin.',account:'Hesap',help:'Telefon ve PC’de aynı Procats hesabını kullan. Kayıtların sana özeldir. Tema ve dil bu cihazda kalır.',leave:'Henüz eşitlenmemiş değişiklikler var. Çıkmadan önce eşitle veya Veri Kasası’ndan yedek al.',legacy:'Bu PC’deki eski Procats kayıtlarını bu hesaba aktaralım mı? Eski kayıtların bir yedeği PC’de korunur.',legacyExisting:'Bu hesapta kayıtlar zaten var. Eski PC kayıtları Veri Kasası üzerinden içe aktarılabilir; otomatik olarak üzerine yazılmadı.'},
 en:{password:'Change password',quota:'Usage limit reached · changes pending on this device',install:'Add shortcut',sync:'Device sync',retry:'Sync now',signout:'Sign out',close:'Close',both:'Download both versions',local:'Use this device’s version',remote:'Use the other version',conflictHelp:'The same record changed on two devices. Download both versions before choosing. Both versions are also saved on this device before resolving.',connecting:'Connecting…',synced:'Synced',pending:'Changes pending',saving:'Syncing…',offline:'Offline · changes are waiting on this device',waiting:'Updates waiting · finish editing to apply',conflict:'Conflict · choose a version',storage:'Device storage unavailable · export a Data Vault backup',invalid:'Unable to sync · export a Data Vault backup (maximum 850 KB)',signin:'Session expired · sign in again',installed:'Shortcut created.',ios:'In Safari, tap Share, then Add to Home Screen.',android:'Open the browser menu and choose Install app or Add to Home screen.',desktop:'In Chrome or Edge, choose Install Procats from the menu or use the address-bar install icon.',already:'Procats is already open as an app.',failed:'The shortcut could not be created. Please try again.',account:'Account',help:'Use the same Procats account on your phone and PC. Your records are private. Theme and language stay on this device.',leave:'Changes have not synced yet. Sync or export a Data Vault backup before signing out.',legacy:'Import this PC’s old Procats records into this account? A copy of the original records stays on this PC.',legacyExisting:'This account already has records. Import the old PC backup through Data Vault if needed; nothing was overwritten automatically.'},
 de:{password:'Passwort ändern',quota:'Kontingent erreicht · Änderungen warten auf diesem Gerät',install:'Verknüpfung hinzufügen',sync:'Geräte synchronisieren',retry:'Jetzt synchronisieren',signout:'Abmelden',close:'Schließen',both:'Beide Versionen herunterladen',local:'Version dieses Geräts verwenden',remote:'Andere Version verwenden',conflictHelp:'Derselbe Eintrag wurde auf zwei Geräten geändert. Lade beide Versionen vor der Auswahl herunter. Beide bleiben vor der Auflösung auf diesem Gerät gesichert.',connecting:'Verbindung wird hergestellt…',synced:'Synchronisiert',pending:'Änderungen ausstehend',saving:'Wird synchronisiert…',offline:'Offline · Änderungen warten auf diesem Gerät',waiting:'Aktualisierung wartet · Bearbeitung beenden',conflict:'Konflikt · Version auswählen',storage:'Lokaler Speicher nicht verfügbar · Sicherung im Datentresor exportieren',invalid:'Synchronisierung fehlgeschlagen · Sicherung exportieren (maximal 850 KB)',signin:'Sitzung abgelaufen · erneut anmelden',installed:'Verknüpfung erstellt.',ios:'In Safari auf Teilen und dann auf Zum Home-Bildschirm tippen.',android:'Im Browsermenü App installieren oder Zum Startbildschirm hinzufügen wählen.',desktop:'In Chrome oder Edge im Menü Procats installieren oder das Installationssymbol in der Adressleiste wählen.',already:'Procats ist bereits als App geöffnet.',failed:'Die Verknüpfung konnte nicht erstellt werden. Bitte erneut versuchen.',account:'Konto',help:'Auf Telefon und PC dasselbe Procats-Konto verwenden. Deine Einträge sind privat. Design und Sprache bleiben auf diesem Gerät.',leave:'Änderungen wurden noch nicht synchronisiert. Vor dem Abmelden synchronisieren oder eine Sicherung exportieren.',legacy:'Die bisherigen Procats-Einträge dieses PCs in dieses Konto importieren? Eine Kopie bleibt auf diesem PC.',legacyExisting:'Dieses Konto enthält bereits Einträge. Die alte PC-Sicherung kann im Datentresor importiert werden; nichts wurde automatisch überschrieben.'}
};
function syncText(key){return (syncTranslations[currentLang]||syncTranslations.tr)[key]||key;}
function updateSyncUI(){
 const state={...ProcatsSync.getState()};
 const sidecars=[window.ProcatsListsStore,window.ProcatsKnowledgeStore].filter(Boolean).map(s=>s.getState());
 if(['synced','device'].includes(state.status)){const issue=sidecars.find(s=>s.conflict||s.invalid||['storage','unavailable','offline'].includes(s.status));if(issue)state.status=issue.conflict?'sectionConflict':issue.invalid?'sectionInvalid':issue.status==='unavailable'?'sectionUnavailable':issue.status;else if(sidecars.some(s=>s.pending||s.status==='saving'||s.status==='connecting'))state.status='pending';}
 if(state.localSaved===false&&state.status!=='storage')state.status='localSaving';else if(state.localSaved&&state.pending&&!['conflict','invalid','quota','signin','storage','offline','waiting','saving'].includes(state.status))state.status='localPending';
 document.querySelectorAll('[data-sync-text]').forEach(el=>el.textContent=syncText(el.dataset.syncText));
 document.getElementById('syncStatus').textContent=window.PROCATS_DEMO?{tr:'Cihazda',en:'On device',de:'Lokal'}[currentLang]:syncText(state.status);
 document.getElementById('syncAccount').textContent=syncText('account')+': '+state.email;
 document.getElementById('syncDetail').textContent=window.PROCATS_DEMO?{tr:'Demo yalnızca bu cihazda saklanır. Eşitleme için hesabına giriş yap.',en:'Demo is saved only on this device. Sign in for cloud sync.',de:'Demo bleibt auf diesem Gerät. Für Cloud-Sync anmelden.'}[currentLang]:syncText(state.status)+' — '+syncText('help');
 document.getElementById('syncConflict').hidden=!state.conflict;
}
function procatsOpenSync(){updateSyncUI();hideAllMenus();openModal('syncModal');}
async function procatsSyncNow(){if(ProcatsSync.getState().status==='signin'){location.reload();return;}await Promise.all([ProcatsSync.sync(),window.ProcatsListsStore?.sync(),window.ProcatsKnowledgeStore?.sync()]);updateSyncUI();}
function procatsResolve(which){ProcatsSync.resolve(which);updateSyncUI();}
async function procatsConflictBackup(){
 const state=ProcatsSync.getConflict();if(!state)return;
 const password=await ProcatsBackupUI.password('create');if(password===null)return;
 try{for(const [name,data]of [['local',state.local],['remote',state.remote]]){const backup={format:'procats',version:2,exportDate:new Date().toISOString()};for(const [key,value]of Object.entries(data))backup[key]=JSON.stringify(value);const encrypted=await ProcatsBackupCrypto.encryptBackup(backup,password);await ProcatsFiles.save(new Blob([JSON.stringify(encrypted)],{type:'application/json'}),'Procats-'+name+'-'+Date.now()+'.procats.json');}}
 catch{showCustomAlert(t('alert_import_err'));}
}
async function procatsSignOut(){
 await ProcatsSync.sync();if(ProcatsSync.getState().pending||ProcatsSync.getState().conflict){showCustomAlert(syncText('leave'));return;}
 await window.ProcatsTimerAlerts?.cancel();await window.ProcatsAccount.signOut();
}

async function procatsInstall(){
 hideAllMenus();
 if(window.procatsDesktop?.createShortcut){try{await window.procatsDesktop.createShortcut();showCustomAlert(syncText('installed'));}catch{showCustomAlert(syncText('failed'));}return;}
 if(window.ProcatsNative?.isNative||matchMedia('(display-mode: standalone)').matches||navigator.standalone){showCustomAlert(syncText('already'));return;}
 if(window.procatsInstallPrompt){const prompt=window.procatsInstallPrompt;window.procatsInstallPrompt=null;await prompt.prompt();await prompt.userChoice;return;}
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 showCustomAlert(syncText(ios?'ios':/Android/.test(navigator.userAgent)?'android':'desktop'));
}
window.procatsValidate=function(data){
 if(!Object.entries(data).every(([key,value])=>validData(key,value)))return false;
 const d=data.yks_v3_days||[],f=data.procats_folders||[],n=data.procats_obs_notes||[],nf=data.procats_obs_folders||[];
 return !(data.yks_v3_tasks||[]).some(t=>!d.some(x=>x.id===t.dayId))&&!d.some(x=>x.folderId!=null&&!f.some(y=>y.id===x.folderId))&&!n.some(x=>x.folderId!=null&&!nf.some(y=>y.id===x.folderId));
};
window.procatsApplyRemote=function(previous,data){
 folders=data.procats_folders||[];days=data.yks_v3_days||[];tasks=data.yks_v3_tasks||[];notes=data.yks_v5_notes||[];activityData=data.yks_v6_activity||{};
 bookmarks=data.yks_v7_bookmarks||[];archives=data.yks_v8_archives||[];obsFolders=data.procats_obs_folders||[];obsNotes=data.procats_obs_notes||[];reminders=data.procats_reminders||[];examRecords=data.procats_exams_v1||[];
 if(!days.some(x=>x.id===activeDayId))activeDayId=null;
 if(!obsNotes.some(x=>x.id===activeObsNoteId))activeObsNoteId=null;
 renderApp();renderNotes();renderBookmarks();renderObsidian();renderObsEditor();renderHeatmap();renderExams();
 if(!ProcatsMerge.same(previous.procats_sw,data.procats_sw)){
  clearInterval(swInterval);swInterval=null;const state=data.procats_sw||{savedTime:0,startTime:0,isRunning:false};swSavedTime=state.savedTime;swStartTime=state.startTime;swRunning=state.isRunning;
  if(swRunning)durationClock()?.elapsed(swStartTime);swRefreshScheduler();document.getElementById('swStartBtn').textContent=t(swRunning?'btn_pause':'btn_start');
 }
 if(!ProcatsMerge.same(previous.procats_timer,data.procats_timer)){
  clearInterval(tInterval);tInterval=null;const state=data.procats_timer||{isRunning:false,endTime:0,remainingTime:0};tEndTime=state.endTime;tTime=state.isRunning?Math.max(0,Math.ceil((window.ProcatsDurationClock?.remaining(tEndTime)??tEndTime-Date.now())/1000)):state.remainingTime;tDuration=Math.max(tTime,Number.isFinite(state.duration)?state.duration:0);
  if(state.isRunning&&tTime>0)tInterval=setInterval(tickTimer,1000);tUpdateDisplay();window.ProcatsTimerAlerts?.reconcile(state);
 }
};
window.addEventListener('procats-sync-status',updateSyncUI);
window.addEventListener('procats-knowledge-change',updateSyncUI);
window.addEventListener('procats-lists-change',updateSyncUI);
new MutationObserver(updateSyncUI).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
window.procatsInitializeSyncUI=async()=>{
 ProcatsSync.start();updateSyncUI();
 if(!window.ProcatsNative?.isNative&&!window.procatsDesktop?.bundledAssets&&'serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
 // Desktop migration is explicit and never overwrites an existing cloud workspace.
 if(window.procatsDesktop?.getLegacy){
  const legacy=await window.procatsDesktop.getLegacy().catch(()=>null);
  if(legacy&&Object.keys(legacy).length){
   if(window.ProcatsAccount.canImportLegacy(window.PROCATS_BOOT.data))showCustomConfirm(syncText('legacy'),async()=>{try{const updates=prepareBackupData(legacy);const old=ProcatsSync.getData();await ProcatsSync.importBackup(updates);window.procatsApplyRemote(old,ProcatsSync.getData());loadTheme();setLang(appStorage.getItem('procats_lang')||currentLang);await ProcatsSync.sync();if(ProcatsSync.getState().status==='synced')await window.procatsDesktop.ackLegacy();}catch{showCustomAlert(t('alert_import_err'));}});
   else showCustomAlert(syncText('legacyExisting'));
  }
 }
};

for(const [lang,words]of Object.entries({tr:['Cihaza kaydediliyor…','Cihazda kayıtlı · eşitleme bekliyor'],en:['Saving on device…','Saved on device · sync pending'],de:['Wird lokal gespeichert…','Lokal gespeichert · Sync ausstehend']}))Object.assign(syncTranslations[lang],{localSaving:words[0],localPending:words[1]});

for(const [lang,words]of Object.entries({tr:['Bir bölümde çakışma var · Listeler / Bilgi Hazinesi bölümünü aç','Bir bölüm okunamadı · Listeler / Bilgi Hazinesi bölümünü aç','Bölüm eşitlemesi kullanılamıyor · Listeler / Bilgi Hazinesi bölümünü aç'],en:['Section conflict · open Lists / Knowledge treasury','Section unreadable · open Lists / Knowledge treasury','Section sync unavailable · open Lists / Knowledge treasury'],de:['Bereichskonflikt · Listen / Wissensschatz öffnen','Bereich nicht lesbar · Listen / Wissensschatz öffnen','Bereichssynchronisierung nicht verfügbar · Listen / Wissensschatz öffnen']}))Object.assign(syncTranslations[lang],{sectionConflict:words[0],sectionInvalid:words[1],sectionUnavailable:words[2]});
