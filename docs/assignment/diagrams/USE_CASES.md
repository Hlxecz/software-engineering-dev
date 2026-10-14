# 유스케이스 21개 상세 시나리오

[전체 목차](README.md) · [유스케이스 그림](01-use-cases.md) · [기능별 시퀀스](05-sequences.md)

기준: 0.7.4-java.1 실제 구현. Lumia의 일반 정보 → 성공 시나리오 → 예외 → 결과 구성 방식을 참고했습니다. 이 앱에 없는 자체 회원가입·JWT·DB 기능은 추가하지 않았습니다.

| ID | 사용자의 목표 | 상세 시퀀스 |
|---|---|---|
| UC-01 | [앱 실행과 초기 상태](#seq-01) | [그림](images/seq-01.svg) |
| UC-02 | [티스토리 계정 연결](#seq-02) | [그림](images/seq-02.svg) |
| UC-03 | [발행 블로그 전환](#seq-03) | [그림](images/seq-03.svg) |
| UC-04 | [새 글 생성](#seq-04) | [그림](images/seq-04.svg) |
| UC-05 | [재료 자동 보관](#seq-05) | [그림](images/seq-05.svg) |
| UC-06 | [사진과 별도 표지 업로드](#seq-06) | [그림](images/seq-06.svg) |
| UC-07 | [참고자료 수집](#seq-07) | [그림](images/seq-07.svg) |
| UC-08 | [AI 없이 직접 작성](#seq-08) | [그림](images/seq-08.svg) |
| UC-09 | [초안 편집·보관](#seq-09) | [그림](images/seq-09.svg) |
| UC-10 | [목록과 초안 재열기](#seq-10) | [그림](images/seq-10.svg) |
| UC-11 | [로컬 글 전체 삭제](#seq-11) | [그림](images/seq-11.svg) |
| UC-12 | [AI 선택과 연결 확인](#seq-12) | [그림](images/seq-12.svg) |
| UC-13 | [AI 초안 생성·재생성](#seq-13) | [그림](images/seq-13.svg) |
| UC-14 | [카테고리 새로 읽기](#seq-14) | [그림](images/seq-14.svg) |
| UC-15 | [기본 프롬프트 저장](#seq-15) | [그림](images/seq-15.svg) |
| UC-16 | [분류별 프롬프트 저장·해제](#seq-16) | [그림](images/seq-16.svg) |
| UC-17 | [말투 분석과 채택](#seq-17) | [그림](images/seq-17.svg) |
| UC-18 | [공개 글 보관함](#seq-18) | [그림](images/seq-18.svg) |
| UC-19 | [검토한 초안 공개 발행](#seq-19) | [그림](images/seq-19.svg) |
| UC-20 | [본문 꾸미기와 미리보기](#seq-20) | [그림](images/seq-20.svg) |
| UC-21 | [개발자 CLI 처리](#seq-21) | [그림](images/seq-21.svg) |

<a id="seq-01"></a>

## UC-01 · 앱 실행과 초기 상태

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | Windows에 Node/JDK 및 의존성 설치 또는 EXE와 Java 준비 |
| 시작 조건 | 실행 스크립트 또는 EXE 시작 |
| 성공 결과 | 전용 자료를 사용하는 작업실 표시 |

**기본 흐름:** 자료 폴더 초기화 → Java 연결 확인 → 로컬 HTTP 서버 → 앱 창 → 설정·글 목록.

**예외·대안:** Java 누락·시작 오류는 안내 후 종료. 원본 자료 위치는 사용하지 않음.

Electron은 전용 자료 폴더를 준비하고 로컬 서버를 연 뒤 창을 표시합니다. createApp의 Java health 실패는 앱 시작 실패로 이어집니다. Java가 없을 때 JS 파일 저장으로 대체하지 않습니다.

[시퀀스 그림](images/seq-01.svg) · 코드: [main.mjs](../../../desktop/main.mjs), [server.mjs](../../../scripts/server.mjs), [workspace.mjs](../../../scripts/workspace.mjs)

<a id="seq-02"></a>

## UC-02 · 티스토리 계정 연결

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 데스크톱 앱 실행, 진행 작업 없음 |
| 시작 조건 | 티스토리 로그인 클릭 |
| 성공 결과 | 확인된 소유 블로그 목록을 메모리에 유지 |

**기본 흐름:** 계정 창 열기 → 사용자 로그인 → 소유 목록 읽기·검증 → 블로그 선택 안내.

**예외·대안:** 사용자 취소·목록 읽기 실패·중복 주소는 오류. 주소를 임의 선택하지 않음.

계정 목록은 확인된 소유 블로그만 메모리에 유지합니다. 로그인 취소나 읽기 실패 시 주소를 임의로 바꾸지 않습니다. 단일 블로그 자동 선택과 복수 선택 후 저장은 UC-03으로 이어집니다.

[시퀀스 그림](images/seq-02.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [account.mjs](../../../desktop/account.mjs)

<a id="seq-03"></a>

## UC-03 · 발행 블로그 전환

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 진행 중인 작업 없음. 계정 연결 모드라면 확인한 소유 목록 존재 |
| 시작 조건 | 블로그 선택 또는 웹 모드 주소 저장 |
| 성공 결과 | 새 발행 대상 적용. 기존 글·사진·기본 지침 보존 |

**기본 흐름:** 주소 검증 → 설정 저장 → 카테고리·지침·발행 연결 갱신 → 새 대상 표시.

**예외·대안:** 예시·잘못된 주소, 계정 목록 외 주소, 진행 중 전환은 거부.

전환 중 기존 글·초안·기본 지침을 덮어쓰지 않습니다. categories, writingPrompts, publications를 새 주소에 맞춰 다시 만듭니다. 웹 모드는 주소 직접 입력을 사용합니다.

[시퀀스 그림](images/seq-03.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [blog-settings.mjs](../../../scripts/blog-settings.mjs)

<a id="seq-04"></a>

## UC-04 · 새 글 생성

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 앱 실행 및 Java 연결 가능 |
| 시작 조건 | 새 글 입력 시작 |
| 성공 결과 | 새로운 로컬 글 한 개 생성 |

**기본 흐름:** 글 ID 생성 → Java 작업 폴더 생성 → 초기 메타·메모·순서 → 재조회.

**예외·대안:** 중복 ID·잘못된 경로·디스크 오류는 성공으로 표시하지 않음.

Node가 날짜와 UUID 조각으로 로컬 글 ID를 만듭니다. Java는 inbox 폴더·메모·초기 정보를 만들고 서버가 다시 읽어 반환합니다.

[시퀀스 그림](images/seq-04.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java)

<a id="seq-05"></a>

## UC-05 · 재료 자동 보관

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 선택한 로컬 글 존재, 수정 가능한 상태 |
| 시작 조건 | 제목·메모·사진 순서·참고자료·분류 변경 |
| 성공 결과 | 재열기 가능한 자료 보관. 제외 사진 원본은 유지 |

**기본 흐름:** dirty 표시 → 큐를 통해 PUT → JS·Java 검증 → 자료·메타 보관.

**예외·대안:** 잘못된 사진 순서·긴 입력·진행 작업 충돌은 오류.

화면의 saveQueue가 재료 저장 요청 순서를 유지합니다. Java는 기존 메타데이터의 추가 필드를 보존합니다. order에서 제외한 사진의 원본 파일은 삭제하지 않습니다.

[시퀀스 그림](images/seq-05.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [app.js](../../../web/app.js), [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java)

<a id="seq-06"></a>

## UC-06 · 사진과 별도 표지 업로드

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 글 존재, 허용된 PNG/JPEG/WebP 파일 준비 |
| 시작 조건 | 사진 또는 별도 표지 업로드 |
| 성공 결과 | 사진을 전용 inbox에 보관 |

**기본 흐름:** 바이트 형식·크기 확인 → Java 저장 → order 또는 coverUploads 갱신 → 미리보기 조회.

**예외·대안:** 10MB 초과·20장 제한·잘못된 형식·경로는 거부. 일반 사진과 별도 표지는 각 목록 기준.

Node는 파일 시그니처와 10MB 제한을 검사합니다. Java는 이름·크기·개수를 검사하고 바이트를 저장합니다. 일반 사진은 order, 별도 표지는 coverUploads에 추가합니다.

[시퀀스 그림](images/seq-06.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java)

<a id="seq-07"></a>

## UC-07 · 참고자료 수집

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 글에 최대 5개 공개 HTTPS 참고자료 또는 붙여넣기 본문 보관 |
| 시작 조건 | 자료 읽기 요청 |
| 성공 결과 | 다음 생성에 쓸 자료와 읽기 결과 확인 |

**기본 흐름:** 자료 조회 → 202 응답 → 웹·공개 노션 수집 → 읽기 보고서 보관 → 상태 조회.

**예외·대안:** 비공개·접근 제한·본문 추출 실패는 보고서 또는 오류. 수동 본문 입력 가능.

자료의 주소·붙여넣기는 재료 저장 경로로 먼저 보관합니다. 공개 노션은 notionReader를 사용할 수 있습니다. 읽기 보고서 보관과 화면의 진행 상태를 구분합니다.

[시퀀스 그림](images/seq-07.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [references.mjs](../../../scripts/references.mjs)

<a id="seq-08"></a>

## UC-08 · AI 없이 직접 작성

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 사진 최소 한 장, 재료를 보관할 수 있는 상태 |
| 시작 조건 | 직접 작성하기 클릭 |
| 성공 결과 | AI 실행 없이 로컬 초안 보관 |

**기본 흐름:** 화면에서 기본 초안 생성 → 최초 입력 사본 준비 → 공통 초안 저장 → 편집 화면.

**예외·대안:** 사진 없음·초안 검증·파일 오류는 안내.

화면이 수동 초안을 만들고 UC-09의 저장 API를 재사용합니다. 첫 입력 사본 준비에는 사진이 최소 한 장 필요합니다. 직접 작성은 AI CLI를 실행하지 않습니다.

[시퀀스 그림](images/seq-08.svg) · 코드: [app.js](../../../web/app.js), [server.mjs](../../../scripts/server.mjs), [SnapshotService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/SnapshotService.java)

<a id="seq-09"></a>

## UC-09 · 초안 편집·보관

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 편집할 초안과 유효한 입력 사본 또는 준비 가능한 사진 존재 |
| 시작 조건 | 초안 보관 클릭 |
| 성공 결과 | 새 초안과 이전 초안 이력을 보관 |

**기본 흐름:** 재료 저장 → 본문·카드·표지 검사 → Java 경로·사진 검사 → 이력 → 새 초안 → 미리보기.

**예외·대안:** 검증 오류는 저장 전 중단. 여러 파일 쓰기 도중 실패는 부분 반영 가능.

학습 1~6 주석과 같은 흐름입니다. 사진·분류·경로 검사 뒤 기존 초안 이력을 남깁니다. 개별 파일은 임시 파일 교체로 기록하지만 여러 파일 전체가 DB 트랜잭션인 것은 아닙니다.

[시퀀스 그림](images/seq-09.svg) · 코드: [app.js](../../../web/app.js), [server.mjs](../../../scripts/server.mjs), [DraftRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/DraftRepository.java)

<a id="seq-10"></a>

## UC-10 · 목록과 초안 재열기

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 로컬 자료 폴더 읽기 가능 |
| 시작 조건 | 보관함 표시·글 선택 |
| 성공 결과 | 보관한 글과 초안을 다시 편집 가능 |

**기본 흐름:** Java 목록·용량 일괄 조회 → 정렬 → 선택 글과 초안 읽기 → 상태·사진 URL 결합.

**예외·대안:** 깨진 JSON·누락된 사진·안전하지 않은 경로는 오류. 옛 절대경로는 현재 복사본으로만 해석.

목록은 Java 한 번 실행으로 글 자료와 용량을 모읍니다. Node는 생성·발행 상태와 사진 URL을 보태 화면 형식으로 바꿉니다. 옛 절대경로는 현재 복사본 안에서만 재연결합니다.

[시퀀스 그림](images/seq-10.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java), [Workspace.java](../../../java-backend/src/main/java/com/hdev/assignment/workspace/Workspace.java)

<a id="seq-11"></a>

## UC-11 · 로컬 글 전체 삭제

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 사용자가 삭제할 글을 지정·확인, 해당 글 진행 작업 없음 |
| 시작 조건 | 삭제 확인 버튼 |
| 성공 결과 | 해당 글의 로컬 자료 제거. 원격 게시글은 유지 |

**기본 흐름:** 두 저장 위치 계산 → 전체 트리 검사 → 파일·하위 폴더부터 삭제 → 용량 반환.

**예외·대안:** 사전 검사 실패 시 삭제 시작 안 함. OS 삭제 오류 시 일부 삭제 가능.

앱의 확인 버튼을 누른 글만 대상으로 합니다. Java가 inbox와 drafts의 전체 대상 트리를 검사한 뒤 삭제합니다. 티스토리 게시글을 삭제하는 호출은 없습니다.

[시퀀스 그림](images/seq-11.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [StorageService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/StorageService.java)

<a id="seq-12"></a>

## UC-12 · AI 선택과 연결 확인

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 선택한 CLI가 설치되어 있고 필요한 로그인은 사용자가 수행 |
| 시작 조건 | AI 선택 또는 연결 확인 |
| 성공 결과 | 선택한 AI와 연결 상태 확인 |

**기본 흐름:** provider 검사 → 설정 보관 → CLI 연결 확인 → 도움말·상태 표시.

**예외·대안:** 설치·로그인·명령 실행 실패를 연결됨으로 표시하지 않음.

Codex/Claude 설정 및 설치·로그인 상태 확인은 JS가 맡습니다. 이 흐름을 실행했다고 실제 글 생성 품질이 검증되는 것은 아닙니다.

[시퀀스 그림](images/seq-12.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [ai.mjs](../../../scripts/ai.mjs)

<a id="seq-13"></a>

## UC-13 · AI 초안 생성·재생성

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 사진 존재, AI 사용 준비, 진행 중 작업 없음 |
| 시작 조건 | AI 초안 생성 또는 재생성 |
| 성공 결과 | 새 초안·분석·검토·사용 지침 기록 |

**기본 흐름:** 입력 사본·지침 고정 → 202 → CLI → 결과 검증·사용자 선택 보존 → Java 보관 → done.

**예외·대안:** CLI·JSON·사진·저장 실패는 error. 기존 초안 보존은 실패 시점에 따라 다르며 전체 롤백 보장은 없음.

입력 사본과 기본·분류 지침을 시작 시 고정합니다. AI 결과의 민감 사진 처리·본문 규칙을 JS에서 검사한 뒤 Java로 보관합니다. 재생성은 사용자 분류·카드·유효한 표지 선택을 유지합니다.

[시퀀스 그림](images/seq-13.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [generate.mjs](../../../scripts/generate.mjs), [ai.mjs](../../../scripts/ai.mjs)

<a id="seq-14"></a>

## UC-14 · 카테고리 새로 읽기

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 데스크톱·유효한 블로그·로그인 확인 가능 |
| 시작 조건 | 카테고리 불러오기 |
| 성공 결과 | 현재 블로그의 분류 목록 보관 |

**기본 흐름:** 티스토리 관리 목록 읽기 → Java 정규화·기본 분류·중복 확인 → 캐시 → 화면 선택 목록.

**예외·대안:** 웹 모드·로그인·읽기·검증 실패는 오류. 잘못된 목록으로 캐시 교체하지 않음.

Electron이 글 관리 화면을 읽고 Java가 검증·보관합니다. 기존 상위 분류 선택을 지우지 않으며 화면의 새 선택 목록은 하위 분류 중심으로 표시합니다.

[시퀀스 그림](images/seq-14.svg) · 코드: [categories.mjs](../../../scripts/categories.mjs), [publish.mjs](../../../desktop/publish.mjs), [CategoryService.java](../../../java-backend/src/main/java/com/hdev/assignment/category/CategoryService.java)

<a id="seq-15"></a>

## UC-15 · 기본 프롬프트 저장

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 현재 기본 지침과 revision 조회 |
| 시작 조건 | 기본 지침 저장 |
| 성공 결과 | 기본 프롬프트와 새 revision 보관 |

**기본 흐름:** 입력·주소 검사 → Java revision 비교 → 기존 지침 이력 → 새 지침·설정.

**예외·대안:** 오래된 revision 또는 잘못된 분석 ID는 409. 지침은 1~20,000자.

지침을 읽을 때 받은 revision을 저장 때 되돌려 보냅니다. 일치하지 않으면 409로 덮어쓰기를 막습니다. 저장 전의 기본 지침은 style/history에 남습니다.

[시퀀스 그림](images/seq-15.svg) · 코드: [style.mjs](../../../scripts/style.mjs), [StyleService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/StyleService.java)

<a id="seq-16"></a>

## UC-16 · 분류별 프롬프트 저장·해제

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 블로그·분류 선택, 현재 revision 조회 |
| 시작 조건 | 예시 가져오기·수정 후 저장 또는 빈 지침 저장 |
| 성공 결과 | 다른 블로그 지침을 보존하며 선택 항목만 갱신 |

**기본 흐름:** 분류·길이·revision 검증 → 해당 분류 항목 교체 또는 제거 → 새 상태.

**예외·대안:** 10,000자 초과·다른 창 충돌·잘못된 분류는 오류.

현재 블로그와 분류의 지침만 교체하고 다른 블로그의 지침은 보존합니다. 빈 문자열은 별도 지침 해제입니다. 화면의 예시 5개는 사용자가 가져와 저장한 경우 적용됩니다.

[시퀀스 그림](images/seq-16.svg) · 코드: [writing-prompts.mjs](../../../scripts/writing-prompts.mjs), [PromptService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/PromptService.java)

<a id="seq-17"></a>

## UC-17 · 말투 분석과 채택

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 공개 블로그 주소 1~3개, AI 분석 가능 |
| 시작 조건 | 말투 분석 시작 |
| 성공 결과 | 분석 후보 생성. 기본 지침 반영은 UC-15에서 별도 수행 |

**기본 흐름:** 공개 본문 수집 → AI 분석 → Java 분석 상태·결과 저장 → 사용자가 검토·채택.

**예외·대안:** 공개 글 수집·CLI·결과 형식 실패는 error. 재시작 때 running은 중단으로 안내.

JS가 공개 글을 수집해 AI에 분석을 요청하고 Java가 분석 상태를 보관합니다. done은 분석 완료이며, 기본 프롬프트 변경은 사용자가 결과를 채택하고 저장할 때만 일어납니다.

[시퀀스 그림](images/seq-17.svg) · 코드: [style.mjs](../../../scripts/style.mjs), [generate.mjs](../../../scripts/generate.mjs), [StyleService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/StyleService.java)

<a id="seq-18"></a>

## UC-18 · 공개 글 보관함

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 조회할 공개 블로그 선택 |
| 시작 조건 | 공개 목록 열기·새로고침·검색 |
| 성공 결과 | 공개 글 목록 표시 |

**기본 흐름:** 기존 JS 캐시 읽기 → 필요하면 RSS·사이트맵 조회 → 캐시 갱신 → 화면 필터.

**예외·대안:** 네트워크·공개 목록 해석 실패 안내. 공개 목록은 로그인 소유 증명이 아님.

RSS·사이트맵을 통한 공개 글 목록과 그 캐시는 기존 JS가 관리합니다. 로컬 초안 보관함과는 별도이며 검색·분류 필터는 화면에서 적용합니다.

[시퀀스 그림](images/seq-18.svg) · 코드: [tistory.mjs](../../../scripts/tistory.mjs), [server.mjs](../../../scripts/server.mjs), [app.js](../../../web/app.js)

<a id="seq-19"></a>

## UC-19 · 검토한 초안 공개 발행

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 데스크톱·대상 블로그·검토 후 보관한 초안·일치하는 draftDigest |
| 시작 조건 | 티스토리에 발행 클릭 |
| 성공 결과 | 검증 성공에 한해 published와 영수증 기록 |

**기본 흐름:** 중복·불확실 상태 검사 → 발행 사본 → 로그인·분류·사진·본문 → 제출 시각 기록 → 공개 요청 → 공개 검증.

**예외·대안:** 제출 전 실패는 failed, 제출 후 불확실은 uncertain. 자동 재발행 차단.

publications는 JS가 관리합니다. 제출 직전에 submittedAt을 먼저 기록합니다. 제출 이후 검증 실패·종료는 uncertain으로 남겨 자동 중복 발행을 차단합니다. 실제 공개 발행은 이 문서 제작에서 실행하지 않았습니다.

[시퀀스 그림](images/seq-19.svg) · 코드: [server.mjs](../../../scripts/server.mjs), [publication.mjs](../../../scripts/publication.mjs), [publish.mjs](../../../desktop/publish.mjs)

<a id="seq-20"></a>

## UC-20 · 본문 꾸미기와 미리보기

| 항목 | 설명 |
|---|---|
| 주 행위자 | 앱 사용자 |
| 사전 조건 | 편집 중인 초안 존재 |
| 시작 조건 | 블록 이동·삽입·표지·카드·미리보기·HTML 복사 |
| 성공 결과 | 화면·보관 미리보기·발행에 공통 렌더링 규칙 사용 |

**기본 흐름:** draft 변경 → 공통 모델·렌더러 → 목차·팁·주의·카드·표지 배치 → 필요 시 저장.

**예외·대안:** 유효하지 않은 카드·이미지 참조·본문은 저장·발행 검증에서 거부.

블록 드래그·삽입, 표지·GitHub 카드·팁·주의·목차 표시를 포함합니다. 공통 렌더러를 화면·저장 미리보기·발행에 사용합니다. 별도 표지 업로드는 UC-06, 저장은 UC-09와 연결됩니다.

[시퀀스 그림](images/seq-20.svg) · 코드: [app.js](../../../web/app.js), [draft-model.js](../../../web/draft-model.js), [article-renderer.js](../../../web/article-renderer.js), [server.mjs](../../../scripts/server.mjs)

<a id="seq-21"></a>

## UC-21 · 개발자 CLI 처리

| 항목 | 설명 |
|---|---|
| 주 행위자 | 개발자·CLI 사용자 |
| 사전 조건 | 개발 환경·JDK 준비, CLI가 사용하는 전용 자료 폴더 |
| 시작 조건 | new / ready / list / prepare / render 명령 |
| 성공 결과 | 입력 버전과 로컬 미리보기 준비. 공개 발행은 수행하지 않음 |

**기본 흐름:** 빈 글 → 사진·메모 수집 → ready → prepare → 초안 준비 → render, list로 상태 확인.

**예외·대안:** 준비 뒤 입력 변경·사본 훼손·초안 형식 오류는 거부. 같은 입력은 검증 후 재사용.

new/ready/list/prepare는 Java로, render는 기존 JS로 연결됩니다. ready는 수집 완료 표시이며 발행 명령이 아닙니다. 같은 입력은 검증 후 기존 사본을 재사용합니다.

[시퀀스 그림](images/seq-21.svg) · 코드: [blog.mjs](../../../scripts/blog.mjs), [SnapshotService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/SnapshotService.java)

## 기능 누락 확인표

| 기존 기능 묶음 | 연결 유스케이스 |
|---|---|
| 작업실·보관함·용량·재열기·삭제 | UC-01, 04, 10, 11 |
| 사진·메모·순서·표지·참고자료·공개 노션 | UC-05, 06, 07, 20 |
| AI 선택·도움말·생성·재생성·수동 작성 | UC-08, 12, 13 |
| 편집·드래그·삽입·목차·팁·주의·GitHub 카드·HTML 복사 | UC-09, 20 |
| 카테고리·기본/분류 지침·예시 5개·말투 분석 | UC-14, 15, 16, 17 |
| 계정 연결·첫 실행·블로그 전환·공개 글 검색/분류 | UC-01, 02, 03, 18 |
| 공개 발행·카테고리·표지 확인·중복 방지 | UC-19 |
| CLI·같은 입력 재사용·로컬 미리보기 | UC-21 |
