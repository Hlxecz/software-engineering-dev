// 계획자료/업무계획.json에서 합계표·하위 업무·일정·관련 그림을 갱신한다.
// 실행: node tools/assignment1/update.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {generatedBlocks, replaceBlock, diagramSources} from './data.mjs';
import {writeHtml} from './html.mjs';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../docs/assignment/과제1-프로젝트관리');
const catalog=JSON.parse(fs.readFileSync(path.join(directory,'계획자료/보고서구성.json'),'utf8'));
const data=JSON.parse(fs.readFileSync(path.join(directory,'계획자료/업무계획.json'),'utf8'));
for(const [file,blocks] of Object.entries(generatedBlocks(data))){
  let markdown=fs.readFileSync(path.join(directory,file),'utf8');
  for(const [name,content] of Object.entries(blocks))markdown=replaceBlock(markdown,name,content);
  fs.writeFileSync(path.join(directory,file),markdown);
}
for(const [name,source] of Object.entries(diagramSources(data)))fs.writeFileSync(path.join(directory,catalog.diagrams.find(d=>d.id===name).file),source);
writeHtml(directory);
console.log('WBS 단일 데이터에서 문서 표·그림 원본·HTML 갱신 완료');
