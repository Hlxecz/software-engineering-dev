import path from 'node:path';
import os from 'node:os';
import { initializeData } from '../desktop/data.mjs';
import { projectRoot } from './java/runtime.mjs';

// 개발/웹은 Java Dev, 배포 EXE는 Java 전용 자료 폴더를 고른다.
// 전용 환경 변수 HDEV_JAVA_DATA_DIR을 주면 그 폴더를 사용한다. 원본 앱 폴더는 거부한다.
export function assignmentDataRoot({ packaged = false, appData = process.env.APPDATA || path.join(os.homedir(), '.config') } = {}) {
  const root = path.resolve(process.env.HDEV_JAVA_DATA_DIR || path.join(appData, packaged ? 'H.Dev Studio Java' : 'H.Dev Studio Java Dev', 'workspace'));
  // A pre-existing environment variable for the original app must not redirect this app.
  const originalRoots = ['H.Dev Studio', 'H.Dev Studio Dev'].map(name => path.resolve(appData, name).toLowerCase());
  if (originalRoots.some(base => root.toLowerCase() === base || root.toLowerCase().startsWith(base + path.sep))) {
    throw new Error('원본 앱 자료 폴더는 사용할 수 없습니다. HDEV_JAVA_DATA_DIR을 별도 복사본으로 지정해 주세요.');
  }
  return root;
}
export const initializeAssignment = options => initializeData(assignmentDataRoot(options), projectRoot);
