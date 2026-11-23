package com.hdev.assignment;

import com.google.gson.*;
import com.hdev.assignment.common.*;
import com.hdev.assignment.post.*;
import com.hdev.assignment.prompt.PromptService;
import com.hdev.assignment.workspace.Workspace;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.Callable;
import static com.hdev.assignment.common.JsonFiles.*;

/** 과제 4: 각 사례를 독립 임시 폴더에서 실행하며 실제 계정·AI·네트워크를 사용하지 않는다. */
public final class Assignment4Cases {
    private static Workspace workspace;
    private static JobRepository jobs;
    private static DraftRepository drafts;
    private static JsonRecordStore records;
    private static ExistingPostService existing;
    private static UpdateService updates;
    private static Path directory;
    private static final String ID="assignment4", BLOG="https://example.tistory.com";

    private static void equal(Object expected, Object actual) {
        if (!Objects.equals(expected,actual)) throw new AssertionError("expected="+expected+", actual="+actual);
    }
    private static void check(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }
    private static void rejected(int status, Callable<?> action) throws Exception {
        try { action.call(); }
        catch (AppException error) { equal(status,error.status); return; }
        throw new AssertionError("expected rejection "+status);
    }
    private static JsonObject category(String blog) { return obj("blogUrl",blog,"id","11","path",List.of("개발","Java")); }
    private static JsonObject draft(String title) {
        return obj("title",title,"tags",List.of("Java"),"blocks",List.of(obj("type","paragraph","text","첫 문단"),obj("type","paragraph","text","보존할 문단")),"extension",obj("keep",true));
    }
    private static JsonObject value(JsonObject draft) throws IOException {
        return obj("directory",directory.toString(),"draft",draft,"manifest",object(directory.resolve("manifest.json")),"usedImages",new JsonArray(),"review","검토 메모");
    }
    private static void prepare() throws Exception {
        jobs.create(ID,obj("title","테스트"));
        SnapshotService snapshots=new SnapshotService(workspace,jobs);
        snapshots.ready(ID,true);
        directory=Path.of(str(snapshots.prepare(ID),"directory"));
        drafts.save(ID,value(draft("이전 제목")));
    }
    private static JsonObject applyValue() throws IOException {
        JsonObject before=object(directory.resolve("draft.json")), after=before.deepCopy();
        after.getAsJsonArray("blocks").get(0).getAsJsonObject().addProperty("text","다듬은 첫 문단");
        JsonObject result=value(after);
        result.add("beforeDraft",before); result.addProperty("beforeReview",text(directory.resolve("review.md")));
        result.addProperty("expectedDigest",sha(Files.readAllBytes(directory.resolve("draft.json"))));
        result.add("context",obj("instruction","첫 문단만 간결하게"));
        return result;
    }
    private static RefinementService refinements() { return new RefinementService(workspace,drafts,records); }
    private static JsonObject snapshotValue() throws IOException {
        existing.save(ID,obj("identity",obj("blogUrl",BLOG,"url",BLOG+"/17","postId","17")));
        return obj("directory",directory.toString(),"expectedDigest",sha(Files.readAllBytes(directory.resolve("draft.json"))),"attemptId","attempt-1","usedImages",new JsonArray());
    }
    private static Map<String,String> bytes() throws IOException {
        Map<String,String> result=new TreeMap<>();
        try(var paths=Files.walk(workspace.root)) {
            for(Path file:paths.filter(Files::isRegularFile).toList()) result.put(workspace.root.relativize(file).toString(),sha(Files.readAllBytes(file)));
        }
        return result;
    }
    private static String execute(String id) throws Exception {
        PromptService prompts=new PromptService(workspace);
        switch(id) {
            case "JOB-01" -> {
                jobs.create(ID,obj("title","새 글"));
                equal("새 글",str(jobs.read(ID).getAsJsonObject("meta"),"title"));
                equal("",str(jobs.read(ID),"notes"));
                return "새 작업 제목과 빈 메모 재조회 일치";
            }
            case "JOB-02" -> {
                jobs.create(ID,obj("title","원본")); Map<String,String> before=bytes();
                rejected(409,()->jobs.create(ID,obj("title","중복"))); equal(before,bytes());
                return "409, 기존 작업 파일 전체 해시 유지";
            }
            case "JOB-03" -> {
                jobs.create(ID,obj("title","사진 글"));
                jobs.upload(ID,obj("name","사진.png","bytes",Base64.getEncoder().encodeToString(new byte[]{1,2,3})));
                jobs.saveMeta(ID,obj("custom",42));
                jobs.save(ID,obj("title","한글 💡","notes","메모 📷\n두 번째 줄","order",new JsonArray()));
                JsonObject result=jobs.read(ID);
                equal("메모 📷\n두 번째 줄",str(result,"notes")); equal(42,result.getAsJsonObject("meta").get("custom").getAsInt());
                equal(0,result.getAsJsonArray("names").size()); check(exists(workspace.job(ID).resolve("images/사진.png")),"원본 사진 소실");
                return "한글·이모지·추가 필드 보존, 순서에서 제외한 사진 파일 유지";
            }
            case "JOB-04", "JOB-05" -> {
                jobs.create(ID,obj("title","원본")); Map<String,String> before=bytes();
                JsonObject request=obj("title","가".repeat(id.equals("JOB-04")?200:201),"notes","","order",new JsonArray());
                if(id.equals("JOB-04")) { jobs.save(ID,request); equal(200,str(jobs.meta(ID),"title").length()); return "제목 200자 저장 허용"; }
                rejected(400,()->jobs.save(ID,request)); equal(before,bytes()); return "제목 201자 거부, 파일 미변경";
            }
            case "JOB-06" -> {
                jobs.create(ID,obj("title","원본")); jobs.upload(ID,obj("name","a.png","bytes","AQID")); Map<String,String> before=bytes();
                rejected(400,()->jobs.save(ID,obj("title","변경","notes","","order",List.of("a.png","a.png")))); equal(before,bytes());
                return "중복 사진 순서 거부, 원본 보존";
            }
            case "JOB-07" -> {
                jobs.create(ID,obj("title","원본")); Map<String,String> before=bytes();
                rejected(400,()->jobs.upload(ID,obj("name","../outside.png","bytes","AQID"))); equal(before,bytes());
                return "상위 경로 사진 이름 거부, 외부 파일 생성 없음";
            }
            case "DRAFT-01" -> {
                prepare(); JsonObject next=draft("새 제목");
                Collections.reverse(next.getAsJsonArray("blocks").asList()); drafts.save(ID,value(next));
                equal(next,jobs.read(ID).get("draft.json")); equal(directory.toString(),str(jobs.meta(ID),"directory"));
                return "제목·블록 순서·확장 필드와 작업 연결 재조회 일치";
            }
            case "DRAFT-02", "DRAFT-03", "DRAFT-04" -> {
                prepare(); JsonObject request=value(draft("변경"));
                if(id.equals("DRAFT-02")) request.getAsJsonObject("manifest").addProperty("id","other");
                if(id.equals("DRAFT-03")) request.getAsJsonObject("draft").add("blocks",new JsonArray());
                if(id.equals("DRAFT-04")) {
                    Files.write(directory.resolve("images/a.png"),new byte[]{1});
                    request.add("usedImages",obj("v",List.of("a.png")).get("v"));
                    request.getAsJsonObject("manifest").add("images",obj("v",List.of(obj("name","a.png","sha256","0".repeat(64)))).get("v"));
                }
                Map<String,String> before=bytes(); rejected(400,()->drafts.save(ID,request)); equal(before,bytes());
                return "잘못된 글 ID/빈 블록/사진 지문 입력 거부, 저장 자료 전체 보존";
            }
            case "DRAFT-05" -> {
                prepare(); JsonObject old=object(directory.resolve("draft.json")); drafts.save(ID,value(draft("새 제목")));
                try(var paths=Files.list(directory.resolve("history"))) {
                    List<Path> history=paths.filter(p->p.getFileName().toString().startsWith("draft-")).toList();
                    equal(1,history.size()); equal(old,object(history.get(0)));
                }
                return "새 초안 저장과 이전 초안 이력 1개 보존";
            }
            case "DRAFT-06" -> {
                prepare(); Files.delete(directory.resolve("review.md")); Files.createDirectory(directory.resolve("review.md"));
                JsonObject request=value(draft("실패해야 하는 변경")); request.add("writingContext",obj("new",true));
                Map<String,String> before=bytes();
                try { drafts.save(ID,request); throw new AssertionError("쓰기 실패가 발생하지 않음"); }
                catch(IOException expected) { equal(before,bytes()); check(!exists(directory.resolve("history")),"실패 이력 잔존"); }
                return "후반 review 쓰기 실패 전달, 초안·관련 파일·메타데이터 복원, 새 이력 제거";
            }
            case "DRAFT-07" -> {
                prepare(); jobs.create("other",obj("title","다른 글")); JsonObject request=value(draft("변경"));
                request.addProperty("directory",workspace.configured("output").resolve("other/snapshot").toString());
                Map<String,String> before=bytes(); rejected(400,()->drafts.save(ID,request)); equal(before,bytes());
                return "다른 글의 초안 경로 거부, 두 작업 자료 보존";
            }
            case "PROMPT-01", "PROMPT-02", "PROMPT-03", "PROMPT-04" -> {
                String revision=str(prompts.state(BLOG),"revision");
                prompts.save(BLOG,obj("revision",revision,"category",category(BLOG),"prompt","  Java 예제로 설명  "));
                if(id.equals("PROMPT-01")) { equal("Java 예제로 설명",str(prompts.resolve(BLOG,category(BLOG)),"prompt")); return "공백 정리 후 동일 블로그·분류 지침 선택"; }
                if(id.equals("PROMPT-02")) {
                    String other="https://second.tistory.com";
                    prompts.save(other,obj("revision",str(prompts.state(other),"revision"),"category",category(other),"prompt","다른 지침"));
                    equal("Java 예제로 설명",str(prompts.resolve(BLOG,category(BLOG)),"prompt")); equal("다른 지침",str(prompts.resolve(other,category(other)),"prompt"));
                    return "같은 분류 번호의 두 블로그 지침 분리 보존";
                }
                if(id.equals("PROMPT-03")) {
                    prompts.save(BLOG,obj("revision",str(prompts.state(BLOG),"revision"),"category",category(BLOG),"prompt","   "));
                    equal("",str(prompts.resolve(BLOG,category(BLOG)),"prompt")); equal(0,prompts.state(BLOG).getAsJsonArray("profiles").size());
                    return "빈 지침 저장 시 해당 분류 해제, 빈 지침 반환";
                }
                Map<String,String> before=bytes(); rejected(409,()->prompts.save(BLOG,obj("revision",revision,"category",category(BLOG),"prompt","오래된 변경"))); equal(before,bytes());
                return "오래된 revision 409, 최신 지침 보존";
            }
            case "PROMPT-05", "PROMPT-06", "PROMPT-07" -> {
                int length=id.equals("PROMPT-05")?9999:id.equals("PROMPT-06")?10000:10001;
                JsonObject request=obj("revision",str(prompts.state(BLOG),"revision"),"category",category(BLOG),"prompt","가".repeat(length));
                if(length>10000) { Map<String,String> before=bytes(); rejected(400,()->prompts.save(BLOG,request)); equal(before,bytes()); return "10,001자 거부, 파일 미변경"; }
                prompts.save(BLOG,request); equal(length,str(prompts.resolve(BLOG,category(BLOG)),"prompt").length()); return length+"자 지침 저장·조회 일치";
            }
            case "REFINE-01" -> {
                prepare(); JsonObject request=applyValue(); refinements().apply(ID,request);
                JsonObject saved=object(directory.resolve("draft.json")); equal(request.get("draft"),saved);
                equal(request.getAsJsonObject("beforeDraft").getAsJsonArray("blocks").get(1),saved.getAsJsonArray("blocks").get(1));
                check(refinements().read(ID,value(saved)).get("undo").isJsonObject(),"되돌리기 기록 누락");
                return "전달된 변경 초안 저장, 비선택 문단·확장 필드와 undo 기록 보존";
            }
            case "REFINE-02", "REFINE-03", "REFINE-04" -> {
                prepare(); JsonObject request=applyValue();
                if(id.equals("REFINE-02")) request.addProperty("expectedDigest","0".repeat(64));
                if(id.equals("REFINE-03")) request.add("beforeDraft",draft("틀린 원문"));
                if(id.equals("REFINE-04")) writeText(directory.resolve("review.md"),"사용자의 최신 검토");
                Map<String,String> before=bytes(); rejected(409,()->refinements().apply(ID,request)); equal(before,bytes());
                return "초안 지문/원문/검토 충돌 409, 최신 자료 전체 보존";
            }
            case "REFINE-05", "REFINE-06" -> {
                prepare(); JsonObject request=applyValue(); JsonObject original=request.getAsJsonObject("beforeDraft"); refinements().apply(ID,request);
                writeText(directory.resolve("review.md"),"현재 검토 메모");
                JsonObject undo=value(original); undo.addProperty("expectedDigest",sha(Files.readAllBytes(directory.resolve("draft.json"))));
                refinements().undo(ID,undo); equal(original,object(directory.resolve("draft.json"))); equal("현재 검토 메모",text(directory.resolve("review.md")));
                if(id.equals("REFINE-05")) return "이전 초안 복원, 현재 검토 메모 유지";
                undo.addProperty("expectedDigest",sha(Files.readAllBytes(directory.resolve("draft.json")))); Map<String,String> before=bytes();
                rejected(409,()->refinements().undo(ID,undo)); equal(before,bytes()); return "이미 사용한 undo 재사용 409, 자료 미변경";
            }
            case "REFINE-07" -> {
                prepare(); JsonObject request=applyValue(); Map<String,String> before=bytes();
                JsonRecordStore failing=new JsonRecordStore() {
                    public JsonElement read(Path file,JsonElement fallback) throws IOException { return records.read(file,fallback); }
                    public void write(Path file,JsonElement record) throws IOException {
                        records.write(file,record);
                        if(file.getFileName().toString().equals("refinement-context.json")) throw new IOException("injected context failure");
                    }
                };
                try { new RefinementService(workspace,drafts,failing).apply(ID,request); throw new AssertionError("실패 주입 미도달"); }
                catch(IOException expected) { check(expected.getMessage().contains("injected"),"예상과 다른 오류"); equal(before,bytes()); check(!exists(directory.resolve("history")),"실패 이력 잔존"); }
                return "context 기록 후 실패 주입, 초안·undo·메타데이터 복원 및 새 이력 제거";
            }
            case "UPDATE-01" -> {
                jobs.create(ID,obj("title","수정 글")); equal("idle",str(updates.state(ID),"phase"));
                updates.save(ID,obj("phase","uncertain","attemptId","a1")); equal("uncertain",str(updates.state(ID),"phase"));
                return "기본 idle과 uncertain 상태 저장·조회 일치";
            }
            case "UPDATE-02" -> {
                jobs.create(ID,obj("title","수정 글")); updates.save(ID,obj("phase","idle")); Map<String,String> before=bytes();
                rejected(400,()->updates.save(ID,obj("phase","unknown"))); equal(before,bytes()); return "미정의 상태 거부, 이전 상태 보존";
            }
            case "UPDATE-03" -> {
                prepare(); JsonObject request=snapshotValue(); Path snapshot=Path.of(str(updates.snapshot(ID,request),"directory"));
                byte[] frozen=Files.readAllBytes(snapshot.resolve("draft.json")); equal(object(directory.resolve("draft.json")),object(snapshot.resolve("draft.json")));
                equal(existing.read(ID),object(snapshot.resolve("existing-post.json")));
                drafts.save(ID,value(draft("사본 생성 뒤 편집"))); check(Arrays.equals(frozen,Files.readAllBytes(snapshot.resolve("draft.json"))),"수정 사본 변경");
                return "초안·manifest·대상 사본 생성, 이후 원본 편집과 분리";
            }
            case "UPDATE-04", "UPDATE-05", "UPDATE-06" -> {
                prepare(); JsonObject request=snapshotValue();
                if(id.equals("UPDATE-04")) request.addProperty("expectedDigest","0".repeat(64));
                if(id.equals("UPDATE-05")) updates.snapshot(ID,request.deepCopy());
                if(id.equals("UPDATE-06")) {
                    Files.write(directory.resolve("images/a.png"),new byte[]{1});
                    JsonObject manifest=object(directory.resolve("manifest.json")); manifest.add("images",obj("v",List.of(obj("name","a.png","sha256","0".repeat(64)))).get("v")); write(directory.resolve("manifest.json"),manifest);
                    request.add("usedImages",obj("v",List.of("a.png")).get("v"));
                }
                Map<String,String> before=bytes(); rejected(409,()->updates.snapshot(ID,request)); equal(before,bytes());
                return "지문 충돌/중복 시도/사진 변경 409, 사본 부분 생성과 덮어쓰기 없음";
            }
            case "UPDATE-07" -> {
                prepare(); Path snapshot=Path.of(str(updates.snapshot(ID,snapshotValue()),"directory"));
                String digest=sha(Files.readAllBytes(snapshot.resolve("draft.json")));
                JsonObject receipt=obj("directory",snapshot.toString(),"record",obj("draftDigest",digest,"phase","updated"));
                updates.receipt(ID,receipt); equal(receipt.get("record"),object(snapshot.resolve("updated-receipt.json")));
                Files.writeString(snapshot.resolve("draft.json"),"tampered"); Map<String,String> before=bytes();
                rejected(409,()->updates.receipt(ID,receipt)); equal(before,bytes());
                return "정상 receipt 저장, 사본 변조 후 receipt 재기록 409";
            }
            default -> throw new IllegalArgumentException("unknown test case: "+id);
        }
    }
    public static void main(String[] args) throws Exception {
        Path root=Path.of(args[0]);
        write(root.resolve("tistory.config.json"),obj("blogUrl",BLOG,"inbox","inbox","output","drafts","styleSamples","style/samples","styleProfile","style/profile.md"));
        workspace=new Workspace(root.toString()); jobs=new JobRepository(workspace); drafts=new DraftRepository(workspace,jobs);
        records=new FileJsonRecordStore(workspace); existing=new ExistingPostService(workspace,records); updates=new UpdateService(workspace,records,existing);
        String actual=execute(args[1]);
        System.out.println(compact(obj("id",args[1],"status","PASS","actual",actual,"javaVersion",System.getProperty("java.version"))));
    }
}
