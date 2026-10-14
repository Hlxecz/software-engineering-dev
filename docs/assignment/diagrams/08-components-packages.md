# 컴포넌트·패키지 다이어그램

[전체 목차](README.md) · [유스케이스 상세](USE_CASES.md) · [HTML 그림 모음](index.html)

어떤 모듈이 누구를 호출하는지와 폴더 간 의존 방향을 보여 줍니다. 클래스 상속 관계를 뜻하지 않습니다.

기준: 0.7.4-java.1 · 2026-09-22

## 실행 컴포넌트 구조

브라우저는 HTTP만 사용하고 Java를 직접 실행하지 않습니다. Node가 외부 연결과 저장 호출을 조정하며 일부 렌더링·발행 캐시 파일은 JS에서 관리합니다.

![실행 컴포넌트 구조](images/components.svg)

[SVG 확대](images/components.svg) · [PNG 다운로드](images/components.png) · [수정할 Mermaid 원본](sources/components.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [main.mjs](../../../desktop/main.mjs), [java-store.mjs](../../../scripts/java-store.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart TB
 UI["web
입력 · 편집 · 미리보기"] -->|HTTP| API["scripts/server.mjs
로컬 API · 작업 조정"]
 DESK["desktop/main.mjs
창 · 메뉴 · 수명 관리"] --> API
 DESK --> AD["계정 · 분류 · 발행 연결 함수"]
 API --> AD
 API --> AI["generate / style / ai
CLI와 공개 자료 수집"]
 API --> LIB["tistory / publication
공개 목록·발행 상태"]
 API --> BR["java-store
프로세스·JSON 변환"]
 BR --> JAVA["Java Main + 10개 담당 클래스"]
 JAVA --> FS[("전용 JSON·사진 자료")]
 LIB --> FS
 API --> PREVIEW["scripts/blog.mjs
Node 본문 검증·파일 미리보기"]
 PREVIEW --> R["web/draft-model / article-renderer
공통 본문 모델·HTML"]
 API --> R
 UI --> R
```

</details>

## Java 기능별 패키지 의존

화살표는 import·호출 방향입니다. post와 prompt는 category의 공통 분류 검증을 사용합니다. 계층별로 의미 없는 상속을 추가하지 않은 현재 구조입니다.

![Java 기능별 패키지 의존](images/packages.svg)

[SVG 확대](images/packages.svg) · [PNG 다운로드](images/packages.png) · [수정할 Mermaid 원본](sources/packages.mmd)

코드 근거: [Main.java](../../../java-backend/src/main/java/com/hdev/assignment/bridge/Main.java), [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java), [PromptService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/PromptService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart TD
 BR["bridge
Main"] --> PO["post
Job · Draft · Snapshot · Storage"]
 BR --> CA["category
CategoryService"]
 BR --> PR["prompt
StyleService · PromptService"]
 BR --> WS["workspace
Workspace"]
 PO --> CA
 PR --> CA
 PO --> WS
 PR --> WS
 CA --> WS
 WS --> CO["common
JsonFiles · AppException"]
 PO --> CO
 PR --> CO
 CA --> CO
 BR --> CO
```

</details>
