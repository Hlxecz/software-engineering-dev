# 기능별 검증 기록

> 아래는 v0.7.4까지의 과거 검사 기록입니다. 0.11.1-java.1의 직접 실행 결과는 [최신 검증 기록](windows-v0.11.1/VERIFICATION.md)에 있습니다.

## 다이어그램 문서 추가 — 2026-09-22

유스케이스·클래스·시퀀스·상태 등 49개 그림을 SVG·PNG로 실제 렌더링했습니다. 기능 21개의 시나리오와 시퀀스 대응, Java 클래스 11개와 주요 메서드, 문서 링크, HTML 검색·작은 화면을 확인했습니다. [상세 검증 기록](diagrams/VERIFICATION.md)과 [전체 그림 목차](diagrams/README.md)에 결과를 모았습니다. 앱 실행 코드·루트 의존성은 변경하지 않았습니다.

## 학습용 설명 추가 — 2026-09-22

README와 [코드 따라 읽기](CODE_GUIDE.md)를 보강하고, Java 클래스 11개와 화면·서버 연결부를 포함한 소스 파일 28개에 한국어 주석 76곳을 추가했습니다. 버전은 `0.7.4-java.1`을 유지합니다.

- 추가한 주석만 메모리에서 제거한 소스를 기존 릴리스 커밋 `c19e254`와 비교해 실행 코드가 같음을 확인했습니다. 원본 파일을 되돌리거나 자료 파일을 수정하는 검사가 아닙니다.
- `npm.cmd run test:java`: 실제 Java 통합 검사 **7/7 통과**, 직접 작성 클래스 **11개**.
- 변경한 JavaScript 파일의 문법과 문서의 상대 파일 링크를 검사했습니다.
- 이번 변경은 주석·문서뿐이므로 Electron 전체 회귀 검사와 EXE 재빌드는 반복하지 않았습니다. 아래 실행 파일·해시·화면 검증 결과는 9월 18일 릴리스 기준입니다.

이번 기록은 `.runtime/verification/learning-comments.json`, `learning-java-tests.log`, `learning-docs-audit.json`에 있습니다.

## v0.7.4 릴리스 검증 — 2026-09-18

검증일: 2026-09-18. Windows x64, Node.js 22.14.0, JDK **17.0.12**, Electron 44.3.0.
직접 작성한 Java 클래스 **11개**, 기준 소스 v0.7.4 (`2017f6a6763292a13cb5685928ca1523596ffde9`), 과제 버전 **0.7.4-java.1**.

## 결과

| 검사 | 결과 | 범위 |
|---|---|---|
| `npm.cmd test` | **86/86 통과** | 원본 79개 + 추가 Java 통합 7개 |
| Java 통합 검사 (`npm test`에 포함) | **7/7 통과** | 실제 Java 실행·사진 읽기·호환·자료 격리·블로그 전환·오류 전달 |
| `npm.cmd run test:desktop` | v0.7.3에서 통과, 코드 동일 | 이번 원본에서 발행 코드·검사 변경 없음 |
| `npm.cmd run test:categories` | **통과** | 카테고리 읽기·보관·재열기·실패 복구·작은 화면 |
| `npm.cmd run test:writing` | **통과** | 지침 5종·별도 저장·충돌·생성 적용·기본값 보존 |
| `electron validation/electron-style.mjs` | v0.7.3에서 통과, 코드 동일 | 이번 원본에서 말투·도움말 화면 변경 없음 |
| `npm.cmd run test:setup` | **통과** | 첫 실행·예시 주소 차단·웹 주소 저장·즉시 반영·자료 보존 |
| `npm.cmd run test:account` | **통과** | 모의 로그인·단일/복수 블로그·계정 전환·연결 이름·취소/오류·작은 화면 |
| `npm.cmd run release:check` | **통과** | 버전·잠금 파일·변경 내역 일치 |
| `npm.cmd run build:exe` | **통과** | Java JAR와 Gson을 포함한 Windows portable EXE |
| 배포 EXE 실행 후 `/api/java` | **통과** | Java 17.0.12 실제 실행, 별도 검사 자료에서 글·사진·초안·지침 저장/조회/삭제 |
| 개발 앱 실행 | v0.7.3에서 통과, 코드 동일 | 이번에는 새 portable EXE로 실제 Java CRUD 재검증 |

