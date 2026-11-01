import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,access} from 'node:fs/promises';

const read=file=>readFile(new URL('../public/'+file,import.meta.url),'utf8');

test('workspace startup and account deletion have no removed-feature init or server connection',async()=>{
 for(const file of ['firebase-client.js','account-deletion.js','delete-account.html','legal.js','lists-store.js']){
  const source=await read(file);
  assert.doesNotMatch(source,/createAssistantClient|ProcatsAssistant|assistant-config|assistant-client|assistant-core|assistant-bridge|assistant\.js|workers\.dev|Cloudflare|acquireAssistantLock|assistantPolicy/,file);
 }
 for(const file of ['assistant-config.js','assistant-client.js','assistant-core.js','assistant-archives-core.js','assistant-bridge.js','assistant.js','assistant.css','assistant-access.css','policy-assistant.js']){
  await assert.rejects(access(new URL('../public/'+file,import.meta.url)),{code:'ENOENT'});
 }
});

test('old private settings cannot restore the removed feature or interfere with existing notes and themes',async()=>{
 const storage=new Map(),saved=[],note=[{id:7,text:'Keep existing notes'}],oldSettings={procats_theme:'swan',procats_assistant_chat_v1:'old private conversation',procats_assistant_applied_v1:'old apply ids'};
 const context=vm.createContext({console,structuredClone,CustomEvent:class{},setTimeout:()=>1,clearTimeout(){},document:{activeElement:null,querySelector:()=>null,addEventListener(){},visibilityState:'visible'},addEventListener(){},dispatchEvent(){},localStorage:{length:0,key:()=>null,getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},PROCATS_BOOT:{user:'owner',email:'owner@example.test',data:{yks_v5_notes:note},revision:1,journal:{base:{yks_v5_notes:note},data:{yks_v5_notes:note},revision:1,settings:oldSettings}},ProcatsDeviceStore:{save:async(_,value)=>saved.push(structuredClone(value)),persist:async()=>{}},ProcatsCloud:{request:async()=>({data:{yks_v5_notes:note},revision:1}),subscribe(){},stop(){}}});
 context.window=context;vm.runInContext(await read('sync-merge.js'),context);vm.runInContext(await read('sync-storage.js'),context);await context.ProcatsSync.start();await context.ProcatsSync.flush();
 assert.equal(typeof context.ProcatsSync.commitAssistant,'undefined');assert.equal(typeof context.ProcatsSync.commitPrivateSettings,'undefined');
 assert.equal(context.procatsStorage.getItem('procats_assistant_chat_v1'),null);assert.equal(context.procatsStorage.getItem('procats_theme'),'swan');assert.deepEqual(JSON.parse(JSON.stringify(context.ProcatsSync.getData().yks_v5_notes)),note);
 context.procatsStorage.setItem('procats_assistant_chat_v1','must not return');await context.ProcatsSync.flush();assert.equal(context.procatsStorage.getItem('procats_assistant_chat_v1'),null);
 await context.ProcatsSync.importBackup(new Map([['procats_assistant_chat_v1','backup archive'],['procats_theme','midnight']]));await context.ProcatsSync.flush();
 assert.equal(context.procatsStorage.getItem('procats_theme'),'midnight');assert.equal(saved.at(-1).settings.procats_assistant_chat_v1,undefined);assert.equal(saved.at(-1).settings.procats_assistant_applied_v1,undefined);
 assert.equal([...storage.keys()].some(key=>/assistant/.test(key)),false);
});
