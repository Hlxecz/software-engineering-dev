package com.hdev.assignment.post;

import com.google.gson.*;
import com.hdev.assignment.common.*;
import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.net.URI;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** 가져온 원문·재사용 매핑·충돌 백업을 보관한다. 원격 접속은 하지 않는다. */
public final class ExistingPostService {
    private final Workspace workspace;
    private final JsonRecordStore records;
    public ExistingPostService(Workspace workspace, JsonRecordStore records) { this.workspace=workspace; this.records=records; }
    public JsonElement read(String id) throws IOException { return records.read(workspace.existingJob(id).resolve("existing-post.json"), JsonNull.INSTANCE); }
    public JsonObject save(String id, JsonObject target) throws IOException {
        validateTarget(target);
        records.write(workspace.existingJob(id).resolve("existing-post.json"), target); return target;
    }
    public void validateTarget(JsonObject target) throws IOException {
        require(target.has("identity") && target.get("identity").isJsonObject(), "기존 글 대상을 확인해 주세요.", 409);
        JsonObject identity=target.getAsJsonObject("identity");
        try {
            URI blog=URI.create(str(workspace.config(),"blogUrl")), url=URI.create(str(identity,"url"));
            String origin=blog.getScheme()+"://"+blog.getHost();
            require("https".equals(blog.getScheme()) && blog.getHost()!=null && blog.getHost().matches("[a-z0-9-]+\\.tistory\\.com") && origin.equals(str(identity,"blogUrl"))
                && "https".equals(url.getScheme()) && Objects.equals(url.getHost(),blog.getHost()) && url.getRawUserInfo()==null && url.getPort()==-1
                && url.getRawQuery()==null && url.getRawFragment()==null && url.getPath().matches("/(?:[0-9]+|entry/[^/]+)"), "현재 블로그와 기존 글 대상이 다릅니다.", 409);
        } catch (IllegalArgumentException error) { throw new AppException("기존 글 주소를 확인해 주세요.",409); }
    }
    public JsonObject index() throws IOException { return records.read(workspace.file("library/imported-posts.json"),obj()).getAsJsonObject(); }
    public JsonObject saveIndex(JsonObject mapping) throws IOException { records.write(workspace.file("library/imported-posts.json"),mapping); return mapping; }
    public void removeFromIndex(String id) throws IOException {
        JsonObject mapping=index();
        for (String key : new ArrayList<>(mapping.keySet())) {
            JsonElement value=mapping.get(key);
            if (value.isJsonPrimitive() && textValue(value) && value.getAsString().equals(id)
                || value.isJsonObject() && str(value.getAsJsonObject(),"id").equals(id)) mapping.remove(key);
        }
        saveIndex(mapping);
    }
    public JsonObject backup(String id, JsonObject value) throws IOException {
        Path directory=workspace.snapshotDirectory(id,str(value,"directory"));
        require(value.has("draft")&&value.get("draft").isJsonObject()&&value.has("target")&&value.get("target").isJsonObject(),"백업 자료를 확인해 주세요.");
        validateTarget(value.getAsJsonObject("target"));
        String filename=System.currentTimeMillis()+"-"+UUID.randomUUID().toString().substring(0,8)+".json";
        Path file=workspace.safe(directory.resolve("conflict-backups").resolve(filename));
        records.write(file,obj("draft",value.get("draft"),"target",value.get("target"),"backedUpAt",now()));
        return obj("filename",filename,"path",file.toString());
    }
    public JsonObject readBackup(String id, JsonObject value) throws IOException {
        Path directory=workspace.snapshotDirectory(id,str(value,"directory"));
        String name=str(value,"name"); require(name.matches("[0-9]+-[a-f0-9]{8}\\.json"),"백업 이름을 확인해 주세요.");
        Path file=workspace.regular(directory.resolve("conflict-backups").resolve(name));
        return records.read(file,JsonNull.INSTANCE).getAsJsonObject();
    }
    public JsonObject reimport(String id, JsonObject value, DraftStore drafts) throws IOException {
        Path directory=workspace.snapshotDirectory(id,str(value,"directory")), job=workspace.existingJob(id);
        String expected=str(value,"expectedDigest");
        require(expected.matches("[a-f0-9]{64}")&&expected.equals(sha(Files.readAllBytes(workspace.regular(directory.resolve("draft.json"))))),"다시 불러오는 동안 초안이 바뀌었습니다. 다시 열어 확인해 주세요.",409);
        JsonElement before=read(id);
        require(before.isJsonObject()&&before.equals(value.get("beforeTarget")),"다시 불러오는 동안 기존 글 연결 정보가 바뀌었습니다.",409);
        require(value.has("existingTarget")&&value.get("existingTarget").isJsonObject()&&value.has("updateState")&&value.get("updateState").isJsonObject(),"다시 불러온 자료를 확인해 주세요.");
        JsonObject target=value.getAsJsonObject("existingTarget"), state=value.getAsJsonObject("updateState");
        validateTarget(target);
        require(Objects.equals(before.getAsJsonObject().get("identity"),target.get("identity")),"다시 불러온 글의 대상이 다릅니다.",409);
        require(str(state,"phase").equals("idle"),"다시 불러온 글의 상태를 확인해 주세요.");
        List<Path> paths=new ArrayList<>();
        for (String name : List.of("draft.json","manifest.json","references-read.json","writing-context.json","review.md","analysis.md")) paths.add(directory.resolve(name));
        for (String name : List.of("app.json","existing-post.json","post-update.json")) paths.add(job.resolve(name));
        if (!str(value,"coverSource").isEmpty()) {
            JsonObject draft=value.getAsJsonObject("draft"); JobRepository.validImageName(str(draft,"cover"));
            paths.add(directory.resolve("images").resolve(str(draft,"cover")));
        }
        try (var transaction=new FileTransaction(workspace,paths.toArray(Path[]::new)).protectCreatedFiles(directory.resolve("history"))) {
            JsonObject result=drafts.save(id,value.deepCopy());
            save(id,target); records.write(job.resolve("post-update.json"),state);
            transaction.commit(); return result;
        }
    }
}
