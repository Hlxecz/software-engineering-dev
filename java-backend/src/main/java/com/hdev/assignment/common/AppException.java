package com.hdev.assignment.common;

/** 화면에 전달할 한국어 오류와 상태 코드. */
public final class AppException extends RuntimeException {
    // Main이 잡아서 JSON으로 보내고 Node가 HTTP 상태로 옮긴다.
    // 400: 입력 문제, 404: 대상 없음, 409: 충돌·현재 처리 불가. 예외는 성공 응답과 구분된다.
    public final int status;
    public AppException(String message, int status) { super(message); this.status = status; }
    public static void require(boolean condition, String message) { require(condition, message, 400); }
    // require(조건, 안내)는 조건이 거짓이면 현재 작업을 중단한다. 아래 줄로 계속 저장하지 않는다.
    public static void require(boolean condition, String message, int status) {
        if (!condition) throw new AppException(message, status);
    }
}
