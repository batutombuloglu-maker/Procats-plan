import {createProgressScene} from './progress-scene.js';
/* Read-only illustration of the same daily task totals used by the heatmap. */
export function stepModel(activity={},today='9999-12-31'){
 const days=Object.entries(activity).filter(([d,n])=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&d<=today&&Number.isSafeInteger(n)&&n>0).sort(([a],[b])=>a.localeCompare(b));
 const total=days.reduce((sum,[,n])=>Math.min(Number.MAX_SAFE_INTEGER,sum+n),0),trail=[];
 for(let i=days.length-1;i>=0&&trail.length<10;i--){const [date,count]=days[i],take=Math.min(count,10-trail.length);for(let j=0;j<take;j++)trail.push({date,count});}
 // Only a small camera window is drawn, even after years of activity.
 return {total,today:activity[today]||0,trail:trail.reverse(),intensity:n=>n>=20?1:n>=18?.85:n>=10?.7:n>=4?.55:.35};
}
const words={tr:{title:'Her görev bir adım',hint:'Küçük adımlar da ilerlemedir.',today:'bugün',steps:'adım',setting:'İlerleme basamakları',description:'Isı haritasının yanında görev adımlarını göster.'},en:{title:'One task, one step',hint:'Small steps still move you forward.',today:'today',steps:'steps',setting:'Progress steps',description:'Show task steps beside the heatmap.'},de:{title:'Eine Aufgabe, ein Schritt',hint:'Auch kleine Schritte bringen dich weiter.',today:'heute',steps:'Schritte',setting:'Fortschrittstreppe',description:'Aufgabenschritte neben der Heatmap zeigen.'}};
const W=()=>words[document.documentElement.lang]||words.tr;
const NS='http://www.w3.org/2000/svg';
const svg=(tag,attrs)=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
let scene=null,sceneCanvas=null;
let host,lastActivity={},lastTotal=null,lastSignature='',pendingAnimation=false;
function localDay(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function render(activity=lastActivity){
 lastActivity=activity;host??=document.getElementById('progressSteps');if(!host)return;
 const selected=globalThis.ProcatsPreferences?.get().activityView||'steps',visible=selected==='steps';host.hidden=!visible;const heatmap=host.parentElement.querySelector('.heatmap-widget');if(heatmap)heatmap.hidden=visible;host.parentElement.classList.toggle('has-progress-steps',visible);if(!visible){scene?.stop();return;}
 const model=stepModel(activity,localDay()),signature=JSON.stringify([document.documentElement.lang,model.total,model.today,model.trail]);if(signature===lastSignature)return;
 if(lastTotal!==null&&model.total>lastTotal)pendingAnimation=true;lastTotal=model.total;lastSignature=signature;
 const w=W(),head=document.createElement('div');head.className='progress-steps-head';const title=document.createElement('h3');title.textContent=w.title;const count=document.createElement('span');count.textContent=model.today+' '+w.today;head.append(title,count);
 const drawing=svg('svg',{viewBox:'0 0 380 220',role:'img','aria-label':model.total+' '+w.steps+' · '+model.today+' '+w.today}),defs=svg('defs',{}),gradient=svg('linearGradient',{id:'steps-fade',x1:'0',y1:'1',x2:'1',y2:'0'});
 for(const [offset,opacity]of [['0%',0],['16%',1],['78%',1],['100%',0]])gradient.append(svg('stop',{offset,'stop-color':'white','stop-opacity':opacity}));
 const mask=svg('mask',{id:'steps-window'});mask.append(svg('rect',{width:380,height:220,fill:'url(#steps-fade)'}));defs.append(gradient,mask);drawing.append(defs);
 const road=svg('g',{mask:'url(#steps-window)'}),completed=10,start=completed-model.trail.length;
 for(let i=0;i<17;i++){
  const x=14+i*19,y=195-i*7,entry=model.trail[i-start],done=i<completed&&!!entry,shade=done?Math.round(100+model.intensity(entry.count)*150):43;
  const step=svg('g',{'class':'progress-step'+(done?' is-done':''),'style':'--step-tone:rgb('+shade+' '+shade+' '+shade+')'});
  step.append(svg('path',{d:`M${x},${y}l23,7 36,-10 -23,-7Z`,'class':'progress-step-top'}),svg('path',{d:`M${x},${y}v7l23,7v-7Z`,'class':'progress-step-front'}),svg('path',{d:`M${x+23},${y+7}v7l36,-10v-7Z`,'class':'progress-step-side'}));road.append(step);
 }
 drawing.append(road);const figure=svg('g',{'class':'progress-person',transform:'translate(215 124)'});
 figure.append(svg('ellipse',{cx:0,cy:5,rx:16,ry:4,'class':'progress-person-shadow'}));
 const body=svg('g',{'class':'progress-person-body'});body.append(svg('circle',{cx:0,cy:-57,r:8}),svg('path',{d:'M0,-44L0,-22 M-9,-40L-11,-22 M9,-40L11,-25 M0,-22L-7,0 M0,-22L9,-1',fill:'none','stroke-linecap':'round','stroke-linejoin':'round','stroke-width':7}));figure.append(body);drawing.append(figure);
 const foot=document.createElement('p');foot.className='progress-steps-foot';foot.textContent=model.total.toLocaleString(document.documentElement.lang)+' '+w.steps+' · '+w.hint;if(!sceneCanvas){sceneCanvas=document.createElement('canvas');sceneCanvas.className='progress-scene';try{scene=createProgressScene(sceneCanvas);}catch{scene=null;}}sceneCanvas.setAttribute('role','img');sceneCanvas.setAttribute('aria-label',model.total+' '+w.steps+' · '+model.today+' '+w.today);host.replaceChildren(head,scene?sceneCanvas:drawing,foot);scene?.set(model);play();
}
function play(){if(!pendingAnimation||!host||host.hidden||document.hidden||!document.getElementById('view-home')?.classList.contains('active'))return;pendingAnimation=false;if(scene){if(!matchMedia('(prefers-reduced-motion: reduce)').matches)scene.animate();return;}if(!matchMedia('(prefers-reduced-motion: reduce)').matches)host.querySelector('.progress-person-body')?.animate([{transform:'translate(-15px, 5px)'},{transform:'translate(-6px, -8px)',offset:.55},{transform:'translate(0, 0)'}],{duration:600,easing:'ease-out'});}
if(typeof document!=='undefined'){
 globalThis.ProcatsProgressSteps={render,play,labels:W};new MutationObserver(()=>{lastSignature='';render();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)scene?.stop();else play();});new MutationObserver(()=>scene?.redraw()).observe(document.body,{attributes:true,attributeFilter:['class','data-theme','style']});
}
