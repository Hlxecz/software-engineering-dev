// 문서 전용 렌더러. 실제 앱 서버·Java·AI·티스토리는 실행하지 않는다.
// 실행: .\node_modules\.bin\electron.cmd tools/diagrams/render.mjs
import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(project, 'docs/assignment/diagrams');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog.json'), 'utf8'));
const modules = path.join(project, 'tools/diagrams/node_modules');
const verification = path.join(project, '.runtime/verification');
const session = path.join(project, '.runtime/diagram-renderer');
for (const folder of [verification, session, path.join(directory, 'images')]) fs.mkdirSync(folder, {recursive:true});
app.setPath('userData', session);
app.disableHardwareAcceleration();
const escapeHtml = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const hash = data => createHash('sha256').update(data).digest('hex');
const page = `<!doctype html><html lang="ko"><meta charset="utf-8"><style>html,body{margin:0;background:#fff;overflow:hidden}#stage{padding:12px;display:inline-block}svg{display:block;max-width:none!important;font-family:'Malgun Gothic',sans-serif}</style><div id="stage"></div><script type="module">
import mermaid from '/modules/mermaid/dist/mermaid.esm.min.mjs';
mermaid.initialize({startOnLoad:false,securityLevel:'strict',markdownAutoWrap:false,theme:'base',fontFamily:'Malgun Gothic, sans-serif',themeVariables:{fontFamily:'Malgun Gothic, sans-serif',fontSize:'16px',primaryColor:'#edf3ff',primaryTextColor:'#152746',primaryBorderColor:'#5372a3',lineColor:'#52647e',secondaryColor:'#eef8f3',tertiaryColor:'#f8f5ec',background:'#ffffff'},flowchart:{htmlLabels:false,useMaxWidth:false,curve:'linear',wrappingWidth:300,nodeSpacing:24,rankSpacing:42},sequence:{useMaxWidth:false,wrap:true,diagramMarginX:24,diagramMarginY:20,actorMargin:35,messageMargin:28},class:{useMaxWidth:false},state:{useMaxWidth:false}});
window.draw=async(id,code)=>{const result=await mermaid.render(id,code);const stage=document.querySelector('#stage');stage.innerHTML=result.svg;const svg=stage.querySelector('svg');const box=svg.viewBox.baseVal;const width=Math.ceil(box.width),height=Math.ceil(box.height);svg.setAttribute('width',width);svg.setAttribute('height',height);svg.style.maxWidth='none';await document.fonts.ready;return {svg:new XMLSerializer().serializeToString(svg),width:width+24,height:height+24,text:svg.textContent,kind:svg.getAttribute('aria-roledescription')};};
window.ready=true;
</script></html>`;

let win;
const server = http.createServer((req,res)=>{
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (pathname === '/') {res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page);return;}
    if (!pathname.startsWith('/modules/')) {res.writeHead(404);res.end();return;}
    const filename=path.resolve(modules, pathname.slice(9));
    const relative=path.relative(modules,filename);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Invalid path');
    res.setHeader('Content-Type',filename.endsWith('.json')?'application/json':'text/javascript; charset=utf-8');
    res.end(fs.readFileSync(filename));
  } catch {res.writeHead(404);res.end();}
});

