# Lumia 문서 참고 기록과 대응표

[전체 목차](README.md)

참고 저장소: [Hlxecz/Lumia_Front의 Docs](https://github.com/Hlxecz/Lumia_Front/tree/be251d9c7334c939fa3859797a9d278a67c6950b/Docs). 확인 기준 커밋은 `be251d9c7334c939fa3859797a9d278a67c6950b`, 확인일은 2026-09-22입니다. 문서 종류·목차·기능별 설명 방식을 참고했고, 그림과 내용은 Java 과제 프로젝트 코드에 맞춰 새로 작성했습니다. 참고 저장소에는 쓰지 않았습니다.

## 참고한 종류와 이번 산출물

| Lumia 문서 | 확인한 종류·구성 | 이번 프로젝트 문서 |
|---|---|---|
| [System_Context_Diagram.md](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Conceptualization_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/System_Context_Diagram.md) | 시스템과 사용자·외부 시스템의 관계 | [02-system-context.md](02-system-context.md) |
| [Use_Case_List.md](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Conceptualization_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/Use_Case_List.md) | 기능별 유스케이스 목록 | [USE_CASES.md](USE_CASES.md) |
| [Use_case_analysis.md](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Analysis_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/Use_case_analysis.md) | 사용자·시스템 경계·include 관계를 그린 유스케이스 | [01-use-cases.md](01-use-cases.md) |
| [Use_case_descriptions.md](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Analysis_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/Use_case_descriptions.md) | 사전 조건·트리거·성공·예외·결과 | [USE_CASES.md](USE_CASES.md) |
| [Domain_analysis.md](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Analysis_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/Domain_analysis.md) | 도메인별 역할 설명 | [03-domain-model.md](03-domain-model.md) |
| [User_InterFace_Prototype.md](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Analysis_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/User_InterFace_Prototype.md) | 실제 화면과 화면 설명 | [10-ui-flow.md](10-ui-flow.md) |
| [Class_diagram.md](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/Class_diagram.md) | 전체 클래스 및 패키지별 상세 설명 10종 | [04-class-diagrams.md](04-class-diagrams.md) |
| [Sequence_diagram.md](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/Sequence_diagram.md) | 유스케이스별 시퀀스 이미지 21개와 단계 설명 | [05-sequences.md](05-sequences.md) |
| [State_machine_diagram.md](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/State_machine_diagram.md) | 클라이언트·서버 상태 머신 | [06-state-machines.md](06-state-machines.md) |

활동도, 컴포넌트·패키지 의존도, Windows 배포도, 데이터 흐름도, SOLID 적용·개선 그림은 이 과제를 설명하기 위해 추가했습니다.

## Lumia의 패키지별 클래스 문서 10종 대응

Spring/JPA 계층 이름을 이 프로젝트에 그대로 복사하지 않았습니다. 같은 설명 목적을 실제 존재하는 클래스·모듈로 연결했습니다.

| 참고 문서 | Java 과제에서 설명하는 대상 |
|---|---|
| [PROJECT](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/PROJECT_CLASS_DIAGRAM_DESCRIPTION.md) | 전체 Java 11개 클래스 |
| [ROOT](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/ROOT_CLASS_DIAGRAM_DESCRIPTION.md) | Main과 Electron 시작 흐름 |
| [CONTROLLER](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/CONTROLLER_CLASS_DIAGRAM_DESCRIPTION.md) | Node createApp 라우팅과 Main.dispatch |
| [SERVICE](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/SERVICE_CLASS_DIAGRAM_DESCRIPTION.md) | SnapshotService·StorageService·CategoryService·StyleService·PromptService |
| [REPOSITORY](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/REPOSITORY_CLASS_DIAGRAM_DESCRIPTION.md) | JobRepository·DraftRepository |
| [ENTITY](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/ENTITY_CLASS_DIAGRAM_DESCRIPTION.md) | JSON·폴더의 도메인 관계. 별도 Entity 클래스 없음 |
| [DTO](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/DTO_CLASS_DIAGRAM_DESCRIPTION.md) | stdin/stdout 요청·응답 JSON. 별도 DTO 클래스 없음 |
| [CONFIG](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/CONFIG_CLASS_DIAGRAM_DESCRIPTION.md) | Workspace와 JS 자료 경로·실행 환경 |
| [SECURITY](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/SECURITY_CLASS_DIAGRAM_DESCRIPTION.md) | Workspace 경로 검사, Node 로컬 주소·Origin·X-App-Token, 격리된 티스토리 창. JWT 없음 |
| [EXCEPTION](https://github.com/Hlxecz/Lumia_Front/blob/be251d9c7334c939fa3859797a9d278a67c6950b/Docs/Design_%5B22413564_%EC%9E%A5%ED%98%95%EC%A4%80%5D/class_descriptions/EXCEPTION_CLASS_DIAGRAM_DESCRIPTION.md) | AppException → Main JSON 오류 → Node HTTP 오류 |

## UML 표기와 읽는 기준

- 유스케이스·활동·컴포넌트·배포는 Mermaid flowchart로 의미를 표현합니다. UML 전용 도구의 모든 도형을 엄밀하게 구현한 형식은 아닙니다.
- 유스케이스 include는 반드시 수행하는 하위 기능으로 향합니다. 로그인 상태 확인을 매번 신규 로그인하는 기능으로 잘못 포함시키지 않았습니다.
- 클래스도의 실선은 보유 참조, 점선은 사용 의존성입니다. 여러 클래스가 공유하는 Workspace에 소유권을 뜻하는 합성 다이아몬드를 붙이지 않았습니다.
- 도메인 관계도의 개수 표시는 정상적으로 준비된 파일의 개념 관계입니다. DB 외래키·SQL 스키마 또는 추가 Java 클래스를 뜻하지 않습니다.
- 클라이언트·서버 상태도는 개념 모델, 생성·발행·분석 phase는 실제 코드 값입니다. CLI 상태는 파일을 읽어 계산하는 값입니다.
- SOLID 제안도만 미구현입니다. 이를 현재 클래스 개수나 구현 완료 근거로 사용하지 않습니다.

## 코드 근거

현재 소스 기준은 학습 주석 커밋 `b04ac03`의 `0.7.4-java.1`입니다. 각 그림 아래에 해당 Java/JS 파일 링크를 붙였습니다. 기존 graphify 그래프는 탐색에만 사용했고, Java 이관 이후 코드와 실제 라우트·상태 문자열을 직접 대조했습니다.
