import {Capacitor,registerPlugin} from '@capacitor/core';
export async function companionAccountHash(uid){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(uid));
 return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export async function eraseCompanionAccount(uid){
 if(Capacitor.getPlatform()==='android')await registerPlugin('ProcatsCompanion').erase({account:await companionAccountHash(uid)});
}
