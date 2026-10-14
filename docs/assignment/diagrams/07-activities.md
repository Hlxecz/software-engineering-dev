# 활동 다이어그램

[전체 목차](README.md) · [유스케이스 상세](USE_CASES.md) · [HTML 그림 모음](index.html)

조건에 따라 어떤 작업이 이어지는지 봅니다. Mermaid flowchart로 활동·판단·종료를 표현했습니다.

기준: 0.7.4-java.1 · 2026-09-22

## AI 생성 활동

준비·검증·보관 순서를 보여 줍니다. 실패 시 자동으로 실제 공개 발행에 이어지지 않습니다.

![AI 생성 활동](images/activity-generation.svg)

[SVG 확대](images/activity-generation.svg) · [PNG 다운로드](images/activity-generation.png) · [수정할 Mermaid 원본](sources/activity-generation.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [generate.mjs](../../../scripts/generate.mjs), [SnapshotService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/SnapshotService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart TD
 A(["초안 만들기 클릭"]) --> B{"진행 중 작업 없음?"}
 B -- 아니요 --> X["409 안내 후 종료"]
 B -- 예 --> C{"사진 있음?"}
 C -- 아니요 --> Y["사진 추가 안내"]
 C -- 예 --> E["기본·분류별 지침 고정"]
 E --> D["ready·prepare 입력 사본"]
 D --> F["202 응답 · 참고자료 수집 · AI CLI 실행"]
 F --> G{"결과와 사진 검증 성공?"}
 G -- 아니요 --> H["error · 재시도 안내"]
 G -- 예 --> I["사용자 분류·카드·유효 표지 유지"]
 I --> J["Java 초안·이력·지침 기록"]
 J --> K{"저장·렌더링 성공?"}
 K -- 아니요 --> H
 K -- 예 --> L(["done · 사용자 검토"])
```

</details>

## 발행 활동과 중복 방지

expectedDigest는 사용자가 검토한 초안과 디스크 초안의 일치를 확인합니다. 공개 요청 전후에 따라 실패 처리가 달라집니다.

![발행 활동과 중복 방지](images/activity-publication.svg)

[SVG 확대](images/activity-publication.svg) · [PNG 다운로드](images/activity-publication.png) · [수정할 Mermaid 원본](sources/activity-publication.mmd)

코드 근거: [publication.mjs](../../../scripts/publication.mjs), [publish.mjs](../../../desktop/publish.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart TD
 A(["발행 버튼"]) --> B{"published / 실행 중?"}
 B -- 예 --> C["기존 상태 반환"]
 B -- 아니요 --> D{"uncertain?"}
 D -- 예 --> E["재발행 차단·글 관리 확인"]
 D -- 아니요 --> F["초안 해시·대상·태그·사진 검증"]
 F --> G["발행 사본 생성"]
 G --> H["로그인·사진 업로드·편집기 입력"]
 H --> I["submittedAt 기록"]
 I --> J["공개 발행 요청"]
 J --> K{"공개 내용 검증 성공?"}
 K -- 예 --> L(["published · 영수증 기록"])
 K -- 아니요 --> E
 H -- 제출 전 실패 --> M["failed · 사용자 재시도 가능"]
 J -- 결과 불확실 --> E
```

</details>

## 로컬 삭제 활동

삭제 전 검증에서 막히면 삭제를 시작하지 않습니다. 실제 파일 삭제 도중 OS 오류가 생기면 일부 삭제가 남을 수 있으므로 전체 원자성을 주장하지 않습니다.

![로컬 삭제 활동](images/activity-deletion.svg)

[SVG 확대](images/activity-deletion.svg) · [PNG 다운로드](images/activity-deletion.png) · [수정할 Mermaid 원본](sources/activity-deletion.mmd)

코드 근거: [server.mjs](../../../scripts/server.mjs), [StorageService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/StorageService.java), [Workspace.java](../../../java-backend/src/main/java/com/hdev/assignment/workspace/Workspace.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
flowchart TD
 A(["삭제 확인 클릭"]) --> B{"이 글 수정 가능?"}
 B -- 아니요 --> X["진행 작업 안내"]
 B -- 예 --> C["inbox/id · drafts/id 대상 계산"]
 C --> D["두 경로와 전체 트리를 모두 검사"]
 D --> E{"경로 이탈·링크·특수 파일 없음?"}
 E -- 아니요 --> F["삭제 시작 전 오류 반환"]
 E -- 예 --> G["용량 집계 후 파일·하위 폴더부터 삭제"]
 G --> H{"OS 삭제 성공?"}
 H -- 예 --> I(["삭제한 용량 반환 · 목록 갱신"])
 H -- 아니요 --> J["오류 반환 · 일부 삭제 가능"]
```

</details>
