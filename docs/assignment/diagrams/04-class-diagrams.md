# 전체·패키지별 클래스 다이어그램

[전체 목차](README.md) · [유스케이스 상세](USE_CASES.md) · [HTML 그림 모음](index.html)

직접 작성한 Java 클래스 11개를 그렸습니다. 실선 화살표는 필드로 보유하는 참조, 점선 화살표는 생성·호출 의존성, 빈 삼각형은 실제 상속입니다. 주요 메서드만 표시하며 공통 JsonFiles/AppException 의존성은 일부 그림에서 생략합니다.

기준: 0.7.4-java.1 · 2026-09-22

## Java 11개 클래스 전체 관계

Main은 요청을 분배하고, 저장 담당 클래스들은 Workspace를 공유합니다. DraftRepository와 SnapshotService는 JobRepository를 생성자로 받습니다. 현재 별도 저장 인터페이스·Spring·JPA는 없습니다.

![Java 11개 클래스 전체 관계](images/classes-overview.svg)

[SVG 확대](images/classes-overview.svg) · [PNG 다운로드](images/classes-overview.png) · [수정할 Mermaid 원본](sources/classes-overview.mmd)

코드 근거: [Main.java](../../../java-backend/src/main/java/com/hdev/assignment/bridge/Main.java), [DraftRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/DraftRepository.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
classDiagram
direction TB
class Main {
 +main(args)
 -dispatch(workspace, request)
 }
class Workspace {
 +Path root
 +config()
 +safe(value)
 +configured(key)
 +savedDirectory(id, meta)
 +regular(file)
 }
class JsonFiles {
 +obj(pairs)$
 +read(file)$
 +write(file, value)$
 +writeText(file, value)$
 +compact(value)$
 +sha(bytes)$
 }
class AppException {
 +int status
 +require(condition, message)$
 }
class JobRepository {
 -Workspace workspace
 +create(id, initial)
 +save(id, value)
 +read(id)
 +saveMeta(id, patch)
 +upload(id, value)
 +readImage(id, value)
 }
class SnapshotService {
 -Workspace workspace
 -JobRepository jobs
 -input(id)
 +ready(id)
 +prepare(id)
 +list()
 }
class DraftRepository {
 -Workspace workspace
 -JobRepository jobs
 +save(id, value)
 }
class StorageService {
 -Workspace workspace
 +inspect(bases, id, delete)
 }
class CategoryService {
 -Workspace workspace
 +normalize(value, blogUrl)$
 +state(blog)
 +save(blog, items)
 }
class PromptService {
 -Workspace workspace
 +state(blog)
 +save(blog, value)
 +resolve(blog, category)
 }
class StyleService {
 -Workspace workspace
 +state(profilePath)
 +save(profilePath, value, analysis)
 +analysis()
 +saveAnalysis(value)
 }

 Main ..> Workspace : 생성
 Main ..> JobRepository : 생성
 Main ..> SnapshotService : 생성
 Main ..> DraftRepository : 생성
 Main ..> StorageService : 생성
 Main ..> CategoryService : 생성
 Main ..> PromptService : 생성
 Main ..> StyleService : 생성
 JobRepository --> Workspace
 SnapshotService --> Workspace
 SnapshotService --> JobRepository
 DraftRepository --> Workspace
 DraftRepository --> JobRepository
 StorageService --> Workspace
 CategoryService --> Workspace
 PromptService --> Workspace
 StyleService --> Workspace
 Workspace ..> JsonFiles
 Workspace ..> AppException
 JobRepository ..> CategoryService
 DraftRepository ..> CategoryService
 PromptService ..> CategoryService
```

</details>

## bridge · 요청 진입점

Main.main은 stdin JSON을 읽고 자료 폴더별 파일 잠금을 획득합니다. dispatch는 switch로 작업을 고르며, 성공·실패 모두 stdout JSON 한 개로 돌려줍니다. AppException의 status는 HTTP 응답에 전달됩니다.

![bridge · 요청 진입점](images/classes-bridge.svg)

[SVG 확대](images/classes-bridge.svg) · [PNG 다운로드](images/classes-bridge.png) · [수정할 Mermaid 원본](sources/classes-bridge.mmd)

코드 근거: [Main.java](../../../java-backend/src/main/java/com/hdev/assignment/bridge/Main.java), [java-store.mjs](../../../scripts/java-store.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
classDiagram
direction TB
class Main {
 +main(args)
 -dispatch(workspace, request)
 }
class Workspace {
 +Path root
 +config()
 +safe(value)
 +configured(key)
 +savedDirectory(id, meta)
 +regular(file)
 }
class JobRepository {
 -Workspace workspace
 +create(id, initial)
 +save(id, value)
 +read(id)
 +saveMeta(id, patch)
 +upload(id, value)
 +readImage(id, value)
 }
class DraftRepository {
 -Workspace workspace
 -JobRepository jobs
 +save(id, value)
 }
class AppException {
 +int status
 +require(condition, message)$
 }

 Main ..> Workspace : 자료 위치와 잠금 경로
 Main ..> JobRepository : 글 관련 작업
 Main ..> DraftRepository : draft.save
 Main ..> AppException : 상태 코드 판별
 DraftRepository --> JobRepository
```

</details>

## post · 글·초안·입력 버전·삭제

JobRepository는 작업 재료, DraftRepository는 편집한 초안과 이력, SnapshotService는 입력 사본을 담당합니다. StorageService는 삭제 대상 전체를 검사한 다음 삭제합니다. 저장 담당은 JsonFiles 정적 함수를 사용합니다.

![post · 글·초안·입력 버전·삭제](images/classes-post.svg)

[SVG 확대](images/classes-post.svg) · [PNG 다운로드](images/classes-post.png) · [수정할 Mermaid 원본](sources/classes-post.mmd)

코드 근거: [JobRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/JobRepository.java), [DraftRepository.java](../../../java-backend/src/main/java/com/hdev/assignment/post/DraftRepository.java), [SnapshotService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/SnapshotService.java), [StorageService.java](../../../java-backend/src/main/java/com/hdev/assignment/post/StorageService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
classDiagram
direction TB
class JobRepository {
 -Workspace workspace
 +create(id, initial)
 +save(id, value)
 +read(id)
 +saveMeta(id, patch)
 +upload(id, value)
 +readImage(id, value)
 }
class DraftRepository {
 -Workspace workspace
 -JobRepository jobs
 +save(id, value)
 }
class SnapshotService {
 -Workspace workspace
 -JobRepository jobs
 -input(id)
 +ready(id)
 +prepare(id)
 +list()
 }
class StorageService {
 -Workspace workspace
 +inspect(bases, id, delete)
 }
class Workspace {
 +Path root
 +config()
 +safe(value)
 +configured(key)
 +savedDirectory(id, meta)
 +regular(file)
 }
class JsonFiles {
 +obj(pairs)$
 +read(file)$
 +write(file, value)$
 +writeText(file, value)$
 +compact(value)$
 +sha(bytes)$
 }

 JobRepository --> Workspace
 DraftRepository --> Workspace
 SnapshotService --> Workspace
 StorageService --> Workspace
 DraftRepository --> JobRepository : 현재 초안 위치 갱신
 SnapshotService --> JobRepository : 사진 목록
 JobRepository ..> JsonFiles
 DraftRepository ..> JsonFiles
 SnapshotService ..> JsonFiles
```

</details>

## category · 목록과 분류 검증

CategoryService는 블로그 주소·분류 번호·전체 경로를 정규화합니다. 티스토리 화면에서 목록을 읽는 함수는 Java 클래스가 아니라 Electron에 있습니다. 캐시는 현재 블로그 한 개의 목록입니다.

![category · 목록과 분류 검증](images/classes-category.svg)

[SVG 확대](images/classes-category.svg) · [PNG 다운로드](images/classes-category.png) · [수정할 Mermaid 원본](sources/classes-category.mmd)

코드 근거: [CategoryService.java](../../../java-backend/src/main/java/com/hdev/assignment/category/CategoryService.java), [categories.mjs](../../../scripts/categories.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
classDiagram
direction TB
class CategoryService {
 -Workspace workspace
 +normalize(value, blogUrl)$
 +state(blog)
 +save(blog, items)
 }
class Workspace {
 +Path root
 +config()
 +safe(value)
 +configured(key)
 +savedDirectory(id, meta)
 +regular(file)
 }
class JobRepository {
 -Workspace workspace
 +create(id, initial)
 +save(id, value)
 +read(id)
 +saveMeta(id, patch)
 +upload(id, value)
 +readImage(id, value)
 }
class DraftRepository {
 -Workspace workspace
 -JobRepository jobs
 +save(id, value)
 }
class PromptService {
 -Workspace workspace
 +state(blog)
 +save(blog, value)
 +resolve(blog, category)
 }

 CategoryService --> Workspace
 JobRepository ..> CategoryService : 선택값 검증
 DraftRepository ..> CategoryService : 초안 분류 검증
 PromptService ..> CategoryService : 지침 분류 검증
```

</details>

## prompt · 기본·분류별 글쓰기 지침

두 서비스는 화면이 읽은 revision과 현재 파일 지문을 비교합니다. PromptService.resolve는 주소·ID·전체 경로가 일치하는 지침만 선택합니다. StyleService는 AI를 실행하지 않습니다.

![prompt · 기본·분류별 글쓰기 지침](images/classes-prompt.svg)

[SVG 확대](images/classes-prompt.svg) · [PNG 다운로드](images/classes-prompt.png) · [수정할 Mermaid 원본](sources/classes-prompt.mmd)

코드 근거: [StyleService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/StyleService.java), [PromptService.java](../../../java-backend/src/main/java/com/hdev/assignment/prompt/PromptService.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
classDiagram
direction TB
class PromptService {
 -Workspace workspace
 +state(blog)
 +save(blog, value)
 +resolve(blog, category)
 }
class StyleService {
 -Workspace workspace
 +state(profilePath)
 +save(profilePath, value, analysis)
 +analysis()
 +saveAnalysis(value)
 }
class CategoryService {
 -Workspace workspace
 +normalize(value, blogUrl)$
 +state(blog)
 +save(blog, items)
 }
class Workspace {
 +Path root
 +config()
 +safe(value)
 +configured(key)
 +savedDirectory(id, meta)
 +regular(file)
 }
class JsonFiles {
 +obj(pairs)$
 +read(file)$
 +write(file, value)$
 +writeText(file, value)$
 +compact(value)$
 +sha(bytes)$
 }

 PromptService --> Workspace
 StyleService --> Workspace
 PromptService ..> CategoryService
 PromptService ..> JsonFiles : 파일과 revision
 StyleService ..> JsonFiles : 지침과 이력
```

</details>

## workspace · 경로와 자료 격리

Workspace는 전용 자료 폴더 내부 경로와 일반 파일 여부를 검사합니다. 옛 절대경로가 들어 있는 복사본은 현재 자료 폴더에서 같은 글 ID·해시의 사본으로만 다시 연결합니다.

![workspace · 경로와 자료 격리](images/classes-workspace.svg)

[SVG 확대](images/classes-workspace.svg) · [PNG 다운로드](images/classes-workspace.png) · [수정할 Mermaid 원본](sources/classes-workspace.mmd)

코드 근거: [Workspace.java](../../../java-backend/src/main/java/com/hdev/assignment/workspace/Workspace.java), [workspace.mjs](../../../scripts/workspace.mjs)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
classDiagram
direction TB
class Workspace {
 +Path root
 +config()
 +safe(value)
 +configured(key)
 +savedDirectory(id, meta)
 +regular(file)
 }
class JsonFiles {
 +obj(pairs)$
 +read(file)$
 +write(file, value)$
 +writeText(file, value)$
 +compact(value)$
 +sha(bytes)$
 }
class AppException {
 +int status
 +require(condition, message)$
 }

 Workspace ..> JsonFiles : 설정과 메타데이터 읽기
 Workspace ..> AppException : 경로 조건 위반
```

</details>

## common · JSON과 오류

JsonFiles는 Gson과 Java 표준 파일 기능을 묶은 정적 유틸리티입니다. AppException은 RuntimeException을 실제로 상속합니다. 요청 오류와 메시지를 표현하는 작은 클래스입니다.

![common · JSON과 오류](images/classes-common.svg)

[SVG 확대](images/classes-common.svg) · [PNG 다운로드](images/classes-common.png) · [수정할 Mermaid 원본](sources/classes-common.mmd)

코드 근거: [JsonFiles.java](../../../java-backend/src/main/java/com/hdev/assignment/common/JsonFiles.java), [AppException.java](../../../java-backend/src/main/java/com/hdev/assignment/common/AppException.java)

<details>
<summary>Mermaid 코드 보기</summary>

```mermaid
classDiagram
direction TB
class JsonFiles {
 +obj(pairs)$
 +read(file)$
 +write(file, value)$
 +writeText(file, value)$
 +compact(value)$
 +sha(bytes)$
 }
class AppException {
 +int status
 +require(condition, message)$
 }
class Gson
class Files
class RuntimeException

 JsonFiles ..> Gson : JSON 변환
 JsonFiles ..> Files : 파일 읽기와 교체
 RuntimeException <|-- AppException
```

</details>
