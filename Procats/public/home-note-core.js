export const homeNote=n=>n?.homePinned===true;
export function saveHomeNote(notes,text,expected,{id,now=Date.now()}={}){
 if(!Array.isArray(notes)||typeof text!=='string'||text.length>2000)throw Error('home-note-invalid');
 const matches=notes.filter(homeNote);if(matches.length>1)throw Error('home-note-conflict');const prior=matches[0]||null;
 if(JSON.stringify(prior)!==expected)throw Error('home-note-changed');
 if(prior?.text===text)return notes;
 const next=structuredClone(notes);
 if(prior)next[next.findIndex(n=>n.id===prior.id)]={...prior,text,updatedAt:now};
 else{if(!Number.isSafeInteger(id)||id<=0||notes.some(n=>n.id===id))throw Error('home-note-id');next.push({id,text,color:'yellow',homePinned:true,createdAt:now,updatedAt:now});}
 return next;
}
