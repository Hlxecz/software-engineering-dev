package com.hdev.assignment.post;

import com.google.gson.*;
import com.hdev.assignment.workspace.Workspace;
import com.hdev.assignment.category.CategoryService;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** 화면에서 검증한 초안을 이력과 함께 저장한다. 표지 파일도 Java가 복사한다. */
public final class DraftRepository implements DraftStore {
    private final Workspace workspace;
    private final JobRepository jobs;
    public DraftRepository(Workspace workspace, JobRepository jobs) { this.workspace = workspace; this.jobs = jobs; }
    // 학습 5: Node의 persistDraft()가 보낸 value에는 draft(본문), manifest(입력 목록), 사진·검토 정보가 있다.
    // 본문 블록의 상세 규칙은 JS가 검사하고, Java는 저장 경로·글 ID·분류·사진 해시를 다시 확인한다.
    public JsonObject save(String id, JsonObject value) throws IOException {
        Path directory = workspace.draftDirectory(id, str(value, "directory"));
        JsonObject draft = value.getAsJsonObject("draft"), manifest = value.getAsJsonObject("manifest");
        require(str(manifest, "id").equals(id), "초안 글 ID가 다릅니다.");
        require(!str(draft, "title").isBlank() && !array(draft, "blocks").isEmpty() && draft.has("tags") && draft.get("tags").isJsonArray(), "초안 형식을 확인해 주세요.");
        if (draft.has("category") && !draft.get("category").isJsonNull()) draft.add("category", CategoryService.normalize(draft.get("category"), str(workspace.config(), "blogUrl")));
        String coverSource = str(value, "coverSource");
        // Check every referenced photo before backing up or replacing a draft.
        // 초안을 덮어쓰기 전에 참조 사진을 모두 확인한다. 같은 파일명이라도 내용이 바뀌었다면 중단한다.
        for (JsonElement used : array(value, "usedImages")) {
            String name = used.getAsString(); JobRepository.validImageName(name);
            Path source = !coverSource.isEmpty() && name.equals(str(draft, "cover")) ? workspace.regular(Path.of(coverSource)) : workspace.regular(directory.resolve("images").resolve(name));
            JsonObject image = null;
            for (String key : List.of("images", "coverImages")) for (JsonElement candidate : array(manifest, key)) if (str(candidate.getAsJsonObject(), "name").equals(name)) image = candidate.getAsJsonObject();
            require(image != null && sha(Files.readAllBytes(source)).equals(str(image, "sha256")), "보관한 사진이 변경됐습니다. 다시 확인해 주세요.");
        }
        if (!coverSource.isEmpty()) {
            JobRepository.validImageName(str(draft, "cover"));
            Path source = workspace.regular(Path.of(coverSource));
            require(source.getParent().equals(workspace.existingJob(id).resolve("images")), "표지 사진 경로가 올바르지 않습니다.");
            Path destination = workspace.safe(directory.resolve("images").resolve(str(draft, "cover")));
            if (!exists(destination)) Files.copy(source, destination);
            require(sha(Files.readAllBytes(source)).equals(sha(Files.readAllBytes(workspace.regular(destination)))), "보관한 표지 사진이 변경됐습니다.");
            write(workspace.safe(directory.resolve("manifest.json")), manifest);
        }
        Path file = workspace.safe(directory.resolve("draft.json"));
        // 기존 초안·참고자료·적용 지침 JSON을 history에 먼저 복사해 이전 편집본을 남긴다.
        if (exists(file)) {
            String version = System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
            Files.createDirectories(workspace.safe(directory.resolve("history")));
            for (String name : List.of("draft", "references-read", "writing-context")) {
                Path source = workspace.safe(directory.resolve(name + ".json"));
                if (exists(source)) Files.copy(workspace.regular(source), workspace.safe(directory.resolve("history").resolve((name.equals("references-read") ? "references" : name) + "-" + version + ".json")));
            }
        }
        write(file, draft);
        if (value.has("referenceReports")) write(workspace.safe(directory.resolve("references-read.json")), value.get("referenceReports"));
        if (value.has("writingContext")) write(workspace.safe(directory.resolve("writing-context.json")), value.get("writingContext"));
        writeText(workspace.safe(directory.resolve("review.md")), str(value, "review"));
        if (!str(value, "analysis").isEmpty()) writeText(workspace.safe(directory.resolve("analysis.md")), str(value, "analysis"));
        // 저장한 초안 폴더를 app.json과 연결한다. 다음에 글을 열면 JobRepository.read()가 이 위치를 읽는다.
        return jobs.saveMeta(id, obj("directory", directory.toString(), "generating", false, "transfer", null, "category", draft.get("category")));
    }
}
