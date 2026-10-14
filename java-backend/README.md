# Java 저장 모듈

직접 작성한 클래스: **11개**. Java 17 이상, Gson 2.13.2 사용.

```text
java-backend/
├─ src/main/java/com/hdev/assignment/
│  ├─ bridge/Main.java              # Node ↔ Java JSON 연결
│  ├─ common/                      # 공통 입출력·오류
│  │  ├─ AppException.java
│  │  └─ JsonFiles.java
│  ├─ workspace/Workspace.java     # 자료 경로·설정·경로 보호
│  ├─ post/                        # 게시글과 초안
│  │  ├─ JobRepository.java
│  │  ├─ SnapshotService.java
│  │  ├─ DraftRepository.java
│  │  └─ StorageService.java
│  ├─ category/CategoryService.java
│  └─ prompt/                      # 기본·카테고리별 지침
│     ├─ PromptService.java
│     └─ StyleService.java
├─ lib/gson-2.13.2.jar              # 외부 JSON 라이브러리
├─ build/                          # 자동 생성 .class/JAR, Git 제외
└─ README.md
```

처음 코드를 읽는다면 [프로젝트 README](../README.md)와 [코드 따라 읽기](../docs/assignment/CODE_GUIDE.md)를 먼저 보세요. 모든 Java 클래스에 역할·검사 이유를 설명하는 한국어 주석이 있습니다. `Main → DraftRepository → JsonFiles` 순서부터 읽으면 실제 초안 저장이 연결됩니다.

프로젝트 최상위에서 `npm.cmd run java:build`를 실행합니다. Maven/Gradle 설치는 필요 없습니다.
빌드 스크립트는 Gson 버전과 SHA-256을 고정하고, `javac --release 17`로 컴파일합니다.
IntelliJ IDEA/Eclipse에서는 pom.xml을 Maven 프로젝트로 열면 패키지와 Gson 의존성을 인식합니다.
각 Java 파일의 package 이름과 실제 폴더가 일치합니다. 수동으로 구성한다면
`src/main/java`를 Sources Root, `lib/gson-2.13.2.jar`를 의존 라이브러리로 지정하면 됩니다.

Java는 **파일 저장과 저장 규칙**을 담당합니다. JS의 본문 렌더링/AI/발행 코드는 중복 구현하지 않습니다.
JSON 요청 예: `{"root":"C:/자료폴더","operation":"health"}`. 요청은 stdin, 응답은 stdout입니다.
화면에서 저장할 때의 실제 호출은 `scripts/server.mjs → scripts/java-store.mjs → Main → DraftRepository`입니다.
