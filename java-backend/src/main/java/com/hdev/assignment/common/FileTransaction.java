package com.hdev.assignment.common;

import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;

/** 지정 파일의 요청 중 실패를 복원한다. 강제 종료·전원 장애 복구 기능은 아니다. */
public final class FileTransaction implements AutoCloseable {
    private final Workspace workspace;
    private final List<Path> roots;
    private final Map<Path, byte[]> before = new LinkedHashMap<>();
    private final Set<Path> directories = new HashSet<>();
    private final Map<Path, Set<Path>> createdOnly = new LinkedHashMap<>();
    private boolean committed;
    public FileTransaction(Workspace workspace, Path... roots) throws IOException {
        this.workspace = workspace; this.roots = List.of(roots);
        for (Path root : roots) for (Path file : tree(root)) {
            if (Files.isDirectory(file, LinkOption.NOFOLLOW_LINKS)) directories.add(file);
            else before.put(file, Files.readAllBytes(workspace.regular(file)));
        }
    }
    /** History is immutable: remember names without reading its old contents. */
    public FileTransaction protectCreatedFiles(Path root) throws IOException {
        createdOnly.put(root,new HashSet<>(tree(root))); return this;
    }
    private List<Path> tree(Path root) throws IOException {
        workspace.safe(root);
        if (!JsonFiles.exists(root)) return List.of();
        try (var stream = Files.walk(root)) {
            List<Path> files = stream.toList();
            for (Path file : files) {
                workspace.safe(file);
                require(Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS) || Files.isDirectory(file, LinkOption.NOFOLLOW_LINKS), "일반 파일만 저장할 수 있습니다.", 409);
            }
            return files;
        }
    }
    public void commit() { committed = true; }
    public void close() throws IOException {
        if (committed) return;
        IOException failure = null;
        for (var entry : before.entrySet()) try {
            Path file = workspace.safe(entry.getKey());
            Files.createDirectories(file.getParent());
            JsonFiles.writeBytes(file, entry.getValue());
        } catch (IOException error) { failure = error; }
        Set<Path> created = new HashSet<>();
        for (Path root : roots) for (Path file : tree(root)) if (!before.containsKey(file) && !directories.contains(file)) created.add(file);
        for (var entry : createdOnly.entrySet()) for (Path file : tree(entry.getKey())) if (!entry.getValue().contains(file)) created.add(file);
        for (Path file : created.stream().sorted(Comparator.comparingInt(Path::getNameCount).reversed()).toList()) try { Files.deleteIfExists(workspace.safe(file)); }
        catch (IOException error) { failure = error; }
        if (failure != null) throw new IOException("저장 오류 뒤 일부 자료를 복원하지 못했습니다. 보관 자료를 확인해 주세요.", failure);
    }
}
