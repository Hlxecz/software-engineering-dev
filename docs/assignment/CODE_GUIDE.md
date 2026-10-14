# 내 프로젝트 코드 따라 읽기

이 문서는 **“버튼을 눌렀는데 누가 어떤 파일을 저장하는가?”**를 기준으로 프로젝트를 설명합니다. 현재 기준은 `0.7.4-java.1`입니다. 2026-09-22에 학습용 주석을 추가했으며 실행 로직은 바꾸지 않았습니다.

먼저 [프로젝트 README](../../README.md)의 전체 그림을 읽고, 아래 순서대로 코드를 열어 보세요. 함수 이름은 편집기의 검색 기능으로 찾으면 됩니다.

그림과 함께 읽으려면 [다이어그램 모음](diagrams/README.md)을 열어 두세요. 특히 [초안 보관 시퀀스](diagrams/images/seq-09.svg)는 아래 `학습 1~6`과 같은 흐름입니다.

## 1. HTML·CSS·JavaScript·Java가 각각 하는 일

| 기술 | 역할 | 예 |
|---|---|---|
| HTML | 화면에 무엇이 있는지 정의 | 제목 입력창, 저장 버튼 |
| CSS | 크기·색·배치 결정 | 좌측 메뉴, 두 칸 작업실, 작은 화면 대응 |
| 브라우저 JavaScript | 클릭·입력 처리, 화면 갱신, 서버 요청 | 보관 버튼을 눌러 `saveAll()` 실행 |
| Node.js | JavaScript로 로컬 서버와 외부 프로그램 실행 | 요청을 받고 Java·AI CLI 호출 |
| Electron | 웹 화면을 Windows 앱 창 안에서 실행 | 메뉴·티스토리 로그인 창 열기 |
| Java | 로컬 저장 규칙과 파일 관리 | 초안 이력 보관, 사진 검사, 지침 충돌 확인 |

`.js`와 `.mjs`는 모두 JavaScript입니다. 이 프로젝트의 `.mjs`는 `import`·`export`를 쓰는 모듈 파일입니다. `.java`는 별개의 언어인 Java 소스입니다.

[index.html](../../web/index.html)의 `id="save-all"`은 요소를 찾기 위한 이름입니다. [app.js](../../web/app.js)의 `$()`는 `document.getElementById()`를 짧게 감싼 함수여서 `$('save-all')`로 같은 버튼을 찾습니다. `class` 속성은 주로 [styles.css](../../web/styles.css)의 모양 규칙과 연결됩니다.

## 2. 실행 버튼을 누르면 어디부터 시작하나

`Start-Desktop.cmd`는 의존성을 확인한 뒤 `npm run setup`, `npm run desktop`을 실행합니다. npm 명령은 [package.json](../../package.json)의 `scripts`에 정의되어 있습니다.

```text
npm run desktop
  → predesktop: Java 빌드 확인
  → electron .
  → package.json의 main: desktop/main.mjs
  → Electron 준비 완료(app.whenReady)
  → 전용 자료 폴더 준비
  → createApp()으로 Node HTTP 서버 생성
  → 사용 가능한 로컬 포트 열기
  → BrowserWindow에 그 주소 표시
  → index.html이 app.js 로드
  → boot()가 설정·글 목록·마지막 작업 불러오기
```

`npm start`는 Electron 창 없이 웹 모드 서버를 실행합니다. 기본 주소는 `http://127.0.0.1:4174`입니다. 웹 모드에도 Java 저장 기능은 있고, 티스토리의 로그인된 창 읽기와 직접 발행은 Electron 모드 기능입니다.

Java 빌드는 [build.mjs](../../scripts/java/build.mjs)가 담당합니다. `javac`가 Java 소스를 실행 가능한 클래스 파일로 컴파일하고, `jar`가 그 파일들을 `blog-storage.jar` 하나로 묶습니다. Gson은 JSON을 읽고 쓰는 외부 라이브러리입니다.

## 3. 저장 버튼 한 번을 끝까지 따라가기

### ① 화면: saveAll()

[web/app.js](../../web/app.js)에서 `saveAll()`을 찾습니다. `current`는 현재 글 정보이고 `draft`는 편집 중인 초안입니다. `materialDirty`, `draftDirty`는 아직 저장하지 않은 변경이 있는지 나타냅니다.

