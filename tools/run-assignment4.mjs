import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

for (const args of [
  [fileURLToPath(new URL('../scripts/java/build.mjs', import.meta.url))],
  ['--test', '--test-reporter=spec', fileURLToPath(new URL('../test/assignment4.test.mjs', import.meta.url))]
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
