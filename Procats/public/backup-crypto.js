import {limits} from './security-limits.js';
const iterations=600000, encoder=new TextEncoder();
const encode=v=>{let s='';for(const n of new Uint8Array(v))s+=String.fromCharCode(n);return btoa(s);};
function decode(v,max){if(typeof v!=='string'||v.length>max||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(v))throw Error('backup-invalid');return Uint8Array.from(atob(v),c=>c.charCodeAt(0));}
async function key(password,salt,usage){const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},material,{name:'AES-GCM',length:256},false,[usage]);}
const aad=encoder.encode('Procats encrypted backup v1');
export async function encryptBackup(data,password){
 if(typeof password!=='string'||password.length<12||password.length>256)throw Error('backup-password');
 const plain=encoder.encode(JSON.stringify(data));
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},await key(password,salt,'encrypt'),plain);
 return {format:'procats-encrypted',version:1,kdf:'PBKDF2-SHA256',iterations,cipher:'AES-256-GCM',salt:encode(salt),iv:encode(iv),data:encode(cipher)};
}
export async function decryptBackup(envelope,password){
 if(!envelope||envelope.format!=='procats-encrypted'||envelope.version!==1||envelope.iterations!==iterations||envelope.kdf!=='PBKDF2-SHA256'||envelope.cipher!=='AES-256-GCM'||typeof password!=='string'||password.length>256)throw Error('backup-invalid');
 const salt=decode(envelope.salt,24),iv=decode(envelope.iv,16),data=decode(envelope.data,limits.fileBytes);
 if(salt.length!==16||iv.length!==12||data.length<17)throw Error('backup-invalid');
 try {const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},await key(password,salt,'decrypt'),data);return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain));}catch{throw Error('backup-unlock');}
}
if(typeof window!=='undefined')window.ProcatsBackupCrypto={encryptBackup,decryptBackup};
