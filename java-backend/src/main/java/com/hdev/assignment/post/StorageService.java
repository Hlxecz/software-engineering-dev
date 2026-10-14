package com.hdev.assignment.post;

import com.google.gson.*;
import com.hdev.assignment.workspace.Workspace;
import com.hdev.assignment.common.AppException;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** 삭제 전에 inbox와 drafts 양쪽의 전체 트리를 검사한다. */
public final class StorageService {
    private final Workspace workspace;
    public StorageService(Workspace workspace) { this.workspace = workspace; }
    // delete=false면 용량·대상 목록만 반환하고, true면 검사 후 실제 삭제한다.
    // bases는 Node가 전달하는 inbox와 drafts 경로다. 사용자 글 ID에 해당하는 하위 폴더만 다룬다.
    public JsonObject inspect(JsonArray bases, String id, boolean delete) throws IOException {
        Workspace.id(id); long bytes = 0; List<Path> targets = new ArrayList<>(); List<Path> files = new ArrayList<>();
        for (JsonElement value : bases) {
            Path base = workspace.safe(Path.of(value.getAsString()));
            Path target = workspace.safe(base.resolve(id));
            if (!exists(target)) continue;
            require(Files.isDirectory(target, LinkOption.NOFOLLOW_LINKS), "자료 폴더 경로를 확인할 수 없어 삭제하지 않았습니다.", 409);
            try (var stream = Files.walk(target)) {
                for (Path file : stream.toList()) {
                    workspace.safe(file);
                    require(Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS) || Files.isDirectory(file, LinkOption.NOFOLLOW_LINKS), "일반 파일만 삭제할 수 있습니다.", 409);
                    if (Files.isRegularFile(file)) bytes += Files.size(file); files.add(file);
                }
            }
            targets.add(target);
        }
        // 위 반복문에서 두 폴더를 모두 검사한 후에야 삭제한다. 검사 실패 전에는 파일을 지우지 않는다.
        // 파일부터 지우고 빈 부모 폴더를 지우기 위해 순서를 뒤집는다. 실제 삭제 중 OS 오류는 일부 삭제를 남길 수 있다.
        if (delete) {
            // Reverse input traversal: snapshots disappear first, then the inbox entry.
            Collections.reverse(files);
            try { for (Path file : files) Files.delete(workspace.safe(file)); }
            catch (IOException error) { throw new AppException("일부 자료를 삭제하지 못했습니다. 이 글의 파일을 사용하는 프로그램을 닫고 다시 삭제해 주세요.", 409); }
        }
        return obj("bytes", bytes, "targets", targets.stream().map(Path::toString).toList());
    }
}
