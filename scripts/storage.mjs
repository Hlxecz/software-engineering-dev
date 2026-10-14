import { javaStore } from './java-store.mjs';

// 화면의 용량 표시와 글 삭제를 같은 Java 검사 경로로 연결한다. 원격 티스토리 글 삭제가 아니다.
export const jobStorage = (root, bases, id) => javaStore(root, 'storage.inspect', { bases, id });
export const deleteJobStorage = (root, bases, id) => javaStore(root, 'storage.delete', { bases, id }).bytes;