먼저 `saveMaterial()`이 제목·메모·사진 순서 같은 재료를 저장합니다. 수정한 초안이 있으면 다음과 같이 요청합니다. 아래는 실제 코드의 핵심 부분입니다.

```js
draftSave = api(`/api/jobs/${current.id}/draft`, {
  method: 'PUT',
  json: { draft, review: $('review-notes').value }
});
current = await draftSave;
```

`api()`는 내부에서 `fetch()`로 Node 서버에 요청합니다. `await`는 요청 결과가 올 때까지 해당 비동기 함수의 다음 단계를 기다립니다. `PUT`은 여기서 “이 글의 초안을 저장해 달라”는 요청 방식입니다.

### ② Node 서버: persistDraft()

[scripts/server.mjs](../../scripts/server.mjs)에서 `action === 'draft'`를 찾습니다. 서버는 요청 본문을 읽고 현재 글을 수정할 수 있는지 확인합니다. 처음 보관할 때는 `prepare()`가 Java를 통해 입력 사본을 준비합니다.

`persistDraft()`는 본문 블록·표지·GitHub 카드 등을 확인하고 `javaStore(root, 'draft.save', ...)`를 호출합니다. 잘못된 초안을 먼저 저장한 후 검사하는 순서가 아닙니다.

### ③ 연결부: javaStore()

[scripts/java-store.mjs](../../scripts/java-store.mjs)는 Java를 실행합니다. `root`는 자료 폴더, `operation`은 작업 이름, 나머지는 필요한 값입니다. 전달 모양은 다음과 같습니다. `...` 부분은 설명을 위해 생략했습니다.

```text
{
  "root": "C:/.../H.Dev Studio Java Dev/workspace",
  "operation": "draft.save",
  "id": "현재 글 ID",
  "value": {
    "directory": "초안을 보관할 입력 사본 폴더",
    "draft": { "title": "글 제목", "tags": [...], "blocks": [...] },
    "manifest": { ... },
    "usedImages": [...],
    "review": "검토 메모"
  }
}
```

`JSON.stringify()`가 이 객체를 문자열로 바꾸고 Java의 **표준 입력(stdin)**으로 보냅니다. 두 프로그램 사이에 데이터를 전달하는 통로입니다. Java 쪽에서 별도 HTTP 포트를 열지는 않습니다.

현재는 `spawnSync()`로 요청마다 Java 프로세스를 새로 실행합니다. Java 작업이 끝날 때까지 Node 실행이 기다립니다. 이전에 설명한 JVM 시작 비용이 여기서 생깁니다.

### ④ Java 입구: Main

[Main.java](../../java-backend/src/main/java/com/hdev/assignment/bridge/Main.java)의 `main()`이 `System.in`에서 요청을 읽습니다. Gson으로 JSON을 해석한 뒤 자료 폴더를 나타내는 `Workspace`를 만듭니다.

`dispatch()` 안의 `switch`는 작업 이름별로 담당 클래스를 고르는 분기입니다.

```java
case "draft.save" -> new DraftRepository(workspace, jobs).save(id, value);
```

`new DraftRepository(...)`는 저장 담당 객체를 만드는 것이고, `.save(...)`는 그 객체의 저장 메서드를 실행하는 것입니다. `Main`이 모든 저장 규칙을 직접 처리하지 않고 책임을 나눈 구조입니다.

### ⑤ 저장 담당: DraftRepository

[DraftRepository.java](../../java-backend/src/main/java/com/hdev/assignment/post/DraftRepository.java)는 다음 순서로 처리합니다.

1. 저장 경로·글 ID·초안의 기본 모양·카테고리를 확인합니다.
2. 사용하는 사진의 내용 지문(해시)이 저장 당시 정보와 같은지 확인합니다.
3. 별도 표지가 있으면 입력 사본 폴더로 복사합니다.
4. 기존 초안이 있으면 이전 초안·참고자료·적용 지침 JSON을 `history`에 보관합니다.
5. 새 `draft.json`, 검토 메모와 전달된 추가 정보를 저장합니다.
6. `JobRepository.saveMeta()`로 `app.json`에 현재 초안 위치를 연결합니다.

### ⑥ 파일 쓰기와 결과 반환

[JsonFiles.java](../../java-backend/src/main/java/com/hdev/assignment/common/JsonFiles.java)의 `write()` → `writeText()`가 실제 파일을 기록합니다. 임시 파일을 먼저 만든 후 목적 파일로 교체합니다. 하나의 파일을 교체하는 보호이며, 여러 파일 전체를 한꺼번에 되돌리는 DB 트랜잭션은 아닙니다.