async function renderAll() {
try {
  await app.whenReady();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  win=new BrowserWindow({show:false,width:1200,height:900,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  await win.loadURL(`http://127.0.0.1:${server.address().port}`);
  await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let attempts=0;const t=setInterval(()=>{if(window.ready){clearInterval(t);resolve(true);}else if(++attempts>200){clearInterval(t);reject(new Error('Mermaid loading timeout'));}},50);})`);
  const rendered=[];
  for (const diagram of catalog.diagrams) {
    const code=fs.readFileSync(path.join(directory,diagram.file),'utf8');
    const result=await win.webContents.executeJavaScript(`window.draw(${JSON.stringify('d-'+diagram.id)},${JSON.stringify(code)})`);
    if (!result.text || result.svg.includes('Syntax error in text') || !Number.isFinite(result.width) || result.width>6000 || result.height>9000) throw new Error(`Invalid render: ${diagram.id}`);
    const svgPath=path.join(directory,`images/${diagram.id}.svg`);
    fs.writeFileSync(svgPath,result.svg);
    win.setContentSize(result.width,result.height);
    await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const screenshot=await win.webContents.capturePage({x:0,y:0,width:result.width,height:result.height});
    const png=screenshot.toPNG();
    if (png.length<1000) throw new Error(`Empty image: ${diagram.id}`);
    fs.writeFileSync(path.join(directory,`images/${diagram.id}.png`),png);
    rendered.push({id:diagram.id,width:result.width,height:result.height,kind:result.kind,sourceSha256:hash(code),svgSha256:hash(result.svg),pngBytes:png.length});
    console.log(`${rendered.length}/${catalog.diagrams.length} ${diagram.id}: ${result.width} x ${result.height}`);
  }
  for (const group of catalog.groups) {
    const diagrams=catalog.diagrams.filter(item=>item.group===group.id);
    const sections=diagrams.map(d=>{
      const links=d.sources.map(file=>`[${path.basename(file)}](../../../${file})`).join(', ');
      const source=fs.readFileSync(path.join(directory,d.file),'utf8').trimEnd();
      return `## ${d.title}\n\n${d.description}\n\n![${d.title}](images/${d.id}.svg)\n\n[SVG 확대](images/${d.id}.svg) · [PNG 다운로드](images/${d.id}.png) · [수정할 Mermaid 원본](${d.file})\n\n코드 근거: ${links}\n\n<details>\n<summary>Mermaid 코드 보기</summary>\n\n\`\`\`mermaid\n${source}\n\`\`\`\n\n</details>\n`;
    });
    let appendix='';
    if(group.id==='10-ui-flow') appendix='\n## 기존 작업실 화면\n\n![기존 작업실 화면](../../assets/workspace.png)\n\n화면 사용법은 [USAGE.md](../../USAGE.md)를 봅니다.\n';
    if(group.id==='11-patterns-solid') appendix=`\n## 현재 SOLID 평가\n\n| 원칙 | 코드에서 확인한 범위 | 남은 한계 |\n|---|---|---|\n| SRP | 재료·초안·스냅샷·분류·지침별 책임 분리 | Node 서버는 여러 기능을 조정하는 큰 모듈 |\n| OCP | AI 생성기·발행 연결 함수를 외부에서 교체 가능 | Java 작업 추가는 Main 분기 수정 필요 |\n| LSP | 억지 상속 없이 협력 객체 사용 | Java 저장 구현체 교체 사례가 없어 충족 증거로 내세우지 않음 |\n| ISP | 클래스의 담당 기능 분리 | 별도 작은 저장 인터페이스 없음 |\n| DIP | 생성자·함수 주입 사용 | Java는 구체 클래스·정적 파일 기능에 의존 |\n\n위 제안도를 구현 완료 관계도로 사용하지 마세요. 클래스 30개 제한은 현재 구현 클래스 11개에 적용되며, 그림의 미구현 타입은 코드에 추가하지 않았습니다.\n`;
    const markdown=`# ${group.title}\n\n[전체 목차](README.md) · [유스케이스 상세](USE_CASES.md) · [HTML 그림 모음](index.html)\n\n${group.intro}\n\n기준: ${catalog.version} · ${catalog.date}\n\n${sections.join('\n')}\n${appendix}`;
    fs.writeFileSync(path.join(directory,group.id+'.md'),markdown.trimEnd()+'\n');
  }
  const nav=catalog.groups.map(g=>`<a href="#${g.id}">${escapeHtml(g.title)}</a>`).join('');
  const sections=catalog.groups.map(g=>`<section id="${g.id}"><h2>${escapeHtml(g.title)}</h2><p>${escapeHtml(g.intro)}</p>${catalog.diagrams.filter(d=>d.group===g.id).map(d=>`<article data-search="${escapeHtml(d.title+' '+d.description+' '+d.ucs.join(' '))}"><h3>${escapeHtml(d.title)}</h3><p>${escapeHtml(d.description)}</p><div class="image"><a href="images/${d.id}.svg"><img loading="lazy" src="images/${d.id}.svg" alt="${escapeHtml(d.title)}"></a></div><p class="links"><a href="images/${d.id}.svg">SVG 확대</a><a href="images/${d.id}.png" download>PNG 저장</a><a href="${d.file}">Mermaid 원본</a><a href="${g.id}.md">설명 문서</a></p></article>`).join('')}</section>`).join('');
  const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>H.Dev Studio Java · 다이어그램 49개</title><style>
