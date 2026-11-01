// Offline recovery. Uses the same authenticated encryption implementation as the app.
import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline';
import {Writable} from 'node:stream';
import {decryptBackup} from '../public/backup-crypto.js';
import {limits,checkStructure} from '../public/security-limits.js';
import '../public/knowledge-core.js';

export function readableBackup(backup){
 if(!backup||typeof backup!=='object'||Array.isArray(backup)||backup.format!=='procats'||![1,2].includes(backup.version))throw Error('Unsupported backup');
 const result=Object.create(null);
 for(const [name,raw]of Object.entries(backup)){
  if(['__proto__','prototype','constructor'].includes(name))throw Error('Invalid backup');
  let value=raw;
  if(typeof raw==='string'&&/^[\s]*[\[{]/.test(raw))try{value=JSON.parse(raw);}catch{}
  if(name==='procats_knowledge_v1')ProcatsKnowledgeCore.check(value);else checkStructure(value);
  result[name]=value;
 }
 return result;
}

export async function recoverFile(input,output,password){
 const info=await stat(input);if(!info.isFile()||info.size>limits.fileBytes)throw Error('Backup exceeds file limit');
 const bytes=await readFile(input);if(bytes.length>limits.fileBytes)throw Error('Backup exceeds file limit');
 const envelope=JSON.parse(bytes.toString('utf8'));
 const original=envelope?.format==='procats-encrypted'?await decryptBackup(envelope,password):envelope;
 const data=readableBackup(original);
 // Never replace another file, including the encrypted original.
 await writeFile(output,JSON.stringify(data,null,2)+'\n',{encoding:'utf8',flag:'wx',mode:0o600});
 return {sections:Object.keys(data).filter(k=>!['format','version','exportDate'].includes(k)),output};
}

async function ask(prompt,secret=false){
 if(!process.stdin.isTTY)throw Error('Open this tool in a terminal');
 const sink=new Writable({write(chunk,encoding,done){if(!secret)process.stdout.write(chunk,encoding);done();}});
 const rl=createInterface({input:process.stdin,output:sink,terminal:true,historySize:0});
 if(secret)process.stdout.write(prompt);
 try{return await new Promise((accept,reject)=>{rl.once('SIGINT',()=>reject(Error('Cancelled')));rl.question(secret?'':prompt,accept);});}
 finally{rl.close();if(secret)process.stdout.write('\n');}
}

async function main(){
 try{
  const input=resolve(process.argv[2]||await ask('Yedek dosyasinin yolu: '));
  const output=resolve(process.argv[3]||join(dirname(input),'Procats-Kurtarilmis-'+Date.now()+'.json'));
  console.log('Bu arac yalniz bilgisayarinda calisir. Firebase veya GitHub baglantisi kurmaz.');
  const password=await ask('Yedek sifresi (ekranda gorunmez): ',true);
  const result=await recoverFile(input,output,password);
  console.log('Okunabilir JSON hazirlandi: '+result.output);
  console.log('Bu yeni dosya sifresizdir. Ozel bir yerde sakla; GitHub\'a yukleme.');
 }catch(error){console.error(error.message==='EEXIST'||error.code==='EEXIST'?'Hedef dosya zaten var; uzerine yazilmadi.':error.message==='backup-unlock'?'Yedek acilamadi. Sifreyi ve dosyayi kontrol et.':'Islem tamamlanamadi: '+error.message);process.exitCode=1;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
