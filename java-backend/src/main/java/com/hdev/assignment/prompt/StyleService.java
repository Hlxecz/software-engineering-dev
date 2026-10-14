package com.hdev.assignment.prompt;

import com.google.gson.*;
import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.nio.file.Path;
import java.util.UUID;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** AI 분석은 JS에 두고, 사용자가 채택한 기본 프롬프트를 관리한다. */
public final class StyleService {
    private final Workspace workspace;
    public StyleService(Workspace workspace) { this.workspace = workspace; }
    public JsonObject analysis() throws IOException {
        Path file = workspace.file("style/analysis.json");
        return exists(file) ? object(file) : obj("phase", "idle");
    }
    public JsonObject saveAnalysis(JsonObject value) throws IOException {
        write(workspace.file("style/analysis.json"), value); return value;
    }
    // 기본 글쓰기 지침(profile.md)과 참고 주소·출처(settings.json)를 함께 읽어 revision을 만든다.
    // StyleService는 AI를 호출하지 않는다. JS의 말투 분석 결과와 사용자가 채택한 지침을 보관한다.
    public JsonObject state(String profilePath) throws IOException {
        Path file = workspace.safe(Path.of(profilePath)), metadataFile = workspace.file("style/settings.json");
        String profile = exists(file) ? text(file) : "";
        JsonObject metadata = exists(metadataFile) ? object(metadataFile) : obj("urls", new JsonArray(), "sources", new JsonArray());
        return merge(metadata.deepCopy(), obj("profile", profile, "revision", sha(profile + compact(metadata))));
    }
    // 새 지침 저장 전 충돌·길이·선택한 분석 결과를 검사한다. 이전 기본 지침은 style/history에 남긴다.
    public JsonObject save(String profilePath, JsonObject value, JsonObject analysis) throws IOException {
        JsonObject previous = state(profilePath);
        require(str(value, "revision").equals(str(previous, "revision")), "다른 창에서 말투를 수정했어요. 설정을 다시 연 뒤 변경사항을 확인해 주세요.", 409);
        require(textValue(value.get("profile")) && !str(value, "profile").isBlank() && str(value, "profile").length() <= 20000, "말투 지침은 1~20,000자로 입력해 주세요.");
        JsonElement sources = previous.get("sources");
        if (!str(value, "analysisId").isEmpty()) {
            require(str(value, "analysisId").equals(str(analysis, "id")) && str(analysis, "phase").equals("done"), "분석 결과가 변경됐어요. 최신 결과를 확인해 주세요.", 409);
            sources = analysis.get("sources");
        }
        if (!str(previous, "profile").isEmpty()) writeText(workspace.file("style/history/" + System.currentTimeMillis() + "-" + UUID.randomUUID() + ".md"), str(previous, "profile"));
        writeText(workspace.safe(Path.of(profilePath)), str(value, "profile").strip());
        write(workspace.file("style/settings.json"), obj("urls", value.get("urls"), "sources", sources, "updatedAt", now()));
        return state(profilePath);
    }
}
