# 문서 도구

현재 버전은 `windows-upgrade/`를 사용합니다. `diagrams/`와 `assignment1/`의 기존 검사기는 v0.7.4의 코드 계약을 검사하므로 당시 소스에서 실행합니다. 옛 그림·제출본의 보존은 새 검사기가 바이트로 확인합니다.

| 폴더 | 용도 |
|---|---|
| `diagrams/` | Mermaid 그림 49개 렌더링, 이미지·클래스·링크 검사 |
| `assignment1/` | 과제 1의 WBS·도식·HTML 생성, 화면·본문 정합성 검사 |

앱 실행에는 이 도구를 실행할 필요가 없습니다. 생성된 그림과 PDF는 `docs/assignment/`에 있습니다.

```powershell
npm.cmd --prefix tools/diagrams ci
node tools/windows-upgrade/check.mjs
.\node_modules\.bin\electron.cmd tools/windows-upgrade/render.mjs
```

그림을 다시 만들 때는 `diagrams/package.json`의 도구용 의존성과 `assignment1/render.mjs`를 참고하세요. 렌더 세션은 업로드하지 않습니다.
