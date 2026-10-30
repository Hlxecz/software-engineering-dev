# H.Dev Studio Java

**블로그 작성 작업 제어기 · 장형준 · 22413564 · 컴퓨터공학전공**

블로그 작성자, 포트폴리오를 준비하는 학생, 초안 작성이 어려운 사용자를 위한 앱입니다. 사진·메모로 초안을 만들거나 직접 작성하고, 필요한 문단을 다듬어 보관·발행할 수 있습니다.

기존 blog-automation의 작성 화면·AI·티스토리 연결을 활용하고, 글·사진·초안·지침·수정 이력의 관리 책임을 Java 클래스로 구성합니다.

## 과제 1. 프로젝트 관리

| 단계 | 문서 |
|---|---|
| 1 | [대상 제어기 선택](docs/assignment/과제1-프로젝트관리/01-대상제어기선택.md) |
| 2 | [프로젝트 범위와 Java 클래스 구조](docs/assignment/과제1-프로젝트관리/02-프로젝트범위정의.md) |
| 3 | [시스템 문맥도 및 이해관계자](docs/assignment/과제1-프로젝트관리/03-시스템문맥도와이해관계자.md) |
| 4 | [제약사항 조사](docs/assignment/과제1-프로젝트관리/04-제약사항조사.md) |
| 5 | [프로젝트 규모 산정](docs/assignment/과제1-프로젝트관리/05-프로젝트규모산정.md) |
| 6 | [주요 업무 및 WBS](docs/assignment/과제1-프로젝트관리/06-주요업무와WBS.md) |

[전체 목차](docs/assignment/과제1-프로젝트관리/00-목차.md) · [통합 Markdown](docs/assignment/과제1-프로젝트관리/통합보고서.md) · [전체 그림·편집 원본](docs/assignment/과제1-프로젝트관리/다이어그램)

## 시스템 구성

| 영역 | 역할 |
|---|---|
| web/ | 작성 화면·편집·미리보기 |
| scripts/ | 로컬 API·AI·Java 연결 |
| desktop/ | Electron 창·로그인·티스토리 발행·수정 |
| java-backend/ | 글·사진·초안·지침·원문·이력 관리 |
| docs/assignment/과제1-프로젝트관리/ | 단계별 과제 문서와 다이어그램 |

Java는 클래스 17개와 인터페이스 2개로 구성됩니다. Node가 Java 프로세스에 JSON 요청을 전달하며, Java가 처리 결과를 반환합니다.

![Java 클래스 관계도](docs/assignment/과제1-프로젝트관리/다이어그램/02-02.svg)

## 실행

**Windows x64 · Node.js 22 이상 · JDK 17 이상**을 사용합니다.

```powershell
git clone https://github.com/Hlxecz/software-engineering-dev.git
cd software-engineering-dev
npm.cmd ci
npm.cmd run setup
npm.cmd run desktop
```

[Windows 실행 안내](docs/assignment/RUN.md) · [전체 사용법](docs/USAGE.md) · [기능 안내](docs/FEATURES.md) · [코드 따라 읽기](docs/assignment/CODE_GUIDE.md)

## 검사

```powershell
node tools/check-docs.mjs
npm.cmd test
npm.cmd run test:desktop
npm.cmd run test:refine
npm.cmd run test:existing
npm.cmd run test:lifecycle
```

## 원본과 라이선스

[Hlxecz/blog-automation v0.11.1](https://github.com/Hlxecz/blog-automation/releases/tag/v0.11.1)을 기반으로 합니다. [Gson 라이선스](java-backend/LICENSE-gson.txt)와 [Pretendard 라이선스](web/fonts/OFL.txt)를 포함합니다.
