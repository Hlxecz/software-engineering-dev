package com.hdev.assignment.bridge;

import com.google.gson.*;
import com.hdev.assignment.common.*;
import com.hdev.assignment.workspace.Workspace;
import com.hdev.assignment.post.*;
import com.hdev.assignment.category.CategoryService;
import com.hdev.assignment.prompt.*;
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
                response = obj("ok", true, "result", dispatch(workspace, request));
            }
        } catch (Exception error) {
            int status = error instanceof AppException app ? app.status : 500;
            response = obj("ok", false, "status", status, "error", error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage());
        }
        // stdout에 안내 문구를 섞으면 Node의 JSON.parse가 실패한다. 진단 로그는 stderr를 사용한다.
        System.out.print(compact(response));
    }
    // operation은 할 일의 이름이다. 예: draft.save → DraftRepository.save().
    // 여기서는 담당 객체를 선택하고, 실제 저장 규칙은 각 클래스에 맡긴다.
    private static JsonElement dispatch(Workspace workspace, JsonObject request) throws Exception {
        String operation = str(request, "operation"), id = str(request, "id"), blog = str(request, "blogUrl");
        JsonObject value = request.has("value") && request.get("value").isJsonObject() ? request.getAsJsonObject("value") : new JsonObject();
        JobRepository jobs = new JobRepository(workspace);
        SnapshotService snapshots = new SnapshotService(workspace, jobs);
        return switch (operation) {
            case "health" -> obj("backend", "java", "javaVersion", System.getProperty("java.version"), "root", workspace.root.toString(), "classes", 11);
            case "job.create" -> jobs.create(id, request.has("value") ? value : null);
            case "job.read" -> jobs.read(id);
            case "job.ids" -> jobs.ids();
            case "job.names" -> jobs.imageNames(id);
            case "job.image" -> jobs.readImage(id, value);
            // 목록의 모든 글과 용량을 한 번의 Java 실행으로 돌려주어 프로세스 시작 횟수를 줄인다.
            case "job.listData" -> {
                JsonArray list = new JsonArray();
                JsonArray bases = new JsonArray(); bases.add(workspace.configured("inbox").toString()); bases.add(workspace.configured("output").toString());
                for (JsonElement entry : jobs.ids()) {
                    String jobId = entry.getAsString();
                    list.add(obj("id", jobId, "data", jobs.read(jobId), "bytes", new StorageService(workspace).inspect(bases, jobId, false).get("bytes")));
                }
                yield list;
            }
            case "job.meta" -> jobs.meta(id);
            case "job.meta.save" -> jobs.saveMeta(id, value);
            case "job.save" -> jobs.save(id, value);
            case "job.upload" -> jobs.upload(id, value);
            case "job.references.check" -> { jobs.saveReferencesCheck(id, value); yield JsonNull.INSTANCE; }
            case "job.directory" -> {
                Path directory = workspace.savedDirectory(id, value);
                yield directory == null ? JsonNull.INSTANCE : new JsonPrimitive(directory.toString());
            }
            case "job.ready" -> snapshots.ready(id);
            case "job.prepare" -> snapshots.prepare(id);
            case "job.list" -> snapshots.list();
            case "draft.save" -> new DraftRepository(workspace, jobs).save(id, value);
            case "storage.inspect", "storage.delete" -> new StorageService(workspace).inspect(request.getAsJsonArray("bases"), id, operation.equals("storage.delete"));
            case "categories.state" -> new CategoryService(workspace).state(blog);
            case "categories.save" -> new CategoryService(workspace).save(blog, request.get("items"));
            case "prompts.state" -> new PromptService(workspace).state(blog);
            case "prompts.save" -> new PromptService(workspace).save(blog, value);
            case "prompts.resolve" -> new PromptService(workspace).resolve(blog, request.get("category"));
            case "style.state" -> new StyleService(workspace).state(str(request, "profileFile"));
            case "style.save" -> new StyleService(workspace).save(str(request, "profileFile"), value, request.getAsJsonObject("analysis"));
            case "style.analysis" -> new StyleService(workspace).analysis();
            case "style.analysis.save" -> new StyleService(workspace).saveAnalysis(value);
            default -> throw new AppException("지원하지 않는 Java 작업: " + operation, 400);
        };
    }
}
