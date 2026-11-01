import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {validateSnapshot} from '../public/validation.js';
const catalogCode=await readFile(new URL('../public/exams-data.js',import.meta.url),'utf8');
const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const ui=await readFile(new URL('../public/exams.js',import.meta.url),'utf8');
const block=app.slice(app.indexOf('        // Practice exam tracking.'),app.indexOf('        window.procatsInitialize'));
function setup(){
 const storage=new Map(),elements=new Map();let fail=false;
 const c=vm.createContext({console,Date,Number,JSON,Set,Map,Object,Array,Math,window:{addEventListener(){}},
  isRecord:v=>v!==null&&typeof v==='object'&&!Array.isArray(v),isId:v=>typeof v==='number'&&Number.isFinite(v)&&v>0,
  isCount:v=>Number.isInteger(v)&&v>=0,isTimestamp:v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=8640000000000000,
  isDateKey:v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v),localDate:d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
  readStoredJSON:(key,fallback)=>storage.has(key)?JSON.parse(storage.get(key)):fallback,
  appStorage:{setItem:(key,value)=>{if(fail)return false;storage.set(key,value);return true;}},
  document:{getElementById:id=>elements.get(id)||null},currentLang:'tr',t:key=>key});
 vm.runInContext(catalogCode,c);vm.runInContext(block,c);vm.runInContext(ui,c);
 return {c,storage,elements,setFail:v=>fail=v,run:code=>vm.runInContext(code,c)};
}
function record(ctx,type,track){
 const subjects=ctx.getExamSubjects(type,track),profile=ctx.ProcatsExamData.profile(type,track);
 return {id:7,type,track,title:'Deneme',date:'2026-09-26',notes:'',scores:Object.fromEntries(subjects.map(s=>[s.id,{correct:s.count-2,wrong:1,blank:1}])),...(profile.manual?{result:82.5}:{})};
}
test('all 14 requested exams and their tracks validate locally and in cloud snapshots',()=>{
 const {c}=setup();assert.equal(Object.keys(c.ProcatsExamData.catalog).length,14);
 for(const type of Object.keys(c.ProcatsExamData.catalog)){
  const tracks=c.ProcatsExamData.tracks(type);for(const track of tracks.length?tracks:[null]){
   const exam=record(c,type,track);assert.equal(c.validateExamRecords([exam]),true,`${type}/${track} local`);
   assert.equal(validateSnapshot({procats_exams_v1:[exam],procats_exam_selection_v1:[type]}),true,`${type}/${track} cloud`);
  }
 }
});
test('TYT and all four AYT legacy shapes retain their question counts',()=>{
 const {c}=setup();assert.equal(c.getExamSubjects('tyt',null).reduce((n,s)=>n+s.count,0),120);
 for(const track of ['say','ea','soz','all'])assert.equal(c.getExamSubjects('ayt',track).reduce((n,s)=>n+s.count,0),track==='all'?160:80);
 const legacy=record(c,'tyt',null);delete legacy.track;
 assert.equal(c.validateExamRecords([legacy]),true);assert.equal(validateSnapshot({procats_exams_v1:[legacy]}),true);
});
test('LGS uses thirds; YDS, YÖKDİL and İSG have no negative marking',()=>{
 const {c}=setup(),net=c.ProcatsExamData.net;
 assert.equal(net(12,3,'lgs',null),11);
 assert.equal(net(12,4,'tyt',null),11);
 for(const type of ['yds','yokdil','isg'])assert.equal(net(12,4,type,c.ProcatsExamData.defaultTrack(type)),12);
 assert.equal(net(0,4,'msu',null),-1);
});
test('invalid totals, dates, duplicate IDs, unknown tracks and invalid written scores are rejected',()=>{
 const {c}=setup(),good=record(c,'lgs',null);
 for(const change of [r=>r.scores.turkish.correct++,r=>r.scores.turkish.wrong=-1,r=>r.scores.turkish.correct=2.5,r=>r.date='2026-02-30',r=>r.type='unknown',r=>r.track='say',r=>r.scores.extra={correct:0,wrong:0,blank:0}]){
  const invalid=structuredClone(good);change(invalid);assert.equal(c.validateExamRecords([invalid]),false);assert.equal(validateSnapshot({procats_exams_v1:[invalid]}),false);
 }
 assert.equal(c.validateExamRecords([good,good]),false);
 for(const value of [-1,101,'82.5',null,NaN,Infinity]){const invalid=record(c,'ydus','written0');invalid.result=value;assert.equal(c.validateExamRecords([invalid]),false);assert.equal(validateSnapshot({procats_exams_v1:[invalid]}),false);}
});
test('initial selection is empty and saving changes never deletes hidden legacy records',()=>{
 const {c,run,elements,storage,setFail}=setup();assert.equal(c.getSelectedExams().length,0);
 const old=record(c,'tyt',null);c.old=old;run('examRecords=[old];renderExams=()=>{};');
 let selection=['lgs','ydus'];const error={textContent:''};elements.set('selection',{querySelectorAll:()=>selection.map(value=>({value})),querySelector:()=>error});elements.set('examNewButton',{focus(){}});
 assert.equal(c.saveExamSelection('selection'),true);assert.deepEqual(JSON.parse(storage.get('procats_exam_selection_v1')),['lgs','ydus']);
 assert.equal(run('examRecords.length'),1);run("activeExamType='lgs';activeExamTrack=null");assert.equal(c.getVisibleExams().length,0);
 selection=['tyt'];assert.equal(c.saveExamSelection('selection'),true);run("activeExamType='tyt'");assert.equal(c.getVisibleExams()[0].title,old.title);
 setFail(true);selection=['ales'];assert.equal(c.saveExamSelection('selection'),false);assert.deepEqual(JSON.parse(storage.get('procats_exam_selection_v1')),['tyt']);assert.ok(error.textContent);
});
test('selection validation accepts none or many, rejecting duplicates and unrecognized IDs',()=>{
 for(const selection of [[],['tyt','ayt','lgs']])assert.equal(validateSnapshot({procats_exam_selection_v1:selection}),true);
 for(const selection of [['tyt','tyt'],['unknown'],'tyt',null,[1]])assert.equal(validateSnapshot({procats_exam_selection_v1:selection}),false);
});
test('written and specialty records remain separate in the chart filter',()=>{
 const {c,run}=setup();c.one=record(c,'ydus','test0');c.two=record(c,'ydus','written0');c.two.id=8;
 run("examRecords=[one,two];activeExamType='ydus';activeExamTrack='written0'");
 assert.equal(c.getVisibleExams().length,1);assert.equal(c.getExamTotals(c.getVisibleExams()[0]).net,82.5);
});
test('chart grows with each added record, fills the panel and retains readable spacing',()=>{
 const {c,run,elements}=setup();c.escapeHtml=String;run("activeExamType='tyt';activeExamTrack=null");
 const a=record(c,'tyt',null),b={...record(c,'tyt',null),id:8,date:'2027-09-26'};
 const records=n=>Array.from({length:n},(_,i)=>({...a,id:i+1}));
 elements.set('examChart',{clientWidth:1800});
 const sparse=c.buildExamChartSVG([a,b]);assert.match(sparse,/viewBox="0 0 420 260"/);assert.doesNotMatch(sparse,/NaN/);
 assert.match(c.buildExamChartSVG(records(3)),/viewBox="0 0 650 260"/);
 assert.match(c.buildExamChartSVG(records(5)),/viewBox="0 0 1110 260"/);
 assert.match(c.buildExamChartSVG(records(8)),/viewBox="0 0 1800 260"/);
 assert.match(c.buildExamChartSVG(records(30)),/viewBox="0 0 2695 260"/);
 elements.set('examChart',{clientWidth:300});assert.match(c.buildExamChartSVG([a,b]),/viewBox="0 0 300 260"/);
 assert.match(c.buildExamChartSVG(records(8)),/viewBox="0 0 715 260"/);
});
