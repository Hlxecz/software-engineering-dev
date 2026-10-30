package com.hdev.assignment.post;

import com.google.gson.JsonObject;
import java.io.IOException;

/** Refinement can use the normal draft rules or a contract-test replacement. */
public interface DraftStore {
    JsonObject save(String id, JsonObject value) throws IOException;
}