전체 회귀 검사에서 tests=86, pass=86, fail=0, skipped=0을 확인했습니다. 최종 실행은 약 154초입니다. 이번에는 변경된 Electron 검사 4종이 성공 후 정상 종료되는 것까지 확인했습니다. 실제 새 EXE 검사는 `HDEV_JAVA_DATA_DIR`로 프로젝트의 별도 임시 자료를 지정했습니다. 기본 Java/Java Dev 자료 경로와 원본 경로 거부는 자동 검사로 확인했습니다. 사용자 자료를 검사용으로 바꾸지 않았습니다.

검사 로그는 `.runtime/verification/v074-*.log`, 화면은 `.runtime/*-qa/`에 있습니다.

- `v074-source-audit.json`: 11개 클래스, v0.7.4 핵심 파일 24개 일치, 원격 연결 없음, 문서 링크 확인.
- `v074-packaged-health.json`: 실제 Windows EXE에서 Java 17.0.12를 통한 CRUD 확인. 개발 앱의 기존 검증 기록은 `v073-development-health.json`에 보존했습니다.
- `v074-packaging-audit.json`: 포함 소스·설정 42개 일치, 실행용 package 정보 일치, Java JAR/Gson/라이선스 4개 포함, 개인 자료 제외.
- `v074-tests.log`: 전체 회귀 검사. Electron은 `v074-electron-*.log`, 빌드는 `v074-build-exe.log`.

실행 파일: `dist/0.7.4-java.1/HDev-Studio-0.7.4-java.1-win-x64.exe` (101,627,349 bytes).

SHA-256: `89944c4d4a5d15ed583fe7d200e4b2a39c5694cd7daabf9e4d09cc731a5fded8`.

같은 폴더의 `release.json`과 `SHA256SUMS.txt`에서도 확인할 수 있습니다. 이전 0.7.3-java.1 구현과 검증 기록은 `checkpoint/java-before-v0.7.4` 태그의 `79b0276` 커밋에 보존했습니다. v0.7.0 Java 구현은 로컬 `checkpoint/java-before-v0.7.3` 태그의 `fe59351` 커밋에 보존했습니다.

## 기능별 확인

| 기능 | 확인한 내용 |
|---|---|
| 새 글·메모·사진 | 실제 Java 생성/저장, 한글·이모지, 사진 순서, 재조회 |
| 입력 버전 | 기존 SHA-256 규칙, 같은 입력 재사용, 원본 수정 감지 |
| 수동 초안·편집 | 실제 API 저장·재열기, 잘못된 본문 저장 시 이전 초안 보존 |
| AI 생성 | 모의 AI 입력과 생성 지침 고정, 민감 이미지 제외, 실패 시 이전 초안 복구 |
| 표지·GitHub 카드 | 저장·재열기·재생성 유지, 이미지 순서와 중복, 발행 사본 보존 |
| 본문 표시 | 목차·스킨 모드, 코드·표·팁·주의, 본문과 사진 검증 |
| 참고자료 | URL 검사, 공개 본문/노션 처리, 붙여넣기, 읽기 중 잠금, 보고서 |
| 카테고리 | 블로그·ID·전체 경로, 중복 이름, 부모/자식, 없음 기본값, 목록 실패 보존 |
| 프롬프트 | 기본/카테고리 분리, 저장·해제·재시작, 길이 제한, 다른 창 충돌 |
| 말투 | 기본 지침 수정·이력, 분석 결과 채택·복구, 모의 공개 글/AI 실패 보존 |
| 보관함·삭제 | 용량, 제외 사진·모든 버전·이력 제거, 다른 글 보존, 생성/발행 중 차단 |
| 경로 보호 | 자료 폴더 이탈, 예약 ID, 심볼릭 링크·Windows 정션 차단 |
| 자료 복사 | 예전 절대경로를 복사본으로 해석, 확장 필드 보존, 원본 파일 불변 |
| Java 필수 연결 | Java 실행 파일을 없게 지정하면 HTTP 503, JS 대체 저장 없음 |
| 동시 지침 저장 | Java 두 프로세스가 같은 revision으로 저장 시 하나만 성공 |
| 발행 | 모의 사진 첨부·본문·태그·카테고리·공개 설정·단일 제출·결과 확인 |
| 중복·복구 | 진행 중 중복 클릭, 공개 완료 재전송 금지, 불확실 상태 판정 |
| 블로그 전환 | 같은 카테고리 번호를 가진 다른 블로그 지침 분리, 이전 지침 복원, 초안·사진 파일 해시와 기본 지침 보존 |
| 사진 실제 읽기 | 원본·초안 사진 HTTP 응답의 바이트 일치, Java 누락 시 503, 잘못된 경로 거부 |
| 계정 연결 | 로그인 중 저장 잠금·단일 자동 연결·복수 선택·다른 계정 목록·취소·빈 목록·변경된 DOM |
| 원본 보존 | Git remote 없음, 별도 branch/폴더, 원본 앱 자료 위치 사용 안 함 |

