/* Personal knowledge cards. No generated answers, daily targets or streaks. */
(()=>{'use strict';
 const key='procats_knowledge_v1',metaKey='procats_knowledge_sync_v1',maxBytes=2000000,maxCards=2000;
 // Content types use the existing kind + category fields. No new storage schema
 // or destructive migration is needed for older archives or encrypted backups.
 const typeGroups={general:['Genel','General','Allgemein'],works:['Eserler','Works','Werke'],people:['İnsanlar ve dünya','People and the world','Menschen und Welt'],subjects:['Alanlar ve dersler','Subjects','Themen und Fächer']};
 const contentTypes=[
  ['fact','fact','','general','Bilgi','Knowledge','Wissen'],['word','word','Kelimeler','general','Kelime','Word','Wort'],['quote','quote','Özlü sözler','general','Özlü söz','Quote','Zitat'],['poem','quote','Şiir','general','Şiir','Poem','Gedicht'],['visual','visual','','general','Görsel bilgi','Visual knowledge','Bildwissen'],
  ['book','work','Kitaplar','works','Kitap','Book','Buch'],['film','work','Sinema','works','Film','Film','Film'],['series','work','Diziler','works','Dizi','TV series','Serie'],['game','work','Oyunlar','works','Oyun','Game','Spiel'],['artwork','work','Sanat eserleri','works','Sanat eseri','Artwork','Kunstwerk'],['music','work','Müzik','works','Müzik / şarkı','Music / song','Musik / Lied'],['work','work','','works','Diğer eser','Other work','Anderes Werk'],
  ['scientist','fact','Bilim insanları','people','Bilim insanı','Scientist','Wissenschaftler'],['artist','fact','Sanatçılar','people','Sanatçı','Artist','Künstler'],['person','fact','Kişiler','people','Kişi / biyografi','Person / biography','Person / Biografie'],['history','fact','Tarih','people','Tarih','History','Geschichte'],['event','fact','Olaylar','people','Olay','Event','Ereignis'],['geography','fact','Coğrafya','people','Coğrafya','Geography','Geografie'],['place','fact','Yerler','people','Yer / ülke','Place / country','Ort / Land'],
  ['math','fact','Matematik','subjects','Matematik','Mathematics','Mathematik'],['physics','fact','Fizik','subjects','Fizik','Physics','Physik'],['chemistry','fact','Kimya','subjects','Kimya','Chemistry','Chemie'],['biology','fact','Biyoloji','subjects','Biyoloji','Biology','Biologie'],['science','fact','Bilim','subjects','Bilim','Science','Wissenschaft'],['philosophy','fact','Felsefe','subjects','Felsefe','Philosophy','Philosophie'],['literature','fact','Edebiyat','subjects','Edebiyat','Literature','Literatur'],['technology','fact','Teknoloji','subjects','Teknoloji','Technology','Technik'],['psychology','fact','Psikoloji','subjects','Psikoloji','Psychology','Psychologie'],['mythology','fact','Mitoloji','subjects','Mitoloji','Mythology','Mythologie'],['economics','fact','Ekonomi','subjects','Ekonomi','Economics','Wirtschaft'],['language','fact','Diller','subjects','Dil / dil bilgisi','Language / grammar','Sprache / Grammatik']
 ].map(([id,kind,category,group,tr,en,de])=>({id,kind,category,group,labels:{tr,en,de}}));
 const categories=[...new Set([...contentTypes.map(t=>t.category).filter(Boolean),'Sanat','Genel kültür'])];
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
 function calendarDue(now,days){const date=new Date(now);date.setDate(date.getDate()+days);date.setHours(0,0,0,0);const due=date.getTime();if(!Number.isSafeInteger(due)||due<=now)throw Error('knowledge-date');return due;}
 function schedule(card){
  const r=card.review;if(!r.grade||!r.at||r.interval===0||r.dueAt===0)return {dueAt:r.dueAt,interval:r.interval};
  const interval=r.grade!=='knew'?1:r.interval<=1?1:r.interval<=3?3:r.interval<=7?7:30;
  return {interval,dueAt:calendarDue(r.at,interval)};
 }
 function rate(card,grade,now=Date.now()){
  if(!valid([card])||!['knew','hard','again'].includes(grade)||!Number.isSafeInteger(now)||now<0)throw Error('knowledge-invalid');
  const c=structuredClone(card),r=c.review,prior=schedule(card).interval;
  const interval=grade!=='knew'||r.grade!=='knew'||prior<1?1:prior<3?3:prior<7?7:30;
  c.review={dueAt:calendarDue(now,interval),interval,count:r.count+1,lapses:r.lapses+(grade==='again'?1:0),at:now,grade};return c;
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
  return cards.filter(c=>(!kind||matchesType(c,kind))&&(!tag||c.tags.some(t=>fold(t)===fold(tag)))&&(path.length===1?[...c.category,...c.tags].some(x=>fold(x)===path[0]):path.every((x,i)=>fold(c.category[i])===x))&&terms.every(q=>fold([c.question,c.answer,c.explanation,c.source,c.author,c.work,c.origin,c.example,c.meaning,c.passage,...c.tags,...c.category].join(' ')).includes(q)));
 }
 function typeInfo(value){return contentTypes.find(t=>t.id===value)||contentTypes[0];}
 function typeOf(card){return contentTypes.find(t=>t.category&&t.kind===card.kind&&fold(t.category)===fold(card.category[0]))?.id||card.kind;}
 function matchesType(card,value){const t=contentTypes.find(t=>t.id===value);return !!t&&(typeOf(card)===value||!!t.category&&[...card.category,...card.tags].some(c=>fold(c)===fold(t.category)));}
 function withType(input,value){
  const t=typeInfo(value),category=[...(input.category||[])];
  if(t.category&&fold(category[0])!==fold(t.category))category.unshift(t.category);
  if(category.length>5)throw Error('knowledge-category-depth');
  return {...input,kind:t.kind,category};
 }
 function queue(cards,{mode='due',now=Date.now(),random=Math.random,limit=20}={}){
  let result=cards.filter(c=>mode==='random'||schedule(c).dueAt<=now);
  if(mode==='random')for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.max(0,Math.min(.999999999,random()))*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  else result.sort((a,b)=>schedule(a).dueAt-schedule(b).dueAt||a.createdAt-b.createdAt);
  return result.slice(0,limit).map(c=>c.id);
 }
 function pack(cards){check(cards);const shards=[[],[],[],[]];let i=0;for(const c of cards){if(bytes({[key]:[...shards[i],c]})>600000)i++;if(i>=4)throw Error('knowledge-limit');shards[i].push(c);}return shards.map(a=>({[key]:a}));}
 function paginate(cards,index=0,size=36){
  if(!Array.isArray(cards)||!Number.isInteger(size)||size<1||size>100)throw Error('knowledge-page');
  const total=cards.length,pages=Math.max(1,Math.ceil(total/size)),page=Math.max(0,Math.min(pages-1,Number.isFinite(index)?Math.floor(index):0)),offset=page*size;
  return {items:cards.slice(offset,offset+size),page,pages,total,start:total?offset+1:0,end:Math.min(total,offset+size)};
 }
 globalThis.ProcatsKnowledgeCore={key,metaKey,categories,kinds,maxBytes,maxCards,valid,snapshot,check,make,rate,update,filter,queue,pack,fold,paginate,calendarDue,schedule,typeGroups,contentTypes,typeInfo,typeOf,matchesType,withType};
})();
