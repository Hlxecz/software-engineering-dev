# 다이어그램 검증 기록

[전체 목차](README.md)

기준일: 2026-09-22. 과제 앱 `0.7.4-java.1`, 학습 주석이 포함된 소스 `b04ac03`을 기준으로 작성했습니다.

## 확인 범위

- Mermaid 12.0.0과 프로젝트의 Electron 44.3.0으로 **49개 전부를 실제 렌더링**했습니다. 각 그림을 SVG와 PNG 두 형식으로 저장했습니다.
- 21개 유스케이스마다 상세 시나리오와 시퀀스가 있고, 유스케이스 그림의 기능 ID와 대응하는지 검사합니다.
- 전체 클래스도의 11개 이름을 실제 `.java` 파일 목록과 비교하고, 상세 클래스도의 주요 메서드가 소스에 존재하는지 확인합니다.
- Mermaid 원본과 생성된 SVG의 해시, PNG의 실제 너비·높이, 문서와 HTML의 로컬 링크를 확인합니다.
- 그림 종류별 대표 이미지의 한글·선·배치를 확인하고, HTML 그림 모음의 검색과 작은 화면 배치를 점검합니다.
- 생성·저장·발행은 소스의 실제 호출 순서와 상태를 대조했습니다. JS가 기본 지침을 생성 요청에 조립하는 단계, Java 저장 단계, JS 발행 사본·영수증 단계를 구분했습니다.

## 재검사

```powershell
.\node_modules\.bin\electron.cmd tools/diagrams/render.mjs
node tools/diagrams/check.mjs
```

설치 안내는 [README](README.md)에 있습니다. 검사 결과는 프로젝트의 `.runtime/verification/diagrams-render.json`, `diagrams-check.json`, `diagrams-gallery.json`에 남깁니다. `.runtime`은 Git에 포함하지 않습니다.

## 범위와 한계

이번 변경은 문서·이미지·문서 제작 도구에 한정합니다. 앱 Java/JS/HTML/CSS 및 루트 실행 의존성은 변경하지 않았습니다. 그래서 기존 Java·Electron 기능 검사를 반복하거나 EXE를 다시 빌드하지 않았습니다. 실제 AI 생성과 티스토리 공개 발행도 수행하지 않았습니다.

Mermaid flowchart로 표현한 유스케이스·활동·배포 그림은 의미 전달용 표기입니다. UML 전용 도구의 모든 기호를 사용하는 산출물은 아닙니다. 도메인 관계도는 파일 구조의 개념 모델이며 SQL 스키마가 아닙니다. SOLID 개선 제안도에 나오는 추가 타입은 미구현입니다.
