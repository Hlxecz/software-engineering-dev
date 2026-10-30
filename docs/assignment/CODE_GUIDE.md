# 코드 따라 읽기 · 최신 Windows 버전

현재 기준: **0.11.1-java.1**. Java와 JavaScript는 서로 다른 언어입니다. 화면·AI·원격 편집은 JS/Electron, 사용자 자료의 보관은 Java가 담당합니다.

## 1. 앱이 시작되는 순서

`Start-Desktop.cmd → windows/Start-App.ps1 → Java 빌드 → Electron desktop/main.mjs → 자료 폴더 준비 → server.mjs → web/app.js`

`package.json`의 `predesktop`은 Java를 빌드하고 `desktop`은 `electron .`을 실행합니다. Java는 HTTP 서버를 따로 열지 않습니다. `scripts/java-store.mjs`가 `Main` 프로세스를 시작해 JSON 한 개를 보내고 응답 JSON을 받습니다.

## 2. 초안 보관을 따라가기

| 순서 | 코드 | 하는 일 |
|---|---|---|
| 1 | [web/app.js](../../web/app.js) `saveAll()` | 화면에서 수정한 글을 저장 요청으로 전송 |
| 2 | [server.mjs](../../scripts/server.mjs) `persistDraft()` | 분류·사진·본문 형식 검증, Java 작업 선택 |
| 3 | [java-store.mjs](../../scripts/java-store.mjs) `javaStore()` | 자료 루트·작업명·값을 JSON으로 전달 |
| 4 | [Main.java](../../java-backend/src/main/java/com/hdev/assignment/bridge/Main.java) | 요청 읽기·자료 잠금·오류 응답 |
| 5 | [RequestDispatcher.java](../../java-backend/src/main/java/com/hdev/assignment/bridge/RequestDispatcher.java) | `draft.save`를 담당 객체에 전달 |
| 6 | [DraftRepository.java](../../java-backend/src/main/java/com/hdev/assignment/post/DraftRepository.java) | 경로·사진 해시 확인, 이력과 새 초안 저장 |
| 7 | Node `renderDraft()`·`readJob()` | JS 미리보기 생성과 저장 결과 재조회 |

입력 사본이 없으면 `SnapshotService`가 먼저 사진·메모를 고정합니다. 직접 작성에는 사진이 없어도 되며, `ready.json`의 `textOnly`로 이를 구분합니다. 사진 기반 AI 초안 생성은 사진이 필요합니다.

## 3. 파일과 값의 이름

| 이름 | 뜻 |
|---|---|
| job | PC에서 작업하는 글 한 개. 티스토리 글 번호와 다름 |
| draft | 제목·태그·본문 블록으로 구성한 편집 자료 |
| manifest | 입력 사본의 사진·해시·경로 정보를 적은 목록 |
| digest | 현재 내용이 같은지 비교하는 SHA-256 지문 |
| snapshot | 특정 시점의 입력·수정 내용을 고정한 사본 |
| revision | 지침을 읽은 뒤 다른 요청이 수정했는지 비교하는 값 |

`inbox/<id>/`는 작업 재료, `drafts/<id>/<입력해시>/`는 입력 사본과 편집 초안입니다. 옛 JSON의 추가 필드는 가능한 그대로 유지합니다. 폴더를 복사해 가져온 경우 옛 절대경로를 새 복사본 안에서 해석합니다.

## 4. 새 기능의 저장 담당

- `ExistingPostService`: `existing-post.json`, 가져오기 매핑, 원문 충돌 백업. 재가져오기에서는 새 원문·초안·상태를 함께 저장합니다.
- `RefinementService`: 현재 digest 검사, AI 다듬기 결과·undo·적용 지침 보관. 되돌리기는 현재 검토 메모를 유지합니다.
- `UpdateService`: `post-update.json`, `updates/<시도ID>/` 사본, 결과 기록. 실제 티스토리 브라우저 조작은 하지 않습니다.

[클래스별 책임 표](과제1-프로젝트관리/02-프로젝트범위정의.md)와 [사용자 시나리오·시퀀스](과제1-프로젝트관리/03-시스템문맥도와이해관계자.md)를 함께 보세요.

## 5. 인터페이스가 필요한 이유

`DraftStore`는 초안을 저장하는 계약, `JsonRecordStore`는 JSON 기록을 읽고 쓰는 계약입니다. 실제 앱에서는 파일 구현을 넣습니다. 검사에서는 저장 도중 실패하는 구현을 넣어 이전 초안·원문·undo가 보존되는지 확인합니다.

모든 클래스에 인터페이스를 붙이지는 않았습니다. `Workspace`는 경로 규칙, `JsonFiles`는 공통 파일 처리로 그대로 씁니다. 파일·입력·잠금의 기본 처리를 새 기능마다 중복 작성하지 않습니다.

## 6. 발표용으로 직접 확인하기

1. `npm.cmd run desktop`으로 실행합니다.
2. AI 로그인 없이 **직접 작성하기**로 글을 만들고 **초안 보관**합니다.
3. 보관함에서 다시 열어 제목·본문이 유지되는지 봅니다.
4. 웹 개발 모드에서는 `GET /api/java`로 `backend: java`와 선언 수를 확인합니다.
5. 새 자동 검사에서 모의 AI·편집기를 사용한 다듬기·되돌리기·기존 글 수정 결과를 확인합니다.

실제 AI 다듬기는 본인 CLI 로그인이 필요하고 실제 발행·수정은 공개 글을 변경합니다. 자동 검사 결과와 실제 계정에서의 발행 성공을 구분합니다.

## 이해 확인

- Java가 없을 때 JS 저장으로 대체하지 않는 이유는 무엇인가요?
- digest를 AI 호출 전과 Java 저장 직전에 두 번 확인하는 이유는 무엇인가요?
- 입력 사본과 수정 시도 사본은 각각 어떤 시점을 고정하나요?
- `uncertain` 상태에서 자동 재시도를 막는 이유는 무엇인가요?
- `FileTransaction`의 요청 실패 복원과 전원 장애 복구는 왜 다른가요?
