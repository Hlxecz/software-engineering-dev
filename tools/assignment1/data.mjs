export const sum=values=>values.reduce((a,b)=>a+b,0);
export function generatedBlocks(data) {
  const compact=(ids,kind)=>ids.length===(kind==='S'?7:10)?(kind==='S'?'S01–07':'AC01–10'):ids.join('·');
  const packages='| ID | 산출물 | 범위 / 검수 | 선행 ID |\n|---|---|---|---|\n'+data.packages.map(p=>`| ${p.id} | ${p.output} | ${compact(p.scopes,'S')} / ${compact(p.acceptance,'AC')} | ${p.predecessors.join(', ')||(p.id==='9.1'?'전 기간':'시작')} |`).join('\n');
  const estimateSummary=`**계획 요약:** ${data.packages.length}개 업무 ${data.baselineHours} h + 위험 예비 ${data.reserveHours} h = ${data.plannedHours} h. 1인 주 ${data.hoursPerWeek} h, ${data.calendarWeeks}주 용량 ${data.capacityHours} h, 미배정 ${data.unallocatedHours} h. 같은 구축 범위의 재수행 가정이며 과거 실투입·현재 남은 시간이 아니다.`;
  return {'00-목차.md':{estimateSummary},'06-업무분해와일정.md':{packages}};
}
export function replaceBlock(markdown, name, content) {
  const start=`<!-- GENERATED:${name}:START -->`, end=`<!-- GENERATED:${name}:END -->`;
  const a=markdown.indexOf(start), b=markdown.indexOf(end);
  if(a<0||b<a)throw new Error(`Missing generated block: ${name}`);
  return markdown.slice(0,a+start.length)+'\n'+content+'\n'+markdown.slice(b);
}
export function diagramSources(data) {
  const sources={};
  const panels=[['wbs-foundation',[1,2,3]],['wbs-integration',[4,5,6]],['wbs-delivery',[7,8,9]]];
  for(const [name,ids] of panels){
    const groups=data.groups.filter(g=>ids.includes(Number(g.id))),packages=data.packages.filter(p=>ids.includes(Number(p.id.split('.')[0])));
    let code=`flowchart LR\n    R["WBS ${ids[0]}–${ids.at(-1)} 부분 ${sum(groups.map(g=>g.hours))} h<br/>하위 ${packages.length}개 / 전체 ${data.baselineHours} h"]\n`;
    for(const g of groups){
      code+=`    R --- G${g.id}["${g.id}. ${g.name}<br/>소계 ${g.hours} h"]\n`;
      for(const p of packages.filter(p=>p.id.startsWith(g.id+'.')))code+=`    G${g.id} --- P${p.id.replace('.','_')}["${p.id} ${p.name}<br/>${p.hours} h"]\n`;
    }
    sources[name]=code;
  }
  const chain=data.groups.filter(g=>g.id!=='9');
  sources.dependencies='flowchart TB\n'+chain.map((g,i)=>`    G${g.id}["${g.id}. ${g.name}"]${i?'\n    G'+chain[i-1].id+(i===1?' -->|"실선: 선행 관계"| G':' --> G')+g.id:''}`).join('\n')+`\n    M["9.1 공통 관리 · ${data.groups.find(g=>g.id==='9').hours} h<br/>점선: 관리 지원<br/>선행 조건 아님"]\n    M -.->|"관리 지원"| G1\n    M -.->|"검사·인계 근거 관리"| G8\n`;
  const duration=data.plannedHours/data.hoursPerWeek;
  sources.estimation=`flowchart TB\n    B["${data.packages.length}개 최하위 업무 합계<br/>기준 ${data.baselineHours} h"] --> R["위험 예비<br/>${data.baselineHours} h × ${data.reserveRate*100}% = ${data.reserveHours} h"]\n    B --> P["계획량<br/>${data.baselineHours} + ${data.reserveHours} = ${data.plannedHours} h"]\n    R --> P\n    P --> W["1인 주 ${data.hoursPerWeek} h로 나누기<br/>${data.plannedHours} ÷ ${data.hoursPerWeek} = ${duration}주"]\n    W --> C["${data.calendarWeeks}주로 올림<br/>가용 용량 ${data.calendarWeeks} × ${data.hoursPerWeek} = ${data.capacityHours} h"]\n    C --> U["미배정 용량<br/>${data.capacityHours} − ${data.plannedHours} = ${data.unallocatedHours} h"]\n`;
  sources.schedule=scheduleSvg(data);
  return sources;
}

