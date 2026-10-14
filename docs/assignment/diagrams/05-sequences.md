# 유스케이스별 시퀀스 다이어그램

[전체 목차](README.md) · [유스케이스 상세](USE_CASES.md) · [HTML 그림 모음](index.html)

위에서 아래로 호출 순서를 읽습니다. 실선 화살표는 요청, 점선은 응답입니다. Java 저장 모듈로 표시한 생명선은 호출마다 실행되는 javaStore → Main → 담당 클래스의 논리적 묶음입니다. 상주 Java 서버가 아닙니다.

기준: 0.7.4-java.1 · 2026-09-22

## UC-01 · 앱 실행과 초기 상태

Electron은 전용 자료 폴더를 준비하고 로컬 서버를 연 뒤 창을 표시합니다. createApp의 Java health 실패는 앱 시작 실패로 이어집니다. Java가 없을 때 JS 파일 저장으로 대체하지 않습니다.

![UC-01 · 앱 실행과 초기 상태](images/seq-01.svg)

[SVG 확대](images/seq-01.svg) · [PNG 다운로드](images/seq-01.png) · [수정할 Mermaid 원본](sources/seq-01.mmd)

코드 근거: [main.mjs](../../../desktop/main.mjs), [server.mjs](../../../scripts/server.mjs), [workspace.mjs](../../../scripts/workspace.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant E as Electron 연결
participant J as Java 저장 모듈
participant N as Node API
participant F as 전용 자료 폴더
participant W as 화면 JS

 U->>E: Start-Desktop.cmd 실행
 E->>F: initializeData로 전용 자료 준비
 E->>N: createApp(root, 연결 함수들)
 N->>J: health 및 저장 설정 조회
 J-->>N: Java 버전과 상태
 N-->>E: 로컬 서버
 E->>N: listen(0, 127.0.0.1)
 E->>W: BrowserWindow.loadURL
 W->>N: GET /api/bootstrap, GET /api/jobs
 N->>J: 카테고리·지침·글 목록 조회
 J-->>N: 저장 데이터
 N-->>W: 설정·토큰·보관함
```

</details>

## UC-02 · 티스토리 계정 연결

계정 목록은 확인된 소유 블로그만 메모리에 유지합니다. 로그인 취소나 읽기 실패 시 주소를 임의로 바꾸지 않습니다. 단일 블로그 자동 선택과 복수 선택 후 저장은 UC-03으로 이어집니다.

![UC-02 · 티스토리 계정 연결](images/seq-02.svg)

[SVG 확대](images/seq-02.svg) · [PNG 다운로드](images/seq-02.png) · [수정할 Mermaid 원본](sources/seq-02.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [account.mjs](../../../desktop/account.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant E as Electron 연결
participant T as 티스토리

 U->>W: 티스토리 로그인 클릭
 W->>N: POST /api/tistory/connect
 N->>E: accountReader()
 E->>T: 계정 페이지 열기
 U->>T: 필요하면 직접 로그인
 E->>T: 소유 블로그 목록 읽기
 alt 목록 확인 성공
 T-->>E: 관리 주소와 블로그 이름
 E-->>N: 블로그 목록
 N->>N: 주소·중복 검증, 메모리 목록 유지
 N-->>W: 단일 자동 선택 또는 선택 목록
 else 취소 또는 목록 오류
 E-->>N: 오류
 N-->>W: 오류 안내
 end
```

</details>

## UC-03 · 발행 블로그 전환

전환 중 기존 글·초안·기본 지침을 덮어쓰지 않습니다. categories, writingPrompts, publications를 새 주소에 맞춰 다시 만듭니다. 웹 모드는 주소 직접 입력을 사용합니다.

![UC-03 · 발행 블로그 전환](images/seq-03.svg)

[SVG 확대](images/seq-03.svg) · [PNG 다운로드](images/seq-03.png) · [수정할 Mermaid 원본](sources/seq-03.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [blog-settings.mjs](../../../scripts/blog-settings.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 U->>W: 대상 블로그 선택 또는 웹 주소 입력
 W->>N: PUT /api/blog-settings
 N->>N: 진행 작업·주소·확인된 소유 목록 검사
 N->>F: tistory.config.json 주소 저장
 N->>N: 분류·지침·발행 연결 재생성
 N->>J: categories.state, prompts.state
 J->>F: 새 대상에 맞는 캐시와 지침 읽기
 J-->>N: 새 블로그 상태
 N-->>W: 주소·분류·지침 즉시 갱신
```

</details>

## UC-04 · 새 글 생성

Node가 날짜와 UUID 조각으로 로컬 글 ID를 만듭니다. Java는 inbox 폴더·메모·초기 정보를 만들고 서버가 다시 읽어 반환합니다.

![UC-04 · 새 글 생성](images/seq-04.svg)

[SVG 확대](images/seq-04.svg) · [PNG 다운로드](images/seq-04.png) · [수정할 Mermaid 원본](sources/seq-04.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 U->>W: 새 글 입력 시작
 W->>N: POST /api/jobs
 N->>N: 글 ID 생성
 N->>J: job.create(id, title)
 J->>F: inbox/id/images, notes, app, order 생성
 J-->>N: 생성 결과
 N->>J: job.read
 J-->>N: 글 자료
 N-->>W: 201과 새 글
```

</details>

## UC-05 · 재료 자동 보관

화면의 saveQueue가 재료 저장 요청 순서를 유지합니다. Java는 기존 메타데이터의 추가 필드를 보존합니다. order에서 제외한 사진의 원본 파일은 삭제하지 않습니다.

![UC-05 · 재료 자동 보관](images/seq-05.svg)

[SVG 확대](images/seq-05.svg) · [PNG 다운로드](images/seq-05.png) · [수정할 Mermaid 원본](sources/seq-05.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [app.js](../../../web/app.js), [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 U->>W: 제목·메모·순서·분류 변경
 W->>W: dirty 표시, saveQueue 순서 유지
 W->>N: PUT /api/jobs/id
 N->>N: 작업 중 여부·입력·참고자료 검사
 N->>J: job.save
 J->>J: 길이·사진 경로·선택 분류 검증
 J->>F: notes, order, references, app 저장
 J-->>N: 저장 결과
 N->>J: job.read
 J-->>N: 글 자료
 N-->>W: 보관된 재료
```

</details>

## UC-06 · 사진과 별도 표지 업로드

Node는 파일 시그니처와 10MB 제한을 검사합니다. Java는 이름·크기·개수를 검사하고 바이트를 저장합니다. 일반 사진은 order, 별도 표지는 coverUploads에 추가합니다.

![UC-06 · 사진과 별도 표지 업로드](images/seq-06.svg)

[SVG 확대](images/seq-06.svg) · [PNG 다운로드](images/seq-06.png) · [수정할 Mermaid 원본](sources/seq-06.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 U->>W: 사진 또는 표지 파일 선택
 W->>N: POST /api/jobs/id/images 또는 covers
 N->>N: 크기·PNG/JPEG/WebP 검사
 N->>J: job.upload(Base64, coverOnly)
 J->>J: 이름·경로·크기·개수 검증
 J->>F: images에 사진 기록
 alt 별도 표지
 J->>F: app.coverUploads 갱신
 else 일반 사진
 J->>F: order.json 갱신
 end
 J-->>N: 결과
 N-->>W: 사진 목록
 W->>N: GET 사진 URL
 N->>J: job.image
 J->>F: 바이트 읽기
 J-->>N: Base64
 N-->>W: 이미지 바이트
```

</details>

## UC-07 · 참고자료 수집

자료의 주소·붙여넣기는 재료 저장 경로로 먼저 보관합니다. 공개 노션은 notionReader를 사용할 수 있습니다. 읽기 보고서 보관과 화면의 진행 상태를 구분합니다.

![UC-07 · 참고자료 수집](images/seq-07.svg)

[SVG 확대](images/seq-07.svg) · [PNG 다운로드](images/seq-07.png) · [수정할 Mermaid 원본](sources/seq-07.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [references.mjs](../../../scripts/references.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant B as 공개 웹
participant F as 전용 자료 폴더

 U->>W: 최대 5개 HTTPS 주소 또는 본문 입력
 W->>N: PUT 글 재료 보관
 N->>J: job.save(references)
 U->>W: 자료 읽기
 W->>N: POST /api/jobs/id/references/read
 N-->>W: 202 reading
 N->>B: collectReferences로 본문 수집
 B-->>N: 내용과 읽기 보고서
 N->>J: job.references.check
 J->>F: references-check.json 저장
 N->>N: done 또는 error 상태
 loop 읽기가 끝날 때까지
 W->>N: GET /api/jobs/id
 N-->>W: 진행 상태와 보고서
 end
```

</details>

## UC-08 · AI 없이 직접 작성

화면이 수동 초안을 만들고 UC-09의 저장 API를 재사용합니다. 첫 입력 사본 준비에는 사진이 최소 한 장 필요합니다. 직접 작성은 AI CLI를 실행하지 않습니다.

![UC-08 · AI 없이 직접 작성](images/seq-08.svg)

[SVG 확대](images/seq-08.svg) · [PNG 다운로드](images/seq-08.png) · [수정할 Mermaid 원본](sources/seq-08.mmd)

코드 근거: [app.js](../../../web/app.js), [server.mjs](../../../scripts/server.mjs), [SnapshotService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/SnapshotService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈

 U->>W: 사진·메모 입력 후 직접 작성하기
 W->>W: 제목·태그·본문 블록 구성
 W->>N: PUT /api/jobs/id/draft
 opt 연결된 입력 사본이 없음
 N->>J: job.ready, job.prepare
 J-->>N: 입력 사본 경로
 end
 N->>N: persistDraft 검증
 N->>J: draft.save
 J-->>N: 저장 결과
 N-->>W: 저장된 초안과 미리보기
```

</details>

## UC-09 · 초안 편집·보관

학습 1~6 주석과 같은 흐름입니다. 사진·분류·경로 검사 뒤 기존 초안 이력을 남깁니다. 개별 파일은 임시 파일 교체로 기록하지만 여러 파일 전체가 DB 트랜잭션인 것은 아닙니다.

![UC-09 · 초안 편집·보관](images/seq-09.svg)

[SVG 확대](images/seq-09.svg) · [PNG 다운로드](images/seq-09.png) · [수정할 Mermaid 원본](sources/seq-09.mmd)

코드 근거: [app.js](../../../web/app.js), [server.mjs](../../../scripts/server.mjs), [DraftRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/DraftRepository.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant F as 전용 자료 폴더
participant R as 공통 렌더러

 U->>W: 초안 보관
 W->>N: PUT /api/jobs/id/draft
 N->>N: 본문 블록·카드·표지 검증
 N->>J: draft.save
 J->>J: 경로·글 ID·분류·사진 해시 검사
 alt 검증 통과
 J->>F: 기존 초안·관련 JSON을 history로 복사
 J->>F: draft.json, review.md, app.json 저장
 J-->>N: ok true
 N->>R: renderDraft로 미리보기 생성
 N->>J: job.read
 J-->>N: 저장 자료
 N-->>W: 보관됨
 else 검증 실패
 J-->>N: ok false와 오류
 N-->>W: 오류 표시
 end
```

</details>

## UC-10 · 목록과 초안 재열기

목록은 Java 한 번 실행으로 글 자료와 용량을 모읍니다. Node는 생성·발행 상태와 사진 URL을 보태 화면 형식으로 바꿉니다. 옛 절대경로는 현재 복사본 안에서만 재연결합니다.

![UC-10 · 목록과 초안 재열기](images/seq-10.svg)

[SVG 확대](images/seq-10.svg) · [PNG 다운로드](images/seq-10.png) · [수정할 Mermaid 원본](sources/seq-10.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java), [Workspace.java](../../../java-backend/src/main/java/com/hdev/assignment/workspace/Workspace.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 U->>W: 보관함 열기
 W->>N: GET /api/jobs
 N->>J: job.listData
 J->>F: 글 자료와 폴더 용량 읽기
 J-->>N: 전체 목록
 N-->>W: 수정 시각 순 목록
 U->>W: 글 선택
 W->>N: GET /api/jobs/id
 N->>J: job.read
 J->>F: app의 directory에서 draft와 관련 자료 읽기
 J-->>N: 저장 데이터
 N->>N: 사진 URL과 현재 상태 결합
 N-->>W: 초안 편집기
```

</details>

## UC-11 · 로컬 글 전체 삭제

앱의 확인 버튼을 누른 글만 대상으로 합니다. Java가 inbox와 drafts의 전체 대상 트리를 검사한 뒤 삭제합니다. 티스토리 게시글을 삭제하는 호출은 없습니다.

![UC-11 · 로컬 글 전체 삭제](images/seq-11.svg)

[SVG 확대](images/seq-11.svg) · [PNG 다운로드](images/seq-11.png) · [수정할 Mermaid 원본](sources/seq-11.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [StorageService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/StorageService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 U->>W: 선택한 글 삭제 확인
 W->>N: DELETE /api/jobs/id
 N->>N: 생성·발행·자료 읽기 중인지 검사
 N->>J: storage.delete(inbox, drafts, id)
 J->>F: 두 대상의 경로·링크·전체 트리 검사
 alt 검사 통과
 J->>F: 파일부터 지우고 부모 폴더 삭제
 J-->>N: 삭제 용량
 N-->>W: 글 목록 갱신
 else 경로 또는 파일 오류
 J-->>N: 오류
 N-->>W: 삭제 실패 안내
 end
```

</details>

## UC-12 · AI 선택과 연결 확인

Codex/Claude 설정 및 설치·로그인 상태 확인은 JS가 맡습니다. 이 흐름을 실행했다고 실제 글 생성 품질이 검증되는 것은 아닙니다.

![UC-12 · AI 선택과 연결 확인](images/seq-12.svg)

[SVG 확대](images/seq-12.svg) · [PNG 다운로드](images/seq-12.png) · [수정할 Mermaid 원본](sources/seq-12.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [ai.mjs](../../../scripts/ai.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant A as AI CLI
participant F as 전용 자료 폴더

 U->>W: AI 선택 / 연결 확인
 W->>N: PUT /api/ai 또는 POST /api/ai/check
 N->>N: 진행 작업과 provider 검사
 N->>F: ai.settings.json 저장
 N->>A: checkAI로 설치·연결 확인
 A-->>N: 연결 상태 또는 오류
 N-->>W: 도움말과 상태 갱신
```

</details>

## UC-13 · AI 초안 생성·재생성

입력 사본과 기본·분류 지침을 시작 시 고정합니다. AI 결과의 민감 사진 처리·본문 규칙을 JS에서 검사한 뒤 Java로 보관합니다. 재생성은 사용자 분류·카드·유효한 표지 선택을 유지합니다.

![UC-13 · AI 초안 생성·재생성](images/seq-13.svg)

[SVG 확대](images/seq-13.svg) · [PNG 다운로드](images/seq-13.png) · [수정할 Mermaid 원본](sources/seq-13.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [generate.mjs](../../../scripts/generate.mjs), [ai.mjs](../../../scripts/ai.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant A as AI CLI
participant F as 전용 자료 폴더
participant B as 공개 웹

 U->>W: AI 초안 만들기 / 다시 만들기
 W->>N: POST /api/jobs/id/generate
 N->>J: prompts.resolve
 J-->>N: 선택 분류 지침
 N->>F: 기본 profile.md 읽기
 N->>N: writingContext 고정
 N->>J: job.ready, job.prepare, 메타 갱신
 J-->>N: 입력 사본 경로
 N-->>W: 202 generating
 N->>B: 입력 사본의 참고자료 수집
 B-->>N: 본문과 보고서
 N->>A: 사진·메모·참고자료·선택 지침
 A-->>N: 초안 JSON과 분석 결과
 alt 생성과 결과 검사 성공
 N->>N: 분류·카드·표지 유지, 민감 사진 처리
 N->>J: draft.save, 참고자료 보고서 보관
 J->>F: 초안·분석·검토·writing-context 저장
 N->>N: done
 else CLI 또는 저장 실패
 N->>J: generating 메타 해제
 N->>N: error
 end
 W->>N: GET /api/jobs/id 주기적 조회
 N-->>W: 최신 결과 / 실패 안내
```

</details>

## UC-14 · 카테고리 새로 읽기

Electron이 글 관리 화면을 읽고 Java가 검증·보관합니다. 기존 상위 분류 선택을 지우지 않으며 화면의 새 선택 목록은 하위 분류 중심으로 표시합니다.

![UC-14 · 카테고리 새로 읽기](images/seq-14.svg)

[SVG 확대](images/seq-14.svg) · [PNG 다운로드](images/seq-14.png) · [수정할 Mermaid 원본](sources/seq-14.mmd)

코드 근거: [categories.mjs](../../../scripts/categories.mjs), [publish.mjs](../../../desktop/publish.mjs), [CategoryService.java](../../../java-backend/src/main/java/com/hdev/assignment/category/CategoryService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant E as Electron 연결
participant T as 티스토리
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 U->>W: 카테고리 불러오기
 W->>N: POST /api/categories
 N->>E: categoryReader(blogUrl)
 E->>T: 글 관리의 카테고리 목록 읽기
 T-->>E: 번호와 전체 경로
 E-->>N: 목록
 N->>J: categories.save
 J->>J: 블로그·중복 ID·기본 분류 검증
 J->>F: library/categories.json 저장
 J-->>N: 캐시
 N-->>W: 분류 선택 목록
```

</details>

## UC-15 · 기본 프롬프트 저장

지침을 읽을 때 받은 revision을 저장 때 되돌려 보냅니다. 일치하지 않으면 409로 덮어쓰기를 막습니다. 저장 전의 기본 지침은 style/history에 남습니다.

![UC-15 · 기본 프롬프트 저장](images/seq-15.svg)

[SVG 확대](images/seq-15.svg) · [PNG 다운로드](images/seq-15.png) · [수정할 Mermaid 원본](sources/seq-15.mmd)

코드 근거: [style.mjs](../../../scripts/style.mjs), [StyleService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/StyleService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 W->>N: GET /api/style
 N->>J: style.state
 J-->>N: profile, revision
 N-->>W: 기본 지침과 revision
 U->>W: 기본 지침 수정·보관
 W->>N: PUT /api/style(profile, revision, urls)
 N->>J: style.save
 J->>J: revision·길이·분석 ID 검사
 alt 일치
 J->>F: 이전 지침 이력, profile과 settings 저장
 J-->>N: 새 revision
 N-->>W: 보관 완료
 else 충돌
 J-->>N: 409
 N-->>W: 최신 저장본 다시 열기 안내
 end
```

</details>

## UC-16 · 분류별 프롬프트 저장·해제

현재 블로그와 분류의 지침만 교체하고 다른 블로그의 지침은 보존합니다. 빈 문자열은 별도 지침 해제입니다. 화면의 예시 5개는 사용자가 가져와 저장한 경우 적용됩니다.

![UC-16 · 분류별 프롬프트 저장·해제](images/seq-16.svg)

[SVG 확대](images/seq-16.svg) · [PNG 다운로드](images/seq-16.png) · [수정할 Mermaid 원본](sources/seq-16.mmd)

코드 근거: [writing-prompts.mjs](../../../scripts/writing-prompts.mjs), [PromptService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/PromptService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 W->>N: GET /api/writing-prompts
 N->>J: prompts.state
 J-->>N: 현재 블로그 지침과 전체 파일 revision
 N-->>W: 지침과 JS 예시 5개
 U->>W: 분류 선택 후 수정 또는 비우기
 W->>N: PUT /api/writing-prompts
 N->>J: prompts.save(category, prompt, revision)
 J->>J: 충돌·분류·길이 검사
 alt 내용 있음
 J->>F: 해당 블로그·분류 지침 교체
 else 빈 지침
 J->>F: 해당 항목만 제거
 end
 J-->>N: 새 상태
 N-->>W: 보관 결과
```

</details>

## UC-17 · 말투 분석과 채택

JS가 공개 글을 수집해 AI에 분석을 요청하고 Java가 분석 상태를 보관합니다. done은 분석 완료이며, 기본 프롬프트 변경은 사용자가 결과를 채택하고 저장할 때만 일어납니다.

![UC-17 · 말투 분석과 채택](images/seq-17.svg)

[SVG 확대](images/seq-17.svg) · [PNG 다운로드](images/seq-17.png) · [수정할 Mermaid 원본](sources/seq-17.mmd)

코드 근거: [style.mjs](../../../scripts/style.mjs), [generate.mjs](../../../scripts/generate.mjs), [StyleService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/StyleService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant B as 공개 웹
participant A as AI CLI
participant J as Java 저장 모듈
participant F as 전용 자료 폴더

 U->>W: 공개 블로그 주소로 말투 분석
 W->>N: POST /api/style/analyze
 N->>J: style.analysis.save(running)
 N-->>W: 202 진행 상태
 N->>B: 공개 글 수집
 B-->>N: 본문 표본과 출처
 N->>A: analyzeWritingStyle
 A-->>N: 분석한 profile
 N->>J: style.analysis.save(done 또는 error)
 J->>F: analysis.json
 W->>N: GET /api/style 반복 조회
 N-->>W: 검토할 결과
 opt 사용자가 결과를 채택하고 보관
 U->>W: 분석 지침 반영·저장
 W->>N: PUT /api/style(analysisId, revision)
 N->>J: style.save
 end
```

</details>

## UC-18 · 공개 글 보관함

RSS·사이트맵을 통한 공개 글 목록과 그 캐시는 기존 JS가 관리합니다. 로컬 초안 보관함과는 별도이며 검색·분류 필터는 화면에서 적용합니다.

![UC-18 · 공개 글 보관함](images/seq-18.svg)

[SVG 확대](images/seq-18.svg) · [PNG 다운로드](images/seq-18.png) · [수정할 Mermaid 원본](sources/seq-18.mmd)

코드 근거: [tistory.mjs](../../../scripts/tistory.mjs), [server.mjs](../../../scripts/server.mjs), [app.js](../../../web/app.js)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant B as 공개 웹
participant F as 전용 자료 폴더

 U->>W: 공개 블로그·목록 선택
 W->>N: GET /api/blogs와 블로그 상세
 N->>F: 기존 공개 목록 캐시 조회
 N-->>W: 공개 글 목록
 U->>W: 목록 새로고침
 W->>N: POST /api/blogs/id/sync
 N->>B: RSS·사이트맵·공개 글 읽기
 B-->>N: 공개 글 정보
 N->>F: JS library 캐시 갱신
 N-->>W: 목록
 W->>W: 검색·카테고리 필터
```

</details>

## UC-19 · 검토한 초안 공개 발행

publications는 JS가 관리합니다. 제출 직전에 submittedAt을 먼저 기록합니다. 제출 이후 검증 실패·종료는 uncertain으로 남겨 자동 중복 발행을 차단합니다. 실제 공개 발행은 이 문서 제작에서 실행하지 않았습니다.

![UC-19 · 검토한 초안 공개 발행](images/seq-19.svg)

[SVG 확대](images/seq-19.svg) · [PNG 다운로드](images/seq-19.png) · [수정할 Mermaid 원본](sources/seq-19.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [publication.mjs](../../../scripts/publication.mjs), [publish.mjs](../../../desktop/publish.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant N as Node API
participant E as Electron 연결
participant T as 티스토리
participant F as 전용 자료 폴더

 U->>W: 검토 후 티스토리에 발행
 W->>N: POST /api/jobs/id/publish(draftDigest)
 N->>N: 기존 상태·대상·초안·사진 검증
 N->>F: 발행 시도별 불변 사본과 preparing 기록
 N-->>W: 202 진행 중
 N->>E: publishAdapter(사본)
 E->>T: 로그인·분류 확인, 사진 업로드, 본문 입력
 E->>N: beforeSubmit()
 N->>F: submittedAt과 submitting 먼저 기록
 E->>T: 공개 발행 요청
 E->>T: 공개 제목·본문·사진·분류 확인
 alt 공개 검증 성공
 E-->>N: URL과 검증 근거
 N->>F: published와 published-receipt 기록
 else 제출 후 결과 불확실
 E-->>N: 오류
 N->>F: uncertain 기록
 end
 W->>N: GET /api/jobs/id
 N-->>W: 발행 결과 / 관리 화면 확인 안내
```

</details>

## UC-20 · 본문 꾸미기와 미리보기

블록 드래그·삽입, 표지·GitHub 카드·팁·주의·목차 표시를 포함합니다. 공통 렌더러를 화면·저장 미리보기·발행에 사용합니다. 별도 표지 업로드는 UC-06, 저장은 UC-09와 연결됩니다.

![UC-20 · 본문 꾸미기와 미리보기](images/seq-20.svg)

[SVG 확대](images/seq-20.svg) · [PNG 다운로드](images/seq-20.png) · [수정할 Mermaid 원본](sources/seq-20.mmd)

코드 근거: [app.js](../../../web/app.js), [draft-model.js](../../../web/draft-model.js), [article-renderer.js](../../../web/article-renderer.js), [server.mjs](../../../scripts/server.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant W as 화면 JS
participant R as 공통 렌더러
participant N as Node API
participant J as Java 저장 모듈

 U->>W: 블록 이동·삽입, 표지·카드 수정
 W->>W: draft 변경과 dirty 표시
 W->>R: articleBlocks, renderArticleContent
 R-->>W: 목차·카드·표지·본문 HTML
 U->>W: HTML 복사 또는 초안 보관
 alt 보관
 W->>N: PUT /api/jobs/id/draft
 N->>R: buildPreview 검증
 N->>J: draft.save
 J-->>N: 저장 결과
 N-->>W: 보관한 초안
 else HTML 복사
 W->>W: 클립보드에 렌더링 결과 복사
 end
```

</details>

## UC-21 · 개발자 CLI 처리

new/ready/list/prepare는 Java로, render는 기존 JS로 연결됩니다. ready는 수집 완료 표시이며 발행 명령이 아닙니다. 같은 입력은 검증 후 기존 사본을 재사용합니다.

![UC-21 · 개발자 CLI 처리](images/seq-21.svg)

[SVG 확대](images/seq-21.svg) · [PNG 다운로드](images/seq-21.png) · [수정할 Mermaid 원본](sources/seq-21.mmd)

코드 근거: [blog.mjs](../../../scripts/blog.mjs), [SnapshotService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/SnapshotService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
sequenceDiagram
autonumber
actor U as 사용자
participant C as CLI 명령
participant J as Java 저장 모듈
participant F as 전용 자료 폴더
participant R as 공통 렌더러

 U->>C: npm run blog -- new id
 C->>J: job.create
 J->>F: 빈 작업 재료 생성
 U->>F: 사진과 메모 준비
 U->>C: ready id, prepare id
 C->>J: job.ready, job.prepare
 J->>F: ready.json과 입력 사본
 J-->>C: 경로와 reused
 U->>C: list
 C->>J: job.list
 J-->>C: 입력 기준 진행 상태
 opt 유효한 draft.json이 준비됨
 U->>C: render 입력사본폴더
 C->>R: renderDraft
 R->>F: preview.html, render.json
 end
```

</details>
