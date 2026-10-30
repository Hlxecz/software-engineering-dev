package com.hdev.assignment.post;

import com.google.gson.*;
import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** 같은 자료는 같은 SHA-256 폴더를 재사용하는 입력 스냅샷. */
public final class SnapshotService {
    private final Workspace workspace;
    private final JobRepository jobs;
    public SnapshotService(Workspace workspace, JobRepository jobs) { this.workspace = workspace; this.jobs = jobs; }
    // 현재 순서의 사진 해시·크기, 메모, 참고자료를 모아 하나의 입력 해시(digest)를 만든다.
    // 여기서 해시를 계산하는 대상은 입력 자료이며 완성된 초안의 본문과는 다르다.
    private JsonObject input(String id, boolean allowEmptyImages) throws IOException {
        Path job = workspace.existingJob(id); JsonArray images = new JsonArray();
        JsonArray names = jobs.imageNames(id);
        if (!exists(workspace.safe(job.resolve("order.json")))) {
            List<String> sorted = new ArrayList<>(); names.forEach(n -> sorted.add(n.getAsString()));
            sorted.sort(SnapshotService::naturalCompare); names = new JsonArray(); for (String n : sorted) names.add(n);
        }
        require(allowEmptyImages || !names.isEmpty(), "images 폴더에 PNG, JPEG 또는 WebP 캡처를 넣으세요: " + job);
        Set<String> seen = new HashSet<>();
        for (JsonElement value : names) {
            require(textValue(value) && seen.add(value.getAsString()), "사진 순서 목록이 올바르지 않습니다.");
            String name = value.getAsString(); JobRepository.validImageName(name);
            byte[] bytes = Files.readAllBytes(workspace.regular(job.resolve("images").resolve(name)));
            require(bytes.length > 0, "빈 이미지 파일입니다: " + name);
            images.add(obj("name", name, "sha256", sha(bytes), "bytes", bytes.length));
        }
        Path note = workspace.safe(job.resolve("notes.md")), refs = workspace.safe(job.resolve("references.json"));
        String notes = exists(note) ? text(workspace.regular(note)) : "";
        JsonArray references = exists(refs) ? read(refs).getAsJsonArray() : new JsonArray();
        JsonObject value = obj("images", images, "notes", notes);
        if (!references.isEmpty()) value.add("references", references);
        String digest = sha(compact(value));
        return obj("digest", digest, "images", images, "notes", notes, "references", references);
    }
    private static int naturalCompare(String a, String b) {
        // Numeric runs compare by value, preserving the 01/02/10 order of legacy CLI imports.
        int i = 0, j = 0;
        while (i < a.length() && j < b.length()) {
            if (Character.isDigit(a.charAt(i)) && Character.isDigit(b.charAt(j))) {
                int x = i, y = j;
                while (i < a.length() && Character.isDigit(a.charAt(i))) i++;
                while (j < b.length() && Character.isDigit(b.charAt(j))) j++;
                int c = new java.math.BigInteger(a.substring(x, i)).compareTo(new java.math.BigInteger(b.substring(y, j)));
                if (c != 0) return c;
            } else { int c = Character.compare(Character.toLowerCase(a.charAt(i++)), Character.toLowerCase(b.charAt(j++))); if (c != 0) return c; }
        }
        int c = Integer.compare(a.length() - i, b.length() - j); return c != 0 ? c : a.compareTo(b);
    }
    // 현재 입력의 지문을 ready.json에 적어 수집 완료 상태를 표시한다. 아직 초안을 만들지는 않는다.
    public JsonObject ready(String id) throws IOException { return ready(id,false); }
    public JsonObject ready(String id, boolean allowEmptyImages) throws IOException {
        JsonObject input = input(id,allowEmptyImages), ready = obj("digest", str(input, "digest"), "readyAt", now());
        if (array(input,"images").isEmpty()) ready.addProperty("textOnly",true);
        write(workspace.safe(workspace.job(id).resolve("ready.json")), ready); return merge(obj("id", id), ready);
    }
    // ready 이후 자료가 바뀌지 않았는지 확인하고 drafts/글ID/입력해시에 입력 사본을 만든다.
    // 같은 입력 폴더가 있으면 사본이 온전한지 검사한 뒤 재사용한다. 재사용 여부는 reused로 알린다.
    public JsonObject prepare(String id) throws IOException {
        Path job = workspace.job(id), marker = workspace.safe(job.resolve("ready.json"));
        require(exists(marker), "먼저 ready 명령으로 캡처 수집 완료를 표시하세요.");
        JsonObject input = input(id,Boolean.parseBoolean(str(object(marker),"textOnly")));
        require(str(object(marker), "digest").equals(str(input, "digest")), "준비 완료 이후 사진/메모가 바뀌었습니다. ready를 다시 실행하세요.");
        Path dest = workspace.safe(workspace.configured("output").resolve(id).resolve(str(input, "digest")));
        Path manifestFile = workspace.safe(dest.resolve("manifest.json"));
        if (exists(manifestFile)) {
            JsonObject manifest = object(manifestFile);
            for (JsonElement entry : array(manifest, "images")) {
                JsonObject image = entry.getAsJsonObject();
                require(sha(Files.readAllBytes(workspace.regular(dest.resolve("images").resolve(str(image, "name"))))).equals(str(image, "sha256")), "보관 이미지가 변경됐습니다. 원본과 비교해 복구하세요.");
            }
            require(text(workspace.regular(dest.resolve("notes.md"))).equals(str(input, "notes")), "보관 메모가 변경됐습니다.");
            Path refs = workspace.safe(dest.resolve("references.json"));
            require((exists(refs) ? read(refs) : new JsonArray()).equals(input.get("references")), "보관 참고자료가 변경됐습니다.");
            require(array(manifest, "references").equals(input.get("references")), "보관 참고자료 목록이 변경됐습니다.");
            return obj("directory", dest.toString(), "reused", true);
        }
        Files.createDirectories(workspace.safe(dest.resolve("images")));
        for (JsonElement entry : array(input, "images")) {
            JsonObject image = entry.getAsJsonObject();
            byte[] bytes = Files.readAllBytes(workspace.regular(job.resolve("images").resolve(str(image, "name"))));
            require(sha(bytes).equals(str(image, "sha256")), "복사 중 원본 사진이 바뀌었습니다. ready를 다시 실행하세요.");
            Files.write(workspace.safe(dest.resolve("images").resolve(str(image, "name"))), bytes);
        }
        writeText(workspace.safe(dest.resolve("notes.md")), str(input, "notes"));
        if (!array(input, "references").isEmpty()) write(workspace.safe(dest.resolve("references.json")), input.get("references"));
        require(str(input(id,Boolean.parseBoolean(str(object(marker),"textOnly"))), "digest").equals(str(input, "digest")), "준비 중 원본이 바뀌었습니다. ready를 다시 실행하세요.");
        JsonObject manifest = obj("id", id, "inputDigest", str(input, "digest"), "preparedAt", now(), "blogUrl", str(workspace.config(), "blogUrl"),
            "images", input.get("images"), "styleSamples", workspace.configured("styleSamples").toString(), "styleProfile", workspace.configured("styleProfile").toString());
        if (array(input,"images").isEmpty()) manifest.addProperty("textOnly",true);
        if (!array(input, "references").isEmpty()) manifest.add("references", input.get("references"));
        writeText(workspace.safe(dest.resolve("task.md")), "AGENTS.md와 docs/WRITING.md를 읽고 실제 사진과 notes.md를 바탕으로 초안을 작성하세요.\n작업 폴더: " + dest + "\n블로그: " + str(workspace.config(), "blogUrl") + "\nanalysis.md, draft.json, review.md 작성 후 node scripts/blog.mjs render 명령으로 검토하세요. 확인되지 않은 경험을 만들지 마세요.\n");
        write(manifestFile, manifest); return obj("directory", dest.toString(), "reused", false);
    }
    // CLI용 진행 상태 목록이다. 화면의 글 보관함은 Main의 job.listData 요청을 사용한다.
    public JsonArray list() throws IOException {
        JsonArray result = new JsonArray();
        for (JsonElement value : jobs.ids()) {
            String id = value.getAsString();
            try {
                Path marker = workspace.safe(workspace.job(id).resolve("ready.json"));
                if (!exists(marker)) { result.add(obj("id", id, "status", "collecting")); continue; }
                JsonObject input = input(id,Boolean.parseBoolean(str(object(marker),"textOnly")));
                if (!str(object(marker), "digest").equals(str(input, "digest"))) { result.add(obj("id", id, "status", "changed", "hint", "ready를 다시 실행하세요.")); continue; }
                Path dest = workspace.safe(workspace.configured("output").resolve(id).resolve(str(input, "digest")));
                String status = "ready";
                if (exists(workspace.safe(dest.resolve("manifest.json")))) status = "prepared";
                if (exists(workspace.safe(dest.resolve("preview.html")))) status = "local_draft";
                Path receiptFile = workspace.safe(dest.resolve("tistory-receipt.json"));
                if (exists(receiptFile)) {
                    JsonObject receipt = object(receiptFile); Path draft = workspace.safe(dest.resolve("draft.json"));
                    status = str(receipt, "inputDigest").equals(str(input, "digest")) && !str(receipt, "verifiedAt").isEmpty() && !str(receipt, "editorUrl").isEmpty() && !str(receipt, "title").isEmpty()
                        && exists(draft) && str(receipt, "draftDigest").equals(sha(Files.readAllBytes(workspace.regular(draft)))) ? "saved_recorded" : "remote_review_needed";
                }
                result.add(obj("id", id, "status", status, "directory", dest.toString()));
            } catch (Exception error) { result.add(obj("id", id, "status", "error", "error", error.getMessage())); }
        }
        return result;
    }
}
