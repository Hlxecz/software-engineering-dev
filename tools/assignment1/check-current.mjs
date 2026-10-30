// 최신 제출본의 내용·계획·그림 연결을 검사한다. 앱이나 외부 서비스를 호출하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..');
const directory=path.join(root,'docs/assignment/과제1-프로젝트관리-최신');
const read=file=>JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const data=read('계획자료/업무계획.json'),report=read('계획자료/보고서구성.json');
const sum=values=>values.reduce((a,b)=>a+b,0);
assert.equal(report.sections.length,6);assert.equal(report.diagrams.length,9);
assert.equal(data.groups.length,9);assert.equal(data.packages.length,28);
assert.equal(sum(data.packages.map(p=>p.hours)),200);
assert.equal(data.reserveHours,data.baselineHours*data.reserveRate);
assert.equal(data.plannedHours,240);assert.equal(data.reserveHours,40);
assert.equal(data.hoursPerWeek*data.calendarWeeks,data.capacityHours);assert.equal(data.unallocatedHours,0);
for(const group of data.groups)assert.equal(sum(data.packages.filter(p=>p.id.startsWith(group.id+'.')).map(p=>p.hours)),group.hours,group.id);
const times={},allocated={};let cursor=0;
for(const block of data.schedule){
 assert.equal(sum(Object.values(block.allocations))+block.reserveHours+(block.unallocatedHours||0),40,block.weeks);
 for(const [id,hours] of Object.entries(block.allocations)){
  assert.ok(data.packages.some(p=>p.id===id),id);assert.ok(hours>0);
  times[id]??={start:cursor,end:cursor};times[id].end=cursor+hours;allocated[id]=(allocated[id]||0)+hours;cursor+=hours;
 }
 cursor+=block.reserveHours+(block.unallocatedHours||0);
}
assert.equal(cursor,240);assert.equal(sum(data.schedule.map(b=>b.reserveHours)),40);
for(const p of data.packages){assert.equal(allocated[p.id],p.hours,p.id);for(const id of p.predecessors)assert.ok(times[id].end<=times[p.id].start,`${id} → ${p.id}`);}
const markdown=report.sections.map(s=>({file:s.file,markdown:fs.readFileSync(path.join(directory,s.file),'utf8')}));
const html=fs.readFileSync(path.join(directory,'통합보고서.html'),'utf8'),metadata=read('검증자료/문서해시.json');
assert.equal(sha(html),metadata.htmlSha256);
assert.equal(sha(JSON.stringify(markdown)),metadata.sourceSha256);
for(const s of report.sections)assert.ok(html.includes(`id="${s.id}"`),s.id);
const images=[...html.matchAll(/src="data:image\/svg\+xml;base64,([^"]+)" data-source="([^"]+)"/g)];
assert.equal(images.length,9);
for(const [,base64,file] of images)assert.deepEqual(Buffer.from(base64,'base64'),fs.readFileSync(path.join(directory,file)),file);
const figures=read('검증자료/그림해시.json');
assert.equal(figures.diagrams.length,report.diagrams.length);
for(const diagram of report.diagrams){
 const hashes=figures.diagrams.find(item=>item.id===diagram.id);assert.ok(hashes,diagram.id);
 for(const [file,expected] of [[diagram.file,hashes.sourceSha256],[diagram.image+'.svg',hashes.svgSha256],[diagram.image+'.png',hashes.pngSha256]])assert.equal(sha(fs.readFileSync(path.join(directory,file))),expected,file);
}
const print=read('검증자료/인쇄검사.json');
assert.equal(print.status,'final_pass');
assert.equal(print.htmlSha256,metadata.htmlSha256,'PDF 검사 이후 HTML이 변경됨');
assert.equal(print.pdfSha256,sha(fs.readFileSync(path.join(directory,'통합보고서.pdf'))),'PDF 검사 결과와 파일 불일치');
assert.ok(print.pageCount>0);
const visible=html.replace(/<style>[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>|<[^>]+>/g,' ');
for(const value of Object.values(report.submission))assert.ok(visible.includes(value),value);
for(const text of ['계획 기준','기준 소스:','본문과 그림은 이 HTML','별도 파일입니다'])assert.ok(!visible.includes(text),text);
assert.ok(!/[a-f0-9]{40,64}/.test(visible),'내부 소스 해시 노출');
const writing=fs.readFileSync(path.join(directory,'03-시스템관계와이해관계자.md'),'utf8');
for(const target of ['블로그 작성자','포트폴리오 준비 학생','초안 구성이 어려운 사람'])assert.ok(writing.includes(target),target);
for(const s of markdown){
 const withoutNavigation=s.markdown.replace(/^\[(?:이전:|목차)[^\n]*$/gm,'');
 assert.ok(!/\[[^\]]+\]\((?!그림\/)[^)]+\)/.test(withoutNavigation),'본문의 근거/외부 문서 링크: '+s.file);
}
const result={checkedAt:new Date().toISOString(),sections:6,diagrams:9,groups:9,leafPackages:28,baselineHours:200,reserveHours:40,plannedHours:240,weeks:12,submission:report.submission,htmlSha256:sha(html),sourceSha256:metadata.sourceSha256,pdfSha256:print.pdfSha256,pdfPages:print.pageCount,appExecuted:false};
fs.writeFileSync(path.join(directory,'검증자료/정합성검사.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
