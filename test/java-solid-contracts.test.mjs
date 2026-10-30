import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {javaTool,javaBackendRoot} from '../scripts/java/runtime.mjs';

test('actual Java services accept replacement stores and restore files after injected late failures',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'hdev-java-contracts-'));
  t.after(()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert.ok(path.basename(root).startsWith('hdev-java-contracts-'));fs.rmSync(root,{recursive:true,force:true});});
  fs.writeFileSync(path.join(root,'tistory.config.json'),JSON.stringify({blogUrl:'https://example.tistory.com',inbox:'inbox',output:'drafts',styleSamples:'style/samples',styleProfile:'style/profile.md'}));
  const backend=javaBackendRoot(),classpath=[path.join(backend,'build/blog-storage.jar'),path.join(backend,'lib/gson-2.13.2.jar')].join(path.delimiter);
  const classes=path.join(root,'contract-classes');fs.mkdirSync(classes);
  const source=fileURLToPath(new URL('../java-backend/src/test/java/com/hdev/assignment/StorageContracts.java',import.meta.url));
  const compiled=spawnSync(javaTool('javac'),['-encoding','UTF-8','--release','17','-cp',classpath,'-d',classes,source],{encoding:'utf8',windowsHide:true});
  assert.equal(compiled.status,0,compiled.stderr||compiled.error?.message);
  const result=spawnSync(javaTool('java'),['-Dfile.encoding=UTF-8','-cp',[classes,classpath].join(path.delimiter),'com.hdev.assignment.StorageContracts',root],{encoding:'utf8',windowsHide:true});
  assert.equal(result.status,0,result.stderr||result.error?.message);
  assert.match(result.stdout,/failure rollback contracts passed/);
});
