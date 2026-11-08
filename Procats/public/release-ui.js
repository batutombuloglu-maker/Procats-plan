// Settings keep the existing sheet, with one focused category at a time.
(()=>{const copy={tr:{settings:'Ayarlar',appearance:'Görünüm',language:'Dil',theme:'Tema',workspace:'Çalışma alanı',exams:'Denemeler bölümünü göster',keep:'Gizlemek kayıtlarını silmez. İstediğin zaman geri açabilirsin.',timer:'Sayaç ve alarm',mode:'Uyarı biçimi',sound:'Sesli',vibrate:'Titreşimli',silent:'Sessiz',wake:'Süre bitince ekranı uyandır',wakeHelp:'Yalnızca başlattığın sayaç bittiğinde alarm ekranı için izin istenir. Android, ekran açıkken üst bildirim göstermeyi tercih edebilir. İzin vermezsen normal bildirimle devam eder.',notify:'Bildirim izni',exact:'Hassas alarm izni',screen:'Alarm ekranı izni',account:'Hesap ve kayıtlar',saved:'Bu cihazda kaydedildi',saving:'Cihaza kaydediliyor…',sync:'Bulut eşitleme',delay:'Değişiklikler önce cihaza, son düzenlemeden 10 saniye sonra buluta kaydedilir. Uygulama kapalıyken bekleyenler sonraki açılışta gönderilir.',password:'Şifre sıfırlama e-postası gönder',signout:'Çıkış yap',confirm:'Bu hesaptan çıkış yapılsın mı?',help:'Yardım ve bilgiler',tour:'Uygulamayı tanı',privacy:'Gizlilik ve veri kullanımı',support:'Destek',remove:'Hesabımı ve verilerimi sil',demo:'Misafir · yalnızca bu cihaz'},en:{settings:'Settings',appearance:'Appearance',language:'Language',theme:'Theme',workspace:'Workspace',exams:'Show practice exams',keep:'Hiding keeps your records. Show them again whenever you like.',timer:'Timer and alarm',mode:'Alert style',sound:'Sound',vibrate:'Vibration',silent:'Silent',wake:'Wake screen when time is up',wakeHelp:'Permission is used only for the end of a timer you start. Android may show a banner while the screen is on. Without permission, regular notifications remain available.',notify:'Notification permission',exact:'Exact alarm permission',screen:'Alarm screen permission',account:'Account and records',saved:'Saved on this device',saving:'Saving on device…',sync:'Cloud sync',delay:'Changes are saved on the device first, then synced 10 seconds after the last edit. Pending changes sync when you reopen the app.',password:'Send password reset email',signout:'Sign out',confirm:'Sign out of this account?',help:'Help and information',tour:'Take a quick tour',privacy:'Privacy and data use',support:'Support',remove:'Delete my account and data',demo:'Guest · on this device'},de:{settings:'Einstellungen',appearance:'Darstellung',language:'Sprache',theme:'Design',workspace:'Arbeitsbereich',exams:'Probeprüfungen anzeigen',keep:'Ausblenden löscht keine Einträge. Du kannst den Bereich jederzeit wieder anzeigen.',timer:'Timer und Alarm',mode:'Hinweisart',sound:'Ton',vibrate:'Vibration',silent:'Lautlos',wake:'Bildschirm bei Ablauf aufwecken',wakeHelp:'Die Erlaubnis gilt nur beim Ablauf eines gestarteten Timers. Bei eingeschaltetem Bildschirm kann Android einen Banner anzeigen. Ohne Erlaubnis bleiben normale Benachrichtigungen verfügbar.',notify:'Benachrichtigungen erlauben',exact:'Genaue Alarme erlauben',screen:'Alarmbildschirm erlauben',account:'Konto und Einträge',saved:'Auf diesem Gerät gespeichert',saving:'Wird auf dem Gerät gespeichert…',sync:'Cloud-Synchronisierung',delay:'Zuerst lokal speichern, dann 10 Sekunden nach der letzten Änderung synchronisieren. Ausstehende Änderungen werden beim erneuten Öffnen übertragen.',password:'E-Mail zum Zurücksetzen senden',signout:'Abmelden',confirm:'Von diesem Konto abmelden?',help:'Hilfe und Informationen',tour:'Kurze Einführung',privacy:'Datenschutz und Datennutzung',support:'Support',remove:'Konto und Daten löschen',demo:'Gast · auf diesem Gerät'}};
const extra = {
 tr:{back:'Ayarlara dön',close:'Kapat',notifications:'Bildirimler',appearanceHelp:'Tema ve uygulama dili',workspaceHelp:'Görünür bölümler ve alt bar',notificationsHelp:'Ses, titreşim, alarm ve izinler',accountHelp:'Kayıtlar ve bulut eşitleme',share:'Bağlantı ve paylaşım',shareHelp:'Web bağlantısı ve ana ekran kısayolu',helpHelp:'Rehber, gizlilik ve destek',palettes:'Renk temaları',pictures:'Görsel temalar',themeHelp:'Tema tüm bölümlere uygulanır. Değişikliğin otomatik kaydedilir.',selected:'Seçili',permissions:'İzinler',allowed:'Açık',required:'İzin ver',unsupported:'Bu tarayıcıda kullanılamıyor',webAlarm:'Tarayıcıda sesli uyarı için sayfayı açık tut. Arka plandaki zamanlayıcılar tarayıcı tarafından durdurulabilir.',webLink:'Web bağlantısı',copy:'Bağlantıyı kopyala',copied:'Bağlantı kopyalandı.',copyHelp:'Bağlantıyı seçip cihazının Kopyala seçeneğini kullanabilirsin.',shareAction:'Uygulamayı paylaş',shareText:'Görevlerin, notların ve odak zamanın için Procats.',linkHelp:'iPhone ve iPad’de web sürümünü kullanabilir, Android’de Play Store sayfasına geçebilirsin.',android:'Google Play’de aç',install:'Ana Ekrana Kısayol Ekle',installed:'Ana ekrana eklenmiş',installIOS:'Safari’de Paylaş menüsünü aç, ardından Ana Ekrana Ekle’yi seç. Bu seçenek görünmüyorsa bağlantıyı Safari’de aç.',installAndroid:'Tarayıcının menüsünden Uygulamayı yükle veya Ana ekrana ekle seçeneğini kullan. Seçenek görünmüyorsa bağlantıyı Chrome’da aç.',installDesktop:'Tarayıcının adres çubuğundaki yükleme simgesini ya da menüdeki Uygulamayı yükle seçeneğini kullan.',installWait:'Tarayıcının yükleme adımlarını izle.',installDismissed:'Kısayolu daha sonra buradan ekleyebilirsin.',navEdit:'Alt barı düzenle',navHelp:'Diğer menüsünde bir bölüme basılı tutup alt bara sürükle. Alt barı düzenle ile okları ve Sabitle düğmesini de kullanabilirsin.',failed:'İşlem tamamlanamadı. Lütfen yeniden dene.'},
 en:{back:'Back to settings',close:'Close',notifications:'Notifications',appearanceHelp:'Theme and app language',workspaceHelp:'Visible sections and bottom tabs',notificationsHelp:'Sound, vibration, alarms and permissions',accountHelp:'Records and cloud sync',share:'Links and sharing',shareHelp:'Web link and home screen shortcut',helpHelp:'Guide, privacy and support',palettes:'Color themes',pictures:'Picture themes',themeHelp:'Your theme applies to every section and is saved automatically.',selected:'Selected',permissions:'Permissions',allowed:'Enabled',required:'Allow',unsupported:'Unavailable in this browser',webAlarm:'Keep this page open for sound alerts. Your browser may pause timers in the background.',webLink:'Web link',copy:'Copy link',copied:'Link copied.',copyHelp:'Select the link and use your device’s Copy action.',shareAction:'Share Procats',shareText:'Procats for your tasks, notes and focus time.',linkHelp:'Use the web app on iPhone and iPad, or visit Google Play on Android.',android:'Open in Google Play',install:'Add to Home Screen',installed:'Added to home screen',installIOS:'In Safari, open Share and choose Add to Home Screen. If unavailable, open this link in Safari.',installAndroid:'Open the browser menu and choose Install app or Add to Home screen. If unavailable, open this link in Chrome.',installDesktop:'Use the install icon in your browser’s address bar or the Install app option in its menu.',installWait:'Follow your browser’s installation steps.',installDismissed:'You can add the shortcut here later.',navEdit:'Customize bottom tabs',navHelp:'In More, hold a section and drag it to the bottom bar. Customize bottom tabs also provides arrows and Pin buttons.',failed:'The action could not be completed. Please try again.'},
 de:{back:'Zurück zu Einstellungen',close:'Schließen',notifications:'Benachrichtigungen',appearanceHelp:'Design und Sprache',workspaceHelp:'Sichtbare Bereiche und untere Leiste',notificationsHelp:'Ton, Vibration, Alarme und Berechtigungen',accountHelp:'Einträge und Cloud-Synchronisierung',share:'Links und Teilen',shareHelp:'Weblink und Startbildschirm-Verknüpfung',helpHelp:'Anleitung, Datenschutz und Support',palettes:'Farbdesigns',pictures:'Bilddesigns',themeHelp:'Das Design gilt für alle Bereiche und wird automatisch gespeichert.',selected:'Ausgewählt',permissions:'Berechtigungen',allowed:'Aktiviert',required:'Erlauben',unsupported:'In diesem Browser nicht verfügbar',webAlarm:'Für akustische Hinweise diese Seite geöffnet lassen. Der Browser kann Timer im Hintergrund anhalten.',webLink:'Weblink',copy:'Link kopieren',copied:'Link kopiert.',copyHelp:'Markiere den Link und wähle auf deinem Gerät Kopieren.',shareAction:'Procats teilen',shareText:'Procats für Aufgaben, Notizen und Fokuszeit.',linkHelp:'Auf iPhone und iPad die Web-App nutzen, auf Android Google Play öffnen.',android:'In Google Play öffnen',install:'Zum Startbildschirm hinzufügen',installed:'Zum Startbildschirm hinzugefügt',installIOS:'In Safari Teilen öffnen und Zum Home-Bildschirm wählen. Falls nicht verfügbar, den Link in Safari öffnen.',installAndroid:'Im Browsermenü App installieren oder Zum Startbildschirm hinzufügen wählen. Falls nicht verfügbar, den Link in Chrome öffnen.',installDesktop:'Das Installationssymbol in der Adressleiste oder App installieren im Browsermenü verwenden.',installWait:'Den Installationsschritten des Browsers folgen.',installDismissed:'Du kannst die Verknüpfung später hier hinzufügen.',navEdit:'Untere Leiste anpassen',navHelp:'Unter Mehr einen Bereich gedrückt halten und in die untere Leiste ziehen. Untere Leiste anpassen bietet auch Pfeile und Anheften.',failed:'Die Aktion ist fehlgeschlagen. Bitte erneut versuchen.'}
};
for(const lang of Object.keys(extra)) Object.assign(copy[lang],extra[lang]);
const L = key => (globalThis.ProcatsLocale?.messages(copy,currentLang) || copy[currentLang] || copy.tr)[key];
const prefs = ProcatsPreferences, originalSwitch = window.switchView, removeAccount = ProcatsUI.deleteAccount;
const modal = document.getElementById('appSettings'), body = modal.querySelector('.experience-body');
const heading = modal.querySelector('h2'), close = modal.querySelector('.sheet-close');
const back = document.createElement('button');back.type='button';back.className='settings-back';back.textContent='‹';back.onclick=()=>show();heading.before(back);
let currentPage='',returnFocus=null,renderToken=0;
window.switchView = (view,...args) => originalSwitch(view==='knowledge'||!prefs.sectionVisible(view,prefs.get())?'home':view,...args);
function apply(){
 for(const view of ['exams']){
  const visible=prefs.sectionVisible(view,prefs.get());document.body.classList.toggle(view+'-hidden',!visible);
  document.querySelectorAll('[data-mobile-view="'+view+'"],[data-mobile-target="'+view+'"],[data-action-click*="switchView(\''+view+'\')"]').forEach(el=>el.hidden=!visible);
  if(!visible&&document.getElementById('view-'+view)?.classList.contains('active'))window.switchView('home');
 }
 window.ProcatsMobileNavigation?.refresh();
}
window.ProcatsSections={apply};apply();
function section(title){const s=document.createElement('section');s.className='settings-section';const h=document.createElement('h3');h.textContent=title;const p=document.createElement('div');p.className='settings-panel';s.append(h,p);body.append(s);return p;}
function action(parent,title,fn,klass=''){
 const button=document.createElement('button');button.type='button';button.className='settings-action '+klass;button.textContent=title;
 button.onclick=async()=>{button.disabled=true;try{await fn();}catch(error){if(error?.name!=='AbortError')showCustomAlert(L('failed'));}finally{button.disabled=false;}};
 parent.append(button);return button;
}
function hint(parent,text){const p=document.createElement('p');p.className='settings-hint';p.textContent=text;parent.after(p);return p;}
function select(parent,id,title,options,value,change){
 const row=document.createElement('div');row.className='settings-row';const label=document.createElement('label');label.htmlFor=id;label.textContent=title;
 const input=document.createElement('select');input.id=id;for(const [v,t]of options)input.add(new Option(t,v));input.value=value;input.onchange=()=>change(input.value);row.append(label,input);parent.append(row);
}
function toggle(parent,id,title,value,change){
 const label=document.createElement('label');label.className='settings-toggle';const text=document.createElement('span');text.textContent=title;const input=document.createElement('input');input.id=id;input.type='checkbox';input.checked=value;input.onchange=()=>change(input.checked);label.append(text,input);parent.append(label);
}
function reconcile(){return ProcatsTimerAlerts.reconcile(ProcatsSync.getData().procats_timer);}
function refresh(){
 const node=document.getElementById('settingsDeviceState');if(!node)return;
 const state=ProcatsSync.getState();node.textContent=state.status==='storage'?syncText('storage'):L(state.localSaved?'saved':'saving');
}
function overview(){
 const hero=document.createElement('div');hero.className='settings-hero';const title=document.createElement('strong');title.textContent=window.PROCATS_DEMO?L('demo'):'Procats';
 const subtitle=document.createElement('small');subtitle.textContent=window.PROCATS_DEMO?'Procats Studio':window.PROCATS_BOOT?.email||'';hero.append(title,subtitle);body.append(hero);
 const list=document.createElement('div');list.className='settings-panel settings-categories';body.append(list);
 for(const page of ['appearance','workspace','notifications','account','share','help']){
  const button=action(list,'',()=>show(page),'settings-category');button.dataset.settingsPage=page;
  const text=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=L(page);small.textContent=L(page+'Help');text.append(strong,small);button.append(text);
 }
 const footer=document.createElement('p');footer.className='settings-version';footer.textContent='Procats Studio · '+(window.PROCATS_PUBLISHER?.version||'2.1.0');body.append(footer);
}
function appearance(){
 const language=section(L('language'));select(language,'settingsLanguage',L('language'),ProcatsLocale.options,currentLang,value=>{setLang(value);try{localStorage.setItem('procats-login-language',value);}catch{}show('appearance');});
 const themes=window.ProcatsThemes;if(!themes)return;
 for(const picture of [false,true]){
  const group=section(L(picture?'pictures':'palettes'));group.classList.add('settings-theme-grid');
  for(const theme of themes.all.filter(item=>!!item.image===picture)){
   const button=document.createElement('button');button.type='button';button.className='settings-theme-card';button.dataset.themeChoice=theme.id;button.setAttribute('aria-pressed',String(theme.id===document.documentElement.dataset.theme));
   const preview=document.createElement('span');preview.className='settings-theme-preview';preview.style.background=theme.color;preview.style.setProperty('--preview-accent',theme.accent);
   if(theme.image){const image=document.createElement('img');image.src='/themes/'+theme.image+'.webp';image.alt='';image.loading='lazy';if(theme.landscape)image.className='theme-landscape';preview.append(image);}
   const sample=document.createElement('span');sample.className='settings-theme-sample';sample.setAttribute('aria-hidden','true');preview.append(sample);
   const label=document.createElement('span');label.className='settings-theme-name';label.textContent=themes.label(theme,currentLang);const check=document.createElement('span');check.className='settings-theme-check';check.textContent='✓';check.setAttribute('aria-hidden','true');
   button.append(preview,label,check);button.onclick=()=>{setTheme(theme.id);void reconcile();};group.append(button);
  }
 }
 const help=document.createElement('p');help.className='settings-hint';help.textContent=L('themeHelp');body.append(help);
 window.ProcatsCustomThemes?.mount(body);
}
function workspace(){
 if(window.ProcatsCompanionUI?.available){const devices=section('Saat ve ana ekran araçları');action(devices,'Saat ve araçları ayarla',()=>{closeSettings();void window.ProcatsCompanionUI.open();});hint(devices,'Sıradaki görevin, günün özeti ve Galaxy Watch / Wear OS kartı.');}
 const workspace=section(L('workspace'));toggle(workspace,'settingsExams',L('exams'),prefs.get().examsVisible,value=>{prefs.set({examsVisible:value});apply();});hint(workspace,L('keep'));
 const nav=section(L('navEdit'));action(nav,L('navEdit'),()=>{closeSettings();document.querySelector('.mobile-tabs [data-mobile-view="more"]')?.click();const editor=document.getElementById('navigationEditor');if(editor?.hidden)document.querySelector('.navigation-edit-toggle')?.click();});hint(nav,L('navHelp'));
 if(!matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 1024px)').matches)nav.querySelector('button').hidden=true;
}
async function updatePermissions(token){
 const status=await ProcatsTimerAlerts.status().catch(()=>({}));if(token!==renderToken)return;
 for(const key of ['notifications','exact','fullScreen']){
  const node=document.querySelector('[data-permission-state="'+key+'"]');if(node)node.textContent=L(status[key]?'allowed':'required');
 }
}
function notifications(){
 const timer=section(L('timer'));select(timer,'settingsAlert',L('mode'),['sound','vibrate','silent'].map(key=>[key,L(key)]),prefs.get().timerMode,value=>{prefs.set({timerMode:value});void reconcile();});
 if(ProcatsNative.isNative){
  toggle(timer,'settingsWake',L('wake'),prefs.get().wakeScreen,value=>{
   if(value){document.getElementById('settingsWake').checked=false;showCustomConfirm(L('wakeHelp'),async()=>{prefs.set({wakeScreen:true});await ProcatsTimerAlerts.screen().catch(()=>{});await reconcile();show('notifications');});}
   else{prefs.set({wakeScreen:false});void reconcile();show('notifications');}
  });
 }
 hint(timer,ProcatsTimerAlerts.help());
 const permissions=section(L('permissions'));
 const addPermission=(label,key,fn)=>{const button=action(permissions,'',async()=>{await fn();await updatePermissions(renderToken);});const text=document.createElement('span'),state=document.createElement('small');text.textContent=L(label);state.dataset.permissionState=key;state.textContent='…';button.append(text,state);return button;};
 if(ProcatsNative.isNative){addPermission('notify','notifications',()=>ProcatsTimerAlerts.enable());addPermission('exact','exact',()=>ProcatsTimerAlerts.precise());if(prefs.get().wakeScreen)addPermission('screen','fullScreen',()=>ProcatsTimerAlerts.screen());}
 else{
  const supported='Notification' in window;const button=addPermission('notify','notifications',()=>ProcatsTimerAlerts.enable());button.disabled=!supported;if(!supported)button.querySelector('small').textContent=L('unsupported');
  hint(permissions,L('webAlarm'));
 }
 void updatePermissions(renderToken);
}
function account(){
 const panel=section(L('account'));const state=document.createElement('p');state.id='settingsDeviceState';state.className='settings-state';state.setAttribute('role','status');panel.append(state);
 action(panel,L('sync'),()=>{closeSettings();procatsOpenSync();});if(!window.PROCATS_DEMO)action(panel,L('password'),()=>ProcatsAccount.resetPassword());
 action(panel,L('signout'),()=>showCustomConfirm(L('confirm'),()=>procatsSignOut()));action(panel,L('remove'),()=>{closeSettings();removeAccount();},'danger');hint(panel,window.PROCATS_DEMO?L('demo'):L('delay'));refresh();
}
function webUrl(){try{const url=new URL(window.PROCATS_PUBLISHER?.siteUrl||'https://procats-example.web.app');return url.protocol==='https:'?url.href:'https://procats-example.web.app/';}catch{return 'https://procats-example.web.app/';}}
function shareStatus(text){const node=document.getElementById('settingsShareStatus');if(node)node.textContent=text;}
async function copyLink(){
 try{await navigator.clipboard.writeText(webUrl());shareStatus(L('copied'));}
 catch{const input=document.getElementById('settingsWebLink');input?.focus();input?.select();try{if(document.execCommand('copy')){shareStatus(L('copied'));return;}}catch{}shareStatus(L('copyHelp'));}
}
async function shareLink(){
 const data={title:'Procats',text:L('shareText'),url:webUrl()};
 if(ProcatsNative.isNative&&window.ProcatsShareLink){await window.ProcatsShareLink(data);return;}
 if(navigator.share){try{await navigator.share(data);return;}catch(error){if(error.name==='AbortError')return;}}
 await copyLink();
}
const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
async function install(){
 const prompt=window.procatsInstallPrompt;
 if(prompt){window.procatsInstallPrompt=null;await prompt.prompt();const choice=await prompt.userChoice;shareStatus(L(choice?.outcome==='accepted'?'installWait':'installDismissed'));return;}
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 shareStatus(L(ios?'installIOS':/Android/i.test(navigator.userAgent)?'installAndroid':'installDesktop'));
}
function sharing(){
 const links=section(L('webLink'));const label=document.createElement('label');label.className='settings-link-label';label.htmlFor='settingsWebLink';label.textContent=L('webLink');
 const input=document.createElement('input');input.type='url';input.id='settingsWebLink';input.className='settings-web-link';input.readOnly=true;input.value=webUrl();input.onclick=()=>input.select();links.append(label,input);
 action(links,L('copy'),copyLink);action(links,L('shareAction'),shareLink);hint(links,L('linkHelp'));
 const android=window.PROCATS_PUBLISHER?.androidUrl;
 if(android){try{const url=new URL(android);if(url.protocol==='https:'&&url.hostname==='play.google.com'){const a=document.createElement('a');a.className='settings-action';a.href=url.href;a.target='_blank';a.rel='noopener';a.textContent=L('android');if(ProcatsNative.isNative)a.onclick=event=>{event.preventDefault();void window.ProcatsOpenResource(a.href);};links.append(a);}}catch{}}
 if(!ProcatsNative.isNative){const installPanel=section(L('install'));const button=action(installPanel,L(installed()?'installed':'install'),install);button.disabled=installed();}
 const status=document.createElement('p');status.id='settingsShareStatus';status.className='settings-share-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');body.append(status);
}
function help(){
 const panel=section(L('help'));action(panel,L('tour'),()=>{closeSettings();ProcatsTour.start();});action(panel,L('support'),()=>location.assign('/support.html?lang='+currentLang));
}
const pages={appearance,workspace,notifications,account,share:sharing,help};
function show(page=''){
 if(typeof page!=='string'||!pages[page])page='';
 if(!modal.classList.contains('active'))returnFocus=document.activeElement;
 hideAllMenus();renderToken++;currentPage=page;body.replaceChildren();heading.textContent=L(page||'settings');close.setAttribute('aria-label',L('close'));back.setAttribute('aria-label',L('back'));back.hidden=!page;
 if(page)pages[page]();else overview();modal.dataset.settingsPage=page||'overview';modal.classList.add('active');body.scrollTop=0;modal.querySelector('.modal-content').scrollTop=0;(page?back:close).focus();
}
function closeSettings(){modal.classList.remove('active');returnFocus?.focus();}
close.onclick=closeSettings;
modal.addEventListener('click',event=>{if(event.target===modal)closeSettings();});
modal.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(currentPage)show();else closeSettings();}
 if(event.key==='Tab'){
  const buttons=[...modal.querySelectorAll('button,input,select,a[href]')].filter(node=>!node.disabled&&node.getClientRects().length);const first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
});
ProcatsUI.settings=show;ProcatsUI.settingsBack=()=>{if(modal.classList.contains('active')&&currentPage){show();return true;}return false;};
document.getElementById('mobileSettings').onclick=()=>show();document.querySelector('[data-mobile-target="settings"]').onclick=()=>{document.getElementById('mobileMore').classList.remove('active');show();};
const desktop=document.createElement('button');desktop.className='context-menu-item';desktop.type='button';desktop.textContent=L('settings');desktop.onclick=()=>show();document.getElementById('themeMenu').prepend(desktop);
window.addEventListener('procats-sync-status',refresh);window.addEventListener('appinstalled',()=>{window.procatsInstallPrompt=null;if(modal.classList.contains('active')&&currentPage==='share')show('share');});
window.addEventListener('focus',()=>{if(modal.classList.contains('active')&&currentPage==='notifications')void updatePermissions(renderToken);});
new MutationObserver(()=>{desktop.textContent=L('settings');apply();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
