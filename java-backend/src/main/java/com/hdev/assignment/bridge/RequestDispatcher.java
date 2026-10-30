package com.hdev.assignment.bridge;

import com.google.gson.*;
import com.hdev.assignment.common.*;
import com.hdev.assignment.workspace.Workspace;
import com.hdev.assignment.post.*;
import com.hdev.assignment.category.CategoryService;
import com.hdev.assignment.prompt.*;
import java.nio.file.*;
import static com.hdev.assignment.common.JsonFiles.*;

/** 작업을 담당 서비스로 분배한다. 입출력·잠금·프로토콜 오류는 Main이 맡는다. */
public final class RequestDispatcher {
    private final Workspace workspace;
    private final ExistingPostService existing;
    private final UpdateService updates;
    private final RefinementService refinements;
    public RequestDispatcher(Workspace workspace) {
        this.workspace=workspace;
        JsonRecordStore records=new FileJsonRecordStore(workspace);
        existing=new ExistingPostService(workspace,records);
        updates=new UpdateService(workspace,records,existing);
        refinements=new RefinementService(workspace,new DraftRepository(workspace,new JobRepository(workspace)),records);
    }
    // operation은 할 일의 이름이다. 예: draft.save → DraftRepository.save().
    // 여기서는 담당 객체를 선택하고, 실제 저장 규칙은 각 클래스에 맡긴다.
    public JsonElement dispatch(JsonObject request) throws Exception {
        String operation = str(request, "operation"), id = str(request, "id"), blog = str(request, "blogUrl");
        JsonObject value = request.has("value") && request.get("value").isJsonObject() ? request.getAsJsonObject("value") : new JsonObject();
        JobRepository jobs = new JobRepository(workspace);
        SnapshotService snapshots = new SnapshotService(workspace, jobs);
        return switch (operation) {
            case "health" -> health();
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
            case "job.ready" -> snapshots.ready(id, value.has("allowEmptyImages") && value.get("allowEmptyImages").getAsBoolean());
            case "job.prepare" -> snapshots.prepare(id);
            case "job.list" -> snapshots.list();
            case "draft.save" -> new DraftRepository(workspace, jobs).save(id, value);
            case "storage.inspect", "storage.delete" -> new StorageService(workspace, existing).inspect(request.getAsJsonArray("bases"), id, operation.equals("storage.delete"));
            case "categories.state" -> new CategoryService(workspace).state(blog);
            case "categories.save" -> new CategoryService(workspace).save(blog, request.get("items"));
            case "prompts.state" -> new PromptService(workspace).state(blog);
            case "prompts.save" -> new PromptService(workspace).save(blog, value);
            case "prompts.resolve" -> new PromptService(workspace).resolve(blog, request.get("category"));
            case "style.state" -> new StyleService(workspace).state(str(request, "profileFile"));
            case "style.save" -> new StyleService(workspace).save(str(request, "profileFile"), value, request.getAsJsonObject("analysis"));
            case "style.analysis" -> new StyleService(workspace).analysis();
            case "style.analysis.save" -> new StyleService(workspace).saveAnalysis(value);
            case "existing.read" -> existing.read(id);
            case "existing.save" -> existing.save(id,value);
            case "existing.index.read" -> obj("mapping",existing.index());
            case "existing.index.save" -> existing.saveIndex(value);
            case "existing.backup" -> existing.backup(id,value);
            case "existing.backup.read" -> existing.readBackup(id,value);
            case "existing.reimport" -> existing.reimport(id,value,new DraftRepository(workspace,jobs));
            case "update.state.read" -> updates.state(id);
            case "update.state.save" -> updates.save(id,value);
            case "update.snapshot" -> updates.snapshot(id,value);
            case "update.receipt" -> updates.receipt(id,value);
            case "refinement.read" -> refinements.read(id,value);
            case "refinement.apply" -> refinements.apply(id,value);
            case "refinement.undo" -> refinements.undo(id,value);
            case "style.upgradeDefault" -> new StyleService(workspace).upgradeDefault(value);
            default -> throw new AppException("지원하지 않는 Java 작업: " + operation, 400);
        };
    }
    private JsonObject health() throws Exception {
        java.util.Properties info=new java.util.Properties();
        try (var input=RequestDispatcher.class.getResourceAsStream("/backend.properties")) {
            if (input==null) throw new java.io.IOException("Java 빌드 메타데이터가 없습니다. 다시 빌드해 주세요.");
            info.load(input);
        }
        return obj("backend","java","javaVersion",System.getProperty("java.version"),"root",workspace.root.toString(),"classes",Integer.parseInt(info.getProperty("declarations")));
    }
}
