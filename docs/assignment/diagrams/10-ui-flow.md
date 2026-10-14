# 화면 이동·프로토타입

[전체 목차](README.md) · [유스케이스 상세](USE_CASES.md) · [HTML 그림 모음](index.html)

현재 화면과 이동 관계를 정리했습니다. 새 화면을 제안하는 와이어프레임이 아닙니다.

기준: 0.7.4-java.1 · 2026-09-22

## 현재 화면 이동 지도

로컬 작성, 글쓰기 설정, 보관함, 공개 글 탐색, 블로그 연결·AI 도움말의 이동입니다. 발행은 초안을 먼저 검토·보관한 뒤 진행합니다. 세부 화면은 기존 docs/assets/workspace.png도 함께 참고합니다.

![현재 화면 이동 지도](images/ui-navigation.svg)

[SVG 확대](images/ui-navigation.svg) · [PNG 다운로드](images/ui-navigation.png) · [수정할 Mermaid 원본](sources/ui-navigation.mmd)

코드 근거: [index.html](../../../web/index.html), [app.js](../../../web/app.js), [style-settings.js](../../../web/style-settings.js), [main.mjs](../../../desktop/main.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart LR
 START(["앱 시작"]) --> WORK["작업실
사진·메모 / 초안 편집·미리보기"]
 WORK <--> LOCAL["보관함
목록·용량·다시 열기·삭제"]
 WORK <--> PUBLIC["공개 글 목록
블로그·검색·분류 필터"]
 WORK <--> STYLE["글쓰기 설정
기본·분류별 지침·말투 분석"]
 WORK <--> CONNECT["블로그 연결
로그인 / 선택 / 웹 주소 입력"]
 CONNECT --> T["티스토리 별도 창"]
 WORK <--> HELP["AI 도움말
Codex / Claude 선택·설치·로그인"]
 WORK --> SAVE["초안 보관"]
 SAVE --> REVIEW["제목·본문·사진·카테고리 검토"]
 REVIEW --> PUB["티스토리에 발행"]
 PUB --> T
 T -- 로그인 완료 --> CONNECT
 T -- 발행 창의 결과 확인 --> RESULT["공개 결과 / 확인 필요 안내"]
 RESULT --> WORK
```

</details>


## 기존 작업실 화면

![기존 작업실 화면](../../assets/workspace.png)

화면 사용법은 [USAGE.md](../../USAGE.md)를 봅니다.