*{box-sizing:border-box}body{margin:0;color:#17283c;background:#f4f6fa;font:16px/1.7 'Malgun Gothic',sans-serif}a{color:#245fa4}aside{width:250px;padding:30px 22px;position:fixed;inset:0 auto 0 0;background:#142940;color:#fff;overflow:auto}aside strong{font-size:22px;line-height:1.5;display:block;margin-bottom:24px}aside a{display:block;color:#e2ebf7;padding:9px 0;text-decoration:none;font-size:14px}main{margin-left:250px;max-width:1510px;padding:40px}header{padding:20px 0 35px}h1{word-break:keep-all;font-size:32px;line-height:1.5;margin:8px 0}h2{font-size:25px;margin:42px 0 12px}h3{margin:0 0 15px;font-size:21px}input{width:100%;max-width:680px;padding:14px 18px;font:inherit;border:1px solid #b8c6d8;border-radius:8px}article{background:white;padding:28px;margin:24px 0;border:1px solid #dce4ef;border-radius:12px;break-inside:avoid}article p{max-width:980px}.image{overflow:auto;background:#fff;padding:12px 0}.image img{display:block;max-width:100%;height:auto;margin:auto;max-height:1150px}.links{display:flex;gap:20px;flex-wrap:wrap;font-size:14px}small{color:#586d85}section{scroll-margin-top:25px}[hidden]{display:none!important}@media(max-width:900px){aside{position:static;width:auto;padding:22px}aside nav{display:flex;flex-wrap:wrap;gap:5px 20px;max-height:155px;overflow:auto}main{margin:0;padding:20px}h1{font-size:27px}article{padding:18px}}@media print{aside,input,.links{display:none}body{background:white}main{margin:0;padding:0}article{border:0}h2{break-before:page}.image img{max-height:900px}}
</style></head><body><aside><strong>H.Dev Studio Java<br>설계를 따라 읽기</strong><nav>${nav}<a href="README.md">문서 목차</a><a href="USE_CASES.md">유스케이스 상세 21개</a><a href="REFERENCE.md">Lumia 참고 대응표</a></nav></aside><main><header><small>${catalog.version} · ${catalog.date} · 실제 코드 기준</small><h1>버튼에서 파일까지,<br>49개 그림으로 읽는 프로젝트</h1><p>유스케이스 → 문맥·도메인 → 클래스 → 시퀀스 → 상태 순서로 읽으세요.<br>그림을 누르면 원본 크기로 열립니다. 이 페이지는 인터넷 없이 볼 수 있습니다.</p><label for="search">기능·코드 용어로 찾기</label><br><input id="search" type="search" placeholder="예: UC-09, 프롬프트, 발행, Java"><p id="count">49개 그림</p></header>${sections}</main><script>const q=document.getElementById('search');q.addEventListener('input',()=>{let count=0;const keyword=q.value.toLocaleLowerCase();document.querySelectorAll('article').forEach(card=>{card.hidden=!card.dataset.search.toLocaleLowerCase().includes(keyword);if(!card.hidden)count++;});document.querySelectorAll('main section').forEach(s=>s.hidden=![...s.querySelectorAll('article')].some(c=>!c.hidden));document.getElementById('count').textContent=count+'개 그림';});</script></body></html>`;
  fs.writeFileSync(path.join(directory,'index.html'),html);
  fs.writeFileSync(path.join(verification,'diagrams-render.json'),JSON.stringify({version:catalog.version,renderer:'Mermaid 12.0.0 / Electron '+process.versions.electron,count:rendered.length,diagrams:rendered},null,2));
  console.log('Rendered every diagram and generated Markdown + offline gallery.');
} catch(error) {console.error(error.stack);process.exitCode=1;}
finally {win?.destroy();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));app.exit(process.exitCode||0);}
}
renderAll();
