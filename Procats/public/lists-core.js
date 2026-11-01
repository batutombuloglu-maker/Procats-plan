/* Data model for the independent Lists section. */
(()=>{'use strict';
 const key='procats_lists_v1',metaKey='procats_lists_sync_v1';
 const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const id=v=>Number.isSafeInteger(v)&&v>0;
 const title=v=>typeof v==='string'&&v.trim().length>0&&v.length<=240;
 function valid(value){
  if(!Array.isArray(value)||value.length>200)return false;
  const ids=new Set();let items=0;
  return value.every(list=>{
   if(!record(list)||!id(list.id)||ids.has(list.id)||!title(list.title)||!Array.isArray(list.items)||list.items.length>1000)return false;
   if(list.position!==undefined&&(!Number.isSafeInteger(list.position)||list.position<0))return false;
   if(list.itemOrder!==undefined&&(!Array.isArray(list.itemOrder)||list.itemOrder.length>1000||list.itemOrder.some(v=>!id(v))||new Set(list.itemOrder).size!==list.itemOrder.length))return false;
   ids.add(list.id);const itemIds=new Set();items+=list.items.length;if(items>5000)return false;
   return list.items.every(item=>{if(!record(item)||!id(item.id)||itemIds.has(item.id)||!title(item.title)||typeof item.completed!=='boolean')return false;itemIds.add(item.id);return true;});
  });
 }
 function snapshot(value){return record(value)&&Object.keys(value).every(k=>k===key)&&(!Object.hasOwn(value,key)||valid(value[key]));}
 function orderedLists(lists){return [...lists].sort((a,b)=>(a.position??Infinity)-(b.position??Infinity));}
 function orderedItems(list){const rank=new Map((list.itemOrder||[]).map((id,index)=>[id,index]));return [...list.items].sort((a,b)=>(rank.get(a.id)??Infinity)-(rank.get(b.id)??Infinity));}
 function update(lists,action){
  if(!valid(lists))throw Error('lists-invalid');
  const next=structuredClone(lists),list=next.find(l=>l.id===action.listId);
  switch(action.type){
   case 'add-list':next.push({id:action.id,title:action.title.trim(),items:[]});break;
   case 'reorder-lists':if(!Array.isArray(action.ids)||action.ids.length!==next.length||new Set(action.ids).size!==next.length||action.ids.some(id=>!next.some(l=>l.id===id)))throw Error('lists-invalid');for(const l of next)l.position=action.ids.indexOf(l.id);break;
   case 'rename-list':if(!list)throw Error('lists-missing');list.title=action.title.trim();break;
   case 'remove-list':return next.filter(l=>l.id!==action.listId);
   case 'add-item':if(!list)throw Error('lists-missing');list.items.push({id:action.id,title:action.title.trim(),completed:false});break;
   case 'rename-item':{const item=list?.items.find(i=>i.id===action.id);if(!item)throw Error('lists-missing');item.title=action.title.trim();break;}
   case 'check-item':{const item=list?.items.find(i=>i.id===action.id);if(!item)throw Error('lists-missing');item.completed=action.completed;break;}
   case 'remove-item':if(!list)throw Error('lists-missing');list.items=list.items.filter(i=>i.id!==action.id);break;
   case 'reorder-items':if(!list||!Array.isArray(action.ids)||action.ids.length!==list.items.length||new Set(action.ids).size!==action.ids.length||action.ids.some(id=>!list.items.some(item=>item.id===id)))throw Error('lists-invalid');list.itemOrder=[...action.ids];break;
   default:throw Error('lists-action');
  }
  if(!valid(next))throw Error('lists-invalid');
  if(new TextEncoder().encode(JSON.stringify({[key]:next})).length>750000)throw Error('lists-limit');
  return next;
 }
 globalThis.ProcatsListsCore={key,metaKey,valid,snapshot,update,orderedItems,orderedLists};
})();