Java `Main`은 성공 시 `{ "ok": true, "result": ... }`, 실패 시 `{ "ok": false, "status": ..., "error": ... }`를 표준 출력(stdout)으로 보냅니다. Node가 이를 읽습니다.

성공한 경우 Node가 미리보기 HTML을 만들고 저장된 글을 다시 읽어 화면에 반환합니다. 화면은 응답을 받은 뒤 “보관됨”을 표시합니다. **Java의 stdout에 임의의 출력 문구를 추가하면 JSON 해석이 깨질 수 있습니다.** 디버깅 출력은 `System.err.println()`을 사용하세요.

## 4. Java 클래스 11개를 한눈에 보기

여기서 `Repository`는 자료를 보관하고 읽는 담당, `Service`는 검증·선택·여러 단계 처리를 묶은 담당이라는 이름입니다. 이름 자체가 Java의 특별한 문법은 아닙니다.

| 패키지·클래스 | 맡은 일 | 먼저 읽을 메서드 |
|---|---|---|
| [bridge/Main](../../java-backend/src/main/java/com/hdev/assignment/bridge/Main.java) | 요청 해석·담당 선택·응답 | `main`, `dispatch` |
| [workspace/Workspace](../../java-backend/src/main/java/com/hdev/assignment/workspace/Workspace.java) | 자료 위치·경로 검사·복사한 자료 연결 | `safe`, `savedDirectory` |
| [common/JsonFiles](../../java-backend/src/main/java/com/hdev/assignment/common/JsonFiles.java) | 공통 JSON·파일 쓰기·해시 | `obj`, `writeText`, `sha` |
| [common/AppException](../../java-backend/src/main/java/com/hdev/assignment/common/AppException.java) | 사용자 오류와 상태 코드 | `require` |
| [post/JobRepository](../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java) | 글 재료·사진·메타데이터 | `create`, `save`, `read`, `upload`, `readImage` |
| [post/SnapshotService](../../java-backend/src/main/java/com/hdev/assignment/post/SnapshotService.java) | 입력 사본 생성·동일 입력 재사용 | `input`, `ready`, `prepare` |
| [post/DraftRepository](../../java-backend/src/main/java/com/hdev/assignment/post/DraftRepository.java) | 초안·편집 이력·표지 보관 | `save` |
| [post/StorageService](../../java-backend/src/main/java/com/hdev/assignment/post/StorageService.java) | 용량 계산·글 전체 삭제 | `inspect` |
| [category/CategoryService](../../java-backend/src/main/java/com/hdev/assignment/category/CategoryService.java) | 분류 검증·목록 캐시 | `normalize`, `state`, `save` |
| [prompt/PromptService](../../java-backend/src/main/java/com/hdev/assignment/prompt/PromptService.java) | 분류별 지침·충돌·적용 지침 선택 | `state`, `save`, `resolve` |
| [prompt/StyleService](../../java-backend/src/main/java/com/hdev/assignment/prompt/StyleService.java) | 기본 지침·이력·분석 기록 | `state`, `save` |

전체 화살표 관계는 [클래스 관계도](ARCHITECTURE.md)에 있습니다. 중요한 연결은 `Main → 저장 담당 → Workspace/JsonFiles`입니다. `SnapshotService`, `DraftRepository`는 글 정보 관리가 필요하므로 `JobRepository`도 사용합니다.

## 5. 코드에서 자주 나오는 Java 문법

| 표현 | 읽는 방법 |
|---|---|
| `package com.hdev.assignment.post;` | 이 클래스가 속한 묶음. 실제 폴더 구조와 맞춰 둠 |
| `import ...` | 다른 클래스 이름을 짧게 쓰기 위한 선언 |
| `import static ...JsonFiles.*;` | `JsonFiles.write()` 대신 `write()`처럼 공통 정적 함수를 호출 |
| `private final Workspace workspace;` | 클래스 내부에서 쓰는 자료 위치 객체의 참조. 생성 뒤 다른 객체로 교체하지 않음 |
| 생성자 `JobRepository(Workspace workspace)` | 객체가 처음 만들어질 때 필요한 Workspace를 받음 |
| `public` / `private` | 다른 클래스에서 사용할 수 있음 / 이 클래스 안에서만 사용 |
| `static` | 객체를 새로 만들지 않고 클래스의 기능으로 호출 |
| `JsonObject` / `JsonArray` | Gson의 JSON 객체 / JSON 배열. 각각 `{...}` / `[...]`에 대응 |
| `Path` / `Files` | 파일 경로 값 / 파일을 읽고 쓰는 Java 표준 기능 |
| `throws IOException` | 파일 접근 중 실패가 생길 수 있고 호출한 쪽에서 처리하도록 전달 |
| `try (...)` | 블록을 벗어날 때 파일 채널·잠금 같은 자원을 자동으로 닫음 |
| `require(조건, 메시지)` | 이 프로젝트가 만든 함수. 조건이 거짓이면 오류를 던져 현재 작업 중단 |

