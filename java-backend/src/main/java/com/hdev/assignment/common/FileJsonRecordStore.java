package com.hdev.assignment.common;

import com.google.gson.JsonElement;
import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.nio.file.Path;

public final class FileJsonRecordStore implements JsonRecordStore {
    private final Workspace workspace;
    public FileJsonRecordStore(Workspace workspace) { this.workspace = workspace; }
    public JsonElement read(Path file, JsonElement fallback) throws IOException {
        workspace.safe(file);
        return JsonFiles.exists(file) ? JsonFiles.read(workspace.regular(file)) : fallback.deepCopy();
    }
    public void write(Path file, JsonElement value) throws IOException { JsonFiles.write(workspace.safe(file), value); }
}
