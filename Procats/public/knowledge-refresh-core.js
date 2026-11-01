import {checkStructure,limits} from './security-limits.js';
import './knowledge-core.js';
const C=globalThis.ProcatsKnowledgeCore,key=C.key;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const contentFields=['kind','question','answer','explanation','source','category','tags','image','imageSide','author','work','origin','example','meaning','passage'];
const content=c=>JSON.stringify(contentFields.map(k=>c[k]));
export function planKnowledgeRefresh(current,file,{now,signature}){
 if(!object(file)||file.version!==1||Object.keys(file).some(k=>!['format','version','title','items'].includes(k))||!Array.isArray(file.items)||!file.items.length||file.items.length>C.maxCards)throw Error('add-format');
 if(new TextEncoder().encode(JSON.stringify(file)).length>limits.fileBytes)throw Error('backup-size');checkStructure(file);
 const previous=[],incoming=[],codes=new Set();
 for(const entry of file.items){
  if(!object(entry)||Object.keys(entry).length!==2||!Object.hasOwn(entry,'previous')||!Object.hasOwn(entry,'card'))throw Error('add-invalid');
  const old=entry.previous,next=entry.card;C.check([old]);C.check([next]);const code=C.mapOf(next);
  if(!code||codes.has(code)||old.kind!=='visual'||!old.image||next.tags.filter(C.isReservedTag).length!==1||next.related.length)throw Error('add-invalid');
  codes.add(code);previous.push(old);incoming.push(next);
 }
 const old=current[key]||[];C.check(old);const next=structuredClone(old),used=new Set(old.map(c=>c.id));let candidate=Math.max(1,Math.min(now,Number.MAX_SAFE_INTEGER-100000)),added=0,changed=0,skipped=0,protectedCount=0;
 const allocate=()=>{while(used.has(candidate))candidate=candidate<Number.MAX_SAFE_INTEGER?candidate+1:1;const id=candidate;used.add(id);candidate=candidate<Number.MAX_SAFE_INTEGER?candidate+1:1;return id;};
 for(let i=0;i<incoming.length;i++){
  const replacement=incoming[i],preimage=previous[i],code=C.mapOf(replacement),country=preimage.tags.filter(t=>t!=='Özel statü').at(-1);
  const candidates=next.filter(c=>C.mapOf(c)===code||c.question===preimage.question||c.question===replacement.question||country&&c.tags.includes(country)&&c.kind==='visual'&&c.category.includes('Coğrafya'));
  const prior=candidates.find(c=>content(c)===content(preimage)),already=candidates.some(c=>content(c)===content(replacement));
  if(already){skipped++;continue;}
  if(prior){
   // This refresh changes presentation/content only. Preserve identity, links,
   // original creation time and the complete review record verbatim.
   const updated={...structuredClone(replacement),id:prior.id,createdAt:prior.createdAt,updatedAt:Math.max(now,prior.updatedAt+1),related:[...prior.related],review:structuredClone(prior.review)};
   next[next.findIndex(c=>c.id===prior.id)]=updated;changed++;
  }else if(candidates.length){protectedCount++;skipped++;}
  else{next.push({...structuredClone(replacement),id:allocate(),createdAt:now,updatedAt:now});added++;}
 }
 C.check(next);
 return {updates:added||changed?{[key]:next}:{},counts:{[key]:added},changedCounts:{[key]:changed},skipped:{[key]:skipped},totalAdded:added,totalChanged:changed,totalSkipped:skipped,protected:protectedCount,ignored:[],signature,refresh:true};
}
