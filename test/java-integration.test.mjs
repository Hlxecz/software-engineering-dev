import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { javaStore } from '../scripts/java-store.mjs';
import { javaTool, javaBackendRoot } from '../scripts/java/runtime.mjs';
import { assignmentDataRoot } from '../scripts/workspace.mjs';
import { createApp } from '../scripts/server.mjs';

const sha = data => createHash('sha256').update(data).digest('hex');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hdev-java-assignment-'));
  fs.writeFileSync(path.join(root, 'tistory.config.json'), JSON.stringify({ blogUrl:'https://example.tistory.com', inbox:'inbox', output:'drafts', styleSamples:'style/samples', styleProfile:'style/profile.md' }));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('hdev-java-assignment-'));
    fs.rmSync(root, { recursive:true, force:true });
  });
  return root;
}
const call = (root, operation, parameters) => javaStore(root, operation, parameters);

test('Java owns storage and preserves v0.7.0 input hashes including Korean, emoji and literal escapes', t => {
  const root = fixture(t), id = '호환성-검사';
  assert.equal(call(root, 'health').backend, 'java');
  call(root, 'job.create', { id, value:{ title:'한글 💡' } });
  const bytes = fs.readFileSync(new URL('./fixtures/redis-test.png', import.meta.url));
  call(root, 'job.upload', { id, value:{ name:'사진.png', bytes:bytes.toString('base64'), label:'화면 📷' } });
  const notes = '줄\u2028문자\u2029 / 실제 문자:   / 한글 💡';
  call(root, 'job.save', { id, value:{ title:'한글 💡', notes, order:['사진.png'], references:[] } });
  const ready = call(root, 'job.ready', { id });
  assert.equal(ready.digest, sha(JSON.stringify({ images:[{ name:'사진.png', sha256:sha(bytes), bytes:bytes.length }], notes })));
  const prepared = call(root, 'job.prepare', { id });
  assert.equal(call(root, 'job.prepare', { id }).reused, true);
  assert.equal(fs.readFileSync(path.join(prepared.directory, 'notes.md'), 'utf8'), notes);
  assert.equal(call(root, 'job.read', { id }).notes, notes);
});

test('copied v0.7.0 absolute snapshot paths reopen locally and never change the source', t => {
  const original = fixture(t), copied = fixture(t), id = '기존자료';
  const digest = 'a'.repeat(64), oldDirectory = path.join(original, 'drafts', id, digest);
  for (const root of [original, copied]) {
    fs.mkdirSync(path.join(root, 'inbox', id, 'images'), { recursive:true });
    fs.writeFileSync(path.join(root, 'inbox', id, 'notes.md'), '기존 메모');
    fs.writeFileSync(path.join(root, 'inbox', id, 'app.json'), JSON.stringify({ title:'예전 글', directory:oldDirectory, customField:42 }));
    const directory = path.join(root, 'drafts', id, digest);
    fs.mkdirSync(directory, { recursive:true });
    fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({ id, inputDigest:digest, images:[] }));
    fs.writeFileSync(path.join(directory, 'draft.json'), JSON.stringify({ title:'기존 제목', tags:[], blocks:[{ type:'paragraph', text:'내용' }], customExtension:{ preserved:true } }));
    fs.writeFileSync(path.join(directory, 'notes.md'), '기존 메모');
  }
  const originalApp = fs.readFileSync(path.join(original,'inbox',id,'app.json'));
  const opened = call(copied, 'job.read', { id });
  assert.equal(opened.directory, path.join(copied,'drafts',id,digest));
  assert.equal(opened['draft.json'].customExtension.preserved, true);
  call(copied, 'job.meta.save', { id, value:{ title:'복사본에서 수정' } });
  assert.equal(call(copied, 'job.meta', { id }).customField, 42);
  assert.deepEqual(fs.readFileSync(path.join(original,'inbox',id,'app.json')), originalApp);
});

