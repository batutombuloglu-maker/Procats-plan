import './knowledge-core.js';
const {key,metaKey,check}=globalThis.ProcatsKnowledgeCore;
export function readKnowledgeJournal(record){const raw=record?.settings?.[key];if(raw===undefined)return null;const lists=JSON.parse(raw),meta=JSON.parse(record.settings[metaKey]||'{"base":[],"revision":0}');check(lists);check(meta.base);if(!Number.isSafeInteger(meta.revision)||meta.revision<0)throw Error('Invalid knowledge journal');return {lists,meta};}
export function hasPendingKnowledge(record,current){try{const v=readKnowledgeJournal(record);return !!v&&(!!v.meta.conflict||JSON.stringify(v.lists)!==JSON.stringify(v.meta.base))&&(current===undefined||JSON.stringify(v.lists)!==JSON.stringify(current));}catch{return true;}}
