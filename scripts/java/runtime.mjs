import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Java 실행 파일을 찾는 순서: java만 전용 HDEV_JAVA_BIN → JAVA_HOME/bin → PATH.
// javac와 jar는 빌드 도구이며 HDEV_JAVA_BIN으로 바뀌지 않는다.
export function javaTool(name) {
  if (name === 'java' && process.env.HDEV_JAVA_BIN) return process.env.HDEV_JAVA_BIN;
  const executable = `${name}${process.platform === 'win32' ? '.exe' : ''}`;
  return process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, 'bin', executable))
    ? path.join(process.env.JAVA_HOME, 'bin', executable) : executable;
}
export function javaBackendRoot() {
  const packaged = process.resourcesPath && path.join(process.resourcesPath, 'java-backend');
  return packaged && fs.existsSync(path.join(packaged, 'build/blog-storage.jar')) ? packaged : path.join(projectRoot, 'java-backend');
}
