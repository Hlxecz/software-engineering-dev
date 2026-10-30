# Java 저장 모듈 · 0.11.1-java.1

**프로덕션 클래스 17개·인터페이스 2개, 총 19개 선언**입니다. Java 17과 Gson 2.13.2를 사용합니다.

| 패키지 | 역할 |
|---|---|
| bridge | Main의 JSON 입출력·잠금, RequestDispatcher의 작업 분배 |
| workspace | 자료 루트·ID·경로 보호 |
| post | 글·사진·초안·입력 사본·삭제·원문·다듬기·수정 시도 |
| category | 현재 블로그의 카테고리 캐시 |
| prompt | 기본·분류별 지침과 기본값 갱신 |
| common | JSON·오류·저장 계약·파일 구현·요청 실패 복원 |

[전체 클래스 표와 관계도](../docs/assignment/windows-v0.11.1/ARCHITECTURE.md) · [쉬운 코드 해설](../docs/assignment/CODE_GUIDE.md)

프로젝트 최상위에서 실행합니다.

```powershell
npm.cmd run java:build
npm.cmd run test:java
node --test test/java-windows-upgrade.test.mjs test/java-solid-contracts.test.mjs
```

`java:build`는 소스·Gson의 지문을 확인하고 `javac --release 17`로 컴파일합니다. 직접 선언 수를 검사하고 실제 수를 JAR의 `backend.properties`에 기록합니다. `/api/java`도 이 수를 반환합니다. 빌드 출력과 다운로드 JAR는 Git에서 제외합니다.

Java IDE에서는 `pom.xml`을 열 수 있으며 앱 빌드에 Maven 설치는 필요하지 않습니다. 파일의 package와 `src/main/java/` 경로는 일치합니다.

요청은 `{"root":"C:/별도자료폴더","operation":"health"}`처럼 stdin으로 받고 stdout으로 JSON을 응답합니다. 진단 로그를 stdout에 섞지 않습니다. Node의 실제 연결은 `scripts/java-store.mjs`입니다.

두 인터페이스는 `DraftStore`와 `JsonRecordStore`입니다. 실제 저장 구현과 실패 대체 구현으로 원문 보존을 검사합니다. Java 계약 검사 소스는 별도 테스트 폴더에 두며 프로덕션 선언 수에 섞지 않습니다. 테스트 선언을 포함해도 과제 제한 30개 이내입니다.

Java는 HTML 정제·AI 호출·티스토리 브라우저 조작을 하지 않습니다. 해당 공통 JS 기능을 재사용하고, 글·사진·초안·지침 및 새 도메인 기록의 파일 처리를 맡습니다.
