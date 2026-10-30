// 최신 설계 그림만 생성한다. 기존 과제 제출본과 49개 그림은 건드리지 않는다.
import {app,BrowserWindow} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
const project=path.resolve(import.meta.dirname,'../..');
const folder=path.join(project,'docs/assignment/windows-v0.11.1');
const modules=path.join(project,'tools/diagrams/node_modules');
const runtime=path.join(project,'.runtime/windows-upgrade-20261030');
fs.mkdirSync(runtime,{recursive:true});fs.mkdirSync(path.join(folder,'images'),{recursive:true});
app.setPath('userData',path.join(runtime,'diagram-session'));app.disableHardwareAcceleration();
const sha=value=>createHash('sha256').update(value).digest('hex');
const page=`<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:12px;background:white;font-family:'Malgun Gothic'}svg{display:block;max-width:none!important}</style><div id="stage"></div><script type="module">import mermaid from '/modules/mermaid/dist/mermaid.esm.min.mjs';mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'base',fontFamily:'Malgun Gothic',themeVariables:{primaryColor:'#eef4ff',primaryTextColor:'#163250',primaryBorderColor:'#55769b',lineColor:'#53677d'},flowchart:{htmlLabels:false,useMaxWidth:false},class:{useMaxWidth:false},sequence:{useMaxWidth:false,wrap:true}});window.draw=async(id,code)=>{const result=await mermaid.render(id,code);document.querySelector('#stage').innerHTML=result.svg;await document.fonts.ready;const svg=document.querySelector('svg'),box=svg.viewBox.baseVal;svg.setAttribute('width',Math.ceil(box.width));svg.setAttribute('height',Math.ceil(box.height));return {width:Math.ceil(box.width+24),height:Math.ceil(box.height+24),svg:new XMLSerializer().serializeToString(svg)}};window.ready=true;</script>`;
const server=http.createServer((req,res)=>{
 if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page);return}
 const pathname=new URL(req.url,'http://localhost').pathname;
 const filename=path.resolve(modules,decodeURIComponent(pathname).slice('/modules/'.length));
 if(!pathname.startsWith('/modules/')||!filename.startsWith(modules+path.sep)||!fs.existsSync(filename)){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(filename));
});
async function run(){
 let win;
 try{
  await app.whenReady();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  win=new BrowserWindow({show:false,width:2200,height:2600,webPreferences:{contextIsolation:true,sandbox:true}});
  await win.loadURL('http://127.0.0.1:'+server.address().port);
  for(let n=0;n<100&&!await win.webContents.executeJavaScript('window.ready===true');n++)await new Promise(r=>setTimeout(r,100));
  const diagrams=[];
  for(const filename of fs.readdirSync(path.join(folder,'sources')).filter(f=>f.endsWith('.mmd')).sort()){
   const id=path.basename(filename,'.mmd'),code=fs.readFileSync(path.join(folder,'sources',filename),'utf8');
   const result=await win.webContents.executeJavaScript(`window.draw(${JSON.stringify(id)},${JSON.stringify(code)})`);
   if(result.width>3500||result.height>6000)throw Error('그림을 나눠야 합니다: '+id);
   win.setContentSize(result.width,result.height);await new Promise(r=>setTimeout(r,100));
   const png=(await win.webContents.capturePage()).toPNG();
   fs.writeFileSync(path.join(folder,'images',id+'.svg'),result.svg);fs.writeFileSync(path.join(folder,'images',id+'.png'),png);
   diagrams.push({id,width:result.width,height:result.height,sourceSha256:sha(code),svgSha256:sha(result.svg),pngSha256:sha(png)});
  }
  fs.writeFileSync(path.join(folder,'diagram-manifest.json'),JSON.stringify({generator:'Mermaid 12 / Electron',diagrams},null,2)+'\n');
  console.log(JSON.stringify({rendered:diagrams.length,diagrams:diagrams.map(({id,width,height})=>({id,width,height}))}));
 }catch(error){console.error(error);process.exitCode=1}
 finally{win?.destroy();server.close();app.exit(process.exitCode||0)}
}
run();