## 원본 화면과 연결 코드 보존

v0.7.3→v0.7.4에는 앱 실행 코드와 Java 코드 변경이 없습니다. 9월 18일 업그레이드에서는 검사 종료 처리·버전·문서를 갱신했습니다.

다음 경로는 릴리스 커밋 기준 `git diff upstream-v0.7.4 c19e254 -- ...` 결과가 비어 있습니다. 9월 22일에는 이 중 일부에 학습용 주석을 추가했으며, 실행 코드는 그대로입니다.

```text
web/
desktop/account.mjs
desktop/publish.mjs
scripts/blog-settings.mjs
scripts/tistory.mjs
scripts/ai.mjs
scripts/generate.mjs
scripts/publication.mjs
```

따라서 UI, AI 실행 방식, 티스토리 브라우저 연결과 공개 확인 코드는 v0.7.4 원본과 같습니다. 저장 경로와 앱 식별자를 바꾸는 `desktop/main.mjs`, Java에 연결하는 저장/API 모듈은 변경했습니다.

## 화면 확인 자료

- `.runtime/style-qa/workspace-expanded.png`: 원래 작업실 배치
- `.runtime/style-qa/workspace-collapsed.png`: 접힌 사이드바
- `.runtime/style-qa/style-settings.png`: 기본 말투 설정
- `.runtime/style-qa/ai-help-codex.png`, `ai-help-claude.png`: AI 도움말
- `.runtime/category-qa/desktop.png`, `mobile.png`: 카테고리
- `.runtime/writing-prompts-qa/desktop.png`, `mobile.png`: 카테고리별 프롬프트

작업실과 프롬프트 화면은 저장한 스크린샷을 직접 열어 배치와 한국어 표시를 확인했습니다.

- `.runtime/account-qa/connected.png`, `mobile.png`: 연결 이름·블로그 선택
- `.runtime/blog-setup-qa/desktop.png`, `mobile.png`: 첫 실행 주소 설정

계정 연결의 데스크톱과 작은 화면 스크린샷도 직접 열어 한국어 표시·버튼·모달 배치를 확인했습니다.

## 검증 한계

실제 AI 계정으로 유료 생성을 하거나 실제 티스토리에 테스트 글을 공개 발행하지 않았습니다. 모의 AI/편집기 통과는 실제 서비스의 로그인·생성 품질·공개 발행 성공을 증명하지 않습니다. 해당 부분은 본인 계정과 현재 서비스 화면에서 확인해야 합니다.

외부 공개 글·노션은 모의 응답과 기존 자동 검사로 로직을 확인했습니다. 모든 실제 사이트의 최신 HTML 구조를 실시간으로 점검한 것은 아닙니다. 원본의 사용자 사진이나 개인 초안을 검사 자료로 사용하지 않았습니다.
