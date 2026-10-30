# 문서 검사

```powershell
node tools/check-docs.mjs
```

현재 과제 문서의 내부 링크, 단계별 문서와 통합본, Java 클래스 관계도, WBS·시간 합계, 다이어그램 원본과 그림의 대응을 확인합니다. 앱 기능 검사는 프로젝트의 `npm test`와 Electron 검사를 사용합니다.

다이어그램은 `docs/assignment/과제1-프로젝트관리/다이어그램/`에서 `.mmd` 원본과 `.svg` 그림을 함께 관리합니다.
