# 클라이언트·서버·작업 상태 다이어그램

[전체 목차](README.md) · [유스케이스 상세](USE_CASES.md) · [HTML 그림 모음](index.html)

실제 phase 값과 설명을 위한 개념 상태를 구분했습니다. 클라이언트·요청 처리 그림은 설명용 모델이며 모든 상태가 하나의 enum으로 구현된 것은 아닙니다.

기준: 0.7.4-java.1 · 2026-09-22

## 클라이언트 화면 상태 · 개념 모델

화면 이동과 저장 상태를 읽기 쉽게 단순화했습니다. 실제로는 current, draft, materialDirty, draftDirty, mode 및 여러 busy 조건이 함께 존재합니다. 로그인은 로컬 글 작성의 필수 선행 상태가 아닙니다.

![클라이언트 화면 상태 · 개념 모델](images/state-client.svg)

[SVG 확대](images/state-client.svg) · [PNG 다운로드](images/state-client.png) · [수정할 Mermaid 원본](sources/state-client.mmd)

코드 근거: [app.js](../../../web/app.js), [main.mjs](../../../desktop/main.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
stateDiagram-v2
 [*] --> Boot
 state "초기 설정·목록 조회" as Boot
 state "작업실" as Workspace
 state "편집 중 / dirty" as Dirty
 state "보관 요청 중" as Saving
 state "기본·분류별 지침 화면" as Settings
 state "보관함 / 공개 글 탐색" as Library
 Boot --> Workspace : 초기 조회 성공
 Workspace --> Dirty : 입력·편집
 Dirty --> Saving : 자동 저장 / 초안 보관
 Saving --> Workspace : 성공
 Saving --> Dirty : 오류 안내
 Workspace --> Settings : 글쓰기 설정
 Settings --> Workspace : 돌아가기
 Workspace --> Library : 목록 보기
 Library --> Workspace : 글 열기
 Dirty --> Dirty : 종료 시 저장되지 않은 변경 확인
 Workspace --> [*] : 진행 작업 없이 앱 종료
```

</details>

## 서버 요청 처리 · 개념 모델

Node의 HTTP 처리와 Java 한 번 실행의 생명주기를 묶은 그림입니다. 모든 API가 Java를 호출하는 것은 아닙니다. Java는 요청마다 종료되고, Node 서버는 다음 요청을 기다립니다.

![서버 요청 처리 · 개념 모델](images/state-request.svg)

[SVG 확대](images/state-request.svg) · [PNG 다운로드](images/state-request.png) · [수정할 Mermaid 원본](sources/state-request.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [java-store.mjs](../../../scripts/java-store.mjs), [Main.java](../../../java-backend/src/main/java/com/hdev/assignment/bridge/Main.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
stateDiagram-v2
 [*] --> Idle
 Idle --> Validate : HTTP 요청
 Validate --> Route : 로컬 주소·Origin·변경 토큰 통과
 Validate --> Error : 검증 실패
 Route --> JavaStart : Java 저장 작업
 Route --> JSWork : AI·발행·공개 자료·렌더링
 JavaStart --> Lock : stdin JSON 해석
 Lock --> JavaWork : 자료 폴더 잠금 획득
 JavaWork --> JavaExit : 성공 또는 작업 오류 JSON
 JavaExit --> Response : Node가 stdout 해석
 JavaStart --> Error : 실행 실패·시간 초과
 JSWork --> Response : 완료 또는 비동기 접수
 JSWork --> Error : 예외
 Error --> Response : 오류 상태와 메시지
 Response --> Idle : HTTP 응답
```

</details>

## AI 생성 phase · 실제 값

실제 값은 idle/generating/done/error입니다. 상세 진행 문구는 generating 내부 message로 바뀝니다. 앱 재시작 후 app.json의 generating이 남으면 조회 시 error로 표현합니다.

![AI 생성 phase · 실제 값](images/state-generation.svg)

[SVG 확대](images/state-generation.svg) · [PNG 다운로드](images/state-generation.png) · [수정할 Mermaid 원본](sources/state-generation.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
stateDiagram-v2
 [*] --> idle
 idle --> generating : 생성 요청 허용
 generating --> generating : 진행 message 갱신
 generating --> done : 생성·검증·보관 완료
 generating --> error : CLI / 검증 / 저장 오류
 done --> generating : 재생성
 error --> generating : 사용자 재시도
 generating --> error : 재시작 후 generating 메타 감지
 done --> idle : 앱 재시작 후 메모리 상태 초기화
```

</details>

## 티스토리 발행 phase · 실제 값

phase는 publication.json에 보관됩니다. submitting 이전 실패는 failed로 재시도할 수 있고, submittedAt 이후 실패는 uncertain입니다. 이미 published이거나 uncertain이면 같은 글을 자동 재발행하지 않습니다.

![티스토리 발행 phase · 실제 값](images/state-publication.svg)

[SVG 확대](images/state-publication.svg) · [PNG 다운로드](images/state-publication.png) · [수정할 Mermaid 원본](sources/state-publication.mmd)

코드 근거: [publication.mjs](../../../scripts/publication.mjs), [publish.mjs](../../../desktop/publish.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
stateDiagram-v2
 [*] --> idle
 idle --> preparing : 발행 요청 검증 통과
 failed --> preparing : 사용자가 재시도
 preparing --> waiting_login : 로그인 확인
 waiting_login --> uploading : 사진 업로드 시작
 waiting_login --> filling : 업로드할 사진 없음
 uploading --> uploading : 다음 사진
 uploading --> filling : 제목·본문·태그·분류 입력
 filling --> submitting : submittedAt 기록 후 제출
 submitting --> verifying : 공개 결과 확인
 verifying --> published : 공개 내용 검증 성공
 preparing --> failed : 제출 전 오류 / 중단
 waiting_login --> failed : 제출 전 오류 / 중단
 uploading --> failed : 제출 전 오류 / 중단
 filling --> failed : 제출 전 오류 / 중단
 submitting --> uncertain : 오류 / 재시작 후 확인 불가
 verifying --> uncertain : 오류 / 재시작 후 확인 불가
 published --> published : 재요청은 기존 상태 반환
 uncertain --> uncertain : 재요청 차단·수동 확인 안내
```

</details>

## CLI 입력 상태 · 파일로 계산

SnapshotService.list가 ready 표식, 입력 해시, manifest, preview, 옛 임시저장 영수증을 읽어 계산합니다. 아래 화살표는 파일 변화에 따른 대표 전이이며 별도 상태 enum 저장은 없습니다. saved_recorded는 공개 발행 published와 다른 옛 임시저장 확인 값입니다.

![CLI 입력 상태 · 파일로 계산](images/state-input.svg)

[SVG 확대](images/state-input.svg) · [PNG 다운로드](images/state-input.png) · [수정할 Mermaid 원본](sources/state-input.mmd)

코드 근거: [SnapshotService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/SnapshotService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
stateDiagram-v2
 [*] --> collecting
 collecting --> ready : ready 실행
 ready --> changed : 사진·메모·참고자료 변경
 changed --> ready : ready 다시 실행
 ready --> prepared : prepare로 manifest 생성
 prepared --> local_draft : render로 preview 생성
 prepared --> changed : 원본 입력 변경
 local_draft --> changed : 원본 입력 변경
 local_draft --> saved_recorded : 유효한 tistory_receipt 확인
 local_draft --> remote_review_needed : 영수증이 있으나 내용 불일치
 saved_recorded --> remote_review_needed : 초안 변경으로 영수증 불일치
 ready --> error : 입력·파일 읽기 실패
 prepared --> error : 읽기 실패
 error --> ready : 파일 복구 후 재조회한 예
```

</details>

## 말투 분석 phase · 실제 값

분석 상태는 Java를 통해 analysis.json에 보관합니다. done에서 기본 지침이 자동 변경되는 화살표는 없습니다. 결과 채택은 별도의 style.save 요청입니다.

![말투 분석 phase · 실제 값](images/state-style.svg)

[SVG 확대](images/state-style.svg) · [PNG 다운로드](images/state-style.png) · [수정할 Mermaid 원본](sources/state-style.mmd)

코드 근거: [style.mjs](../../../scripts/style.mjs), [StyleService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/StyleService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
stateDiagram-v2
 [*] --> idle
 idle --> running : 분석 요청
 running --> running : 수집·AI 진행 문구 저장
 running --> done : 유효한 분석 결과
 running --> error : 수집·AI·형식 오류
 running --> error : 앱 재시작 때 중단 감지
 done --> running : 새 분석
 error --> running : 다시 분석
 done --> done : 사용자가 결과 채택 후 기본 지침 별도 저장
```

</details>
