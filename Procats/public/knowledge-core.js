/* Personal knowledge cards. No generated answers, daily targets or streaks. */
(()=>{'use strict';
 const key='procats_knowledge_v1',metaKey='procats_knowledge_sync_v1',maxBytes=2000000,maxCards=2000;
 const categories=['Edebiyat','Sinema','Tarih','Sanat','Felsefe','Coğrafya','Bilim','Genel kültür','Kelimeler','Özlü sözler'];
 const kinds=['fact','word','quote','work','visual'];
 const fields=new Set(['id','kind','question','answer','explanation','source','category','tags','related','image','imageSide','author','work','origin','example','meaning','passage','createdAt','updatedAt','review']),reviewFields=new Set(['dueAt','interval','count','lapses','at','grade']);
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),id=x=>Number.isSafeInteger(x)&&x>0;
 const text=(s,n)=>typeof s==='string'&&s.length<=n;
 const fold=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('tr-TR');
 const bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length;
 const stringList=(v,max,len)=>Array.isArray(v)&&v.length<=max&&v.every(x=>text(x,len)&&x.trim())&&new Set(v.map(fold)).size===v.length;
 function valid(cards){
  if(!Array.isArray(cards)||cards.length>maxCards)return false;const ids=new Set();
  return cards.every(c=>{
   if(!object(c)||Object.keys(c).some(k=>!fields.has(k))||!id(c.id)||ids.has(c.id)||!kinds.includes(c.kind)||!text(c.question,500)||!c.question.trim()||!text(c.answer,12000)||!c.answer.trim())return false;
   ids.add(c.id);
   if(!text(c.explanation,12000)||!text(c.source,1000)||!stringList(c.category,5,80)||!stringList(c.tags,12,40)||!Array.isArray(c.related)||c.related.length>20||c.related.some(x=>!id(x)||x===c.id)||new Set(c.related).size!==c.related.length)return false;
   for(const k of ['author','work','origin','example','meaning'])if(!text(c[k],2000))return false;
   if(!text(c.passage,12000))return false;
   if(!['front','back'].includes(c.imageSide)||!(c.image===''||text(c.image,50000)&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(c.image)))return false;
   if(!Number.isSafeInteger(c.createdAt)||c.createdAt<0||!Number.isSafeInteger(c.updatedAt)||c.updatedAt<c.createdAt)return false;
   const r=c.review;
   return object(r)&&Object.keys(r).every(k=>reviewFields.has(k))&&Number.isSafeInteger(r.dueAt)&&r.dueAt>=0&&Number.isInteger(r.interval)&&r.interval>=0&&r.interval<=365&&Number.isSafeInteger(r.count)&&r.count>=0&&Number.isSafeInteger(r.lapses)&&r.lapses>=0&&Number.isSafeInteger(r.at)&&r.at>=0&&['','knew','hard','again'].includes(r.grade);
  });
 }
 function check(cards){if(!valid(cards))throw Error('knowledge-invalid');if(bytes({[key]:cards})>maxBytes)throw Error('knowledge-limit');return cards;}
 const snapshot=v=>object(v)&&Object.keys(v).length===1&&Object.keys(v).every(k=>k===key)&&(!Object.hasOwn(v,key)||valid(v[key])&&bytes(v)<=maxBytes);
 const clean=(s,n)=>String(s||'').trim().slice(0,n),labels=(v,max,n)=>[...new Map(v.map(x=>clean(x,n)).filter(Boolean).map(x=>[fold(x),x])).values()].slice(0,max);
 function make(input,now=Date.now(),previous){
  const c={id:previous?.id??input.id,kind:input.kind||'fact',question:clean(input.question,500),answer:clean(input.answer,12000),explanation:clean(input.explanation,12000),source:clean(input.source,1000),category:labels(input.category||[],5,80),tags:labels(input.tags||[],12,40),related:[...new Set(input.related||[])].filter(x=>x!==(previous?.id??input.id)).slice(0,20),image:input.image||'',imageSide:input.imageSide||'front',passage:clean(input.passage,12000),createdAt:previous?.createdAt??now,updatedAt:Math.max(now,(previous?.updatedAt??-1)+1),review:previous?structuredClone(previous.review):{dueAt:0,interval:0,count:0,lapses:0,at:0,grade:''}};
  for(const k of ['author','work','origin','example','meaning'])c[k]=clean(input[k],2000);
  if(previous&&(previous.question!==c.question||previous.answer!==c.answer||previous.image!==c.image)){c.review={...c.review,dueAt:0,interval:0};}
  if(!valid([c]))throw Error('knowledge-invalid');return c;
 }
 function rate(card,grade,now=Date.now()){
  if(!valid([card])||!['knew','hard','again'].includes(grade)||!Number.isSafeInteger(now)||now<0)throw Error('knowledge-invalid');
  const c=structuredClone(card),r=c.review;const interval=grade==='again'?0:grade==='hard'?Math.max(1,Math.min(7,Math.round(r.interval*0.6))):r.interval<1?1:r.interval<3?3:Math.min(365,Math.round(r.interval*2));
  c.review={dueAt:now+(grade==='again'?120000:interval*86400000),interval,count:r.count+1,lapses:r.lapses+(grade==='again'?1:0),at:now,grade};return c;
 }
 function update(cards,action){
  check(cards);let next=structuredClone(cards);
  if(action.type==='save'){const prior=next.find(c=>c.id===action.card.id);if(action.expected===null?!!prior:action.expected!==undefined&&JSON.stringify(prior)!==action.expected)throw Error('knowledge-changed');const c=make(action.card,action.now??Date.now(),prior);if(prior)next[next.findIndex(x=>x.id===c.id)]=c;else next.unshift(c);}
  else if(action.type==='delete'){const c=next.find(x=>x.id===action.id);if(!c)throw Error('knowledge-missing');if(action.expected!==undefined&&JSON.stringify(c)!==action.expected)throw Error('knowledge-changed');next=next.filter(x=>x.id!==action.id).map(x=>({...x,related:x.related.filter(id=>id!==action.id)}));}
  else if(action.type==='rate'){const index=next.findIndex(x=>x.id===action.id);if(index<0)throw Error('knowledge-missing');if(action.expected!==undefined&&JSON.stringify(next[index])!==action.expected)throw Error('knowledge-changed');next[index]=rate(next[index],action.grade,action.now??Date.now());}
  else throw Error('knowledge-action');return check(next);
 }
 function filter(cards,{query='',category='',tag='',kind=''}={}){
  const terms=fold(query).split(/\s+/).filter(Boolean),path=category.split(' › ').filter(Boolean).map(fold);
  return cards.filter(c=>(!kind||c.kind===kind)&&(!tag||c.tags.some(t=>fold(t)===fold(tag)))&&path.every((x,i)=>fold(c.category[i])===x)&&terms.every(q=>fold([c.question,c.answer,c.explanation,c.source,c.author,c.work,c.origin,c.example,c.meaning,c.passage,...c.tags,...c.category].join(' ')).includes(q)));
 }
 function queue(cards,{mode='due',now=Date.now(),random=Math.random,limit=20}={}){
  let result=cards.filter(c=>mode==='random'||c.review.dueAt<=now);
  if(mode==='random')for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.max(0,Math.min(.999999999,random()))*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  else result.sort((a,b)=>a.review.dueAt-b.review.dueAt||a.createdAt-b.createdAt);
  return result.slice(0,limit).map(c=>c.id);
 }
 function pack(cards){check(cards);const shards=[[],[],[],[]];let i=0;for(const c of cards){if(bytes({[key]:[...shards[i],c]})>600000)i++;if(i>=4)throw Error('knowledge-limit');shards[i].push(c);}return shards.map(a=>({[key]:a}));}
 function paginate(cards,index=0,size=36){
  if(!Array.isArray(cards)||!Number.isInteger(size)||size<1||size>100)throw Error('knowledge-page');
  const total=cards.length,pages=Math.max(1,Math.ceil(total/size)),page=Math.max(0,Math.min(pages-1,Number.isFinite(index)?Math.floor(index):0)),offset=page*size;
  return {items:cards.slice(offset,offset+size),page,pages,total,start:total?offset+1:0,end:Math.min(total,offset+size)};
 }
 globalThis.ProcatsKnowledgeCore={key,metaKey,categories,kinds,maxBytes,maxCards,valid,snapshot,check,make,rate,update,filter,queue,pack,fold,paginate};
})();
