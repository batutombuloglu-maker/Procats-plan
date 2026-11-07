import {eraseCompanionAccount} from './companion-cleanup.js';
import {knowledgeDocuments} from './knowledge-cloud.js';
// The content-free marker prevents old clients from restoring deleted records.
export const deletionRef=(sdk,db,uid)=>sdk.doc(db,'users',uid,'account','deletion');
export async function isDeletionPending(sdk,db,uid){return (await sdk.getDocFromServer(deletionRef(sdk,db,uid))).exists();}
export function clearAccountStorage(uid){for(const s of [localStorage,sessionStorage])for(const key of Object.keys(s))if(key.startsWith('procats-cloud:'+uid+':'))s.removeItem(key);}
export async function deleteAccount({authSDK,storeSDK,auth,db,password,beforeDelete=()=>{},onStage=()=>{}}){
 const user=auth.currentUser;if(!user?.email)throw {code:'auth/requires-recent-login'};
 await authSDK.reauthenticateWithCredential(user,authSDK.EmailAuthProvider.credential(user.email,password));await authSDK.getIdToken(user,true);
 let removed=await isDeletionPending(storeSDK,db,user.uid);const retry=removed;await window.ProcatsLegacyArchive?.stop();await window.ProcatsListsStore?.stop();await beforeDelete();await window.ProcatsSync?.flush();
 if(!removed){const batch=storeSDK.writeBatch(db);for(const name of ['main','lists',...knowledgeDocuments])batch.delete(storeSDK.doc(db,'users',user.uid,'state',name));batch.set(deletionRef(storeSDK,db,user.uid),{requestedAt:storeSDK.serverTimestamp()});try{await batch.commit();removed=true;}catch(e){if(await isDeletionPending(storeSDK,db,user.uid).catch(()=>false))removed=true;else throw e;}}
 if(removed){await eraseCompanionAccount(user.uid);if(retry)for(const name of ['lists',...knowledgeDocuments])await storeSDK.deleteDoc(storeSDK.doc(db,'users',user.uid,'state',name));await window.ProcatsDeviceStore?.remove(user.uid);await window.ProcatsTimerAlerts?.cancel();clearAccountStorage(user.uid);onStage('data-deleted');}
 try{await authSDK.deleteUser(user);}catch(cause){throw Object.assign(new Error('Finish account deletion after reconnecting'),{code:'deletion/auth-pending',cause});}
 await window.ProcatsFiles?.clear();onStage('complete');
}
