package com.hdev.assignment.common;

import com.google.gson.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** 기존 JSON의 필드 순서와 UTF-8을 보존하는 공통 파일 처리. */
public final class JsonFiles {
    // Gson은 JSON 문자열과 Java 객체를 서로 바꾸는 외부 라이브러리다.
    // COMPACT는 통신·해시용, PRETTY는 사람이 읽을 저장 파일용이다.
    private static final Gson COMPACT = new GsonBuilder().disableHtmlEscaping().serializeNulls().create();
    private static final Gson PRETTY = new GsonBuilder().disableHtmlEscaping().serializeNulls().setPrettyPrinting().create();
    private JsonFiles() {}
    // obj("ok", true, "result", 값)처럼 키·값을 번갈아 주면 JSON 객체를 만드는 보조 함수다.
    public static JsonObject obj(Object... pairs) {
        JsonObject value = new JsonObject();
        for (int i = 0; i < pairs.length; i += 2) value.add((String)pairs[i], COMPACT.toJsonTree(pairs[i + 1]));
        return value;
    }
    // 같은 입력이 JS와 Java에서 같은 해시를 갖도록 특수 문자 표기를 맞춘다.
    // 해시는 문자열의 바이트가 달라져도 바뀌므로 단순히 보기 좋은 JSON으로 바꾸면 안 된다.
    public static String compact(JsonElement value) {
        // JSON.stringify does not escape these two Unicode characters.
        String json = COMPACT.toJson(value); StringBuilder result = new StringBuilder();
        for (int i = 0; i < json.length(); i++) {
            if (json.charAt(i) == '\\' && i + 1 < json.length()) {
                if (json.startsWith("\\u2028", i) || json.startsWith("\\u2029", i)) {
                    result.append(json.charAt(i + 5) == '8' ? '\u2028' : '\u2029'); i += 5;
                } else { result.append(json.charAt(i)).append(json.charAt(++i)); }
            } else result.append(json.charAt(i));
        }
        return result.toString();
    }
    public static String now() { return Instant.now().truncatedTo(ChronoUnit.MILLIS).toString(); }
    public static String str(JsonObject value, String key) { return str(value, key, ""); }
    public static String str(JsonObject value, String key, String fallback) {
        return value.has(key) && !value.get(key).isJsonNull() ? value.get(key).getAsString() : fallback;
    }
    public static boolean textValue(JsonElement value) { return value != null && value.isJsonPrimitive() && value.getAsJsonPrimitive().isString(); }
    public static JsonArray array(JsonObject value, String key) { return value.has(key) && value.get(key).isJsonArray() ? value.getAsJsonArray(key) : new JsonArray(); }
    public static boolean exists(Path file) { return Files.exists(file, LinkOption.NOFOLLOW_LINKS); }
    public static String text(Path file) throws IOException { return Files.readString(file, StandardCharsets.UTF_8); }
    public static JsonElement read(Path file) throws IOException { return JsonParser.parseString(text(file).replaceFirst("^\uFEFF", "")); }
    public static JsonObject object(Path file) throws IOException { return read(file).getAsJsonObject(); }
    public static void write(Path file, JsonElement value) throws IOException { writeText(file, PRETTY.toJson(value)); }
    // 학습 6: 먼저 임시 파일을 완성하고 목적 파일로 교체한다. 쓰는 도중 원래 파일을 비우지 않는다.
    // 가능하면 원자적 교체를 사용한다. 여러 파일 전체를 한꺼번에 되돌리는 DB 트랜잭션은 아니다.
    public static void writeText(Path file, String value) throws IOException {
        writeBytes(file,value.getBytes(StandardCharsets.UTF_8));
    }
    public static void writeBytes(Path file, byte[] value) throws IOException {
        Files.createDirectories(file.getParent());
        Path temp = file.resolveSibling(file.getFileName() + "." + UUID.randomUUID() + ".tmp");
        try {
            Files.write(temp, value, StandardOpenOption.CREATE_NEW);
            try { Files.move(temp, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING); }
            catch (AtomicMoveNotSupportedException e) { Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING); }
        } finally { Files.deleteIfExists(temp); }
    }
    // SHA-256은 내용의 지문이다. 입력 변경·사진 무결성·지침 충돌을 확인하며 암호화 기능은 아니다.
    public static String sha(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public static String sha(String value) { return sha(value.getBytes(StandardCharsets.UTF_8)); }
    public static JsonObject merge(JsonObject target, JsonObject patch) {
        patch.entrySet().forEach(entry -> target.add(entry.getKey(), entry.getValue())); return target;
    }
}
