import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const page=readFileSync(new URL('../backend-guide.html',import.meta.url),'utf8');
const source=page.match(/<script>([\s\S]*?)<\/script>/)[1];
const components=JSON.parse(source.match(/const components = (.*);/)[1]);
const scenarios=JSON.parse(source.match(/const scenarios = (.*);/)[1]);
test('visual guide ships without external dependencies and compiles its browser script',()=>{
 assert.doesNotThrow(()=>new Script(source));
 assert.doesNotMatch(page,/<script[^>]+src=|<link[^>]+rel="stylesheet"/);
 assert.equal(Object.keys(components).length,10);
 assert.equal(Object.keys(scenarios).length,7);
 for(const item of Object.values(components))for(const field of ['name','desc','io','code','why'])assert.ok(item[field]);
});
test('request traces preserve repository/service/mapper return order and isolate not-found',()=>{
 const get=scenarios.get.steps.map(s=>s.component);
 assert.deepEqual(get.slice(5),['repository','database','repository','service','mapper','service','controller','response']);
 assert.ok(!scenarios.missing.steps.some(s=>s.component==='mapper'));
 assert.ok(scenarios.missing.steps.some(s=>s.component==='error'));
 for(const scene of Object.values(scenarios)){assert.ok(scene.steps.some(s=>s.component==='middleware'));assert.ok(scene.steps.some(s=>s.component==='router'));for(const step of scene.steps){assert.ok(components[step.component]);assert.ok(step.value);}}
 assert.match(scenarios.delete.steps.at(-1).value,/204.*end\(\)/);
});
test('existing study pages and home navigation expose the new visual guide',()=>{
 const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(home,/href="backend-guide.html"/);
 for(const name of ['theory','midterm'])assert.ok(readFileSync(new URL(`../content/${name}.js`,import.meta.url),'utf8').includes('backend-guide.html'));
 for(const id of ['flow','http','crud','dto','pagination','errors','database','debug','exam'])assert.ok(page.includes(`id="${id}"`));
});
