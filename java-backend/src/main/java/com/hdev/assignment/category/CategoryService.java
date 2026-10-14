package com.hdev.assignment.category;

import com.google.gson.*;
import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Path;
import java.util.*;
import static com.hdev.assignment.common.AppException.require;
import static com.hdev.assignment.common.JsonFiles.*;

/** 카테고리 식별자는 이름 하나가 아니라 블로그 + 번호 + 전체 경로이다. */
public final class CategoryService {
    private final Workspace workspace;
    public CategoryService(Workspace workspace) { this.workspace = workspace; }
    public static String origin(String value) {
        URI uri = URI.create(value); return uri.getScheme().toLowerCase() + "://" + uri.getHost().toLowerCase();
    }
    // normalize는 입력을 검증하고 통일된 형태로 돌려준다는 뜻이다.
    // 예: {blogUrl: 블로그 주소, id: "11", path: ["개발", "Java"]}. 이름이 같아도 다른 블로그·번호면 다른 분류다.
    public static JsonObject normalize(JsonElement value, String blogUrl) {
        String message = "카테고리 정보를 확인하고 목록에서 다시 선택해 주세요.";
        require(value != null && value.isJsonObject(), message);
        JsonObject category = value.getAsJsonObject();
        require(textValue(category.get("id")) && str(category, "id").matches("(0|[1-9][0-9]{0,14})"), message);
        URI url;
        try { url = URI.create(str(category, "blogUrl")); } catch (Exception e) { throw new com.hdev.assignment.common.AppException(message, 400); }
        require("https".equalsIgnoreCase(url.getScheme()) && url.getHost() != null && url.getHost().toLowerCase().matches("[a-z0-9-]+\\.tistory\\.com")
            && url.getUserInfo() == null && (url.getPort() == -1 || url.getPort() == 443) && (url.getPath().isEmpty() || url.getPath().equals("/")) && url.getQuery() == null && url.getFragment() == null, message);
        String origin = origin(url.toString());
        if (blogUrl != null) require(origin.equals(origin(blogUrl)), "다른 블로그의 카테고리입니다. 현재 블로그의 목록을 불러와 다시 선택해 주세요.");
        JsonArray names = array(category, "path");
        require(names.size() >= 1 && names.size() <= 2, message);
        JsonArray normalized = new JsonArray();
        for (JsonElement name : names) {
            require(textValue(name) && !name.getAsString().strip().isEmpty() && name.getAsString().length() <= 100, message);
            normalized.add(name.getAsString().strip());
        }
        require(!str(category, "id").equals("0") || (normalized.size() == 1 && normalized.get(0).getAsString().equals("카테고리 없음")), message);
        return obj("blogUrl", origin, "id", str(category, "id"), "path", normalized);
    }
    public static JsonObject none(String blog) { return normalize(obj("blogUrl", origin(blog), "id", "0", "path", List.of("카테고리 없음")), blog); }
    private JsonArray validate(JsonElement items, String blog) {
        require(items != null && items.isJsonArray() && items.getAsJsonArray().size() > 0 && items.getAsJsonArray().size() <= 1000, "카테고리 목록을 읽지 못했습니다.");
        JsonArray result = new JsonArray(); Set<String> ids = new HashSet<>();
        for (JsonElement item : items.getAsJsonArray()) {
            JsonObject normalized = normalize(item, blog);
            require(ids.add(str(normalized, "id")), "카테고리 목록을 다시 확인해 주세요."); result.add(normalized);
        }
        require(ids.contains("0"), "카테고리 목록을 다시 확인해 주세요."); return result;
    }
    // 현재 캐시는 블로그 한 개의 목록이다. 주소가 다르거나 캐시가 잘못됐으면 빈 목록을 반환한다.
    // 실제 티스토리 목록을 읽는 일은 Electron이 하고, Java는 읽어 온 목록을 검증·보관한다.
    public JsonObject state(String blog) throws IOException {
        String origin = origin(blog); Path file = workspace.file("library/categories.json");
        try {
            JsonObject data = object(file);
            if (str(data, "blogUrl").equals(origin)) return obj("blogUrl", origin, "items", validate(data.get("items"), origin), "updatedAt", data.get("updatedAt"));
        } catch (java.nio.file.NoSuchFileException | com.google.gson.JsonParseException | IllegalStateException | com.hdev.assignment.common.AppException e) { /* Invalid caches cannot provide choices. */ }
        return obj("blogUrl", origin, "items", new JsonArray(), "updatedAt", null);
    }
    // 중복 번호와 기본 분류(ID 0) 존재까지 확인한 목록만 library/categories.json에 저장한다.
    public JsonObject save(String blog, JsonElement items) throws IOException {
        JsonObject data = obj("blogUrl", origin(blog), "items", validate(items, blog), "updatedAt", now());
        write(workspace.file("library/categories.json"), data); return data;
    }
}
