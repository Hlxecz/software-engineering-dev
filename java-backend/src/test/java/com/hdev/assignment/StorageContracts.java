package com.hdev.assignment;

import com.google.gson.*;
import com.hdev.assignment.common.*;
import com.hdev.assignment.post.*;
import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import static com.hdev.assignment.common.JsonFiles.*;

/** Runs with fake workspace data; no AI, browser, or network dependencies. */
public final class StorageContracts {
    private static void check(boolean value, String message) { if (!value) throw new AssertionError(message); }
    private static void fails(java.util.concurrent.Callable<?> action) throws Exception {
        try { action.call(); throw new AssertionError("injected failure did not reach the caller"); }
        catch (IOException expected) { check(expected.getMessage().contains("injected"),"unexpected I/O failure"); }
    }
    private static JsonRecordStore failing(JsonRecordStore delegate, String name) {
        return new JsonRecordStore() {
            public JsonElement read(Path file, JsonElement fallback) throws IOException { return delegate.read(file,fallback); }
            public void write(Path file, JsonElement value) throws IOException {
                delegate.write(file,value);
                if (file.getFileName().toString().equals(name)) throw new IOException("injected record failure");
            }
        };
    }
    public static void main(String[] args) throws Exception {
        Workspace workspace=new Workspace(args[0]);
        JobRepository jobs=new JobRepository(workspace); String id="contract";
        jobs.create(id,obj("title","contract"));
        SnapshotService snapshots=new SnapshotService(workspace,jobs); snapshots.ready(id,true);
        Path directory=Path.of(str(snapshots.prepare(id),"directory"));
        JsonObject draft=obj("title","before","tags",new JsonArray(),"blocks",List.of(obj("type","paragraph","text","before")),"extension",17);
        JsonObject value=obj("directory",directory.toString(),"draft",draft,"manifest",object(directory.resolve("manifest.json")),"usedImages",new JsonArray(),"review","keep review");
        DraftStore realDrafts=new DraftRepository(workspace,jobs);
        realDrafts.save(id,value.deepCopy());
        JsonRecordStore files=new FileJsonRecordStore(workspace);
        JsonObject undoBefore=obj("sentinel","old undo"), contextBefore=obj("sentinel","old context");
        files.write(directory.resolve("refinement-undo.json"),undoBefore); files.write(directory.resolve("refinement-context.json"),contextBefore);
        byte[] original=Files.readAllBytes(directory.resolve("draft.json")), meta=Files.readAllBytes(workspace.job(id).resolve("app.json"));
        JsonObject next=draft.deepCopy(); next.addProperty("title","after");
        JsonObject apply=value.deepCopy(); apply.add("draft",next); apply.add("beforeDraft",draft); apply.addProperty("beforeReview","keep review"); apply.addProperty("expectedDigest",sha(original)); apply.add("context",obj("instruction","fake"));

        // A replacement draft implementation is actually invoked; its partial write is restored.
        int[] calls={0};
        DraftStore failingDraft=(job,patch)->{ calls[0]++; write(directory.resolve("draft.json"),patch.get("draft")); throw new IOException("injected draft failure"); };
        fails(()->new RefinementService(workspace,failingDraft,files).apply(id,apply.deepCopy()));
        check(calls[0]==1,"DraftStore was not substituted");
        check(Arrays.equals(original,Files.readAllBytes(directory.resolve("draft.json"))),"draft failure lost original bytes");

        // A late context failure happens after the real draft, history, metadata and undo writes.
        fails(()->new RefinementService(workspace,realDrafts,failing(files,"refinement-context.json")).apply(id,apply.deepCopy()));
        check(Arrays.equals(original,Files.readAllBytes(directory.resolve("draft.json"))),"late failure lost original draft");
        check(Arrays.equals(meta,Files.readAllBytes(workspace.job(id).resolve("app.json"))),"late failure changed metadata");
        check(object(directory.resolve("refinement-undo.json")).equals(undoBefore),"late failure lost old undo");
        check(object(directory.resolve("refinement-context.json")).equals(contextBefore),"late failure lost old context");
        check(!exists(directory.resolve("history")),"failed attempt left history files");

        RefinementService real=new RefinementService(workspace,realDrafts,files); real.apply(id,apply.deepCopy());
        byte[] after=Files.readAllBytes(directory.resolve("draft.json")), undo=Files.readAllBytes(directory.resolve("refinement-undo.json"));
        writeText(directory.resolve("review.md"),"current user review");
        JsonObject revert=value.deepCopy(); revert.addProperty("expectedDigest",sha(after));
        fails(()->new RefinementService(workspace,realDrafts,failing(files,"refinement-undo.json")).undo(id,revert));
        check(Arrays.equals(after,Files.readAllBytes(directory.resolve("draft.json"))),"undo failure changed current draft");
        check(Arrays.equals(undo,Files.readAllBytes(directory.resolve("refinement-undo.json"))),"undo failure consumed the undo record");
        check(text(directory.resolve("review.md")).equals("current user review"),"undo failure changed review");

        // The same JSON record port also supports another storage implementation.
        Map<Path,JsonElement> memory=new HashMap<>();
        JsonRecordStore inMemory=new JsonRecordStore() {
            public JsonElement read(Path file, JsonElement fallback) { return memory.getOrDefault(file,fallback).deepCopy(); }
            public void write(Path file, JsonElement record) { memory.put(file,record.deepCopy()); }
        };
        JsonObject target=obj("identity",obj("blogUrl","https://example.tistory.com","url","https://example.tistory.com/17","postId","17"),"extension",obj("keep",true));
        ExistingPostService replaceable=new ExistingPostService(workspace,inMemory); replaceable.save(id,target);
        check(replaceable.read(id).equals(target),"JsonRecordStore substitution changed the record");
        check(!exists(workspace.job(id).resolve("existing-post.json")),"in-memory port unexpectedly wrote a file");
        ExistingPostService existing=new ExistingPostService(workspace,files); existing.save(id,target);
        JsonObject snapshot=obj("directory",directory.toString(),"expectedDigest",sha(after),"attemptId","contract-attempt","usedImages",new JsonArray());
        fails(()->new UpdateService(workspace,failing(files,"manifest.json"),existing).snapshot(id,snapshot));
        check(!exists(directory.resolve("updates/contract-attempt")),"failed update snapshot left partial inputs");

        JsonObject previousState=obj("phase","stale","custom","keep state");
        files.write(workspace.job(id).resolve("post-update.json"),previousState);
        JsonObject backup=existing.backup(id,obj("directory",directory.toString(),"draft",object(directory.resolve("draft.json")),"target",target));
        Path conflictBackup=Path.of(str(backup,"path")); byte[] backupBytes=Files.readAllBytes(conflictBackup);
        JsonObject newTarget=target.deepCopy(); newTarget.add("source",obj("templates",obj("new","remote rich template")));
        JsonObject imported=value.deepCopy(), importedDraft=next.deepCopy();
        importedDraft.addProperty("title","new remote draft");
        imported.add("draft",importedDraft); imported.addProperty("expectedDigest",sha(after));
        imported.add("beforeTarget",target); imported.add("existingTarget",newTarget); imported.add("updateState",obj("phase","idle","reimportedAt","fake"));
        byte[] beforeReimportMeta=Files.readAllBytes(workspace.job(id).resolve("app.json"));
        Path history=directory.resolve("history"), immutable=history.resolve("immutable-old.json");
        writeText(immutable,"old immutable history contents");
        Set<Path> oldHistory=new HashSet<>(workspace.children(history));
        // Windows forbids reading these locked bytes. Name-only history protection still works.
        try (var channel=java.nio.channels.FileChannel.open(immutable,StandardOpenOption.READ,StandardOpenOption.WRITE); var lock=channel.lock()) {
            DraftStore partialDraft=(job,patch)->{ realDrafts.save(job,patch); throw new IOException("injected reimport draft failure"); };
            fails(()->existing.reimport(id,imported.deepCopy(),partialDraft));
            check(Arrays.equals(after,Files.readAllBytes(directory.resolve("draft.json"))),"reimport draft failure lost the old draft");
            check(existing.read(id).equals(target),"reimport draft failure mixed new source with old draft");
            fails(()->new ExistingPostService(workspace,failing(files,"post-update.json")).reimport(id,imported.deepCopy(),realDrafts));
            check(Arrays.equals(after,Files.readAllBytes(directory.resolve("draft.json"))),"late reimport failure lost the old draft");
            check(existing.read(id).equals(target),"late reimport failure lost the old target");
            check(object(workspace.job(id).resolve("post-update.json")).equals(previousState),"late reimport failure changed update state");
            check(Arrays.equals(beforeReimportMeta,Files.readAllBytes(workspace.job(id).resolve("app.json"))),"late reimport failure changed app metadata");
            check(new HashSet<>(workspace.children(history)).equals(oldHistory),"failed reimport left new history");
            check(Arrays.equals(backupBytes,Files.readAllBytes(conflictBackup)),"failed reimport removed the conflict backup");
        }
        JsonObject stale=imported.deepCopy(); stale.addProperty("expectedDigest","0".repeat(64));
        try { existing.reimport(id,stale,realDrafts); throw new AssertionError("stale reimport accepted"); }
        catch (AppException expected) { check(expected.status==409,"wrong stale status"); }
        stale=imported.deepCopy(); stale.add("beforeTarget",obj("changed",true));
        try { existing.reimport(id,stale,realDrafts); throw new AssertionError("stale target accepted"); }
        catch (AppException expected) { check(expected.status==409,"wrong stale target status"); }
        existing.reimport(id,imported.deepCopy(),realDrafts);
        check(existing.read(id).equals(newTarget)&&object(directory.resolve("draft.json")).equals(importedDraft),"successful reimport did not replace source and draft together");
        check(object(workspace.job(id).resolve("post-update.json")).get("phase").getAsString().equals("idle"),"successful reimport did not reset update state");
        check(text(immutable).equals("old immutable history contents"),"old immutable history changed");
        System.out.println("DraftStore/JsonRecordStore substitution and failure rollback contracts passed");
    }
}
