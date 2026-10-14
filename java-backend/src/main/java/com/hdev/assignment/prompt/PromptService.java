package com.hdev.assignment.prompt;

import com.google.gson.*;
import com.hdev.assignment.workspace.Workspace;
import com.hdev.assignment.category.CategoryService;
import java.io.IOException;
import java.nio.file.Path;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** 카테고리별 지침 저장, 삭제(빈 지침), 버전 충돌 검사와 선택. */
public final class PromptService {
    private final Workspace workspace;
    public PromptService(Workspace workspace) { this.workspace = workspace; }
    private JsonObject readData() throws IOException {
        Path file = workspace.file("style/category-prompts.json");
        JsonObject data = exists(file) ? object(file) : obj("profiles", new JsonArray());
        require(data.has("profiles") && data.get("profiles").isJsonArray(), "카테고리 글쓰기 지침 파일을 확인해 주세요."); return data;
    }
    // 전체 지침 파일에서 현재 블로그의 지침만 화면에 보여준다.
    // revision은 전체 파일 내용의 지문이다. 나중에 저장할 때 그 사이 다른 요청이 수정했는지 비교한다.
    public JsonObject state(String blog) throws IOException {
        JsonObject data = readData(); JsonArray profiles = new JsonArray();
        for (JsonElement item : array(data, "profiles")) {
            if (str(item.getAsJsonObject().getAsJsonObject("category"), "blogUrl").equals(CategoryService.origin(blog))) profiles.add(item);
        }
        return obj("blogUrl", CategoryService.origin(blog), "profiles", profiles, "revision", sha(compact(data)));
    }
    // 읽을 때 받은 revision과 현재 값을 비교한다. 오래된 화면에서 저장하면 409 오류로 덮어쓰기를 막는다.
    // 같은 블로그·분류 번호의 지침만 교체하고 다른 블로그의 지침은 보존한다.
    public JsonObject save(String blog, JsonObject value) throws IOException {
        require(str(value, "revision").equals(str(state(blog), "revision")), "다른 창에서 지침을 수정했어요. 최신 저장본을 불러온 뒤 다시 저장해 주세요.", 409);
        JsonObject category = CategoryService.normalize(value.get("category"), blog);
        require(textValue(value.get("prompt")) && str(value, "prompt").length() <= 10000, "카테고리 지침은 10,000자 이하로 입력해 주세요.");
        JsonObject data = readData(); JsonArray profiles = new JsonArray();
        for (JsonElement item : array(data, "profiles")) {
            JsonObject saved = item.getAsJsonObject().getAsJsonObject("category");
            if (!str(saved, "blogUrl").equals(CategoryService.origin(blog)) || !str(saved, "id").equals(str(category, "id"))) profiles.add(item);
        }
        // 빈 문자열을 저장하면 이 분류의 별도 지침을 해제한다. 기본 지침 파일을 삭제하는 것이 아니다.
        String prompt = str(value, "prompt").strip();
        if (!prompt.isEmpty()) profiles.add(obj("category", category, "prompt", prompt, "updatedAt", now()));
        data.add("profiles", profiles); write(workspace.file("style/category-prompts.json"), data); return state(blog);
    }
    // AI 생성에 사용할 분류 지침을 고른다. 주소·번호·전체 경로가 모두 일치해야 적용한다.
    // 일치하지 않으면 빈 지침을 반환하며 기본 프롬프트는 Node가 별도로 전달한다.
    public JsonObject resolve(String blog, JsonElement value) throws IOException {
        JsonObject category = value == null || value.isJsonNull() ? CategoryService.none(blog) : CategoryService.normalize(value, blog);
        for (JsonElement item : array(state(blog), "profiles")) {
            JsonObject profile = item.getAsJsonObject();
            if (profile.get("category").equals(category)) return obj("category", category, "prompt", str(profile, "prompt"));
        }
        return obj("category", category, "prompt", "");
    }
}
