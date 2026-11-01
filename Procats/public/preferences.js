export const KEY='procats-device-settings-v1';
export function normalize(value={}){return {examsVisible:value?.examsVisible!==false,timerMode:['sound','vibrate','silent'].includes(value?.timerMode)?value.timerMode:'sound',wakeScreen:value?.wakeScreen===true};}
const preferred=()=>globalThis.window?.procatsStorage||localStorage;
export function read(storage=preferred()){try{let raw=storage.getItem(KEY);if(!raw&&storage!==localStorage)raw=localStorage.getItem(KEY);return normalize(JSON.parse(raw||'{}'));}catch{return normalize();}}
export function write(patch,storage=preferred()){const value=normalize({...read(storage),...patch});storage.setItem(KEY,JSON.stringify(value));return value;}
