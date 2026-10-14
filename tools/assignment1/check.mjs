// 문서·그림·단일 추정 데이터의 정합성 검사. 앱 및 외부 서비스는 실행하지 않는다.
// 실행: node tools/assignment1/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {buildHtml,sha256,readSections,sourceDigest,sectionHtml,readAssets,headingAnchor} from './html.mjs';
import {generatedBlocks,replaceBlock,diagramSources,scheduleSegments} from './data.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const directory=path.join(project,'docs/assignment/과제1-프로젝트관리');
const data=JSON.parse(fs.readFileSync(path.join(directory,'계획자료/업무계획.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(directory,'계획자료/보고서구성.json'),'utf8'));
const sections=readSections(directory);
const assets=readAssets(directory,catalog);
const markdown=sections.map(s=>s.markdown).join('\n');
const html=fs.readFileSync(path.join(directory,'통합보고서.html'),'utf8');
const scopes=Array.from({length:7},(_,i)=>`S${String(i+1).padStart(2,'0')}`);
const acceptance=Array.from({length:10},(_,i)=>`AC${String(i+1).padStart(2,'0')}`);
const sum=values=>values.reduce((a,b)=>a+b,0);
assert.equal(data.packages.length,24);
assert.equal(data.groups.length,9);
assert.equal(new Set(data.groups.map(g=>g.id)).size,9,'상위 ID 중복');
assert.equal(new Set(data.packages.map(p=>p.id)).size,24,'하위 ID 중복');
assert.equal(sum(data.packages.map(p=>p.hours)),160,'최하위 업무 합계');
for(const g of data.groups){
  assert.equal(sum(data.packages.filter(p=>p.id.startsWith(g.id+'.')).map(p=>p.hours)),g.hours,`상위 업무 ${g.id}`);
}
assert.equal(sum(data.groups.map(g=>g.hours)),data.baselineHours);
assert.equal(data.baselineHours*data.reserveRate,data.reserveHours);
assert.equal(data.baselineHours+data.reserveHours,data.plannedHours);
assert.equal(data.hoursPerWeek*data.calendarWeeks,data.capacityHours);
assert.equal(data.capacityHours-data.plannedHours,data.unallocatedHours);
assert.equal(data.plannedHours/data.hoursPerWeek,9.6);
assert.equal(Math.ceil(data.plannedHours/data.hoursPerWeek),data.calendarWeeks);
const map=new Map(data.packages.map(p=>[p.id,p]));
for(const p of data.packages){
  assert.ok(Number.isFinite(p.hours)&&p.hours>0);
  assert.ok(data.groups.some(g=>g.id===p.id.split('.')[0]));
  assert.ok(p.name&&p.output&&data.person);
  assert.ok(p.scopes.length&&p.acceptance.length,`추적 연결 누락 ${p.id}`);
  assert.equal(new Set(p.scopes).size,p.scopes.length,`범위 중복 ${p.id}`);
  assert.equal(new Set(p.acceptance).size,p.acceptance.length,`인수 조건 중복 ${p.id}`);
  for(const id of p.scopes)assert.ok(scopes.includes(id),id);
  for(const id of p.acceptance)assert.ok(acceptance.includes(id),id);
  for(const id of p.predecessors)assert.ok(map.has(id)&&id!==p.id,`선행 ID ${id}`);
}
for(const id of scopes)assert.ok(data.packages.some(p=>p.scopes.includes(id)),id);
for(const id of acceptance)assert.ok(data.packages.some(p=>p.acceptance.includes(id)),id);
const visited=new Set(),visiting=new Set();
function visit(id){if(visited.has(id))return;assert.ok(!visiting.has(id),`의존 순환 ${id}`);visiting.add(id);for(const prev of map.get(id).predecessors)visit(prev);visiting.delete(id);visited.add(id);}
for(const id of map.keys())visit(id);
const allocated=new Map(data.packages.map(p=>[p.id,0]));
for(const s of data.schedule){
  assert.equal(sum(Object.values(s.allocations))+s.reserveHours+s.unallocatedHours,data.hoursPerWeek*2,s.weeks);
  for(const [id,hours] of Object.entries(s.allocations)){
    assert.ok(map.has(id),`일정의 미등록 ID ${id}`);
    assert.ok(hours>0);
    for(const prev of map.get(id).predecessors)assert.equal(allocated.get(prev),map.get(prev).hours,`선행 미완료 ${prev} → ${id}`);
    allocated.set(id,allocated.get(id)+hours);
    assert.ok(allocated.get(id)<=map.get(id).hours,`일정 과배정 ${id}`);
  }
}
for(const p of data.packages)assert.equal(allocated.get(p.id),p.hours,`일정 배정 누락 ${p.id}`);
assert.equal(sum(data.schedule.map(s=>s.reserveHours)),data.reserveHours);
assert.equal(sum(data.schedule.map(s=>s.unallocatedHours)),data.unallocatedHours);
assert.equal(sections.length,6);
assert.deepEqual(sections.map(s=>s.file),['01-대상제어기.md','02-목표와범위.md','03-시스템관계와이해관계자.md','04-제약과위험.md','05-규모와시간산정.md','06-업무분해와일정.md']);
assert.deepEqual(sections.map(s=>s.id),['step-1','step-2','step-3','step-4','step-5','step-6']);
assert.deepEqual([...markdown.matchAll(/^# (\d)\./gm)].map(m=>m[1]),['1','2','3','4','5','6']);
for(const s of sections){assert.equal(s.markdown.split('\n')[0],'# '+s.title);assert.ok(s.markdown.includes('[목차](00-목차.md)'));assert.ok(s.markdown.includes('단계 목적'));}
const scopePage=sections.find(s=>s.file==='02-목표와범위.md').markdown;
assert.deepEqual([...scopePage.matchAll(/^\| (S\d{2}) \|/gm)].map(m=>m[1]),scopes,'범위 정의 정확 집합');
assert.deepEqual([...scopePage.matchAll(/^\| (AC\d{2}) \|/gm)].map(m=>m[1]),acceptance,'인수 정의 정확 집합');
assert.equal([...sections.find(s=>s.file==='06-업무분해와일정.md').markdown.matchAll(/^\| \d+\.\d+ \|/gm)].length,24,'산출물 추적 24행');
for(const [file,blocks] of Object.entries(generatedBlocks(data))){const text=fs.readFileSync(path.join(directory,file),'utf8');for(const [name,content] of Object.entries(blocks))assert.equal(replaceBlock(text,name,content),text,`생성 표 갱신 필요 ${file}/${name}`);}
for(const [name,source] of Object.entries(diagramSources(data)))assert.equal(fs.readFileSync(path.join(directory,catalog.diagrams.find(d=>d.id===name).file),'utf8'),source,`그림 데이터 갱신 필요 ${name}`);
assert.equal(html,buildHtml(sections,catalog,assets),'6개 Markdown과 HTML 불일치');
const documentManifest=JSON.parse(fs.readFileSync(path.join(directory,'검증자료/문서해시.json'),'utf8'));
assert.equal(documentManifest.sourceSha256,sourceDigest(sections));
assert.equal(documentManifest.htmlSha256,sha256(html));
assert.deepEqual(documentManifest.sections,sections.map(s=>({id:s.id,file:s.file,markdownSha256:sha256(s.markdown)})));
for(const s of sections){const fragment=html.match(new RegExp(`<section class="step" id="${s.id}"[^>]*>([\\s\\S]*?)</section>`));assert.ok(fragment,s.id);assert.equal(fragment[1].replace(/<nav class="section-footer"[\s\S]*$/,''),sectionHtml(s.markdown,catalog,assets),`단계 HTML 본문 ${s.file}`);}
assert.deepEqual(documentManifest.embeddedImages,Object.fromEntries(Object.entries(assets).map(([file,bytes])=>[file,sha256(bytes)])));
const embedded=[...html.matchAll(new RegExp('<img src="data:image/svg[+]xml;base64,([^"]+)" data-source="([^"]+)"','g'))];
assert.equal(embedded.length,catalog.diagrams.length,'등록 그림 전체 내장');
for(const [,encoded,file] of embedded)assert.equal(sha256(Buffer.from(encoded,'base64')),sha256(assets[file]),'내장 그림 '+file);
assert.ok(!html.includes('<del>'),'범위 기호의 취소선 변환');
assert.ok(!markdown.includes('\uFFFD'),'문자 인코딩 오류');
const manifest=JSON.parse(fs.readFileSync(path.join(directory,'검증자료/그림해시.json'),'utf8'));
const review=JSON.parse(fs.readFileSync(path.join(directory,'검증자료/화면검사.json'),'utf8'));
const compression=JSON.parse(fs.readFileSync(path.join(directory,'검증자료/설명분량비교.json'),'utf8'));
assert.equal(compression.after.sourceSha256,sourceDigest(sections),'설명 분량 비교 대상 갱신 필요');
assert.equal(review.sourceSha256,sourceDigest(sections),'HTML 화면 검사 원문 갱신 필요');
assert.deepEqual(review.sectionSha256,Object.fromEntries(sections.map(s=>[s.file,sha256(s.markdown)])));
assert.equal(review.htmlSha256,sha256(html),'HTML 화면 검사 갱신 필요');
assert.deepEqual(review.standalone,{images:catalog.diagrams.length,loaded:true,steps:6,brokenAnchors:0},'단독 HTML 검사');
assert.ok(review.interaction.keyboardDialog.open&&review.interaction.keyboardDialog.focus&&review.interaction.keyboardDialog.loaded,'키보드 확대 검사');
assert.ok(review.interaction.escapeClose.closed&&review.interaction.escapeClose.focusRestored,'Escape와 초점 복원');
assert.equal(review.interaction.umlDialogs.length,6);assert.ok(review.interaction.umlDialogs.every(d=>d.open&&d.sourceMatches),'새 UML 확대 검사');
assert.ok(review.interaction.beforePrintClosesDialog,'인쇄 확대창 닫기');
assert.equal(review.interaction.navigation.current,'#step-2');
assert.equal(review.interaction.observedCurrent,'#step-6');
assert.equal((html.match(/<h1>/g)||[]).length,1,'표지 제목 1개');
assert.equal((html.match(/class="stage-purpose"/g)||[]).length,6,'단계 목적 강조');
const submissionBlock=html.match(/<dl class="submission"[\s\S]*?<\/dl>/)?.[0];
assert.ok(submissionBlock,'표지 제출 정보');
for(const [label,key] of [['성명','name'],['학번','studentId'],['전공','major'],['제출일','date']]){
  const actual=submissionBlock.match(new RegExp('<dt>'+label+'</dt><dd>([\\s\\S]*?)</dd>'))?.[1];
  assert.equal(actual,catalog.submission?.[key]??'','표지 '+label);
}
assert.ok(!html.includes('기준 소스:')&&!html.includes('본문과 그림은 이 HTML에 포함되어 있습니다.'),'제출 표지의 파일 안내 제거');
assert.ok(!html.includes('<script src=')&&!html.includes('<link rel="stylesheet"'),'외부 스크립트/스타일 없음');
assert.equal(new Set(catalog.diagrams.map(d=>d.id)).size,catalog.diagrams.length);
assert.deepEqual(manifest.diagrams.map(d=>d.id),catalog.diagrams.map(d=>d.id));
for(const d of manifest.diagrams){
  const entry=catalog.diagrams.find(e=>e.id===d.id);
  assert.equal(d.sourceFile,entry.file);assert.equal(d.kind,entry.kind);assert.equal(d.basis,entry.basis);
  const source=fs.readFileSync(path.join(directory,d.sourceFile),'utf8');
  const svg=fs.readFileSync(path.join(directory,entry.image+'.svg'),'utf8');
  const png=fs.readFileSync(path.join(directory,entry.image+'.png'));
  assert.ok(svg.includes('<svg')&&!svg.includes('Syntax error in text'));
  if(entry.kind==='svg')for(const tag of source.match(/<[A-Za-z][^>]*>/g)||[]){const names=[...tag.matchAll(/([\w:-]+)\s*=\s*"[^"]*"/g)].map(m=>m[1]);assert.equal(new Set(names).size,names.length,'SVG 중복 속성 '+d.id);}
  assert.equal(sha256(source),d.sourceSha256,`원본 수정 후 재렌더 필요 ${d.id}`);
  assert.equal(sha256(svg),d.svgSha256,d.id);
  assert.equal(review.svgSha256[d.id],sha256(svg),`화면 검사의 그림 변경 ${d.id}`);
  assert.equal(sha256(png),d.pngSha256,d.id);
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),d.width);
  assert.equal(png.readUInt32BE(20),d.height);
}
// 새 UML 그림은 본문 삽입·번호·코드 클래스와 함께 확인한다.
assert.equal(catalog.diagrams.length,15,'기존 9개와 UML 6개');
const umlIds=['activity-authoring','sequence-manual-save','usecase-writing','usecase-connections','usecase-prompts','classes-java'];
for(const id of umlIds){const entry=catalog.diagrams.find(d=>d.id===id);assert.equal(entry.kind,'svg');assert.ok(markdown.includes(']('+entry.image+'.svg)'),id+' 실제 그림 삽입');assert.equal(manifest.diagrams.find(d=>d.id===id).textOutsideViewBox,0,id+' 텍스트 경계');}
const ucSources=catalog.diagrams.filter(d=>d.id.startsWith('usecase-')).map(d=>fs.readFileSync(path.join(directory,d.file),'utf8'));
const ucNames=new Map([...fs.readFileSync(path.join(project,'docs/assignment/diagrams/USE_CASES.md'),'utf8').matchAll(/^## (UC-\d{2}) · (.+)$/gm)].map(m=>[m[1],m[2]]));
const ucNodes=ucSources.flatMap(s=>[...s.matchAll(/data-use-case="(UC-\d{2})" data-uc-name="([^"]+)"/g)]);
assert.equal(ucNodes.length,21);assert.equal(new Set(ucNodes.map(m=>m[1])).size,21);
for(const [,id,name] of ucNodes)assert.equal(name,ucNames.get(id),id+' 명칭');
const expectedRelations=[['사용자:UC-04','사용자:UC-05','사용자:UC-06','사용자:UC-07','사용자:UC-08','사용자:UC-09','사용자:UC-10','사용자:UC-11','사용자:UC-20','공개 웹·노션:UC-07'],['사용자:UC-01','사용자:UC-02','사용자:UC-03','사용자:UC-12','사용자:UC-14','사용자:UC-18','사용자:UC-19','티스토리:UC-02','티스토리:UC-14','티스토리:UC-18','티스토리:UC-19','AI CLI:UC-12','UC-19:공개 결과 검증','티스토리:공개 결과 검증'],['사용자:UC-13','사용자:UC-15','사용자:UC-16','사용자:UC-17','개발자:UC-21','AI CLI:UC-13','AI CLI:UC-17','공개 블로그:UC-17','UC-13:입력·지침 고정']];
ucSources.forEach((s,i)=>{assert.ok(s.includes('<ellipse')&&s.includes('<rect x="230" y="112"')&&s.includes('같은 H.Dev Studio Java 앱의 부분 보기'),'UML 타원과 시스템 경계');assert.deepEqual([...s.matchAll(/data-(?:association|include)="([^"]+)"/g)].map(m=>m[1]),expectedRelations[i],'유스케이스 관계');assert.ok(!s.includes('«extend»'),'추가 확장 관계 없음');});
const classSource=fs.readFileSync(path.join(directory,catalog.diagrams.find(d=>d.id==='classes-java').file),'utf8');
const classNodes=[...classSource.matchAll(/data-class="([^"]+)"/g)].map(m=>m[1]);
const javaNames=fs.readdirSync(path.join(project,'java-backend/src/main/java/com/hdev/assignment'),{recursive:true}).filter(f=>f.endsWith('.java')).map(f=>path.basename(f,'.java'));
assert.deepEqual(classNodes.sort(),javaNames.sort(),'직접 작성 11개 클래스');assert.equal(classNodes.length,11);
const sequence=fs.readFileSync(path.join(directory,catalog.diagrams.find(d=>d.id==='sequence-manual-save').file),'utf8');
assert.ok(sequence.includes('PUT /api/jobs/id/draft'));assert.deepEqual([...sequence.matchAll(/data-operation="([^"]+)"/g)].map(m=>m[1]),['job.meta,job.directory','job.ready,job.prepare,job.meta.save','draft.save','renderDraft','job.read']);
assert.ok(sequence.includes('자동 복원하지 않는다'),'저장 후 실패 구분');
const wbsSource=catalog.diagrams.filter(d=>d.id.startsWith('wbs-')).map(d=>fs.readFileSync(path.join(directory,d.file),'utf8')).join('\n');
assert.deepEqual([...wbsSource.matchAll(/P\d+_\d+\["(\d+\.\d+)/g)].map(m=>m[1]).sort(),data.packages.map(p=>p.id).sort(),'그림의 24개 최하위 ID');
assert.ok(!wbsSource.includes('-->'),'업무 분해에는 포함선 사용');
const segments=scheduleSegments(data);
assert.equal(segments[0].start,0);assert.equal(segments.at(-1).end,data.capacityHours);
for(let i=1;i<segments.length;i++)assert.equal(segments[i].start,segments[i-1].end,'시간 축 겹침/누락');
const bars=[...fs.readFileSync(path.join(directory,catalog.diagrams.find(d=>d.id==='schedule').file),'utf8').matchAll(/data-group="([^"]+)" data-start="([\d.]+)" data-end="([\d.]+)"/g)];
for(const group of [...data.groups.map(g=>g.id),'reserve','unallocated'])assert.equal(bars.filter(m=>m[1]===group).reduce((total,m)=>total+Number(m[3])-Number(m[2]),0),segments.filter(s=>s.group===group).reduce((total,s)=>total+s.hours,0),`시간 막대 ${group}`);
const context=fs.readFileSync(path.join(directory,catalog.diagrams.find(d=>d.id==='context').file),'utf8');
assert.equal([...context.matchAll(/^\s+\w+\[/gm)].length,5,'문맥도: 전체 앱 하나와 외부 4개');
assert.ok(!context.includes('Node')&&!context.includes('javaStore')&&!context.includes('GitHub'),'문맥도의 내부 구성/원본 통신 혼입');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const javaFiles=walk(path.join(project,'java-backend/src/main/java')).filter(f=>f.endsWith('.java'));
const classes=sum(javaFiles.map(file=>[...fs.readFileSync(file,'utf8').matchAll(/\b(?:class|interface|enum|record)\s+\w+/g)].length));
assert.equal(classes,11,'직접 작성 Java 클래스 기준');
assert.ok(classes<=30);
let links=0;
const documents=[path.join(project,'README.md'),path.join(project,'docs/assignment/README.md'),...walk(directory).filter(f=>f.endsWith('.md')||f.endsWith('.html'))];
for(const file of documents){
  const text=fs.readFileSync(file,'utf8');
  if(file.endsWith('.md'))assert.equal((text.match(/^```/gm)||[]).length%2,0,`코드 블록 ${file}`);
  const prose=file.endsWith('.md')?text.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm,''):text;
  const targets=file.endsWith('.md')?[...prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1]):[...prose.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]);
  for(const target of targets){
    if(/^[a-z]+:/i.test(target))continue;
    const [local,fragment]=decodeURIComponent(target.replace(/^<|>$/g,'')).split('#');
    const destination=path.resolve(path.dirname(file),local||path.basename(file));
    assert.ok(fs.existsSync(destination),`${path.relative(project,file)}: ${target}`);
    if(fragment&&destination.endsWith('.md')){const targetText=fs.readFileSync(destination,'utf8');const ids=[...targetText.matchAll(/^#{1,6} (.+)$/gm)].map(m=>headingAnchor(m[1]));assert.ok(ids.includes(fragment),`Markdown 앵커 ${target}`);}
    if(fragment&&destination.endsWith('.html'))assert.ok(fs.readFileSync(destination,'utf8').includes(`id="${fragment}"`),`HTML 앵커 ${target}`);
    links++;
  }
}
const result={checkedAt:new Date().toISOString(),kind:'6단계 문서·그림·계획 데이터 정합성 검사',sections:6,scopeIds:7,acceptanceIds:10,groups:9,leafPackages:24,baselineHours:160,reserveHours:32,plannedHours:192,capacityHours:200,unallocatedHours:8,diagrams:catalog.diagrams.length,embeddedSvgImages:embedded.length,standaloneHtmlChecked:true,keyboardDialogChecked:true,javaClasses:classes,umlUseCases:ucNodes.length,umlJavaClasses:classNodes.length,umlDiagrams:umlIds.length,localLinks:links,sourceSha256:sourceDigest(sections),sectionSha256:Object.fromEntries(sections.map(s=>[s.file,sha256(s.markdown)])),appExecuted:false,externalServicesUsed:false};
fs.writeFileSync(path.join(directory,'검증자료/정합성검사.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
