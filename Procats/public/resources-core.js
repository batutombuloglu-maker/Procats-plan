/* Shared URL rules. Imported content is data, never executable markup. */
(() => {
 const normalize = value => {
  if(typeof value!=='string'||value.length>4096)return null;
  let input=value.trim();if(!input||/[\u0000-\u0020\u007f]/.test(input))return null;
  if(!/^[a-z][a-z\d+.-]*:/i.test(input))input='https://'+input;
  try{const u=new URL(input);if(u.protocol==='http:')u.protocol='https:';if(u.protocol!=='https:'||!u.hostname||u.username||u.password)return null;return u.href;}catch{return null;}
 };
 function youtube(value){
  const normalized=normalize(value);if(!normalized)return null;const u=new URL(normalized);
  if(!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(u.hostname)||u.port)return null;
  const list=u.searchParams.get('list');
  if(list&&/^[A-Za-z0-9_-]{10,150}$/.test(list))return {kind:'playlist',id:list,url:'https://www.youtube.com/playlist?list='+list};
  const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname==='/watch'?u.searchParams.get('v'):/^\/(shorts|live|embed)\//.test(u.pathname)?u.pathname.split('/')[2]:null;
  return id&&/^[A-Za-z0-9_-]{11}$/.test(id)?{kind:'video',id,url:'https://www.youtube.com/watch?v='+id}:null;
 }
 const canonical=value=>youtube(value)?.url||normalize(value);
 function shared(text,title=''){
  if(typeof text!=='string'||text.length>16000)return null;
  const match=text.match(/https?:\/\/[^\s<>"\u0000-\u001f]+/i);if(!match)return null;
  const url=canonical(match[0].replace(/[).,;!\]}]+$/,''));if(!url)return null;
  const candidate=(typeof title==='string'?title:'').trim()||text.replace(match[0],'').trim();
  return {url,title:candidate.replace(/[\u0000-\u001f]/g,' ').slice(0,180),kind:youtube(url)?.kind||'link'};
 }
 const thumbnail=value=>{try{const u=new URL(value);return u.protocol==='https:'&&['i.ytimg.com','img.youtube.com'].includes(u.hostname)&&!u.port&&!u.username&&!u.password?u.href:null;}catch{return null;}};
 globalThis.ProcatsResourcesCore={normalize,canonical,youtube,shared,thumbnail};
})();
