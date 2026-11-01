import './lists-core.js';
const {key,metaKey,valid}=globalThis.ProcatsListsCore;
export function readListsJournal(record){
 const raw=record?.settings?.[key];if(raw===undefined)return null;
 const lists=JSON.parse(raw),meta=JSON.parse(record.settings[metaKey]||'{"base":[],"revision":0}');
 if(!valid(lists)||!valid(meta.base))throw Error('Invalid lists journal');
 return {lists,meta};
}
export function hasPendingLists(record,current){
 try{const value=readListsJournal(record);return !!value&&(!!value.meta.conflict||JSON.stringify(value.lists)!==JSON.stringify(value.meta.base))&&(current===undefined||JSON.stringify(value.lists)!==JSON.stringify(current));}
 catch{return true;}
}
