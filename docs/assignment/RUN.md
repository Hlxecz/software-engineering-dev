# Windows 실행 안내 · 0.11.1-java.1

## 준비

- Windows 64비트
- Node.js 22 이상 (`node --version`)
- JDK 17 이상 (`java -version`, `javac -version`, `jar --version`)
- 처음 npm 패키지와 Gson을 다운로드할 인터넷 연결

Java는 `--release 17`로 컴파일합니다. JDK 설치 후 JAVA_HOME과 실행 경로를 확인하세요.
Java IDE에서는 `java-backend/pom.xml`을 열면 됩니다. 앱 실행·빌드는 npm으로 연결했으므로 Maven 설치는 필수가 아닙니다.

## 가장 쉬운 실행

`Start-Desktop.cmd`를 더블 클릭합니다. 의존성 설치, Java 빌드, 자료 폴더 준비 후 Electron을 엽니다.
PowerShell에서는 프로젝트 최상위 폴더에서 실행합니다.

```powershell
npm.cmd ci
npm.cmd run setup
npm.cmd run desktop
```

실행 정책 때문에 `npm`이 막히면 위처럼 `npm.cmd`를 사용하세요.
첫 실행의 **내 티스토리 연결 → 티스토리 로그인**에서 본인 계정에 로그인합니다. 블로그가 하나면 자동 연결하고 여러 개면 선택합니다. **블로그 이름 ▾** 버튼에서 선택과 로그인 확인을 다시 할 수 있습니다. 글·카테고리·발행 대상은 재시작 없이 바뀌고 기존 초안·사진·지침은 유지됩니다.
기본값 `https://your-blog.tistory.com`은 미설정 상태로 실제 접속하지 않습니다. 원본의 개인 블로그 정보는 복사하지 않습니다. 연결 창을 닫고 로컬 수동 작성은 바로 할 수 있습니다.

## 웹 개발 화면

```powershell
npm.cmd start
```

