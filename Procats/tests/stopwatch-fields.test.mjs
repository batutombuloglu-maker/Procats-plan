import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('centisecond repaint leaves minute and second fields intact until they change',()=>{
 const src=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),block=src.slice(src.indexOf('        let swLastDisplay='),src.indexOf('        function swRefreshScheduler'));
 const writes=[0,0,0],parts=['00','00','00'].map((text,i)=>({get textContent(){return text},set textContent(v){text=v;writes[i]++},style:{}}));let reads=0;
 const display={querySelectorAll(){reads++;return parts}},ctx={Math,Array,document:{getElementById:()=>display}};vm.createContext(ctx);vm.runInContext(block,ctx);
 ctx.swUpdateDisplay(12340);assert.deepEqual(parts.map(p=>p.textContent),['00','12','34']);assert.deepEqual(writes,[0,1,1]);
 ctx.swUpdateDisplay(12390);assert.deepEqual(writes,[0,1,2]);ctx.swUpdateDisplay(12390);assert.deepEqual(writes,[0,1,2]);assert.equal(reads,1);
 ctx.swUpdateDisplay(6000000);assert.equal(parts[0].textContent,'100');assert.equal(parts[0].style.inlineSize,'calc(3ch + 6px)');
});
