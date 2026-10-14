import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templates = [
  ['config/tistory.example.json', 'tistory.config.json'],
  ['config/style.example.md', 'style/profile.md'],
  ['config/source-notes.example.md', 'style/samples/source-notes.md']
];

export function setup(root = ROOT) {
  const created = [];
  for (const [source, destination] of templates) {
    const target = path.join(root, destination);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    try {
      fs.copyFileSync(path.join(root, source), target, fs.constants.COPYFILE_EXCL);
      created.push(destination);
    } catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  for (const directory of ['inbox', 'drafts']) fs.mkdirSync(path.join(root, directory), { recursive: true });
  return created;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { initializeAssignment } = await import('./workspace.mjs');
  const root = initializeAssignment();
  console.log(`Java 과제 앱 자료 폴더: ${root}`);
  console.log('전용 자료 폴더를 준비했습니다. 기존 설정은 유지합니다.');
  console.log('tistory.config.json의 blogUrl에 내 블로그 주소를 입력하고 style/profile.md의 말투를 준비하세요.');
}
