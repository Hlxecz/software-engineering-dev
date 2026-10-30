// 현재 제출본의 그림·표·HTML만 생성한다. 이전 제출본과 앱 코드는 수정하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import {writeHtml,sha256} from './html.mjs';
import {diagramSources,replaceBlock,scheduleSegments} from './data.mjs';
const root=path.resolve(import.meta.dirname,'../..');
const directory=path.join(root,'docs/assignment/과제1-프로젝트관리-최신');
const previous=path.join(root,'docs/assignment/과제1-프로젝트관리');
const data=JSON.parse(fs.readFileSync(path.join(directory,'계획자료/업무계획.json'),'utf8'));
for(const name of ['그림원본','그림','검증자료'])fs.mkdirSync(path.join(directory,name),{recursive:true});
const oldReport=JSON.parse(fs.readFileSync(path.join(previous,'계획자료/보고서구성.json'),'utf8'));
const ids=['control-concept','internal-controller','context','classes-java','wbs-foundation','wbs-integration','wbs-delivery','dependencies','schedule'];
const report={title:'과제 1 · 블로그 글쓰기 지원 앱 프로젝트 관리',version:'0.11.1-java.1',printFriendly:true,baselineCommit:'20a607cf8fbbb8b71680b6bae9f01f4977952039',revisedAt:'2026-10-30',submission:oldReport.submission,sections:oldReport.sections,diagrams:ids.map(id=>({...oldReport.diagrams.find(d=>d.id===id),basis:['estimation','wbs-foundation','wbs-integration','wbs-delivery','dependencies','schedule'].includes(id)?'구축 계획 가정':'현재 기능과 구조'}))};
fs.writeFileSync(path.join(directory,'계획자료/보고서구성.json'),JSON.stringify(report,null,2)+'\n');
const sources=diagramSources(data);
sources.estimation=sources.estimation.replace(`${data.calendarWeeks}주로 올림`,`계획 기간 ${data.calendarWeeks}주`);
for(const id of ['wbs-foundation','wbs-integration','wbs-delivery'])for(const p of data.packages)sources[id]=sources[id].replace(p.name,p.name.replaceAll('·',' · ').replaceAll('검토메모','검토 메모'));
sources['control-concept']=`flowchart TB
 U["블로그 작성자 · 포트폴리오 준비 학생<br/>초안 구성이 어려운 사용자"] --> I["자료 입력<br/>사진·메모 / 직접 쓴 글"]
 I --> A["초안 구성<br/>직접 작성 또는 AI 생성"]
 A --> E["편집·검토<br/>다듬기 · 되돌리기"]
 E --> S["내 PC에 보관·다시 열기"]
 S --> C{"사용자가 공개 반영 선택?"}
 C -->|예| P["티스토리 신규 발행 / 기존 글 수정"]
 C -->|아니요| L["로컬 초안으로 유지"]
 P --> F["결과·오류·불확실 상태 안내"]
 L --> F
 F -.->|"필요한 부분 다시 편집"| E
`;
sources['internal-controller']=`flowchart TB
 W["화면 · HTML/CSS/JavaScript<br/>작성·편집·미리보기"] --> N["Node HTTP API<br/>입력 검사·작업 조정"]
 N -->|"JSON 요청·응답"| J["Java 17개 클래스 + 2개 인터페이스<br/>자료 검사·저장·조회·복원"]
 J --> F["Java 전용 workspace<br/>글·사진·초안·지침·수정 기록"]
 N --> A["AI CLI<br/>초안 생성·문장 다듬기"]
 N --> T["Electron 연결<br/>로그인·발행·기존 글 수정"]
`;
sources.context=`flowchart TB
 U["주요 사용자<br/>블로그 작성자<br/>포트폴리오 준비 학생<br/>초안 구성이 어려운 사람"] -->|"자료·요청·검토·반영 선택"| S["블로그 글쓰기 지원 PC 앱"]
 S -->|"초안·미리보기·처리 결과"| U
 S -->|"작성 요청"| A["AI CLI<br/>Codex / Claude Code"]
 A -->|"초안·다듬기 결과"| S
 S -->|"로그인·발행·수정"| T["티스토리"]
 T -->|"원문·분류·결과"| S
 P["공개 웹·노션"] -->|"참고 내용"| S
`;
sources.dependencies=`flowchart TB
 A["1. 요구·범위"] --> B["2. 구조·데이터 설계"]
 B --> C["3. 기본 글 자료 관리"]
 C --> D["4. 지침·AI·참고자료"]
 D --> E["5. 부분 다듬기"]
 C --> F["6. 발행·기존 글 수정"]
 D --> F
 E --> G["7. Windows 화면·패키지"]
 F --> G
 G --> H["8. 통합·인수 검증"]
 H --> I["9.2 보고서·제출 정리"]
 M["9.1 범위·위험·진행 관리<br/>12주 동안 분산"] -.-> B
 M -.-> H
`;
const esc=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const packages=[
 ['bridge · 요청 진입과 분배',30,100,480,155,['Main','RequestDispatcher']],
 ['post · 글과 새 저장 기능',30,295,480,460,['JobRepository','SnapshotService','DraftRepository','DraftStore «interface»','StorageService','ExistingPostService','RefinementService','UpdateService']],
 ['common · 공통 저장과 복원',560,100,480,330,['AppException','JsonFiles','JsonRecordStore «interface»','FileJsonRecordStore','FileTransaction']],
 ['workspace · 자료 경로',560,470,480,120,['Workspace']],
 ['category · 카테고리',30,795,480,120,['CategoryService']],
 ['prompt · 기본·분류별 지침',560,630,480,160,['PromptService','StyleService']]
];
sources['classes-java']=`<svg xmlns="http://www.w3.org/2000/svg" width="1070" height="960" viewBox="0 0 1070 960" role="img"><title>기능별 Java 구조: 클래스 17개와 인터페이스 2개</title><rect width="1070" height="960" fill="white"/><g font-family="Malgun Gothic,sans-serif" fill="#163250"><text x="30" y="42" font-size="28" font-weight="700">기능별 Java 구조 · 총 19개 선언</text><text x="30" y="75" font-size="20">클래스 17개 / 실제 저장 계약인 인터페이스 2개</text>${packages.map(([title,x,y,w,h,names])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#f3f7fc" stroke="#6b87a4" stroke-width="2"/><text x="${x+20}" y="${y+36}" font-size="22" font-weight="700">${esc(title)}</text><line x1="${x}" y1="${y+52}" x2="${x+w}" y2="${y+52}" stroke="#bccbd9"/>${names.map((name,i)=>`<text x="${x+24}" y="${y+88+i*42}" font-size="22"${name.includes('interface')?' font-style="italic" fill="#7b4a2e"':''}>${esc(name)}</text>`).join('')}`).join('')}<text x="560" y="850" font-size="20">«interface» = 구현을 교체할 수 있는 저장 계약</text><text x="560" y="882" font-size="20">책임이 다른 기능만 분리하고</text><text x="560" y="912" font-size="20">기존 공통 처리와 간단한 구조는 유지</text></g></svg>`;
sources.schedule=timeline(data);
for(const d of report.diagrams){if(d.id==='classes-java')d.kind='svg';fs.writeFileSync(path.join(directory,d.file),sources[d.id]);}
for(const [file,block,text] of [
 ['00-목차.md','estimateSummary',`**계획 요약:** 기본 ${data.baselineHours} h + 위험 예비 ${data.reserveHours} h = ${data.plannedHours} h. 1인 주 ${data.hoursPerWeek} h, ${data.calendarWeeks}주. 실제 투입시간이나 현재 남은 시간이 아닌 재구성 계획이다.`],
 ['06-업무분해와일정.md','groupSummary','| 그룹 | 주요 업무 | 기본 시간 |\n|---|---|---:|\n'+data.groups.map(g=>`| ${g.id} | ${g.name} | ${g.hours} h |`).join('\n')+`\n| **합계** | **${data.packages.length}개 하위 업무** | **${data.baselineHours} h** |`]
]){const filename=path.join(directory,file);if(fs.existsSync(filename)){const md=fs.readFileSync(filename,'utf8');if(md.includes('<!-- GENERATED:'+block+':START -->'))fs.writeFileSync(filename,replaceBlock(md,block,text));}}
if(report.sections.every(s=>fs.existsSync(path.join(directory,s.file)))&&report.diagrams.every(d=>fs.existsSync(path.join(directory,d.image+'.svg')))){
 writeHtml(directory);
 const file=path.join(directory,'통합보고서.html');let html=fs.readFileSync(file,'utf8');
 html=html.replace('Java 블로그 작업 제어기<br>프로젝트 관리 보고서','블로그 글쓰기 지원 앱<br>프로젝트 관리 보고서').replace('PC 기반 소프트웨어 작업 제어기','글쓰기 지원 PC 앱');
 html=html.replace('</style>','@media print{.step#step-1 .report-figure:first-of-type img{max-height:210mm}.step#step-6 .report-figure:first-of-type img{max-height:220mm}.keep-together{break-inside:avoid-page}}\n</style>');
 html=html.replace(/(<h3 id="(?:인수-조건|보조-이해관계자|과제-요구와-검수-연결)"[^>]*>[\s\S]*?<\/div>)/g,'<div class="keep-together">$1</div>');
 // 제출용 본문에는 코드 근거나 파일 안내를 넣지 않는다.
 html=html.replace(/<p class="source-evidence">[\s\S]*?<\/p>/g,'');
 fs.writeFileSync(file,html);
 const metadataFile=path.join(directory,'검증자료/문서해시.json'),metadata=JSON.parse(fs.readFileSync(metadataFile,'utf8'));metadata.htmlSha256=sha256(html);fs.writeFileSync(metadataFile,JSON.stringify(metadata,null,2)+'\n');
}
console.log(JSON.stringify({directory,diagrams:report.diagrams.length,sectionsReady:report.sections.every(s=>fs.existsSync(path.join(directory,s.file)))}));

function timeline(data){
 const segments=scheduleSegments(data),width=1160,height=870,left=260,plot=820,top=180,row=45;
 const x=hour=>left+hour/data.capacityHours*plot;
 const palette=['#426c9b','#607ca7','#3f8277','#8b7448','#8c6294','#5c7b95','#638349','#9e7958','#786a99'];
 const rows=[...data.groups.filter(g=>g.id!=='9').map((g,i)=>({...g,color:palette[i]})),{id:'9.1',name:'진행 관리',hours:8,color:'#786a99'},{id:'9.2',name:'보고서·제출',hours:8,color:'#786a99'},{id:'reserve',name:'위험 예비',hours:data.reserveHours,color:'#cb8f28'}];
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>12주 단일 인력의 시간 배분</title><rect width="${width}" height="${height}" fill="white"/><g font-family="Malgun Gothic,sans-serif" fill="#163250"><text x="24" y="42" font-size="27" font-weight="700">12주 시간 배분 · 한 사람의 순차 일정</text><text x="24" y="78" font-size="21">기본 200 h + 예비 40 h = 240 h / 주당 20 h</text><text x="175" y="122" font-size="18">상대 주</text><text x="175" y="154" font-size="18">누적 h</text>`];
 for(let hour=0;hour<=data.capacityHours;hour+=20){parts.push(`<line x1="${x(hour)}" y1="165" x2="${x(hour)}" y2="${top+rows.length*row}" stroke="#dce4ed"/><text x="${x(hour)}" y="154" text-anchor="middle" font-size="18">${hour}</text>`);if(hour<data.capacityHours)parts.push(`<text x="${x(hour+10)}" y="122" text-anchor="middle" font-size="19">${hour/20+1}주</text>`);}
 rows.forEach((r,i)=>{const y=top+i*row,own=segments.filter(s=>r.id.startsWith('9.')?s.id===r.id:s.group===r.id);parts.push(`<text x="24" y="${y+25}" font-size="19">${esc(r.name)} · ${r.hours} h</text>`);for(const s of own){const w=x(s.end)-x(s.start);parts.push(`<rect x="${x(s.start)}" y="${y}" width="${w}" height="31" rx="2" fill="${r.color}"/>`);if(w>=38)parts.push(`<text x="${x(s.start)+w/2}" y="${y+23}" text-anchor="middle" fill="white" font-size="17">${s.hours}</text>`);}});
 parts.push(`<text x="24" y="735" font-size="21">진행 관리 8 h는 전 기간에 분산하고, 보고서·제출 8 h는 마지막에 배정</text><text x="24" y="775" font-size="21">모든 막대는 같은 0–240 h 축의 순차 배분이며, 한 사람의 업무를 중복 배정하지 않음</text><text x="24" y="815" font-size="20">위험 예비는 발생 시점에 맞게 사용할 수 있도록 확보한 계획 용량</text></g></svg>`);return parts.join('');
}