`final` 참조라도 그 객체 안의 데이터가 모두 변경 불가능해지는 것은 아닙니다. 그리고 `JsonObject`를 쓴 이유는 기존 JSON 형식과 추가 필드를 유지하기 위해서입니다. 글의 모든 항목마다 별도 Java 모델 클래스를 만든 구조는 아닙니다.

## 6. 저장 폴더를 보면 프로그램이 보인다

기본 개발 자료는 `%APPDATA%/H.Dev Studio Java Dev/workspace`, EXE 자료는 `%APPDATA%/H.Dev Studio Java/workspace`입니다. 이 위치는 [scripts/workspace.mjs](../../scripts/workspace.mjs)가 결정합니다.

```text
workspace/
├─ tistory.config.json            발행 대상·자료 하위 경로 설정
├─ inbox/글ID/
│  ├─ app.json                    제목·수정 시각·연결된 초안 위치
│  ├─ notes.md                    사용자가 적은 메모
│  ├─ order.json                  사용할 사진과 순서
│  └─ images/                     원본 사진·별도 표지
├─ drafts/글ID/입력해시/
│  ├─ manifest.json               입력 사진 이름·크기·해시 등의 목록
│  ├─ images/                     입력 사진 사본
│  ├─ draft.json                  편집한 제목·태그·본문 블록
│  ├─ writing-context.json        AI 생성에 실제 적용한 지침(있는 경우)
│  ├─ preview.html                JS가 만든 미리보기 결과
│  └─ history/                    이전 초안과 관련 JSON 이력
├─ library/categories.json        현재 블로그의 카테고리 캐시
└─ style/
   ├─ profile.md                 기본 글쓰기 지침
   ├─ category-prompts.json       여러 블로그의 분류별 지침
   └─ history/                   기본 지침의 이전 내용
```

입력 해시는 사진 내용·순서·메모·참고자료로 계산한 지문입니다. 같은 입력이면 같은 폴더를 재사용하되 보관된 사본도 확인합니다. 본문만 편집하면 같은 입력 폴더 안의 `draft.json`과 `history`를 갱신합니다.

사진을 화면 목록에서 제외하는 것은 `order.json`을 바꾸는 일입니다. 사진 원본은 남습니다. 글 전체 삭제는 해당 ID의 `inbox`와 `drafts`를 함께 지우며 티스토리의 공개 글을 삭제하지 않습니다.

## 7. 저장 외의 기능도 연결해 보기

| 사용자가 하는 일 | 코드 흐름과 책임 |
|---|---|
| 사진 업로드 | `app.js → server.mjs → javaStore(job.upload) → JobRepository`가 파일 보관 |
| 사진 미리보기 | 서버의 이미지 주소 요청 → Java `readImage()` → Base64를 Node가 바이트로 바꿔 전달 |
| 카테고리 불러오기 | Electron이 글 관리 화면에서 목록 읽기 → Java `CategoryService` 검증·보관 |
| 분류별 지침 저장 | 화면 → `writing-prompts.mjs` → Java `PromptService.save()` |
| 기본 지침 수정 | 화면 → `style.mjs` → Java `StyleService.save()` |
| AI 초안 만들기 | 서버에서 입력 사본·지침 준비 → `generate.mjs → ai.mjs`의 CLI → 초안 검증 → Java 저장 |
| 로그인·블로그 선택 | `desktop/account.mjs`로 계정 목록 읽기 → 서버에서 선택한 주소 반영 |
| 티스토리에 발행 | 저장된 초안 확인 → `publication.mjs`로 발행 사본·상태 관리 → `desktop/publish.mjs`로 편집기 조작·공개 확인 |

