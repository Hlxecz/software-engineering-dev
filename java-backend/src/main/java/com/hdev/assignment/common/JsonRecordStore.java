package com.hdev.assignment.common;

import com.google.gson.JsonElement;
import java.io.IOException;
import java.nio.file.Path;

/** 저장 경로는 서비스가 선택한다. 화면 요청이 임의의 파일 경로를 정해 쓰지 못하게 한다. */
public interface JsonRecordStore {
    JsonElement read(Path file, JsonElement fallback) throws IOException;
    void write(Path file, JsonElement value) throws IOException;
}
