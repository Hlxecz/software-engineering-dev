import { javaStore } from './java-store.mjs';

// Browser interaction is asynchronous JS; validation and persistence are Java.
// reader는 Electron이 전달한 목록 읽기 함수다. 외부 화면 읽기는 JS, 목록 검증·저장은 Java로 나눈다.
// busy는 현재 읽기 진행 상태이므로 메모리에 두고, 보관할 목록만 Java에 보낸다.
export function createCategories({ root, blogUrl, reader }) {
  let busy = false;
  const state = () => ({ ...javaStore(root, 'categories.state', { blogUrl }), busy, canRead: !!reader });
  async function refresh() {
    if (!reader) throw Object.assign(new Error('카테고리 불러오기는 데스크톱 앱에서 사용할 수 있어요.'), { status: 409 });
    if (busy) throw Object.assign(new Error('카테고리를 불러오는 중입니다.'), { status: 409 });
    busy = true;
    try { javaStore(root, 'categories.save', { blogUrl, items: await reader({ blogUrl: new URL(blogUrl).origin }) }); }
    catch (error) { throw Object.assign(new Error(error.message), { status: error.status || 400 }); }
    finally { busy = false; }
    return state();
  }
  return { state, refresh, isRunning: () => busy };
}
