import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const report = path.join(root, 'docs/assignment/과제1-프로젝트관리');
const read = file => fs.readFileSync(file, 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const stages = fs.readdirSync(report).filter(name => /^\d\d-.*\.md$/.test(name)).sort();
assert.equal(stages.length, 7, '목차와 6단계 문서가 필요합니다.');
assert.deepEqual(stages.map(name => name.slice(0, 2)), ['00', '01', '02', '03', '04', '05', '06']);
assert.equal(read(path.join(report, '통합보고서.md')),
  stages.map(name => read(path.join(report, name))).join('\n\n---\n\n'), '통합본을 단계별 문서와 맞춰 주세요.');

const java = walk(path.join(root, 'java-backend/src/main/java')).filter(file => file.endsWith('.java'));
const declarations = java.flatMap(file => [...read(file)
  .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"/g, '')
  .matchAll(/\b(class|interface|enum|record)\s+(\w+)/g)].map(match => ({ kind: match[1], name: match[2] })));
assert.equal(declarations.length, 19);
assert.equal(declarations.filter(item => item.kind === 'interface').length, 2);
assert.deepEqual([...read(path.join(report, '다이어그램/02-02.mmd')).matchAll(/^class (\w+)/gm)]
  .map(match => match[1]).sort(), declarations.map(item => item.name).sort(), '클래스 그림과 Java 선언을 맞춰 주세요.');

const plan = JSON.parse(read(path.join(report, '자료/WBS-산정자료.json')));
assert.equal(plan.tasks.length, 24);
assert.equal(plan.tasks.reduce((sum, task) => sum + task.hours, 0), plan.basis_hours);
assert.equal(plan.basis_hours, 200);
assert.equal(plan.reserve_hours, 40);
assert.equal(plan.weeks * plan.weekly_hours, plan.basis_hours + plan.reserve_hours);
const wbs = read(path.join(report, stages[6]));
const taskIds = new Set();
for (const task of plan.tasks) {
  assert.ok(!taskIds.has(task.id), `WBS 중복: ${task.id}`);
  if (taskIds.size) assert.ok(taskIds.has(task.depends_on), `선행 업무 확인: ${task.id}`);
  taskIds.add(task.id);
  const rows = wbs.split('\n').filter(line => line.startsWith(`| ${task.id} |`));
  assert.equal(rows.length, 1, `WBS 행 확인: ${task.id}`);
  assert.ok(rows[0].includes(`| ${task.hours} h |`), `WBS 시간 확인: ${task.id}`);
}

const html = read(path.join(report, '통합보고서-미리보기.html'));
let diagrams = 0;
for (const name of stages) {
  let index = 0;
  for (const [, source] of read(path.join(report, name)).matchAll(/```mermaid\n([\s\S]*?)```/g)) {
    const id = `${name.slice(0, 2)}-${String(++index).padStart(2, '0')}`;
    assert.equal(read(path.join(report, '다이어그램', id + '.mmd')), source, `그림 원본 확인: ${id}`);
    diagrams++;
  }
}
const svgs = fs.readdirSync(path.join(report, '다이어그램')).filter(name => name.endsWith('.svg'));
assert.equal(svgs.length, diagrams + 1, '상대 일정표와 Mermaid 그림이 필요합니다.');
for (const name of svgs) {
  const svg = fs.readFileSync(path.join(report, '다이어그램', name));
  assert.match(svg.toString(), /<svg\b/);
  assert.ok(!svg.toString().includes('Syntax error in text'), name);
  assert.ok(html.includes(svg.toString('base64')), `HTML 그림 확인: ${name}`);
}

const documents = ['README.md', 'java-backend/README.md', 'windows/README.md', 'tools/README.md']
  .map(file => path.join(root, file)).concat(walk(path.join(root, 'docs')).filter(file => file.endsWith('.md')));
let links = 0;
for (const file of documents) {
  const text = read(file).replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  for (const [, url] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^(?:[a-z]+:|#)/i.test(url)) continue;
    const target = decodeURIComponent(url.replace(/^<|>$/g, '').split('#')[0]);
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), target)), `${path.relative(root, file)}: ${url}`);
    links++;
  }
}
console.log(`문서 확인 완료: 6단계, Java 선언 ${declarations.length}개, WBS ${plan.tasks.length}개, 그림 ${svgs.length}개, 내부 링크 ${links}개`);
