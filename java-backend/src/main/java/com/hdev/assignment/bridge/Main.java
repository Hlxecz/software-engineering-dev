package com.hdev.assignment.bridge;

import com.google.gson.*;
import com.hdev.assignment.common.*;
import com.hdev.assignment.workspace.Workspace;
import java.nio.charset.StandardCharsets;
import java.nio.channels.FileChannel;
import java.nio.file.*;
import static com.hdev.assignment.common.JsonFiles.*;

/** Electron/Node가 시작하는 Java 진입점. stdout은 JSON 응답 전용이다. */
public final class Main {
    // 학습 4: Node의 javaStore()가 이 메서드로 시작하는 Java 프로세스를 실행한다.
    // 요청 JSON 한 개를 stdin(표준 입력)으로 받고, 응답 JSON 한 개를 stdout(표준 출력)으로 보낸 뒤 종료한다.
    // Java 웹 서버를 띄우는 방식이 아니다. 화면과 직접 통신하는 HTTP 서버는 Node가 담당한다.
    public static void main(String[] args) {
        JsonObject response;
        try {
            JsonObject request = JsonParser.parseString(new String(System.in.readAllBytes(), StandardCharsets.UTF_8)).getAsJsonObject();
            Workspace workspace = new Workspace(str(request, "root"));
            // 같은 자료 폴더를 쓰는 Java 요청끼리 순서를 지키도록 파일 잠금을 건다.
            // try (...)는 성공·실패에 관계없이 잠금과 파일 채널을 자동으로 닫는다.
            try (var channel = FileChannel.open(workspace.file(".java-store.lock"), StandardOpenOption.CREATE, StandardOpenOption.WRITE);
                 var lock = channel.lock()) {
                response = obj("ok", true, "result", new RequestDispatcher(workspace).dispatch(request));
            }
        } catch (Exception error) {
            int status = error instanceof AppException app ? app.status : 500;
            String message=error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
            if (error.getSuppressed().length>0) message+=" 저장 복원 중 오류도 있어 보관 자료 확인이 필요합니다.";
            response = obj("ok", false, "status", status, "error", message);
        }
        // stdout에 안내 문구를 섞으면 Node의 JSON.parse가 실패한다. 진단 로그는 stderr를 사용한다.
        System.out.print(compact(response));
    }
}
