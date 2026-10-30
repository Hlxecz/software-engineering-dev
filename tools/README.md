# 문서 도구

현재 개발 문서는 `windows-upgrade/`, 최신 과제 보고서는 `assignment1/current.mjs`와 `assignment1/check-current.mjs`를 사용합니다. `diagrams/`와 `assignment1/check.mjs`의 기존 검사기는 v0.7.4의 코드 계약을 검사하므로 당시 소스에서 실행합니다. 옛 그림·제출본의 보존과 요청에 따른 기존 HTML 표지 수정 1건은 새 검사기가 바이트로 구분해 확인합니다.

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

## 최신 과제 보고서

`docs/assignment/과제1-프로젝트관리-최신/`의 단계별 Markdown과 `계획자료/업무계획.json`을 편집합니다. 다음 순서로 HTML과 9개 그림을 갱신합니다.

```powershell
node tools/assignment1/current.mjs
.\node_modules\.bin\electron.cmd tools/assignment1/render.mjs docs/assignment/과제1-프로젝트관리-최신
node tools/assignment1/current.mjs
node tools/assignment1/check-current.mjs
```

본문만 수정했다면 그림 렌더링을 생략합니다. 마지막 검사 전에는 생성된 HTML을 A4·배율 100%·머리글/바닥글 없음으로 PDF 출력하고, 전 페이지의 표·그림·페이지 구성을 확인한 뒤 교체합니다. `검증자료/인쇄검사.json`의 통과 상태·HTML/PDF 해시·쪽 수도 새 결과로 갱신합니다. 검사기는 이 기록이 이전 HTML/PDF를 가리키면 실패하며, 외부 서비스나 앱은 실행하지 않습니다.