export function scheduleSegments(data){
  const result=[];let cursor=0;
  for(const block of data.schedule){
    for(const [id,hours] of Object.entries(block.allocations)){result.push({id,group:id.split('.')[0],start:cursor,end:cursor+hours,hours,block:block.weeks});cursor+=hours;}
    for(const [id,hours] of [['reserve',block.reserveHours],['unallocated',block.unallocatedHours]])if(hours){result.push({id,group:id,start:cursor,end:cursor+hours,hours,block:block.weeks});cursor+=hours;}
  }
  return result;
}
export function scheduleSvg(data){
  const segments=scheduleSegments(data),width=1020,height=780,left=200,plot=600,top=155,row=40;
  const x=time=>left+time/data.capacityHours*plot;
  const esc=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const colors=['#426c9b','#637aa8','#428377','#857150','#8d648b','#577a94','#56814b','#96705d','#ac7841'];
  const rows=[...data.groups.map((g,i)=>({...g,color:colors[i]})),{id:'reserve',name:'위험 예비',hours:data.reserveHours,color:'#dba642'},{id:'unallocated',name:'미배정 용량',hours:data.unallocatedHours,color:'#ccd4dc'}];
  let parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">1인 시간 배분: ${data.capacityHours}시간 / ${data.calendarWeeks}주</title><desc id="desc">기준 ${data.baselineHours}시간, 위험 예비 ${data.reserveHours}시간, 미배정 ${data.unallocatedHours}시간. 모든 배분은 시간 축에서 겹치지 않는다.</desc><rect width="${width}" height="${height}" fill="white"/><g font-family="Malgun Gothic, sans-serif" fill="#1c344e"><text x="20" y="30" font-size="21" font-weight="700">누적 시간에 비례한 1인 구축 일정</text><text x="20" y="60" font-size="16">주 ${data.hoursPerWeek} h · ${data.calendarWeeks}주 ${data.capacityHours} h / 행은 업무 종류, 막대는 순차 배분</text>`];
  parts.push('<text x="135" y="95" font-size="15">상대 주</text><text x="138" y="119" font-size="15">시간 h</text>');
  for(let hour=0;hour<=data.capacityHours;hour+=data.hoursPerWeek){parts.push(`<line x1="${x(hour)}" y1="130" x2="${x(hour)}" y2="${top+row*rows.length}" stroke="#dce4ec"/><text x="${x(hour)}" y="95" text-anchor="middle" font-size="15">${hour/data.hoursPerWeek}</text><text x="${x(hour)}" y="119" text-anchor="middle" font-size="15">${hour}</text>`);}
  for(const [i,item] of rows.entries()){
    const y=top+i*row;const own=segments.filter(s=>s.group===item.id),merged=[];
    for(const s of own){const prev=merged.at(-1);if(prev&&prev.end===s.start){prev.end=s.end;prev.hours+=s.hours;}else merged.push({...s});}
    parts.push(`<text x="16" y="${y+18}" font-size="16">${item.id.match(/^\d$/)?item.id+'. ':''}${esc(item.name)} · ${item.hours} h</text>`);
    for(const s of merged){const barWidth=(s.end-s.start)/data.capacityHours*plot;parts.push(`<rect x="${x(s.start)}" y="${y}" width="${barWidth}" height="26" rx="2" fill="${item.color}" data-group="${item.id}" data-start="${s.start}" data-end="${s.end}"/>`);if(barWidth>=23)parts.push(`<text x="${x(s.start)+barWidth/2}" y="${y+18}" text-anchor="middle" font-size="14" fill="${item.id==='unallocated'?'#183650':'white'}">${s.hours}</text>`);}
    const range=item.id==='9'?`${own.length}회 × ${own[0].hours}`:merged.map(s=>`${s.start}–${s.end}`).join(' / ');
    parts.push(`<text x="820" y="${y+18}" font-size="16">${range} h</text>`);
  }
  const management=segments.filter(s=>s.group==='9').map(s=>`${s.start}–${s.end}`).join(' / ');
  const split=data.packages.filter(p=>p.id!=='9.1'&&segments.filter(s=>s.id===p.id).length>1).map(p=>`${p.id}: ${segments.filter(s=>s.id===p.id).map(s=>`${s.start}–${s.end}`).join(' / ')} h`);
  parts.push(`<text x="20" y="640" font-size="16">관리 구간: ${management} h</text><text x="20" y="669" font-size="16">경계 분할: ${esc(split.join(' · '))}</text><text x="20" y="708" font-size="16">기준 ${data.baselineHours} h + 예비 ${data.reserveHours} h = 계획 ${data.plannedHours} h / 미배정 ${data.unallocatedHours} h와 별도</text><text x="20" y="742" font-size="15">예비 구간은 확보 용량 표시이며, 위험 발생 시 필요한 시점에 사용하고 후속 일정을 조정한다.</text></g></svg>\n`);
  return parts.join('\n');
}
