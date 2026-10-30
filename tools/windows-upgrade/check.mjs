// 현재 설계와 실제 코드의 대응, 과거 제출 자료의 바이트 보존을 함께 검사한다.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..');
const directory=path.join(root,'docs/assignment/windows-v0.11.1');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const java=walk(path.join(root,'java-backend/src/main/java')).filter(f=>f.endsWith('.java'));
const declarations=java.flatMap(f=>[...fs.readFileSync(f,'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"/g,'').matchAll(/\b(class|interface|enum|record)\s+(\w+)/g)].map(m=>({kind:m[1],name:m[2]})));
assert.equal(declarations.length,19);assert.ok(declarations.length<=30);
assert.equal(declarations.filter(d=>d.kind==='interface').length,2);
const classSource=fs.readFileSync(path.join(directory,'sources/classes.mmd'),'utf8');
assert.deepEqual([...classSource.matchAll(/^class (\w+)/gm)].map(m=>m[1]).sort(),declarations.map(d=>d.name).sort());
const manifest=JSON.parse(fs.readFileSync(path.join(directory,'diagram-manifest.json'),'utf8'));
for(const d of manifest.diagrams){
 assert.equal(sha(fs.readFileSync(path.join(directory,'sources',d.id+'.mmd'))),d.sourceSha256,d.id);
 assert.equal(sha(fs.readFileSync(path.join(directory,'images',d.id+'.svg'))),d.svgSha256,d.id);
 assert.equal(sha(fs.readFileSync(path.join(directory,'images',d.id+'.png'))),d.pngSha256,d.id);
}
const archive=JSON.parse(fs.readFileSync(path.join(directory,'archive-hashes.json'),'utf8'));
for(const item of archive.files)assert.equal(sha(fs.readFileSync(path.join(root,item.path))),item.sha256,'과거 자료 변경: '+item.path);
let links=0;
// upstream 원문은 원본 저장소의 디렉터리를 기준으로 쓴 자료이므로 로컬 링크 검사에서 구분한다.
for(const file of [path.join(root,'README.md'),path.join(root,'java-backend/README.md'),...walk(path.join(root,'docs')).filter(f=>f.endsWith('.md')&&!f.startsWith(path.join(root,'docs/upstream')+path.sep))]){
 const text=fs.readFileSync(file,'utf8').replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm,'');
 for(const [,url] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
  if(/^(?:[a-z]+:|#)/i.test(url))continue;
  const relative=decodeURIComponent(url.replace(/^<|>$/g,'').split('#')[0]);
  assert.ok(fs.existsSync(path.resolve(path.dirname(file),relative)),`${path.relative(root,file)}: ${url}`);links++;
 }
}
const result={version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,javaDeclarations:declarations.length,classes:17,interfaces:2,diagrams:manifest.diagrams.length,archivedFilesUnchanged:archive.files.length,localLinks:links,actualAppRun:false};
fs.mkdirSync(path.join(root,'.runtime/windows-upgrade-20261030'),{recursive:true});
fs.writeFileSync(path.join(root,'.runtime/windows-upgrade-20261030/document-check.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
