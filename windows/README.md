# Windows 실행·빌드

Windows 64비트, Node.js 22 이상과 JDK 17 이상을 사용합니다. `desktop/`, `scripts/`, `web/`의 공통 기능 코드를 실행하며, 의존성과 설정은 저장소 루트에서 관리합니다.

## 소스로 실행

저장소 루트의 PowerShell에서 실행합니다.

```powershell
npm.cmd ci
npm.cmd run setup
npm.cmd run desktop
```

`./windows/Start-App.ps1`도 같은 데스크톱 앱을 실행합니다. 처음 실행할 때 의존성과 기본 설정을 준비하며 기존 설정은 유지합니다. 실행 정책으로 스크립트가 차단되면 위 npm 명령을 사용하세요.

웹 개발 화면은 `./windows/Start-Web.ps1` 또는 기존 루트의 `./Start-App.ps1`로 엽니다. 티스토리 계정 연결·사진 발행·기존 글 수정은 데스크톱 앱을 사용합니다.

## EXE 빌드

```powershell
npm.cmd run build:exe
# 같은 명령: ./windows/Build-App.ps1
```

Windows에서 `windows/electron-builder.cjs` 설정을 읽고 `dist/<버전>/windows/`에 무설치 EXE, `SHA256SUMS.txt`, `release.json`을 만듭니다. 빌드 전에 [Java 과제 실행·검사 안내](../docs/assignment/RUN.md)를 통과해야 합니다.

사진·초안·말투·로그인은 `%APPDATA%/H.Dev Studio Java/workspace`와 `persist:hdev-tistory-java` 전용 세션에 보관하며 EXE와 Git에 포함하지 않습니다. 개발 자료는 `H.Dev Studio Java Dev/workspace`로 분리합니다.

[사용 안내](../docs/USAGE.md) · [배포 관리](../docs/RELEASING.md) · [Java 과제 구조](../docs/assignment/ARCHITECTURE.md)

자료 위치는 `HDEV_JAVA_DATA_DIR`, 웹 포트는 `HDEV_JAVA_PORT`로만 재정의합니다. 원본 앱의 자료·포트 환경 변수는 사용하지 않습니다. EXE에는 Java 저장 JAR·Gson·라이선스를 포함하며, 실행할 PC에는 Java 17 이상이 필요합니다.
