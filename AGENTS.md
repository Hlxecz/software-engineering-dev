# 소프트웨어공학 과제 저장소 작업 규칙

## 범위와 구조

- 기존 blog-automation v0.7.4 기반의 독립 Java 과제 프로젝트다.
- 이 저장소의 원격은 Hlxecz/software-engineering-dev만 사용한다. 원본 저장소에 push하지 않는다.
- 화면은 web/, Electron은 desktop/, 로컬 API·AI 연결은 scripts/에 있다.
- Java는 java-backend/src/main/java/com/hdev/assignment/의 기능별 패키지에 둔다.
- 직접 작성 Java 선언은 30개 이하이며 현재 11개 클래스다.
- 구조·실행·코드 해설은 README.md와 docs/assignment/README.md에서 시작한다.

## 자료와 저장 규칙

- 개발/웹은 H.Dev Studio Java Dev, 배포는 H.Dev Studio Java의 workspace를 쓴다.
- 자료 위치 재정의에는 HDEV_JAVA_DATA_DIR만 사용하며 원본 HDEV_DATA_DIR를 사용하지 않는다.
- 실제 사진·초안·말투·개인 설정·로그인 자료는 Git과 EXE에 포함하지 않는다.
- 기존 자료를 가져올 때는 별도 복사본을 사용하고 원본을 이동하거나 수정하지 않는다.
- 글·사진·초안·카테고리·프롬프트 관리 API는 실제 Java 저장 모듈로 연결한다.
- JSON 호환성, 경로 제한, 수정 충돌과 기존 상태 보존을 유지한다.

## 글 작성과 발행

- docs/WRITING.md의 분석·작성 규칙을 따른다. 실제 사진을 보고 작성한다.
- 사용자의 검토·지침·카테고리·표지·카드는 재생성 시 유지한다.
- 초안 보관은 로컬 저장이다. 티스토리 공개 발행과 구분한다.
- 실제 사용자가 앱에서 티스토리에 발행을 누른 초안은 공개 발행 의사로 취급한다.
- 구현 검사를 위해 실제 공개 글을 만들거나 기존 글을 수정하지 않는다.
- 사진 업로드, 대상 블로그, 선택 분류와 공개 내용 확인에 성공한 경우에만 성공을 기록한다.
- 제출 이후 결과가 불확실한 상태는 자동 재시도하지 않고 원격 결과를 먼저 확인한다.
- 사용자 글 삭제는 확인된 글의 로컬 자료에만 적용하고 티스토리 게시글은 삭제하지 않는다.

## 실행과 검사

- Windows x64, Node.js 22 이상, JDK 17 이상을 사용한다.
- npm ci, npm run setup, npm run desktop 순서로 준비한다.
- npm test와 변경 기능에 해당하는 Electron 검사를 실행한다.
- 검사에는 임시 자료·모의 AI·모의 편집기를 사용한다.
- Java 빌드는 npm run java:build, 버전 확인은 npm run release:check로 한다.
- package.json과 lock의 버전을 맞춘다. EXE는 필요할 때만 별도로 빌드한다.
- 과거 검증 기록과 이번 변경에서 직접 확인한 결과를 구분한다.
