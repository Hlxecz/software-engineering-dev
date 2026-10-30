import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {javaStore} from '../scripts/java-store.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const put=(file,value)=>fs.writeFileSync(file,JSON.stringify(value));
const call=(root,operation,value={})=>javaStore(root,operation,value);
function fixture(t,id='java-upgrade') {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'hdev-java-upgrade-'));
  put(path.join(root,'tistory.config.json'),{blogUrl:'https://example.tistory.com',inbox:'inbox',output:'drafts',styleSamples:'style/samples',styleProfile:'style/profile.md'});
  t.after(()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert.ok(path.basename(root).startsWith('hdev-java-upgrade-'));fs.rmSync(root,{recursive:true,force:true});});
  call(root,'job.create',{id,value:{title:'텍스트 초안'}});
  return {root,id,job:path.join(root,'inbox',id)};
}
function saved(t) {
  const f=fixture(t);call(f.root,'job.ready',{id:f.id,value:{allowEmptyImages:true}});
  const {directory}=call(f.root,'job.prepare',{id:f.id});
  const value={directory,draft:{title:'원문',tags:[],blocks:[{type:'paragraph',text:'원래 내용'}],extension:{keep:true}},manifest:json(path.join(directory,'manifest.json')),usedImages:[],review:'사용자 검토 메모'};
  call(f.root,'draft.save',{id:f.id,value});return {...f,directory,value};
}
const target=()=>({identity:{blogUrl:'https://example.tistory.com',url:'https://example.tistory.com/17',postId:'17'},source:{title:'기존 제목',digest:'remote',templates:{}},remoteDigest:'remote',unknown:{keep:1}});

test('Java text-only ready survives prepare/list/reuse while the default still requires photos',t=>{
  const {root,id,job}=fixture(t);
  assert.throws(()=>call(root,'job.ready',{id}),/images/);
  call(root,'job.ready',{id,value:{allowEmptyImages:true}});
  assert.equal(json(path.join(job,'ready.json')).textOnly,true);
  const prepared=call(root,'job.prepare',{id});
  assert.equal(json(path.join(prepared.directory,'manifest.json')).textOnly,true);
  assert.equal(call(root,'job.prepare',{id}).reused,true);
  assert.equal(call(root,'job.list').find(j=>j.id===id).status,'prepared');
  const opened=call(root,'job.read',{id});
  assert.equal(opened['existing-post.json'],null);
  assert.equal(opened['refinement-undo.json'],null);
  assert.deepEqual(opened['post-update.json'],{phase:'idle'});
  assert.equal(call(root,'health').classes,19);
});

test('Java imports, conflict backups and deletion preserve unrelated mappings and extension fields',t=>{
  const f=saved(t), {root,id,directory}=f;
  call(root,'existing.save',{id,value:target()});
  assert.equal(call(root,'existing.read',{id}).unknown.keep,1);
  call(root,'existing.index.save',{value:{one:id,other:'another-job',object:{id},metadata:{keep:3}}});
  assert.equal(call(root,'existing.index.read').mapping.other,'another-job');
  const backup=call(root,'existing.backup',{id,value:{directory,draft:f.value.draft,target:target()}});
  assert.match(backup.filename,/^\d+-[a-f0-9]{8}\.json$/);
  assert.deepEqual(call(root,'existing.backup.read',{id,value:{directory,name:backup.filename}}).draft,f.value.draft);
  assert.throws(()=>call(root,'existing.backup.read',{id,value:{directory,name:'../../app.json'}}));
  assert.equal(call(root,'job.read',{id})['existing-post.json'].unknown.keep,1);
  assert.throws(()=>call(root,'existing.save',{id,value:{...target(),identity:{...target().identity,blogUrl:'https://other.tistory.com'}}}),e=>e.status===409);
  call(root,'storage.delete',{id,bases:[path.join(root,'inbox'),path.join(root,'drafts')]});
  assert.deepEqual(call(root,'existing.index.read').mapping,{other:'another-job',metadata:{keep:3}});
});

