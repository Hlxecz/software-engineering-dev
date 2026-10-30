# 그림으로 이해하는 H.Dev Studio Java

> 이 모음은 v0.7.4의 49개 설계 그림을 보존한 자료입니다. 현재 클래스·다듬기·기존 글 수정은 [최신 설계와 그림](../windows-v0.11.1/README.md)을 기준으로 읽습니다.

**49개 다이어그램과 21개 유스케이스 상세 설명**을 모았습니다. [HTML 그림 모음](index.html)을 브라우저에서 열면 검색·확대하면서 읽을 수 있습니다. 인터넷 연결이나 Mermaid 확장 설치 없이 완성된 SVG·PNG 그림을 볼 수 있습니다.

기준: **0.7.4-java.1 / Java 클래스 11개 / 2026-09-22**. [Lumia 참고 종류와 대응표](REFERENCE.md)를 바탕으로 실제 코드에 맞춰 새로 그렸습니다. 기존 화면·기능과 Java 코드는 변경하지 않았습니다.

## 처음에는 이 다섯 그림부터

1. [글 작성 유스케이스](images/uc-writing.svg): 내가 이 앱으로 무엇을 하는가?
2. [시스템 문맥도](images/system-context.svg): 앱이 누구와 데이터를 주고받는가?
3. [Java 전체 클래스](images/classes-overview.svg): 11개 클래스가 어떻게 역할을 나누는가?
4. [UC-09 초안 보관 시퀀스](images/seq-09.svg): 버튼을 누르면 누가 실제 파일을 쓰는가?
5. [발행 상태도](images/state-publication.svg): 왜 결과가 불확실하면 재발행을 막는가?

## 전체 목차

| 문서 | 그림 수 | 읽는 목적 |
|---|---:|---|
| [유스케이스 다이어그램](01-use-cases.md) | 3 | 사용자가 무엇을 할 수 있는지부터 봅니다 |
| [시스템 문맥도](02-system-context.md) | 1 | 앱 전체를 하나의 상자로 보고 주변 사용자·프로그램·서비스와의 관계를 읽습니다. |
| [도메인·파일 관계도](03-domain-model.md) | 1 | 실제 JSON과 폴더의 개념 관계입니다 |
| [전체·패키지별 클래스 다이어그램](04-class-diagrams.md) | 7 | 직접 작성한 Java 클래스 11개를 그렸습니다 |
| [유스케이스별 시퀀스 다이어그램](05-sequences.md) | 21 | 위에서 아래로 호출 순서를 읽습니다 |
| [클라이언트·서버·작업 상태 다이어그램](06-state-machines.md) | 6 | 실제 phase 값과 설명을 위한 개념 상태를 구분했습니다 |
| [활동 다이어그램](07-activities.md) | 3 | 조건에 따라 어떤 작업이 이어지는지 봅니다 |
| [컴포넌트·패키지 다이어그램](08-components-packages.md) | 2 | 어떤 모듈이 누구를 호출하는지와 폴더 간 의존 방향을 보여 줍니다 |
| [배포·데이터 흐름 다이어그램](09-deployment-dataflow.md) | 2 | Windows PC에서 실행되는 프로세스와 파일, 외부로 나가는 데이터의 경계를 봅니다. |
| [화면 이동·프로토타입](10-ui-flow.md) | 1 | 현재 화면과 이동 관계를 정리했습니다 |
| [디자인 패턴·SOLID 적용 범위](11-patterns-solid.md) | 2 | 현재 구현을 설명하는 그림과 아직 구현하지 않은 개선 제안을 분리했습니다 |

- [유스케이스 21개 상세](USE_CASES.md): 사전 조건·성공 흐름·예외·결과·기능 누락 확인표
- [참고 자료와 표기 설명](REFERENCE.md): Lumia 문서별 대응과 현재 구현/제안 구분
- [검증 기록](VERIFICATION.md): 렌더링·링크·코드 일치 확인
- [코드 따라 읽기](../CODE_GUIDE.md): Java 문법과 실제 파일 저장 설명

## 저장 구조

```text
diagrams/
├─ README.md / index.html       읽기 시작점·오프라인 그림 모음
├─ USE_CASES.md                 기능 21개의 상세 시나리오
├─ REFERENCE.md                 Lumia 참고 종류와 대응표
├─ 01-...md ~ 11-...md          종류별 그림·설명·실제 코드 링크
├─ catalog.json                그림 제목·설명·코드 근거·분류
├─ sources/*.mmd               수정 가능한 Mermaid 원본 49개
└─ images/*.svg, *.png          문서·발표에 넣을 완성 그림 각 49개
```

SVG는 확대해도 선명하고, PNG는 발표 슬라이드에 바로 넣기 쉽습니다. 각 Markdown에는 완성 그림과 접어서 보는 Mermaid 코드가 함께 있습니다. 이미지가 너무 작으면 SVG 확대 링크를 누르세요.

## 수정하고 다시 그리기

프로젝트 루트에서 실행합니다. 앱 의존성이 이미 설치되어 있으면 첫 줄은 생략할 수 있습니다. 렌더러는 화면을 띄우지 않는 별도 Electron 프로세스를 사용하며 실제 앱·AI·티스토리를 실행하지 않습니다.

```powershell
npm.cmd ci
npm.cmd ci --prefix tools/diagrams
.\node_modules\.bin\electron.cmd tools/diagrams/render.mjs
node tools/diagrams/check.mjs
```

그림은 `sources/*.mmd`, 설명·분류·코드 링크는 `catalog.json`을 수정합니다. 렌더러가 종류별 Markdown, SVG, PNG, HTML 모음을 갱신하므로 생성된 01~11 문서만 직접 고치면 다음 렌더링에서 덮어씁니다. 도구 의존성은 `tools/diagrams`에 분리되어 앱과 EXE에 포함되지 않습니다.

## 발표할 때 정확하게 설명하기

“화면과 외부 연결은 JavaScript/Electron, 로컬 글·사진·초안·카테고리·지침 보관은 Java가 담당합니다. Java는 요청마다 실행하고 JSON으로 통신합니다. 책임 분리와 저장 계층을 적용했으며, 인터페이스 기반 의존성 역전은 아직 개선 제안입니다.”
