// 생성된 그림·문서의 누락과 소스-이미지 불일치를 확인한다. 앱은 실행하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const directory=path.join(project,'docs/assignment/diagrams');
const catalog=JSON.parse(fs.readFileSync(path.join(directory,'catalog.json'),'utf8'));
const walk=folder=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(folder,e.name)):[path.join(folder,e.name)]);
const sha=value=>createHash('sha256').update(value).digest('hex');
const reportFile=path.join(project,'.runtime/verification/diagrams-render.json');
const render=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile,'utf8')):null;
const javaFiles=walk(path.join(project,'java-backend/src/main/java')).filter(f=>f.endsWith('.java'));
const javaNames=javaFiles.map(f=>path.basename(f,'.java'));
assert.equal(new Set(catalog.diagrams.map(d=>d.id)).size,catalog.diagrams.length,'Duplicate diagram id');
const overview=fs.readFileSync(path.join(directory,'sources/classes-overview.mmd'),'utf8');
const drawnClasses=[...overview.matchAll(/\bclass (\w+)\s*\{/g)].map(m=>m[1]);
assert.deepEqual([...drawnClasses].sort(),[...javaNames].sort(),'Class diagram must match actual Java classes');
let links=0,bytes=0;
for(const d of catalog.diagrams) {
  assert.ok(catalog.groups.some(g=>g.id===d.group),`Unknown group ${d.group}`);
  for(const source of d.sources) assert.ok(fs.existsSync(path.join(project,source)),`Missing source ${source}`);
  const mmd=fs.readFileSync(path.join(directory,d.file),'utf8');
  const svg=fs.readFileSync(path.join(directory,'images',d.id+'.svg'),'utf8');
  const png=fs.readFileSync(path.join(directory,'images',d.id+'.png'));
  assert.ok(svg.includes('<svg') && !svg.includes('Syntax error in text'),d.id);
  assert.equal(png.subarray(1,4).toString(),'PNG',d.id);
  bytes+=Buffer.byteLength(svg)+png.length;
  if(render) {
    const result=render.diagrams.find(r=>r.id===d.id);
    assert.ok(result,`Not rendered: ${d.id}`);
    assert.equal(result.sourceSha256,sha(mmd),`Re-render modified source: ${d.id}`);
    assert.equal(result.svgSha256,sha(svg),`SVG differs: ${d.id}`);
    assert.equal(png.readUInt32BE(16),result.width,`PNG width: ${d.id}`);
    assert.equal(png.readUInt32BE(20),result.height,`PNG height: ${d.id}`);
  }
  if(d.id.startsWith('classes-')) {
    const blocks=[...mmd.matchAll(/class (\w+)\s*\{([^}]*)\}/g)];
    for(const [,name,body] of blocks) {
      const file=javaFiles.find(f=>path.basename(f,'.java')===name);
      if(!file) continue;
      const source=fs.readFileSync(file,'utf8');
      for(const [,method] of body.matchAll(/[+-](\w+)\(/g)) assert.ok(new RegExp('\\b'+method+'\\s*\\(').test(source),`${name}.${method} missing`);
    }
  }
}
const useCases=fs.readFileSync(path.join(directory,'USE_CASES.md'),'utf8');
for(let i=1;i<=21;i++) {
  const id=String(i).padStart(2,'0');
  assert.ok(useCases.includes(`id="seq-${id}"`),`Missing use case ${id}`);
  assert.ok(catalog.diagrams.some(d=>d.id===`seq-${id}`&&d.ucs.includes(`UC-${id}`)));
  assert.ok(catalog.diagrams.some(d=>d.group==='01-use-cases'&&d.ucs.includes(`UC-${id}`)));
}
const markdown=[path.join(project,'README.md'),...walk(path.join(project,'docs/assignment')).filter(f=>f.endsWith('.md'))];
for(const file of markdown) {
  const text=fs.readFileSync(file,'utf8');
  assert.equal((text.match(/^```/gm)||[]).length%2,0,`Open fence: ${file}`);
  const prose=text.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm,'');
  for(const [,target] of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if(/^(?:[a-z]+:|#)/i.test(target))continue;
    const local=decodeURIComponent(target.replace(/^<|>$/g,'').split('#')[0]);
    assert.ok(fs.existsSync(path.resolve(path.dirname(file),local)),`${file}: ${target}`);links++;
  }
}
const html=fs.readFileSync(path.join(directory,'index.html'),'utf8');
assert.equal((html.match(/<article /g)||[]).length,catalog.diagrams.length);
for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if(url.startsWith('#'))continue;
  assert.ok(fs.existsSync(path.resolve(directory,url)),`Gallery link: ${url}`);links++;
}
const result={result:'passed',diagrams:catalog.diagrams.length,groups:catalog.groups.length,sequences:21,javaClasses:javaNames.length,markdownFiles:markdown.length,localLinks:links,imageBytes:bytes,renderHashesChecked:!!render};
fs.mkdirSync(path.join(project,'.runtime/verification'),{recursive:true});
fs.writeFileSync(path.join(project,'.runtime/verification/diagrams-check.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