test('Java update snapshots check current bytes, photo hashes, target and bounded receipt paths',t=>{
  const {root,id,directory,value}=saved(t);
  const image=Buffer.from('fake image bytes');fs.mkdirSync(path.join(directory,'images'),{recursive:true});fs.writeFileSync(path.join(directory,'images','sample.png'),image);
  const manifest={...value.manifest,images:[{name:'sample.png',sha256:digest(image),bytes:image.length}]};put(path.join(directory,'manifest.json'),manifest);
  call(root,'existing.save',{id,value:target()});
  const expectedDigest=digest(fs.readFileSync(path.join(directory,'draft.json')));
  const request={directory,expectedDigest,attemptId:'safe-attempt',usedImages:['sample.png']};
  assert.throws(()=>call(root,'update.snapshot',{id,value:{...request,expectedDigest:'0'.repeat(64)}}),e=>e.status===409);
  fs.writeFileSync(path.join(directory,'images','sample.png'),'tampered');
  assert.throws(()=>call(root,'update.snapshot',{id,value:request}),e=>e.status===409);
  assert.equal(fs.existsSync(path.join(directory,'updates','safe-attempt')),false);
  fs.writeFileSync(path.join(directory,'images','sample.png'),image);
  const snapshot=call(root,'update.snapshot',{id,value:request}).directory;
  assert.deepEqual(fs.readFileSync(path.join(snapshot,'images','sample.png')),image);
  const record={phase:'updated',draftDigest:expectedDigest,url:target().identity.url,verifiedAt:'fake-test-verification',extension:7};
  call(root,'update.state.save',{id,value:record});
  assert.equal(call(root,'update.state.read',{id}).extension,7);
  call(root,'update.receipt',{id,value:{directory:snapshot,record}});
  assert.deepEqual(json(path.join(snapshot,'updated-receipt.json')),record);
  assert.throws(()=>call(root,'update.receipt',{id,value:{directory,record}}));
  assert.throws(()=>call(root,'update.snapshot',{id,value:{...request,attemptId:'../../escape'}}));
  assert.equal(call(root,'job.read',{id})['post-update.json'].extension,7);
});

test('Java refinement commits its undo record, rejects stale changes, and undo preserves the current review',t=>{
  const {root,id,directory,value}=saved(t), file=path.join(directory,'draft.json');
  const before=fs.readFileSync(file), expectedDigest=digest(before);
  const next={...value.draft,blocks:[{type:'paragraph',text:'다듬은 내용'}]};
  const request={...value,draft:next,expectedDigest,beforeDraft:value.draft,beforeReview:value.review,context:{indices:[0],instruction:'간결하게',custom:5}};
  assert.throws(()=>call(root,'refinement.apply',{id,value:{...request,expectedDigest:'0'.repeat(64)}}),e=>e.status===409);
  assert.deepEqual(fs.readFileSync(file),before);
  assert.throws(()=>call(root,'refinement.apply',{id,value:{...request,beforeDraft:{...value.draft,title:'stale'}}}),e=>e.status===409);
  call(root,'refinement.apply',{id,value:request});
  const appliedDigest=digest(fs.readFileSync(file));
  const refinement=call(root,'refinement.read',{id,value:{directory}});
  assert.equal(refinement.undo.afterDigest,appliedDigest);assert.equal(refinement.context.custom,5);
  assert.deepEqual(call(root,'job.read',{id})['refinement-context.json'],request.context);
  fs.writeFileSync(path.join(directory,'review.md'),'다듬은 뒤 사용자가 쓴 검토 메모');
  assert.throws(()=>call(root,'refinement.undo',{id,value:{...value,draft:{...value.draft,title:'wrong'},expectedDigest:appliedDigest}}),e=>e.status===409);
  call(root,'refinement.undo',{id,value:{...value,review:'이 값으로 덮으면 안 됨',expectedDigest:appliedDigest}});
  assert.deepEqual(json(file),value.draft);
  assert.equal(fs.readFileSync(path.join(directory,'review.md'),'utf8'),'다듬은 뒤 사용자가 쓴 검토 메모');
  assert.equal(call(root,'refinement.read',{id,value:{directory}}).undo.undone,true);
  assert.throws(()=>call(root,'refinement.undo',{id,value:{...value,expectedDigest:digest(fs.readFileSync(file))}}),e=>e.status===409);
});

test('Java migration upgrades only known default profiles and leaves custom or external paths intact',t=>{
  const {root}=fixture(t), profile=path.join(root,'style','profile.md');fs.mkdirSync(path.dirname(profile),{recursive:true});
  const legacy=fs.readFileSync(new URL('../config/style.example.md',import.meta.url),'utf8');
  const previous=fs.readFileSync(new URL('../java-backend/src/test/resources/legacy-profile.md',import.meta.url),'utf8');
  fs.writeFileSync(profile,previous.replace(/\n/g,'\r\n'));
  const migration=call(root,'style.upgradeDefault',{value:{next:legacy}});
  assert.equal(migration.updated,true);
  assert.equal(fs.readFileSync(migration.backup,'utf8'),previous.replace(/\n/g,'\r\n'));
  assert.equal(fs.readFileSync(profile,'utf8'),legacy);
  fs.writeFileSync(profile,'사용자가 고친 지침');
  assert.deepEqual(call(root,'style.upgradeDefault',{value:{next:legacy}}),{updated:false});
  assert.equal(fs.readFileSync(profile,'utf8'),'사용자가 고친 지침');
  const config=json(path.join(root,'tistory.config.json'));config.styleProfile='other/profile.md';put(path.join(root,'tistory.config.json'),config);
  assert.deepEqual(call(root,'style.upgradeDefault',{value:{next:legacy}}),{updated:false});
});
