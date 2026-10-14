// 생성 HTML의 PC·작은 화면·인쇄 스타일을 확인한다. 앱은 실행하지 않는다.
// 실행: .\node_modules\.bin\electron.cmd tools/assignment1/inspect.mjs
import {app,BrowserWindow} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {sha256,readSections,sourceDigest} from './html.mjs';
const tool=path.dirname(fileURLToPath(import.meta.url));
const directory=path.resolve(tool,'../../docs/assignment/과제1-프로젝트관리');
const catalog=JSON.parse(fs.readFileSync(path.join(directory,'계획자료/보고서구성.json'),'utf8'));
const sources=readSections(directory);
app.setPath('userData',path.join(tool,'.render-session'));
app.disableHardwareAcceleration();
let win;
const snapshots=[];
const snapshot=async(name)=>{fs.writeFileSync(path.join(directory,'검증자료',name),(await win.webContents.capturePage()).toPNG());snapshots.push(name);};
const settle=()=>win.webContents.executeJavaScript('new Promise(resolve=>setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)),180))');
async function inspect(){
try{
  await app.whenReady();
  console.log('HTML 검사 창 준비');
  win=new BrowserWindow({show:false,frame:false,width:1280,height:900,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  await win.loadFile(path.join(directory,'통합보고서.html'));
  console.log('HTML 읽기 완료');
  const report=[];
  for(const width of [1280,375]){
    console.log('화면 폭 검사: '+width);
    win.setContentSize(width,900);
    await win.webContents.executeJavaScript('new Promise(resolve=>setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)),150))');
    const result=await win.webContents.executeJavaScript(`(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.report-figure img')].map(i=>i.decode()));return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,images:[...document.querySelectorAll('.report-figure img')].map(i=>({name:i.dataset.source,embedded:i.src.startsWith('data:image/svg+xml;base64,'),loaded:i.complete&&i.naturalWidth>0,displayWidth:i.getBoundingClientRect().width})),sections:[...document.querySelectorAll('.step')].map(s=>({id:s.id,file:s.dataset.sourceFile,sourceSha256:s.dataset.sourceSha256,title:s.querySelector('h2').textContent})),tableCount:document.querySelectorAll('table').length,overflowTables:[...document.querySelectorAll('.table-wrap')].filter(t=>t.scrollWidth>t.clientWidth).length,struckText:document.querySelectorAll('del').length,clippedCells:[...document.querySelectorAll('td,th')].filter(c=>c.scrollWidth>c.clientWidth+1).length,brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)))).length};})()`);
    assert.equal(result.width,width);
    assert.ok(result.documentWidth<=width,'페이지 자체의 가로 잘림');
    assert.equal(result.sections.length,6);
    assert.deepEqual(result.sections.map(s=>s.id),sources.map(s=>s.id));
    for(const [i,s] of result.sections.entries()){assert.equal(s.sourceSha256,sha256(sources[i].markdown));assert.equal(s.title,sources[i].title);}
    assert.equal(result.images.length,catalog.diagrams.length);
    assert.equal(result.brokenAnchors,0);
    assert.ok(result.images.every(i=>i.loaded&&i.embedded&&i.displayWidth<=width));
    assert.equal(result.struckText,0);
    assert.equal(result.clippedCells,0);
    report.push(result);
    await win.webContents.executeJavaScript('scrollTo(0,0)');
    const filename=width===1280?'화면-PC-1280.png':'화면-모바일-375.png';
    fs.writeFileSync(path.join(directory,'검증자료',filename),(await win.webContents.capturePage()).toPNG());
    snapshots.push(filename);
  }
  win.setContentSize(1280,900);await settle();
  await win.webContents.executeJavaScript("document.querySelector('.report-sidebar a[href=\"#step-2\"]').click()");await settle();
  const navigation=await win.webContents.executeJavaScript("({hash:location.hash,current:document.querySelector('.report-sidebar a[aria-current]').hash,sidebarPosition:getComputedStyle(document.querySelector('.report-sidebar')).position})");
  assert.equal(navigation.hash,'#step-2');assert.equal(navigation.current,'#step-2');assert.equal(navigation.sidebarPosition,'sticky');
  await win.webContents.executeJavaScript("document.querySelector('#step-2 .table-wrap').scrollIntoView({block:'start'})");await settle();await snapshot('화면-02-범위와인수.png');
  await win.webContents.executeJavaScript("document.querySelector('#step-2 .figure-open').scrollIntoView({block:'start'})");await settle();await snapshot('화면-02-내부책임그림.png');
  await win.webContents.executeJavaScript("document.querySelector('#step-2 .figure-open').focus()");
  win.webContents.focus();
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});win.webContents.sendInputEvent({type:'char',keyCode:'Enter'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});await settle();
  const dialogOpen=await win.webContents.executeJavaScript("({open:document.querySelector('dialog').open,focus:document.querySelector('dialog').contains(document.activeElement),title:document.querySelector('#figure-title').textContent,loaded:document.querySelector('.dialog-image').complete&&document.querySelector('.dialog-image').naturalWidth>0})");
  console.log('키보드 확대 검사: '+JSON.stringify(dialogOpen));assert.ok(dialogOpen.open&&dialogOpen.focus&&dialogOpen.loaded);await snapshot('화면-그림확대.png');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await settle();
  const dialogClosed=await win.webContents.executeJavaScript("({closed:!document.querySelector('dialog').open,focusRestored:document.activeElement.classList.contains('figure-open')})");assert.ok(dialogClosed.closed&&dialogClosed.focusRestored);
  await win.webContents.executeJavaScript("document.querySelector('#step-6 .report-figure').scrollIntoView({block:'start'})");await settle();await snapshot('화면-06-업무분해.png');
  const observedCurrent=await win.webContents.executeJavaScript("document.querySelector('.report-sidebar a[aria-current]').hash");assert.equal(observedCurrent,'#step-6');
  // 새 UML 그림의 화면 삽입과 각각의 확대 동작을 확인한다.
  const umlDialogs=[];
  for(const id of ['activity-authoring','sequence-manual-save','usecase-writing','usecase-connections','usecase-prompts','classes-java']){
    const entry=catalog.diagrams.find(d=>d.id===id);
    await win.webContents.executeJavaScript(`(()=>{const img=[...document.querySelectorAll('.report-figure img')].find(i=>i.dataset.source===${JSON.stringify(entry.image+'.svg')});img.closest('figure').scrollIntoView({block:'start'});})()`);await settle();await snapshot('화면-UML-'+id+'.png');
    const tested=await win.webContents.executeJavaScript(`(()=>{const img=[...document.querySelectorAll('.report-figure img')].find(i=>i.dataset.source===${JSON.stringify(entry.image+'.svg')});img.closest('button').click();const d=document.querySelector('dialog');const result={id:${JSON.stringify(id)},open:d.open,sourceMatches:d.querySelector('img').src===img.src};d.close();return result;})()`);
    assert.ok(tested.open&&tested.sourceMatches);umlDialogs.push(tested);
  }
  // 그림 폴더가 없는 독립 사본에서도 내장된 본문·등록 그림 전체이 읽혀야 한다.
  const standaloneDirectory=path.resolve(tool,'../../.runtime/assignment1-standalone-review-20261006');fs.mkdirSync(standaloneDirectory,{recursive:true});const standaloneFile=path.join(standaloneDirectory,'통합보고서.html');fs.copyFileSync(path.join(directory,'통합보고서.html'),standaloneFile);await win.loadFile(standaloneFile);await settle();
  const standalone=await win.webContents.executeJavaScript("(async()=>{const imgs=[...document.querySelectorAll('.report-figure img')];await Promise.all(imgs.map(i=>i.decode()));return {images:imgs.length,loaded:imgs.every(i=>i.naturalWidth>0),steps:document.querySelectorAll('.step').length,brokenAnchors:[...document.querySelectorAll('a[href^=\"#\"]')].filter(a=>!document.getElementById(decodeURIComponent(a.hash.slice(1)))).length};})()");assert.deepEqual(standalone,{images:catalog.diagrams.length,loaded:true,steps:6,brokenAnchors:0});
  await win.webContents.executeJavaScript("document.querySelector('.figure-open').click();window.dispatchEvent(new Event('beforeprint'))");assert.equal(await win.webContents.executeJavaScript("document.querySelector('dialog').open"),false);
  await win.webContents.executeJavaScript(`(()=>{const style=document.createElement('style');style.textContent=[...document.styleSheets[0].cssRules].filter(r=>r.conditionText==='print').map(r=>[...r.cssRules].map(c=>c.cssText).join('')).join('');document.head.append(style);})()`);
  // A4 폭 210 mm에서 좌우 여백 15 mm씩을 뺀 본문 폭(약 680 px).
  win.setContentSize(680,1009);
  await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  const print=await win.webContents.executeJavaScript(`({width:innerWidth,documentWidth:document.documentElement.scrollWidth,sidebarDisplay:getComputedStyle(document.querySelector('.report-sidebar')).display,tableMinWidths:[...document.querySelectorAll('table')].map(t=>getComputedStyle(t).minWidth),tableOverflows:[...document.querySelectorAll('.table-wrap')].filter(t=>t.scrollWidth>t.clientWidth+1).length,imageWidths:[...document.querySelectorAll('.report-figure img')].map(i=>i.getBoundingClientRect().width)})`);
  assert.equal(print.sidebarDisplay,'none');
  assert.ok(print.documentWidth<=print.width,'인쇄 스타일 가로 잘림');
  assert.equal(print.tableOverflows,0,'인쇄 표 잘림');
  const result={checkedAt:new Date().toISOString(),sourceSha256:sourceDigest(sources),sectionSha256:Object.fromEntries(sources.map(s=>[s.file,sha256(s.markdown)])),htmlSha256:sha256(fs.readFileSync(path.join(directory,'통합보고서.html'))),svgSha256:Object.fromEntries(catalog.diagrams.map(({id,image})=>[id,sha256(fs.readFileSync(path.join(directory,image+'.svg')))])),screens:report,printStyle:print,snapshots,interaction:{umlDialogs,navigation,observedCurrent,keyboardDialog:dialogOpen,escapeClose:dialogClosed,beforePrintClosesDialog:true},standalone,printEngine:'인쇄 CSS를 A4 폭에 적용한 레이아웃 검사; 이 도구는 PDF를 생성하지 않음',appExecuted:false};
  fs.writeFileSync(path.join(directory,'검증자료/화면검사.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.stack);process.exitCode=1;}
finally{win?.destroy();app.exit(process.exitCode||0);}
}
inspect();
