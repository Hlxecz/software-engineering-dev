package com.hdev.assignment.workspace;

import com.google.gson.*;
import com.hdev.assignment.common.AppException;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** 모든 저장 경로는 이 자료 폴더 아래에 있어야 한다. */
public final class Workspace {
    public final Path root;
    private JsonObject config;
    // root는 이 요청이 사용할 자료 폴더다. 소스 폴더와 사용자의 글 저장 폴더는 별개다.
    public Workspace(String root) throws IOException {
        this.root = Path.of(root).toAbsolutePath().normalize();
        require(Files.isDirectory(this.root), "자료 폴더를 찾을 수 없습니다.", 409);
    }
    public JsonObject config() throws IOException {
        if (config == null) config = object(safe(root.resolve("tistory.config.json")));
        return config;
    }
    // 예: configured("inbox")는 설정의 inbox 값을 실제 자료 폴더 아래 경로로 바꾼다.
    public Path configured(String key) throws IOException {
        String value = str(config(), key);
        require(!value.isBlank(), "설정 누락: " + key);
        return safe(root.resolve(value));
    }
    public Path file(String relative) throws IOException { return safe(root.resolve(relative)); }
    // 단순한 문자열 검사 외에 실제 경로도 검사한다. 바깥 폴더로 이어지는 링크·정션을 차단한다.
    // 저장소 클래스는 파일을 읽거나 쓰기 전에 이 공통 검사를 사용한다.
    public Path safe(Path value) throws IOException {
        Path target = value.toAbsolutePath().normalize();
        require(target.startsWith(root) && !target.equals(root), "자료 폴더 경로를 확인할 수 없어 처리하지 않았습니다.", 409);
        // Reject junctions as well as symbolic links, including every existing ancestor.
        Path current = root;
        Path realRoot = root.toRealPath();
        for (Path part : root.relativize(target)) {
            current = current.resolve(part);
            if (exists(current)) {
                require(!Files.isSymbolicLink(current) && current.toRealPath().equals(realRoot.resolve(root.relativize(current))),
                    "자료 폴더 경로에 링크가 있어 처리하지 않았습니다.", 409);
            }
        }
        return target;
    }
    public static String id(String id) {
        require(id != null && id.matches("[\\p{L}\\p{N}][\\p{L}\\p{N}_-]{0,79}"), "잘못된 글 주소입니다.");
        require(!id.matches("(?i)(con|prn|aux|nul|com[0-9]|lpt[0-9])"), "Windows 예약 이름은 사용할 수 없습니다.");
        return id;
    }
    public Path job(String id) throws IOException { return safe(configured("inbox").resolve(id(id))); }
    public Path existingJob(String id) throws IOException {
        Path job = job(id); require(Files.isDirectory(job), "글을 찾을 수 없습니다.", 404); return job;
    }
    public Path draftDirectory(String id, String directory) throws IOException {
        Path base = safe(configured("output").resolve(id(id)));
        Path candidate = Path.of(directory).toAbsolutePath().normalize();
        require(candidate.startsWith(base) && !candidate.equals(base), "초안 경로가 올바르지 않습니다.");
        return safe(candidate);
    }
    // 옛 앱 자료를 복사하면 app.json에 예전 절대경로가 남을 수 있다.
    // 같은 글 ID·입력 해시를 가진 현재 복사본을 찾아 열며 예전 원본 위치에 접근하지 않는다.
    public Path savedDirectory(String id, JsonObject meta) throws IOException {
        String directory = str(meta, "directory"); if (directory.isEmpty()) return null;
        Path base = safe(configured("output").resolve(id(id)));
        Path old = Path.of(directory).toAbsolutePath().normalize();
        Path candidate = old;
        if (!old.startsWith(base)) {
            // Copied v0.7.0 workspaces contain absolute paths. Resolve only a local,
            // matching ID + digest snapshot; never open the old directory.
            require(old.getParent() != null && old.getParent().getFileName().toString().equals(id)
                && old.getFileName().toString().matches("[a-f0-9]{64}"), "초안 경로가 올바르지 않습니다.");
            candidate = base.resolve(old.getFileName());
        }
        Path result = draftDirectory(id, candidate.toString());
        Path manifest = safe(result.resolve("manifest.json"));
        if (!exists(manifest)) return null;
        require(str(object(manifest), "id").equals(id), "초안 경로의 글 ID가 다릅니다.");
        return result;
    }
    public List<Path> children(Path directory) throws IOException {
        safe(directory);
        if (!exists(directory)) return List.of();
        try (var stream = Files.list(directory)) { return stream.sorted().toList(); }
    }
    public Path regular(Path file) throws IOException {
        safe(file); require(Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS), "일반 파일만 사용할 수 있습니다: " + file, 409); return file;
    }
}
