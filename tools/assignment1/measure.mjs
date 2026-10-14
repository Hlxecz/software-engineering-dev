// 개정 전후의 일반 설명 분량을 같은 기준으로 비교한다.
// 실행: node tools/assignment1/measure.mjs <이전 README 경로>
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256,readSections,sourceDigest} from './html.mjs';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../docs/assignment/과제1-프로젝트관리');
const oldFile=process.argv[2];
if(!oldFile)throw new Error('비교할 이전 README 경로를 지정하세요.');
const sections=readSections(directory);
export function prose(markdown){
  const text=markdown.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm,'').replace(/<!--[\s\S]*?-->/g,'').split('\n').filter(line=>!/^\s*(?:#{1,6}\s|\||!\[)/.test(line)).map(line=>line.replace(/\[[^\]]*\]\([^)]+\)/g,'').replace(/<[^>]*>/g,'').replace(/[`*]/g,'')).map(line=>/[\p{L}\p{N}]/u.test(line)?line:'').join('\n');
  const paragraphs=text.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  return {paragraphs:paragraphs.length,charactersWithoutWhitespace:paragraphs.join('').replace(/\s/g,'').length};
}
const old=fs.readFileSync(oldFile,'utf8'),before=prose(old),after=prose(sections.map(s=>s.markdown).join('\n\n'));
const result={checkedAt:new Date().toISOString(),criterion:'코드블록·HTML주석·표행·제목·그림행 제거, Markdown 링크(문구 포함)·HTML태그·서식기호 제거 후 남은 서술 문단과 공백 제외 문자 수. 총파일줄수나 기능 수를 평가하지 않음.',before:{file:oldFile,sha256:sha256(old),...before},after:{files:sections.map(s=>s.file),sourceSha256:sourceDigest(sections),...after},characterReductionPercent:Number(((1-after.charactersWithoutWhitespace/before.charactersWithoutWhitespace)*100).toFixed(1))};
fs.writeFileSync(path.join(directory,'검증자료/설명분량비교.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
