package com.hdev.assignment.post;

import com.google.gson.*;
import com.hdev.assignment.workspace.Workspace;
import com.hdev.assignment.category.CategoryService;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** 글의 원본 사진, 메모, 목록 순서와 app.json을 관리한다. */
public final class JobRepository {
    // Repository는 저장소라는 뜻이다. 이 클래스는 inbox의 작업 재료를 관리한다.
    // 완성된 본문 draft.json의 저장은 DraftRepository가 맡는다.
    // 생성자로 받은 Workspace를 공유해 모든 기능에 같은 자료 위치·경로 검사 규칙을 적용한다.
    private final Workspace workspace;
    public JobRepository(Workspace workspace) { this.workspace = workspace; }
    // 글 ID 폴더와 images, notes.md를 만든다. 앱 요청에는 제목·순서 목록도 초기화한다.
    // CLI에서 initial 없이 만들면 사용자가 채울 메모 양식을 제공한다.
    public JsonObject create(String id, JsonObject initial) throws IOException {
        Path job = workspace.job(id);
        require(!exists(job), "EEXIST: 이미 존재하는 글입니다.", 409);
        Files.createDirectories(job.resolve("images"));
        String notes = "# 개발 메모 (선택)\n\n- 하려던 작업:\n- 겪은 문제 / 시도한 방법:\n- 실제 결과:\n- 글에 넣고 싶은 내용:\n\n캡처는 images 폴더에 01, 02, 03 순서로 저장하세요.\n";
        writeText(workspace.safe(job.resolve("notes.md")), initial == null ? notes : "");
        if (initial != null) {
            write(workspace.safe(job.resolve("order.json")), new JsonArray());
            String title = str(initial, "title");
            saveMeta(id, obj("title", title.substring(0, Math.min(200, title.length()))));
        }
        return obj("id", id, "job", job.toString(), "images", job.resolve("images").toString());
    }
    public JsonObject meta(String id) throws IOException {
        Path job = workspace.existingJob(id), file = workspace.safe(job.resolve("app.json"));
        return exists(file) ? object(file) : obj("title", "", "updatedAt", Files.getLastModifiedTime(job).toInstant().toString(), "directory", null);
    }
    // app.json은 제목·수정 시각·초안 위치 등 부가 정보다. patch의 항목만 합쳐 기존 확장 필드를 보존한다.
    public JsonObject saveMeta(String id, JsonObject patch) throws IOException {
        JsonObject meta = merge(meta(id), patch); meta.addProperty("updatedAt", now());
        write(workspace.safe(workspace.job(id).resolve("app.json")), meta); return meta;
    }
    // order.json은 화면에서 사용할 사진과 순서다. 목록에서 빠졌다고 원본 사진 파일을 삭제하지 않는다.
    public JsonArray imageNames(String id) throws IOException {
        Path job = workspace.existingJob(id), orderFile = workspace.safe(job.resolve("order.json"));
        if (exists(orderFile)) return com.hdev.assignment.common.JsonFiles.read(orderFile).getAsJsonArray();
        JsonArray names = new JsonArray();
        for (Path image : workspace.children(job.resolve("images"))) {
            if (image.getFileName().toString().matches("(?i).*\\.(png|jpe?g|webp)$")) names.add(image.getFileName().toString());
        }
        return names;
    }
    /** 미리보기용 사진도 Java가 경로를 검사하고 읽는다. HTTP 전송만 Node가 맡는다. */
    // 사진 바이트를 Base64 문자열로 바꿔 JSON에 담는다. Node는 이를 다시 바이트로 바꿔 화면에 전달한다.
    // draft=true이면 입력 스냅샷의 사진, false이면 inbox 원본 사진을 읽는다.
    public JsonObject readImage(String id, JsonObject value) throws IOException {
        String name = str(value, "name"); validImageName(name);
        Path base = value.has("draft") && value.get("draft").getAsBoolean()
            ? workspace.savedDirectory(id, meta(id)) : workspace.existingJob(id);
        require(base != null, "초안 사진을 찾을 수 없습니다.", 404);
        Path image = workspace.safe(base.resolve("images").resolve(name));
        require(exists(image), "파일을 찾을 수 없습니다.", 404);
        byte[] bytes = Files.readAllBytes(workspace.regular(image));
        return obj("bytes", Base64.getEncoder().encodeToString(bytes));
    }
    // 메모·메타데이터와 연결된 초안을 한 묶음으로 읽는다. HTML이나 HTTP 주소는 여기서 만들지 않는다.
    // Node의 readJob()이 이 결과에 사진 URL과 현재 생성·발행 상태를 붙여 화면에 보낸다.
    public JsonObject read(String id) throws IOException {
        Path job = workspace.existingJob(id); JsonObject meta = meta(id);
        Path saved = workspace.savedDirectory(id, meta);
        // Return data, not presentation: URL mapping and transient job state stay in JS.
        JsonObject result = obj("meta", meta, "directory", saved == null ? null : saved.toString(),
            "notes", text(workspace.regular(job.resolve("notes.md"))), "names", imageNames(id),
            "references", readOptional(job, "references.json", new JsonArray()),
            "checked", readOptional(job, "references-check.json", JsonNull.INSTANCE));
        for (String name : List.of("draft.json", "manifest.json", "writing-context.json", "references-read.json")) {
            result.add(name, saved == null ? JsonNull.INSTANCE : readOptional(saved, name, JsonNull.INSTANCE));
        }
        for (String name : List.of("notes.md", "review.md", "analysis.md")) {
            Path file = saved == null ? null : workspace.safe(saved.resolve(name));
            result.addProperty(name, file != null && exists(file) ? text(file) : "");
        }
        return result;
    }
    private JsonElement readOptional(Path directory, String name, JsonElement fallback) throws IOException {
        Path file = workspace.safe(directory.resolve(name)); return exists(file) ? com.hdev.assignment.common.JsonFiles.read(file) : fallback;
    }
    // 제목·메모·순서·선택한 분류를 검사한 뒤 보관한다. 완성된 초안 본문을 저장하는 메서드와 구분한다.
    public JsonObject save(String id, JsonObject value) throws IOException {
        Path job = workspace.existingJob(id);
        require(textValue(value.get("title")) && str(value, "title").length() <= 200 && textValue(value.get("notes")) && str(value, "notes").length() <= 20000, "제목이나 메모 길이를 확인해 주세요.");
        require(value.has("order") && value.get("order").isJsonArray() && array(value, "order").size() <= 20, "사진 목록이 올바르지 않습니다.");
        Set<String> seen = new HashSet<>();
        for (JsonElement name : array(value, "order")) {
            require(textValue(name), "사진 목록이 올바르지 않습니다.");
            String filename = name.getAsString(); validImageName(filename);
            require(seen.add(filename), "사진 목록이 올바르지 않습니다."); workspace.regular(job.resolve("images").resolve(filename));
        }
        JsonObject patch = obj("title", str(value, "title"));
        if (value.has("category")) patch.add("category", value.get("category").isJsonNull() ? JsonNull.INSTANCE : CategoryService.normalize(value.get("category"), str(workspace.config(), "blogUrl")));
        writeText(workspace.safe(job.resolve("notes.md")), str(value, "notes"));
        write(workspace.safe(job.resolve("order.json")), value.get("order"));
        if (value.has("references")) write(workspace.safe(job.resolve("references.json")), value.get("references"));
        return saveMeta(id, patch);
    }
    // Node가 사진 형식을 확인해 보낸 데이터를 파일로 쓴다. Java도 이름·크기·개수를 검사한다.
    // 별도 표지는 coverUploads에 넣고 AI 입력 순서인 order에는 추가하지 않는다.
    public JsonObject upload(String id, JsonObject value) throws IOException {
        Path job = workspace.existingJob(id); String name = str(value, "name"); validImageName(name);
        JsonObject meta = meta(id); boolean cover = value.has("coverOnly") && value.get("coverOnly").getAsBoolean();
        JsonArray names = cover ? array(meta, "coverUploads") : imageNames(id);
        require(names.size() < 20, "한 글에 사진을 최대 20장까지 보관할 수 있습니다.");
        byte[] bytes = Base64.getDecoder().decode(str(value, "bytes"));
        require(bytes.length > 0 && bytes.length <= 10 * 1024 * 1024, "사진 한 장은 10MB 이하로 올려 주세요.", 413);
        Files.write(workspace.safe(job.resolve("images").resolve(name)), bytes, StandardOpenOption.CREATE_NEW);
        names.add(name); JsonObject patch = new JsonObject();
        if (cover) patch.add("coverUploads", names); else write(workspace.safe(job.resolve("order.json")), names);
        JsonObject labels = meta.has("labels") ? meta.getAsJsonObject("labels") : new JsonObject();
        String label = str(value, "label", name); labels.addProperty(name, label.substring(0, Math.min(200, label.length())));
        patch.add("labels", labels); return saveMeta(id, patch);
    }
    public JsonArray ids() throws IOException {
        JsonArray result = new JsonArray();
        for (Path job : workspace.children(workspace.configured("inbox"))) {
            if (Files.isDirectory(job, LinkOption.NOFOLLOW_LINKS)) result.add(job.getFileName().toString());
        }
        return result;
    }
    public void saveReferencesCheck(String id, JsonElement value) throws IOException { write(workspace.safe(workspace.existingJob(id).resolve("references-check.json")), value); }
    public static void validImageName(String name) {
        require(name.matches("(?i)[^\\\\/:]+\\.(png|jpe?g|webp)") && !name.equals(".") && !name.equals(".."), "사진 경로가 올바르지 않습니다.");
    }
}
