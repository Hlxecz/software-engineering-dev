# 유스케이스 다이어그램

[전체 목차](README.md) · [유스케이스 상세](USE_CASES.md) · [HTML 그림 모음](index.html)

사용자가 무엇을 할 수 있는지부터 봅니다. 타원은 기능, 바깥 사각형은 사용자·외부 시스템, 큰 묶음은 앱의 경계입니다. Mermaid flowchart로 UML 유스케이스의 의미를 표현했습니다. 연결선은 참여 관계이며 처리 순서가 아닙니다.

기준: 0.7.4-java.1 · 2026-09-22

## 글 작성·보관 유스케이스

UC-04~11, UC-20. 사진·표지·참고자료를 입력하고 직접 또는 AI로 만든 초안을 편집·보관합니다. 사진을 목록에서 제외하는 것과 글 전체 삭제는 서로 다른 동작입니다. 상세 조건은 USE_CASES.md를 봅니다.

![글 작성·보관 유스케이스](images/uc-writing.svg)

[SVG 확대](images/uc-writing.svg) · [PNG 다운로드](images/uc-writing.png) · [수정할 Mermaid 원본](sources/uc-writing.mmd)

코드 근거: [app.js](../../../web/app.js), [server.mjs](../../../scripts/server.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart LR
 U["사용자"]
 subgraph APP["H.Dev Studio Java · 글 작업"]
 direction TB
 C(["UC-04
새 글 만들기"])
 M(["UC-05
제목·메모·사진 순서 보관"])
 I(["UC-06
사진·별도 표지 올리기"])
 R(["UC-07
참고자료 읽기·붙여넣기"])
 D(["UC-08
직접 초안 작성"])
 S(["UC-09
초안 편집·보관"])
 L(["UC-10
보관함·초안 다시 열기"])
 X(["UC-11
로컬 글 전체 삭제"])
 V(["UC-20
표지·카드·목차·미리보기"])
 end
 W["공개 웹·공개 노션"]
 U --- C & M & I & R & D & S & L & X & V
 R --- W
```

</details>

## 실행·계정·발행 유스케이스

UC-01~03, 12, 14, 18, 19. 로컬 작성은 티스토리 로그인 없이 가능합니다. 계정 목록 읽기·분류 새로 읽기·직접 발행은 Electron에서 제공됩니다. 발행의 공개 결과 검증은 발행에 포함되는 필수 단계입니다.

![실행·계정·발행 유스케이스](images/uc-connections.svg)

[SVG 확대](images/uc-connections.svg) · [PNG 다운로드](images/uc-connections.png) · [수정할 Mermaid 원본](sources/uc-connections.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [main.mjs](../../../desktop/main.mjs), [publication.mjs](../../../scripts/publication.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart LR
 U["사용자"]
 subgraph APP["H.Dev Studio Java · 실행과 외부 연결"]
 B(["UC-01
앱 실행·초기 조회"])
 A(["UC-02
티스토리 계정 연결"])
 S(["UC-03
발행 블로그 선택·전환"])
 AI(["UC-12
AI 선택·연결 확인"])
 C(["UC-14
카테고리 불러오기"])
 L(["UC-18
공개 글 목록 읽기"])
 P(["UC-19
검토한 초안 공개 발행"])
 V(["공개된 제목·본문·사진 검증"])
 P -. "«include»" .-> V
 end
 T["티스토리"]
 CLI["Codex / Claude CLI"]
 U --- B & A & S & AI & C & L & P
 T --- A & C & L & P & V
 AI --- CLI
```

</details>

## AI·지침·CLI 유스케이스

UC-13, 15~17, 21. 말투 분석 결과는 검토 후 사용자가 채택해야 기본 지침에 반영됩니다. CLI는 개발자용 진입점이며 자동 예약 작업은 없습니다.

![AI·지침·CLI 유스케이스](images/uc-prompts.svg)

[SVG 확대](images/uc-prompts.svg) · [PNG 다운로드](images/uc-prompts.png) · [수정할 Mermaid 원본](sources/uc-prompts.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [style.mjs](../../../scripts/style.mjs), [blog.mjs](../../../scripts/blog.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart LR
 U["사용자"]
 DEV["개발자 · CLI 사용자"]
 subgraph APP["H.Dev Studio Java · AI와 글쓰기 지침"]
 G(["UC-13
AI 초안 생성·재생성"])
 B(["UC-15
기본 프롬프트 관리"])
 C(["UC-16
분류별 프롬프트 관리"])
 A(["UC-17
공개 글 말투 분석"])
 INPUT(["입력 사본·적용 지침 고정"])
 CLI(["UC-21
CLI 준비·목록·미리보기"])
 G -. "«include»" .-> INPUT
 end
 AI["Codex / Claude CLI"]
 WEB["공개 블로그"]
 U --- G & B & C & A
 DEV --- CLI
 G --- AI
 A --- AI & WEB
```

</details>
