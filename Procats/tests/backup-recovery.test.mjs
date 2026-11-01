import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {encryptBackup} from '../public/backup-crypto.js';
import {recoverFile,readableBackup} from '../tools/recover-backup.mjs';
const backup={format:'procats',version:2,yks_v5_notes:JSON.stringify([{id:1,text:'Özel örnek not'}]),procats_lists_v1:JSON.stringify([{id:2,title:'Kişisel liste',items:[]}])},password='Local backup test only 173';
test('offline recovery keeps readable Unicode records and the encrypted original',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'procats-recover-'));try{const source=join(dir,'encrypted.json'),output=join(dir,'readable.json'),encrypted=JSON.stringify(await encryptBackup(backup,password));await writeFile(source,encrypted);await recoverFile(source,output,password);assert.deepEqual(JSON.parse(await readFile(output,'utf8')).yks_v5_notes,[{id:1,text:'Özel örnek not'}]);assert.equal(await readFile(source,'utf8'),encrypted);await assert.rejects(recoverFile(source,output,password),{code:'EEXIST'});}finally{await rm(dir,{recursive:true,force:true});}
});
test('wrong password produces no output; prototype keys and unsupported backup versions fail closed',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'procats-recover-'));try{const source=join(dir,'encrypted.json'),output=join(dir,'out.json');await writeFile(source,JSON.stringify(await encryptBackup(backup,password)));await assert.rejects(recoverFile(source,output,'wrong password'));await assert.rejects(readFile(output),{code:'ENOENT'});}finally{await rm(dir,{recursive:true,force:true});}
 assert.throws(()=>readableBackup({...backup,version:99}));assert.throws(()=>readableBackup(JSON.parse('{"format":"procats","version":2,"__proto__":{"x":1}}')));
});