test('Java validates the whole tree before deleting and preserves unrelated jobs', t => {
  const root = fixture(t), outside = fixture(t), bases = [path.join(root,'inbox'),path.join(root,'drafts')];
  for (const id of ['삭제대상','다른글']) call(root, 'job.create', { id, value:{ title:id } });
  fs.mkdirSync(path.join(root, 'drafts', '삭제대상'), { recursive:true });
  fs.writeFileSync(path.join(outside,'protected.txt'), '보호할 자료');
  const link = path.join(root, 'drafts', '삭제대상', 'linked');
  fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => call(root,'storage.delete',{ id:'삭제대상',bases }), error => error.status === 409);
  assert.ok(fs.existsSync(path.join(root,'inbox','삭제대상','notes.md')));
  assert.equal(fs.readFileSync(path.join(outside,'protected.txt'),'utf8'), '보호할 자료');
  fs.unlinkSync(link);
  const size = call(root,'storage.inspect',{ id:'삭제대상',bases }).bytes;
  assert.ok(size > 0);
  assert.equal(call(root,'storage.delete',{ id:'삭제대상',bases }).bytes, size);
  assert.ok(!fs.existsSync(path.join(root,'inbox','삭제대상')));
  assert.ok(fs.existsSync(path.join(root,'inbox','다른글','notes.md')));
  assert.throws(() => call(root,'storage.delete',{ id:'../outside',bases }));
  assert.throws(() => call(root,'storage.delete',{ id:'다른글',bases:[outside] }), error => error.status === 409);
});

test('two Java processes cannot overwrite a newer prompt revision', async t => {
  const root = fixture(t), blogUrl = 'https://example.tistory.com';
  const revision = call(root,'prompts.state',{ blogUrl }).revision;
  const request = prompt => new Promise((resolve,reject) => {
    const backend = javaBackendRoot();
    const child = spawn(javaTool('java'), ['-Dfile.encoding=UTF-8','-Dstdout.encoding=UTF-8','-cp',[path.join(backend,'build/blog-storage.jar'),path.join(backend,'lib/gson-2.13.2.jar')].join(path.delimiter),'com.hdev.assignment.bridge.Main'],{ windowsHide:true });
    let output=''; child.stdout.setEncoding('utf8'); child.stdout.on('data',data=>output+=data); child.on('error',reject);
    child.on('close',code=>code===0 ? resolve(JSON.parse(output)) : reject(new Error(`Java exit ${code}`)));
    child.stdin.end(JSON.stringify({ root,operation:'prompts.save',blogUrl,value:{ revision,prompt,category:{ blogUrl,id:'0',path:['카테고리 없음'] } } }));
  });
  const results = await Promise.all([request('첫 창'), request('둘째 창')]);
  assert.equal(results.filter(result=>result.ok).length,1);
  assert.equal(results.find(result=>!result.ok).status,409);
});

test('the actual app HTTP API reports Java and fails without Java instead of saving in JS', async t => {
  const root = fixture(t), server = createApp({ root,checkGenerator:async()=>false });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{ server.closeAllConnections();server.close(); });
  const url = `http://127.0.0.1:${server.address().port}`;
  const bootstrap = await (await fetch(url+'/api/bootstrap')).json();
  assert.equal(bootstrap.storageBackend.backend,'java');
  const previous = process.env.HDEV_JAVA_BIN;
  process.env.HDEV_JAVA_BIN = path.join(root,'missing-java.exe');
  try {
    const response = await fetch(url+'/api/jobs',{ method:'POST',headers:{'Content-Type':'application/json','X-App-Token':bootstrap.token},body:JSON.stringify({title:'저장되면 안 됨'}) });
    assert.equal(response.status,503);
    assert.match((await response.json()).error,/Java/);
    assert.ok(!fs.existsSync(path.join(root,'inbox')));
  } finally {
    if(previous===undefined)delete process.env.HDEV_JAVA_BIN;else process.env.HDEV_JAVA_BIN=previous;
  }
});

test('assignment default data paths and app identifiers are separate from upstream', () => {
  const previous = process.env.HDEV_JAVA_DATA_DIR;
  try {
    delete process.env.HDEV_JAVA_DATA_DIR;
    assert.equal(path.basename(path.dirname(assignmentDataRoot())),'H.Dev Studio Java Dev');
    assert.equal(path.basename(path.dirname(assignmentDataRoot({packaged:true}))),'H.Dev Studio Java');
    process.env.HDEV_JAVA_DATA_DIR=path.join(process.env.APPDATA || os.homedir(),'H.Dev Studio','workspace');
    assert.throws(()=>assignmentDataRoot({appData:process.env.APPDATA || os.homedir()}),/원본 앱 자료/);
  } finally { if(previous===undefined)delete process.env.HDEV_JAVA_DATA_DIR;else process.env.HDEV_JAVA_DATA_DIR=previous; }
  const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url)));
  assert.equal(pkg.build.appId,'com.hdev.studio.java.assignment');
});

