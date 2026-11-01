import './geography-atlas.js';
const atlas=globalThis.ProcatsGeographyAtlas,NS='http://www.w3.org/2000/svg';
let serial=0;
const loading=new Map();
function loadRegion(c){
 if(globalThis.ProcatsGeographyGeometry?.[c.region])return Promise.resolve();
 if(loading.has(c.region))return loading.get(c.region);
 const p=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/geography/'+c.chunk;script.async=true;script.onload=()=>{script.remove();if(globalThis.ProcatsGeographyGeometry?.[c.region])resolve();else reject(Error('map-unavailable'));};script.onerror=()=>{script.remove();reject(Error('map-unavailable'));};document.head.append(script);}).catch(e=>{loading.delete(c.region);throw e;});loading.set(c.region,p);return p;
}
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const svg=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
const texts={tr:{capital:'Başkent',english:'İngilizce adı',zoom:'Haritayı büyüt',continent:'Kıta',country:'Ülke',population:'Nüfus',area:'Yüzölçümü',sources:'Veri kaynakları',hint:'Beyaz nokta başkentin konumu',detail:'Yakından',back:'Kıtayı göster'},en:{capital:'Capital',english:'English name',zoom:'Enlarge map',continent:'Continent',country:'Country',population:'Population',area:'Surface area',sources:'Data sources',hint:'White dot marks the capital',detail:'Closer view',back:'Show continent'},de:{capital:'Hauptstadt',english:'Englischer Name',zoom:'Karte vergrößern',continent:'Kontinent',country:'Land',population:'Bevölkerung',area:'Fläche',sources:'Datenquellen',hint:'Weißer Punkt: Hauptstadt',detail:'Nahansicht',back:'Kontinent zeigen'}};
const words=()=>texts[document.documentElement.lang]||texts.tr;
function country(card){const code=globalThis.ProcatsKnowledgeCore.mapOf(card);return code&&atlas.countries[code]?{code,...atlas.countries[code]}:null;}
function flag(c){const i=node('img','kh-flag');i.src='/geography/flags/'+c.code+'.png';i.alt=c.name;i.loading='lazy';i.decoding='async';return i;}
function draw(c,detail=false){
 const chunk=globalThis.ProcatsGeographyGeometry[c.region],shape=chunk.countries[c.code],geometry=detail?shape.zoom:shape,paths=geometry.paths,points=geometry.points;
 const map=svg('svg',{viewBox:'0 0 1000 620',role:'img','aria-label':c.name+' · '+c.region,preserveAspectRatio:'xMidYMid meet'}),id='kh-map-'+(++serial);
 const defs=svg('defs'),clip=svg('clipPath',{id:id+'-clip'});clip.append(svg('rect',{x:0,y:0,width:1000,height:620}));defs.append(clip);
 const bounds=svg('path',{d:paths.join(''),fill:'none'});
 // Pattern dimensions are taken from vetted geometry after insertion below.
 const pattern=svg('pattern',{id:id+'-flag',patternUnits:'objectBoundingBox',width:1,height:1,viewBox:'0 0 3 2',preserveAspectRatio:'none'});
 pattern.append(svg('image',{href:'/geography/flags/'+c.code+'.png',x:0,y:0,width:3,height:2,preserveAspectRatio:'none'}));defs.append(pattern);map.append(defs);
 const group=svg('g',{'clip-path':'url(#'+id+'-clip)'});
 if(!detail){const land=svg('g',{'class':'kh-map-land'});for(const d of chunk.region.paths)land.append(svg('path',{d}));group.append(land);}
 bounds.setAttribute('fill','url(#'+id+'-flag)');bounds.setAttribute('class','kh-map-country');bounds.setAttribute('fill-rule','evenodd');group.append(bounds);
 for(const [cx,cy]of points){group.append(svg('circle',{cx,cy,r:detail?9:8,'class':'kh-map-dot-halo'}),svg('circle',{cx,cy,r:detail?5:4.5,'class':'kh-map-dot'}));}
 map.append(group);return map;
}
function figure(card,{large=false}={}){
 const c=country(card);if(!c)return null;const w=words(),box=node('figure','kh-map'+(large?' kh-map-large':''));
 const head=node('figcaption','kh-map-heading'),name=node('div','kh-map-title');name.append(node('span','kh-map-region',c.region),node('strong','',c.name));head.append(name,flag(c));box.append(head);
 let detail=false;const canvas=node('div','kh-map-canvas');box.append(canvas);
 const paint=()=>canvas.replaceChildren(draw(c,detail));
 async function prepare(){try{await loadRegion(c);paint();}catch{const retry=node('button','kh-map-control',document.documentElement.lang==='tr'?'Haritayı yeniden yükle':'Reload map');retry.type='button';retry.onclick=prepare;canvas.replaceChildren(retry);}}
 if(globalThis.ProcatsGeographyGeometry?.[c.region])paint();else{canvas.append(node('span','kh-map-loading','…'));void prepare();}
 const foot=node('div','kh-map-footer');foot.append(node('span','kh-map-legend',w.hint));const actions=node('div','kh-map-actions');
 const toggle=node('button','kh-map-control',w.detail);toggle.type='button';toggle.setAttribute('aria-pressed','false');toggle.onclick=()=>{detail=!detail;void prepare();toggle.textContent=detail?w.back:w.detail;toggle.setAttribute('aria-pressed',String(detail));};actions.append(toggle);
 if(!large){const expand=node('button','kh-map-control',w.zoom+' ↗');expand.type='button';expand.onclick=()=>{const p=globalThis.ProcatsFeatureUI.panel('knowledgeMap',c.name);p.overlay.classList.add('kh-map-modal');p.content.append(figure(card,{large:true}));};actions.append(expand);}
 foot.append(actions);box.append(foot);return box;
}
function facts(card){
 const c=country(card);if(!c)return null;const w=words(),section=node('section','kh-geo-facts'),grid=node('dl','kh-facts-grid'),locale={tr:'tr-TR',en:'en-GB',de:'de-DE'}[document.documentElement.lang]||'tr-TR';
 if(c.capitalEnglish){const line=node('p','kh-capital-english');line.append(node('span','',w.english+' · '),node('strong','',c.capitalEnglish));section.append(line);}
 for(const [key,label]of [['population',w.population],['area',w.area]]){const f=c.facts[key];if(!f)continue;const cell=node('div','kh-fact'),dt=node('dt','',label+(f.year?' · '+f.year:''));cell.append(dt,node('dd','',new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(f.value)+(key==='area'?' km²':'')));grid.append(cell);}section.append(grid);
 const details=node('details','kh-fact-sources');details.append(node('summary','',w.sources));for(const [key,label]of [['population',w.population],['area',w.area]]){const f=c.facts[key];if(!f)continue;const a=node('a','',label+(f.year?' ('+f.year+')':''));a.href=f.source;a.target='_blank';a.rel='noopener noreferrer';details.append(a);}section.append(details);return section;
}
const prose=card=>{const c=country(card);return c&&card.explanation===c.generatedExplanation?c.note:card.explanation;};
globalThis.ProcatsGeography={country,figure,facts,flag,prose};
