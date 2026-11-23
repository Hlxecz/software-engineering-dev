import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { javaTool, javaBackendRoot, projectRoot } from '../scripts/java/runtime.mjs';

const cases = JSON.parse(fs.readFileSync(new URL('../docs/assignment/과제4-구현및테스트/test-cases.json', import.meta.url), 'utf8'));
const suiteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hdev-assignment4-'));
const classes = path.join(suiteRoot, 'classes');
fs.mkdirSync(classes);
const backend = javaBackendRoot();
const classpath = [path.join(backend, 'build/blog-storage.jar'), path.join(backend, 'lib/gson-2.13.2.jar')].join(path.delimiter);
const source = fileURLToPath(new URL('../java-backend/src/test/java/com/hdev/assignment/Assignment4Cases.java', import.meta.url));
const results = [];
const startedAt = new Date().toISOString();
const compiled = spawnSync(javaTool('javac'), ['-encoding', 'UTF-8', '--release', '17', '-cp', classpath, '-d', classes, source], { encoding: 'utf8', windowsHide: true });

after(() => {
  const output = path.join(projectRoot, 'output/assignment4');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({
    startedAt, finishedAt: new Date().toISOString(), platform: process.platform, node: process.version,
    expected: cases.length, passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length, results
  }, null, 2) + '\n');
  assert.equal(path.dirname(suiteRoot), path.resolve(os.tmpdir()));
  assert.ok(path.basename(suiteRoot).startsWith('hdev-assignment4-'));
  fs.rmSync(suiteRoot, { recursive: true, force: true });
});

for (const item of cases) {
  test(`${item.id} ${item.target}.${item.method} - ${item.expected}`, t => {
    const root = path.join(suiteRoot, item.id);
    fs.mkdirSync(root);
    const started = performance.now();
    try {
      assert.equal(compiled.status, 0, compiled.error?.message || compiled.stderr || compiled.stdout);
      const result = spawnSync(javaTool('java'), [
        '-Dfile.encoding=UTF-8', '-Dstdout.encoding=UTF-8', '-cp', [classes, classpath].join(path.delimiter),
        'com.hdev.assignment.Assignment4Cases', root, item.id
      ], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
      assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
      const actual = JSON.parse(result.stdout.trim());
      assert.equal(actual.id, item.id);
      assert.equal(actual.status, 'PASS');
      results.push({ ...actual, durationMs: Math.round(performance.now() - started) });
      t.diagnostic(actual.actual);
    } catch (error) {
      results.push({ id: item.id, status: 'FAIL', actual: error.message, durationMs: Math.round(performance.now() - started) });
      throw error;
    }
  });
}