Java는 AI 생성이나 티스토리 발행을 직접 하지 않습니다. 공개 글 목록 캐시, 발행 사본·영수증, HTML 렌더링도 JS에 남아 있습니다. 그래서 “모든 파일을 Java만 쓴다”라고 설명하면 정확하지 않습니다.

분류별 지침은 **블로그 주소 + 분류 번호 + 전체 경로**가 맞아야 적용됩니다. 같은 이름의 `Java` 분류라도 다른 블로그의 지침이 섞이지 않습니다. 카테고리 목록 캐시는 현재 블로그 하나를 담지만, 분류별 지침 파일에는 여러 블로그의 지침을 함께 보존합니다.

`revision`은 지침 내용의 지문입니다. 화면이 받은 값과 저장 시점의 값이 다르면 누군가 먼저 수정한 것이므로 덮어쓰지 않고 충돌을 알립니다. Java 파일 잠금은 같은 자료 폴더의 Java 요청들이 동시에 파일을 바꾸지 않도록 합니다. JS의 모든 작업까지 하나의 거래로 묶는 기능은 아닙니다.

## 8. 내 손으로 확인하는 학습 순서

처음 설치·Java 빌드는 [Windows 실행 안내](RUN.md)를 따릅니다. 본인 자료와 섞지 않도록 새 시연 폴더를 지정합니다.

```powershell
$env:HDEV_JAVA_DATA_DIR = 'C:\JavaBlogData\learning'
npm.cmd run setup
npm.cmd run desktop
```

1. 첫 티스토리 연결 창을 닫고 로컬 글 작성부터 시작합니다.
2. 테스트 사진 한 장과 제목·메모를 넣고 **직접 작성하기**를 누릅니다.
3. 문단을 편집하고 **초안 보관** 후 보관함에서 다시 엽니다.
4. **작업실 → 자료 폴더 열기**로 `app.json`, `draft.json`을 찾아 화면 내용과 비교합니다.
5. 본문을 한 번 더 고쳐 보관하고 `history`에 이전 초안이 남는지 봅니다.
6. 기본 글쓰기 지침을 저장하고 `style/profile.md`를 확인합니다.
7. 마지막으로 시연용 글을 삭제하고 이 글의 폴더가 사라지는지 확인합니다. 삭제는 휴지통을 거치지 않습니다.

학습용 환경 변수는 현재 터미널과 그 터미널에서 실행한 앱에 적용됩니다. 평소 자료 위치로 돌아가려면 앱을 종료하고 새 터미널에서 실행하거나 `Remove-Item Env:HDEV_JAVA_DATA_DIR`로 이 변수만 해제합니다.

`npm.cmd run test:java`는 실제 Java와 임시 자료를 사용해 연결·호환·삭제·충돌·블로그 변경을 검사합니다. 검사를 위해 실제 AI 생성을 하거나 티스토리에 글을 게시하지 않습니다.

## 9. 이 질문에 답하면 핵심을 이해한 것

| 질문 | 확인할 답 |
|---|---|
| 보관 버튼은 어느 파일부터 따라가나? | `web/app.js`의 `saveAll()` |
| Node가 Java에 할 일을 어떻게 알려 주나? | `javaStore()`가 operation과 값을 JSON으로 표준 입력에 전달 |
| 실제 초안 저장 클래스는? | `DraftRepository`. 공통 파일 쓰기는 `JsonFiles` |
| JobRepository와 DraftRepository가 왜 둘인가? | 작업 재료·글 정보와 편집한 초안·이력의 책임을 나눴기 때문 |
| 같은 입력을 다시 준비하면? | 입력 해시와 사본을 확인하고 같은 스냅샷 재사용 |
| Java가 없으면 JS로 대신 저장하나? | 아니요. 실행 실패를 API 오류로 전달 |
| Java를 넣어서 무조건 빨라졌나? | 아니요. 현재는 요청마다 JVM을 시작하므로 비용이 추가됨 |
| 발표에서 Java의 기여를 어떻게 설명하나? | 글·사진·초안·이력·분류·지침을 실제로 보관하고 저장 규칙을 검증함 |

발표용 짧은 설명은 [PRESENTATION.md](PRESENTATION.md), 상세 관계도는 [ARCHITECTURE.md](ARCHITECTURE.md), 전체 앱 사용법은 [USAGE.md](../USAGE.md)에 있습니다.
