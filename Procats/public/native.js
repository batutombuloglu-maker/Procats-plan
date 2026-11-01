import './timer-alerts.js';
import {ProcatsDevice} from './device-store.js';
import {Capacitor,registerPlugin,SystemBars,SystemBarsStyle} from '@capacitor/core';import {App} from '@capacitor/app';import {Filesystem,Directory} from '@capacitor/filesystem';import {Share} from '@capacitor/share';
const native=Capacitor.isNativePlatform();window.ProcatsNative={isNative:native};
window.ProcatsShareLink=options=>Share.share(options);
const clear=async()=>{if(native)await Filesystem.rmdir({directory:Directory.Cache,path:'exports',recursive:true}).catch(()=>{});};
window.ProcatsFiles={clear,async save(blob,name){
 if(!native){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return;}
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(blob);});
 const result=await Filesystem.writeFile({directory:Directory.Cache,path:'exports/'+name.replace(/[^\p{L}\p{N}._-]/gu,'-'),data,recursive:true});await Share.share({title:name,files:[result.uri]});
}};
if(native){await clear();const style=()=>SystemBars.setStyle({style:document.documentElement.dataset.themeTone==='light'?SystemBarsStyle.Light:SystemBarsStyle.Dark}).catch(()=>{});style();new MutationObserver(style).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-theme-tone']});
 App.addListener('appStateChange',({isActive})=>{if(isActive){window.ProcatsSync?.sync(true);window.ProcatsTimerAlerts?.resume();}else{void window.ProcatsSync?.sync(true);void window.ProcatsSync?.flush();}});
 App.addListener('backButton',()=>{if(document.getElementById('privacyGate')){App.minimizeApp();return;}if(document.querySelector('.tour-overlay')){window.ProcatsTour?.close();return;}if(!['/','/index.html'].includes(location.pathname)){if(document.querySelector('#publicDeleteForm button:disabled'))return;location.assign('/');return;}const modal=[...document.querySelectorAll('.modal-overlay.active')].at(-1);if(modal){if(modal.dataset.busy==='true')return;if(modal.id==='knowledgeEdit'){window.ProcatsKnowledgeUI?.closeEditor();return;}if(modal.id==='backupPassword'){window.ProcatsBackupUI?.cancel?.();return;}if(modal.id==='appSettings'&&window.ProcatsUI?.settingsBack?.())return;if(modal.id==='weeklySummary')window.ProcatsWeekly.close();else if(modal.id==='onboarding')window.ProcatsWelcome.close();else modal.classList.remove('active');return;}const drawer=document.querySelector('.mobile-list-open');if(drawer){drawer.classList.remove('mobile-list-open');window.procatsMobileRefresh?.();return;}if(document.querySelector('.view.active')?.id!=='view-home'){window.switchView?.('home');return;}App.minimizeApp();});}

window.ProcatsOpenResource=url=>ProcatsDevice.openLink({url});
window.ProcatsResourceBridge=native?registerPlugin('ProcatsResources'):null;
