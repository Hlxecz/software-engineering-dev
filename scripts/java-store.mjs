import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { javaTool, javaBackendRoot } from './java/runtime.mjs';

/** 기존 동기 저장 API와 Java 사이의 유일한 연결 지점. JS 저장 대체 경로는 없다. */
// 학습 3: 화면의 HTTP 요청을 Java가 이해할 JSON 요청으로 바꾸는 연결부다.
// root=자료 위치, operation=작업 이름, parameters=글 ID나 저장할 값이다.
export function javaStore(root, operation, parameters = {}) {
  const backend = javaBackendRoot();
  const jar = path.join(backend, 'build/blog-storage.jar');
  if (!fs.existsSync(jar)) throw Object.assign(new Error('Java 저장 모듈이 없습니다. npm.cmd run java:build를 실행해 주세요.'), { status: 503 });
  // java -cp는 저장 JAR와 Gson을 함께 읽고 Main 클래스를 시작하라는 명령이다.
  // spawnSync는 Java가 끝날 때까지 Node를 기다리게 한다. 요청마다 JVM 시작 비용이 생기는 이유다.
  // input은 Java의 System.in으로 전달되고 result.stdout은 Java의 System.out 출력이다.
  const result = spawnSync(javaTool('java'), ['-Dfile.encoding=UTF-8', '-Dstdout.encoding=UTF-8', '-Dstderr.encoding=UTF-8', '-cp',
    [jar, path.join(backend, 'lib/gson-2.13.2.jar')].join(path.delimiter), 'com.hdev.assignment.bridge.Main'], {
    input: JSON.stringify({ root: path.resolve(root), operation, ...parameters }), encoding: 'utf8',
    windowsHide: true, timeout: 30000, maxBuffer: 48 * 1024 * 1024
  });
  if (result.error || result.status !== 0) throw Object.assign(new Error(`Java 저장 모듈을 실행하지 못했습니다. JDK 17 이상과 JAVA_HOME을 확인해 주세요. ${result.error?.code || result.stderr?.trim() || ''}`), { status: 503 });
  let response;
  try { response = JSON.parse(result.stdout); }
  catch { throw Object.assign(new Error('Java 저장 모듈의 응답을 읽지 못했습니다.'), { status: 503 }); }
  // 프로세스 실행 성공과 저장 작업 성공은 다르다. Java의 ok=false도 앱 오류로 전달해야 한다.
  if (!response.ok) throw Object.assign(new Error(response.error), { status: response.status || 500 });
  return response.result;
}
