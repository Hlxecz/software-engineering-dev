// 빌드 순서: 고정된 Gson 파일·해시 확인 → Java 클래스 수 확인 → javac 컴파일 → jar 묶기.
// 소스 지문이 같으면 재빌드를 생략한다. Java 실행에 필요한 결과물은 java-backend/build에 둔다.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { javaTool, projectRoot } from './runtime.mjs';

const root = path.join(projectRoot, 'java-backend');
const lib = path.join(root, 'lib/gson-2.13.2.jar');
const expected = 'dd0ce1b55a3ed2080cb70f9c655850cda86c206862310009dcb5e5c95265a5e0';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
fs.mkdirSync(path.dirname(lib), { recursive: true });
if (!fs.existsSync(lib)) {
  const response = await fetch('https://repo.maven.apache.org/maven2/com/google/code/gson/gson/2.13.2/gson-2.13.2.jar');
  if (!response.ok) throw new Error(`Gson 다운로드 실패: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (digest(bytes) !== expected) throw new Error('Gson 무결성 검사 실패');
  fs.writeFileSync(lib, bytes);
}
if (digest(fs.readFileSync(lib)) !== expected) throw new Error('Gson 파일이 변경되었습니다. java-backend/lib 파일을 확인하세요.');
const sources = fs.readdirSync(path.join(root, 'src/main/java'), { recursive: true }).filter(file => file.endsWith('.java')).sort().map(file => path.join(root, 'src/main/java', file));
const declarations = sources.reduce((count, file) => count + [...fs.readFileSync(file, 'utf8').matchAll(/\b(?:class|interface|record|enum)\s+\w+/g)].length, 0);
if (declarations > 30) throw new Error(`직접 작성한 Java 선언이 ${declarations}개입니다. 과제 제한은 30개입니다.`);
const build = path.join(root, 'build'), jar = path.join(build, 'blog-storage.jar'), stamp = path.join(build, 'source.sha256');
const fingerprint = digest(Buffer.concat([Buffer.from(expected), ...sources.map(file => fs.readFileSync(file))]));
if (fs.existsSync(jar) && fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === fingerprint) {
  console.log(`Java 빌드 최신 상태 (${declarations}개 클래스)`);
} else {
  fs.mkdirSync(path.join(build, 'classes'), { recursive: true });
  for (const [tool, args] of [
    ['javac', ['-encoding', 'UTF-8', '--release', '17', '-cp', lib, '-d', path.join(build, 'classes'), ...sources]],
    ['jar', ['--create', '--file', jar, '-C', path.join(build, 'classes'), '.']]
  ]) {
    const result = spawnSync(javaTool(tool), args, { encoding: 'utf8', windowsHide: true });
    if (result.error || result.status !== 0) throw new Error(`JDK 17 이상이 필요합니다. ${tool}: ${result.error?.message || result.stderr || result.stdout}`);
  }
  fs.writeFileSync(stamp, fingerprint);
  console.log(`Java 빌드 완료 (${declarations}개 클래스): ${jar}`);
}
