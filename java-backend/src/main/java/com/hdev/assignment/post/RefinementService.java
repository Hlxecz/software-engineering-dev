package com.hdev.assignment.post;

import com.google.gson.*;
import com.hdev.assignment.common.*;
import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** Main의 자료 잠금 안에서 내용 지문 검사와 저장을 함께 수행한다. */
public final class RefinementService {
    private final Workspace workspace;
    private final DraftStore drafts;
    private final JsonRecordStore records;
    public RefinementService(Workspace workspace, DraftStore drafts, JsonRecordStore records) { this.workspace=workspace; this.drafts=drafts; this.records=records; }
    private Path directory(String id, JsonObject value) throws IOException {
        Path directory=workspace.snapshotDirectory(id,str(value,"directory"));
        require(str(object(workspace.regular(directory.resolve("manifest.json"))),"id").equals(id),"초안 글 ID가 다릅니다.",409);
        return directory;
    }
    public JsonObject read(String id, JsonObject value) throws IOException {
        Path directory=directory(id,value);
        return obj("undo",records.read(directory.resolve("refinement-undo.json"),JsonNull.INSTANCE),"context",records.read(directory.resolve("refinement-context.json"),JsonNull.INSTANCE));
    }
    private String check(Path directory, JsonObject value) throws IOException {
        String digest=sha(Files.readAllBytes(workspace.regular(directory.resolve("draft.json"))));
        require(str(value,"expectedDigest").matches("[a-f0-9]{64}")&&str(value,"expectedDigest").equals(digest),"다듬는 동안 글이 바뀌어 적용하지 않았습니다.",409);
        return digest;
    }
    private FileTransaction transaction(String id, Path directory, JsonObject value) throws IOException {
        List<Path> files=new ArrayList<>();
        for (String name : List.of("draft.json","manifest.json","references-read.json","writing-context.json","review.md","analysis.md","refinement-undo.json","refinement-context.json")) files.add(directory.resolve(name));
        files.add(workspace.existingJob(id).resolve("app.json"));
        if (!str(value,"coverSource").isEmpty()) {
            JsonObject draft=value.getAsJsonObject("draft"); JobRepository.validImageName(str(draft,"cover"));
            files.add(directory.resolve("images").resolve(str(draft,"cover")));
        }
        return new FileTransaction(workspace,files.toArray(Path[]::new)).protectCreatedFiles(directory.resolve("history"));
    }
    public JsonObject apply(String id, JsonObject value) throws IOException {
        Path directory=directory(id,value); check(directory,value);
        JsonObject before=object(workspace.regular(directory.resolve("draft.json")));
        require(value.has("beforeDraft")&&before.equals(value.get("beforeDraft")),"다듬기 원문이 현재 초안과 다릅니다.",409);
        String review=exists(directory.resolve("review.md"))?text(workspace.regular(directory.resolve("review.md"))):"";
        require(textValue(value.get("beforeReview"))&&review.equals(str(value,"beforeReview")),"다듬는 동안 검토 메모가 바뀌었습니다.",409);
        require(value.has("context")&&value.get("context").isJsonObject(),"다듬기 지침을 확인해 주세요.");
        JsonObject patch=value.deepCopy(); patch.addProperty("review",review);
        try (var transaction=transaction(id,directory,patch)) {
            JsonObject result=drafts.save(id,patch);
            String after=sha(Files.readAllBytes(workspace.regular(directory.resolve("draft.json"))));
            records.write(directory.resolve("refinement-undo.json"),obj("draft",before,"review",review,"afterDigest",after));
            records.write(directory.resolve("refinement-context.json"),value.get("context"));
            transaction.commit(); return merge(result,obj("afterDigest",after));
        }
    }
    public JsonObject undo(String id, JsonObject value) throws IOException {
        Path directory=directory(id,value); String digest=check(directory,value);
        JsonElement saved=records.read(directory.resolve("refinement-undo.json"),JsonNull.INSTANCE);
        require(saved.isJsonObject(),"되돌릴 다듬기 원문이 없습니다.",409);
        JsonObject undo=saved.getAsJsonObject();
        require(!Boolean.parseBoolean(str(undo,"undone"))&&digest.equals(str(undo,"afterDigest")),"다듬기 이후 글이 바뀌어 되돌릴 수 없습니다.",409);
        require(undo.has("draft")&&undo.get("draft").equals(value.get("draft")),"되돌릴 원문이 보관 자료와 다릅니다.",409);
        JsonObject patch=value.deepCopy();
        patch.addProperty("review",exists(directory.resolve("review.md"))?text(workspace.regular(directory.resolve("review.md"))):"");
        try (var transaction=transaction(id,directory,patch)) {
            JsonObject result=drafts.save(id,patch);
            JsonObject next=undo.deepCopy(); next.addProperty("undone",true);
            records.write(directory.resolve("refinement-undo.json"),next);
            transaction.commit(); return result;
        }
    }
}
