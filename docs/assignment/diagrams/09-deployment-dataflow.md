# 배포·데이터 흐름 다이어그램

[전체 목차](README.md) · [유스케이스 상세](USE_CASES.md) · [HTML 그림 모음](index.html)

Windows PC에서 실행되는 프로세스와 파일, 외부로 나가는 데이터의 경계를 봅니다.

기준: 0.7.4-java.1 · 2026-09-22

## Windows 배포와 프로세스

EXE는 Electron·Node·앱 소스 및 저장 JAR/Gson을 포함합니다. Java 런타임은 설치 PC의 Java 17 이상을 사용합니다. 개발은 Node 22 이상과 JDK가 필요합니다. 자료 폴더는 실행 파일과 분리됩니다.

![Windows 배포와 프로세스](images/deployment.svg)

[SVG 확대](images/deployment.svg) · [PNG 다운로드](images/deployment.png) · [수정할 Mermaid 원본](sources/deployment.mmd)

코드 근거: [package.json](../../../package.json), [main.mjs](../../../desktop/main.mjs), [runtime.mjs](../../../scripts/java/runtime.mjs), [workspace.mjs](../../../scripts/workspace.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart LR
 subgraph PC["Windows x64 PC"]
 direction TB
 subgraph EXE["H.Dev Studio Java EXE"]
 MAIN["Electron main + Node HTTP
127.0.0.1 임의 포트"]
 VIEW["Chromium 앱 화면
Node 직접 접근 없음"]
 TWIN["격리된 티스토리 창
메모리 세션"]
 JAR["resources/java-backend
blog-storage.jar + Gson"]
 VIEW <-->|HTTP| MAIN
 MAIN --> TWIN
 end
 JVM["설치된 Java 17+
요청마다 새 프로세스"]
 CLI["설치된 Codex / Claude CLI"]
 DATA[("AppData 전용 workspace
Java / Java Dev")]
 MAIN <-->|stdin / stdout JSON| JVM
 JAR -. classpath .-> JVM
 JVM --> DATA
 MAIN --> DATA
 MAIN --> CLI
 end
 TS["티스토리"]
 AI["AI 제공자"]
 TWIN <--> TS
 CLI <--> AI
```

</details>

## 데이터 흐름과 언어 경계

Java가 로컬 글·사진·초안·지침을 보관하는 경로와, JS가 발행용 사본·공개 목록·HTML을 다루는 경로를 나누어 표시했습니다. 전체 파일 I/O를 Java로만 처리한다는 뜻은 아닙니다.

![데이터 흐름과 언어 경계](images/dataflow.svg)

[SVG 확대](images/dataflow.svg) · [PNG 다운로드](images/dataflow.png) · [수정할 Mermaid 원본](sources/dataflow.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [publication.mjs](../../../scripts/publication.mjs), [style.mjs](../../../scripts/style.mjs), [java-store.mjs](../../../scripts/java-store.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart TB
 U["사진·메모·주소·편집 입력"] --> N["JS 검증과 API"]
 N --> J["Java 글·자료 저장"]
 J --> IN[("inbox
원본 재료")]
 IN --> SNAP["Java 입력 사본 준비"]
 SNAP --> OUT[("drafts
고정 입력")]
 STYLE[("style
기본·분류 지침")] --> PROMPT["JS 생성 요청 조립"]
 OUT --> PROMPT
 PROMPT --> AI["AI CLI"]
 AI --> VALID["JS 결과·사진 검증"]
 N --> VALID
 VALID --> SAVE["Java 초안·이력 보관"]
 SAVE --> DRAFT[("draft.json · history
writing-context")]
 DRAFT --> R["JS 공통 렌더러"]
 R --> UI["화면·preview.html"]
 DRAFT --> PUB["JS 발행 사본과 상태"]
 PUB --> TS["Electron → 티스토리"]
 TS --> REC[("JS 공개 확인·영수증")]
```

</details>
