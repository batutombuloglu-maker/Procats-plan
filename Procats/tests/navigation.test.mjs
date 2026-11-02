import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/navigation.js';
const nav=globalThis.ProcatsNavigation;
test('new installation shows requested five destinations',()=>assert.deepEqual(nav.normalize(null),['home','tasks','timers','notes','more']));
test('corrupt or duplicate persisted layouts recover without losing access to More',()=>{for(const bad of [[],['home'],['more','more'],['unknown','more'],['home','tasks','timers','notes','exams','more'],{}])assert.deepEqual(nav.normalize(bad),nav.defaults);});
test('pinning replaces exactly one full slot and keeps More accessible',()=>{const original=[...nav.defaults];const next=nav.place(original,'exams',1);assert.deepEqual(next,['home','exams','timers','notes','more']);assert.deepEqual(original,nav.defaults);assert.deepEqual(nav.place(original,'exams',4),original);});
test('all tabs including More can be reordered without duplication',()=>{const next=nav.place(nav.defaults,'more',0);assert.deepEqual(next,['more','home','tasks','timers','notes']);assert.equal(nav.valid(next),true);assert.deepEqual(nav.place(next,'home',4),['more','tasks','timers','notes','home']);});
test('removal frees a slot, preserves More, and next pin stays within five',()=>{const smaller=nav.remove(nav.defaults,'notes');assert.deepEqual(nav.remove(smaller,'more'),smaller);assert.deepEqual(nav.place(smaller,'exams',2),['home','tasks','exams','timers','more']);});
test('every sequence of moves preserves bounded unique accessible navigation',()=>{let value=nav.defaults;for(let i=0;i<1000;i++){value=nav.place(value,nav.allowed[i%nav.allowed.length],i%7-1);assert.equal(nav.valid(value),true);if(i%4===0)value=nav.remove(value,nav.allowed[(i+3)%nav.allowed.length]);assert.equal(nav.valid(value),true);}});

import fs from 'node:fs';
test('every sidebar destination has an allowlisted action, view and accessible label',()=>{
 const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),actions=fs.readFileSync(new URL('../public/ui-actions.js',import.meta.url),'utf8'),labels=fs.readFileSync(new URL('../public/navigation-a11y.js',import.meta.url),'utf8');
 for(const [,view] of html.matchAll(/class="nav-item[^"]*"[^>]*data-action-click="switchView\('([a-z]+)'\)"/g)){assert.ok(nav.allowed.includes(view));assert.ok(html.includes('id="view-'+view+'"'));assert.ok(actions.includes('"switchView(\''+view+'\')":'));assert.ok(labels.includes(view+':'));}
});

test("retired Treasury pin is removed without reordering remaining tabs",()=>{const old=["tasks","knowledge","home","more"];assert.deepEqual(nav.normalize(old),["tasks","home","more"]);assert.deepEqual(old,["tasks","knowledge","home","more"]);assert.equal(nav.allowed.includes("knowledge"),false);});