[http://127.0.0.1:4174](http://127.0.0.1:4174)를 엽니다. `Start-App.ps1`도 이 화면을 실행합니다.
웹 모드에서는 **내 블로그 설정**에 본인 주소를 입력합니다. 웹에서 Java 저장·편집·AI 연결을 사용할 수 있습니다. 카테고리 새로 읽기와 직접 발행은 Electron에서 지원합니다.

웹 실행 중 Java 연결을 확인합니다.

```powershell
Invoke-RestMethod http://127.0.0.1:4174/api/java
```

`backend: java`, 실제 Java 버전과 자료 폴더가 표시됩니다. Electron은 빈 포트를 사용하므로 개발 `runtime.json`의 origin을 참고합니다.

## 분리된 자료 폴더

| 앱 | 위치 |
|---|---|
| 원본 배포 앱 | `%APPDATA%\H.Dev Studio\workspace` — 사용하지 않음 |
| 원본 개발 앱 | `%APPDATA%\H.Dev Studio Dev\workspace` — 사용하지 않음 |
| 과제 개발/웹 앱 | `%APPDATA%\H.Dev Studio Java Dev\workspace` |
| 과제 배포 EXE | `%APPDATA%\H.Dev Studio Java\workspace` |

원본용 `HDEV_DATA_DIR`와 `TISTORY_APP_PORT`는 이 앱의 자료 위치·포트를 바꾸지 않습니다.
과제 앱의 자료 위치를 바꿀 때는 **새 폴더 또는 별도 복사본**을 지정합니다.

```powershell
$env:HDEV_JAVA_DATA_DIR = 'C:\JavaBlogData\assignment'
npm.cmd run desktop
```

웹과 Electron은 기본 개발 자료를 공유하므로 같은 자료를 동시에 편집하지 말고 하나씩 실행하세요.
웹 포트는 `HDEV_JAVA_PORT`로 바꿀 수 있습니다.

## 기존 v0.7.0~v0.11.1 자료 가져오기

1. 원본 앱과 과제 앱을 종료합니다.
2. 원본의 `workspace` 전체를 **새 폴더에 복사**합니다. 원본은 이동하거나 삭제하지 않습니다.
3. 복사본 `tistory.config.json`에서 경로를 복사본 안의 상대경로로 확인합니다. 기본값은 `inbox`, `drafts`, `style/profile.md`, `style/samples`입니다.
4. `HDEV_JAVA_DATA_DIR`을 복사본으로 지정하고 실행합니다.
5. 보관함에서 글·표지·지침을 확인합니다. 저장은 복사본에만 반영됩니다.

`app.json.directory`에 남은 옛 절대경로는 같은 ID·입력해시의 복사본으로 해석합니다. 이전 폴더가 없어도 복사본이 온전하면 열 수 있습니다. 설정이 자료 폴더 밖을 가리키면 거부합니다. 티스토리·AI CLI 로그인은 별도로 준비합니다.

## AI와 발표 시연

기존 **도움말 · AI 연결**에서 Codex/Claude Code의 설치·로그인을 확인합니다. 자세한 사용법은 [USAGE.md](../USAGE.md)입니다.
발표는 사진 업로드 → **직접 작성하기** → 초안 보관 → 다시 열기로 가능합니다. 실제 AI 생성이나 공개 발행을 시연하려면 본인 계정을 준비하세요. 자동 검사는 실제 공개 글을 만들지 않습니다.

## 검사와 배포

```powershell
npm.cmd test                   # 전체 검사 + Java 연동
npm.cmd run test:java          # Java 호환·격리·연결 검사
npm.cmd run test:desktop       # 모의 티스토리 편집기
npm.cmd run test:categories    # Electron 카테고리 UI
npm.cmd run test:writing       # Electron 프롬프트 UI
npm.cmd run test:setup         # 웹 첫 실행·주소 즉시 반영
npm.cmd run test:account       # 모의 로그인·블로그 선택·취소·보존
npm.cmd run test:refine        # 모의 AI 부분 다듬기·되돌리기
npm.cmd run test:existing      # 모의 기존 글 수정·섹션 편집
npm.cmd run test:lifecycle     # Windows 창·종료·테마·자료 격리
npm.cmd run release:check
npm.cmd run build:exe
```

EXE 위치는 `dist/0.11.1-java.1/windows/HDev-Studio-0.11.1-java.1-win-x64.exe`입니다. Java JAR와 Gson을 포함하지만 Java 런타임 자체는 포함하지 않으므로 실행 PC에도 **Java 17 이상**이 필요합니다. 개발/재빌드에는 JDK가 필요합니다. 같은 버전의 EXE는 덮어쓰지 않습니다.

## 오류 해결

| 상황 | 확인 |
|---|---|
| Java 저장 모듈이 없습니다 | `npm.cmd run java:build` |
| Java 실행 실패 / javac 없음 | JDK 설치 후 터미널 재실행, JAVA_HOME 또는 PATH 확인 |
| 특정 Java 사용 | HDEV_JAVA_BIN에 java.exe 절대경로 지정; 빌드는 JDK javac 사용 |
| 글이 안 보임 | 원본/과제/개발/EXE 자료 폴더 구분 |
| 경로 오류 | 복사본 안 상대경로인지, 정션·심볼릭 링크가 있는지 확인 |
| 지침 수정 충돌 | 화면의 최신 저장본 불러오기 사용 |
| AI 미연결 | 도움말에서 로그인 상태 확인; 수동 작성은 가능 |
| 티스토리 UI 변경 | 기존 편집기 연결이 중단될 수 있음; 모의 검사는 실제 게시 성공과 별개 |

검사 로그·화면은 `.runtime/`, 발표 문서는 `docs/assignment/`, Java 코드는 `java-backend/src/main/java/`에 있습니다.

## 새 기능과 검사 세션

사진 없는 수동 글은 입력 사본에 textOnly로 표시합니다. AI 생성에는 사진이 필요합니다. [AI 다듬기·원문 가져오기·기존 글 수정](../USAGE.md)은 최신 사용법에 있습니다.

자료 폴더 재정의는 HDEV_JAVA_DATA_DIR 하나입니다. 별도 검증에서만 HDEV_JAVA_USER_DATA_DIR로 Electron의 쿠키·창 설정용 세션 경로를 격리할 수 있으며, 이 값은 글의 workspace 위치를 바꾸지 않습니다. 기본 영구 로그인 세션도 원본 앱과 분리합니다.