test('v0.7.3 blog switching uses Java categories and prompts while preserving local drafts, photos and base style', async t => {
  const root = fixture(t), oldBlog = 'https://example.tistory.com', nextBlog = 'https://second.tistory.com';
  const category = blogUrl => ({ blogUrl,id:'11',path:['개발','Java'] });
  const choices = blogUrl => [{blogUrl,id:'0',path:['카테고리 없음']},category(blogUrl)];
  const server = createApp({root,checkGenerator:async()=>false,categoryReader:async({blogUrl})=>choices(blogUrl)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();server.close();});
  const origin = `http://127.0.0.1:${server.address().port}`;
  const bootstrap = await (await fetch(origin+'/api/bootstrap')).json();
  assert.equal(bootstrap.storageBackend.backend,'java');
  const request = async (route,method='GET',body) => {
    const response = await fetch(origin+route,{method,headers:{'X-App-Token':bootstrap.token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
    const value = await response.json(); assert.ok(response.ok,JSON.stringify(value)); return value;
  };
  const style = await request('/api/style');
  await request('/api/style','PUT',{profile:'발표용 기본 지침',urls:[],revision:style.revision});
  const job = await request('/api/jobs','POST',{title:'보존할 글'}), id = job.id;
  const photo = fs.readFileSync(new URL('./fixtures/redis-test.png',import.meta.url));
  call(root,'job.upload',{id,value:{name:'사진.png',bytes:photo.toString('base64'),label:'기존 사진'}});
  await request(`/api/jobs/${id}`,'PUT',{title:'보존할 글',notes:'기존 메모',order:['사진.png'],category:category(oldBlog)});
  const draft = {title:'기존 초안',tags:['Java'],category:category(oldBlog),blocks:[{type:'paragraph',text:'보존할 본문'},{type:'image',file:'사진.png',alt:'사진',caption:'설명'}]};
  await request(`/api/jobs/${id}/draft`,'PUT',{draft,review:'검토 메모'});
  const initialPrompt = await request('/api/writing-prompts');
  await request('/api/writing-prompts','PUT',{category:category(oldBlog),prompt:'첫 블로그 지침',revision:initialPrompt.revision});
  await request('/api/categories','POST',{});
  const snapshot = () => Object.fromEntries(['inbox','drafts'].flatMap(base => fs.readdirSync(path.join(root,base),{recursive:true,withFileTypes:true}).filter(item=>item.isFile()).map(item=>{
    const file=path.join(item.parentPath,item.name);return [path.relative(root,file),sha(fs.readFileSync(file))];
  })));
  const before = snapshot();
  const imageRoutes = [`/api/jobs/${id}/images/${encodeURIComponent('사진.png')}`,`/api/jobs/${id}/draft-images/${encodeURIComponent('사진.png')}`];
  for (const route of imageRoutes) {
    const response=await fetch(origin+route);assert.equal(response.status,200);
    assert.equal(response.headers.get('Content-Type'),'image/png');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),photo);
  }
  assert.throws(()=>call(root,'job.image',{id,value:{name:'../사진.png'}}));
  const switched = await request('/api/blog-settings','PUT',{blogUrl:nextBlog});
  assert.equal(switched.categories.blogUrl,nextBlog);assert.deepEqual(switched.writingPrompts.profiles,[]);
  assert.deepEqual((await request('/api/categories','POST',{})).items,choices(nextBlog));
  await request('/api/writing-prompts','PUT',{category:category(nextBlog),prompt:'둘째 블로그 지침',revision:switched.writingPrompts.revision});
  assert.deepEqual((await request(`/api/jobs/${id}`)).draft,draft);
  const returned = await request('/api/blog-settings','PUT',{blogUrl:oldBlog});
  // Upstream keeps one category cache: another blog's list must never leak into it.
  assert.deepEqual(returned.categories.items,[]);
  assert.deepEqual((await request('/api/categories','POST',{})).items,choices(oldBlog));
  assert.equal(returned.writingPrompts.profiles[0].prompt,'첫 블로그 지침');
  assert.equal(call(root,'prompts.resolve',{blogUrl:nextBlog,category:category(nextBlog)}).prompt,'둘째 블로그 지침');
  assert.equal((await request('/api/style')).profile,'발표용 기본 지침');
  assert.deepEqual(snapshot(),before);
  const javaExecutable = process.env.HDEV_JAVA_BIN;
  process.env.HDEV_JAVA_BIN=path.join(root,'missing-java.exe');
  try {
    for(const route of ['/api/categories','/api/writing-prompts','/api/style',...imageRoutes])assert.equal((await fetch(origin+route)).status,503);
  } finally {if(javaExecutable===undefined)delete process.env.HDEV_JAVA_BIN;else process.env.HDEV_JAVA_BIN=javaExecutable;}
});
