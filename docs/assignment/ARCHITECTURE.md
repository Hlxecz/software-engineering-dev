# 구조와 Java 클래스 관계도

현재 기준은 **0.11.1-java.1 Windows**, 클래스 17개·인터페이스 2개입니다.

- [최신 전체 구조와 19개 선언의 역할](windows-v0.11.1/ARCHITECTURE.md)
- [다듬기·원문 충돌·기존 글 수정 흐름](windows-v0.11.1/FLOWS.md)
- [기능별 언어 분담](windows-v0.11.1/FEATURES.md)
- [코드 따라 읽기](CODE_GUIDE.md)

![실제 Java 클래스 구조](windows-v0.11.1/images/classes.svg)

기존 11개에 대응 인터페이스를 모두 만들지 않았습니다. 실제 실패 검사가 필요한 초안 저장·JSON 기록 계약만 분리하고, 기존 경로 검사·공통 JSON 함수·단순한 분배 방식은 유지합니다.

[v0.7.4 당시 49개 그림](diagrams/README.md)과 [과제 1 PDF](과제1-프로젝트관리/통합보고서.pdf)는 과거 제출·설계 기록입니다. 현재 클래스 수나 기능 설명을 대신하지 않습니다.
