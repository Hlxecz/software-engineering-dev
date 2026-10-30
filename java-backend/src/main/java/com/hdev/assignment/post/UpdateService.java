package com.hdev.assignment.post;

import com.google.gson.*;
import com.hdev.assignment.common.*;
import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** 수정 상태와 고정된 입력 사본을 보관한다. 브라우저·네트워크 처리는 Node에 둔다. */
public final class UpdateService {
    private final Workspace workspace;
    private final JsonRecordStore records;
    private final ExistingPostService existing;
    public UpdateService(Workspace workspace, JsonRecordStore records, ExistingPostService existing) { this.workspace=workspace; this.records=records; this.existing=existing; }
    public JsonObject state(String id) throws IOException { return records.read(workspace.existingJob(id).resolve("post-update.json"),obj("phase","idle")).getAsJsonObject(); }
    public JsonObject save(String id, JsonObject value) throws IOException {
        require(Set.of("idle","checking_remote","waiting_login","uploading","filling","submitting","verifying","stale","updated","failed","uncertain").contains(str(value,"phase")),"수정 단계가 올바르지 않습니다.");
        records.write(workspace.existingJob(id).resolve("post-update.json"),value); return value;
    }
    public JsonObject snapshot(String id, JsonObject value) throws IOException {
        Path directory=workspace.snapshotDirectory(id,str(value,"directory"));
        byte[] draftBytes=Files.readAllBytes(workspace.regular(directory.resolve("draft.json")));
        require(sha(draftBytes).equals(str(value,"expectedDigest")),"초안이 변경됐습니다. 다시 열어 확인해 주세요.",409);
        JsonObject manifest=object(workspace.regular(directory.resolve("manifest.json")));
        require(str(manifest,"id").equals(id),"초안 글 ID가 다릅니다.",409);
        JsonElement targetValue=existing.read(id);
        require(targetValue.isJsonObject(),"기존 글 수정 작업이 아닙니다.",409);
        JsonObject target=targetValue.getAsJsonObject(); existing.validateTarget(target);
        String attempt=Workspace.id(str(value,"attemptId"));
        Path snapshot=workspace.safe(directory.resolve("updates").resolve(attempt));
        require(!exists(snapshot),"이미 존재하는 수정 사본입니다.",409);
        require(value.has("usedImages")&&value.get("usedImages").isJsonArray(),"사용 사진 목록을 확인해 주세요.");
        Map<String,byte[]> images=new LinkedHashMap<>();
        for (JsonElement item : array(value,"usedImages")) {
            require(textValue(item),"사진 이름을 확인해 주세요.");
            String name=item.getAsString(); JobRepository.validImageName(name);
            require(!images.containsKey(name),"사진 목록이 중복됐습니다.");
            byte[] bytes=Files.readAllBytes(workspace.regular(directory.resolve("images").resolve(name)));
            String expected="";
            for (String key : List.of("images","coverImages")) for (JsonElement entry : array(manifest,key)) {
                require(entry.isJsonObject(),"사진 목록을 확인해 주세요.");
                if (name.equals(str(entry.getAsJsonObject(),"name"))) expected=str(entry.getAsJsonObject(),"sha256");
            }
            require(sha(bytes).equals(expected),"보관한 사진이 변경됐습니다. 다시 확인해 주세요.",409);
            images.put(name,bytes);
        }
        try (var transaction=new FileTransaction(workspace,snapshot)) {
            Files.createDirectories(workspace.safe(snapshot.resolve("images")));
            Files.write(workspace.safe(snapshot.resolve("draft.json")),draftBytes,StandardOpenOption.CREATE_NEW);
            records.write(snapshot.resolve("manifest.json"),manifest);
            records.write(snapshot.resolve("existing-post.json"),target);
            for (var image : images.entrySet()) Files.write(workspace.safe(snapshot.resolve("images").resolve(image.getKey())),image.getValue(),StandardOpenOption.CREATE_NEW);
            transaction.commit();
        }
        return obj("directory",snapshot.toString());
    }
    public JsonObject receipt(String id, JsonObject value) throws IOException {
        Path snapshot=workspace.draftDirectory(id,str(value,"directory"));
        Path updates=snapshot.getParent();
        require(updates!=null&&updates.getFileName().toString().equals("updates")&&updates.getParent()!=null,"수정 사본 경로가 올바르지 않습니다.");
        Path original=workspace.snapshotDirectory(id,updates.getParent().toString());
        require(original.getParent().equals(workspace.safe(workspace.configured("output").resolve(id))),"수정 사본 경로가 올바르지 않습니다.");
        Workspace.id(snapshot.getFileName().toString());
        JsonObject manifest=object(workspace.regular(snapshot.resolve("manifest.json")));
        require(str(manifest,"id").equals(id),"수정 사본 글 ID가 다릅니다.");
        JsonObject target=object(workspace.regular(snapshot.resolve("existing-post.json"))); existing.validateTarget(target);
        require(value.has("record")&&value.get("record").isJsonObject(),"수정 결과를 확인해 주세요.");
        JsonObject record=value.getAsJsonObject("record");
        require(str(record,"draftDigest").equals(sha(Files.readAllBytes(workspace.regular(snapshot.resolve("draft.json"))))),"수정 사본이 변경됐습니다.",409);
        records.write(snapshot.resolve("updated-receipt.json"),record); return record;
    }
}
