// 기존 Mermaid/Electron을 재사용하는 과제 1 전용 렌더러. 앱 기능은 실행하지 않는다.
// 실행: .\node_modules\.bin\electron.cmd tools/assignment1/render.mjs
import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { sha256, writeHtml } from './html.mjs';

const tool = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(tool, '../..');
const directory = path.resolve(project, process.argv[2] || 'docs/assignment/과제1-프로젝트관리');
if(!directory.startsWith(path.join(project,'docs/assignment')+path.sep))throw new Error('과제 문서 폴더만 생성할 수 있습니다.');
const report=JSON.parse(fs.readFileSync(path.join(directory,'계획자료/보고서구성.json'),'utf8'));
const modules = path.join(project, 'tools/diagrams/node_modules');
const session = path.join(project, '.runtime', 'report-render-'+path.basename(directory));
fs.mkdirSync(session, {recursive:true});
fs.mkdirSync(path.join(directory, '그림'), {recursive:true});
app.setPath('userData', session);
app.disableHardwareAcceleration();
const page = `<!doctype html><html lang="ko"><meta charset="utf-8"><style>html,body{margin:0;background:white;overflow:hidden}#stage{padding:12px;display:inline-block}svg{display:block;max-width:none!important;font-family:'Malgun Gothic',sans-serif}</style><div id="stage"></div><script type="module">
import mermaid from '/modules/mermaid/dist/mermaid.esm.min.mjs';
mermaid.initialize({startOnLoad:false,securityLevel:'strict',markdownAutoWrap:false,theme:'base',fontFamily:'Malgun Gothic, sans-serif',themeVariables:{fontFamily:'Malgun Gothic, sans-serif',fontSize:'${report.printFriendly?'20px':'17px'}',primaryColor:'#edf3fb',primaryTextColor:'#142c46',primaryBorderColor:'#5175a0',lineColor:'#50667d',secondaryColor:'#edf7f1',tertiaryColor:'#fbf4e7'},flowchart:{htmlLabels:false,useMaxWidth:false,curve:'linear',nodeSpacing:18,rankSpacing:26,wrappingWidth:260},sequence:{useMaxWidth:false,wrap:true},class:{useMaxWidth:false}});
window.drawSvg=async(markup)=>{const stage=document.querySelector('#stage');stage.innerHTML=markup;const svg=stage.querySelector('svg');const box=svg.viewBox.baseVal;const width=Math.ceil(box.width),height=Math.ceil(box.height);svg.setAttribute('width',width);svg.setAttribute('height',height);svg.style.maxWidth='none';await document.fonts.ready;const overflowText=[...svg.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,width:b.width,height:b.height};}).filter(b=>b.x<box.x-1||b.y<box.y-1||b.x+b.width>box.x+box.width+1||b.y+b.height>box.y+box.height+1);return {svg:new XMLSerializer().serializeToString(svg),width:width+24,height:height+24,text:svg.textContent,overflowText};};window.draw=async(id,code)=>window.drawSvg((await mermaid.render(id,code)).svg);window.ready=true;
</script></html>`;
let win;
const server=http.createServer((req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page);return;}
    if(!pathname.startsWith('/modules/'))throw new Error('Not found');
    const filename=path.resolve(modules,pathname.slice(9));
    const relative=path.relative(modules,filename);
    if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Invalid path');
    res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(fs.readFileSync(filename));
  }catch{res.writeHead(404);res.end();}
});
async function render(){
  try{
    await app.whenReady();
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    win=new BrowserWindow({show:false,width:1200,height:900,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
    await win.loadURL(`http://127.0.0.1:${server.address().port}`);
    await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(window.ready){clearInterval(timer);resolve(true);}else if(++n>200){clearInterval(timer);reject(new Error('Mermaid loading timeout'));}},50);})`);
    const results=[];
    for(const diagram of report.diagrams){
      const {id}=diagram;
      const source=fs.readFileSync(path.join(directory,diagram.file),'utf8');
      const call=diagram.kind==='svg'?`window.drawSvg(${JSON.stringify(source)})`:`window.draw(${JSON.stringify('assignment1-'+id)},${JSON.stringify(source)})`;
      const result=await win.webContents.executeJavaScript(call);
      if(!result.text||result.svg.includes('Syntax error in text')||!Number.isFinite(result.width)||result.width>6000||result.height>9000)throw new Error(`Invalid render: ${id}`);
      fs.writeFileSync(path.join(directory,diagram.image+'.svg'),result.svg);
      win.setContentSize(result.width,result.height);
      await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
      const png=(await win.webContents.capturePage({x:0,y:0,width:result.width,height:result.height})).toPNG();
      fs.writeFileSync(path.join(directory,diagram.image+'.png'),png);
      if(diagram.kind==='svg'&&result.overflowText.length)console.log('원본 텍스트 경계 확인: '+id+' '+JSON.stringify(result.overflowText));
      results.push({id,textOutsideViewBox:diagram.kind==='svg'?result.overflowText.length:0,sourceFile:diagram.file,kind:diagram.kind,basis:diagram.basis,width:result.width,height:result.height,sourceSha256:sha256(source),svgSha256:sha256(result.svg),pngSha256:sha256(png)});
      console.log(`${id}: ${result.width} × ${result.height}`);
    }
    writeHtml(directory);
    fs.writeFileSync(path.join(directory,'검증자료/그림해시.json'),JSON.stringify({renderer:'Mermaid 12 / Electron '+process.versions.electron,diagrams:results},null,2)+'\n');
    console.log('과제 1 그림 및 6개 Markdown 기반 HTML 생성 완료');
  }catch(error){console.error(error.stack);process.exitCode=1;}
  finally{win?.destroy();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));app.exit(process.exitCode||0);}
}
render();
