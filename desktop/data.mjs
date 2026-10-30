import fs from 'node:fs';
import path from 'node:path';
import { javaStore } from '../scripts/java-store.mjs';

function upgradeDefaultProfile(root, bundle) {
  const next = fs.readFileSync(path.join(bundle, 'config/style.example.md'), 'utf8');
  return javaStore(root, 'style.upgradeDefault', { value: { next } });
}

export function initializeData(root, bundle) {
  fs.mkdirSync(root, { recursive: true });
  const defaults = {
    'tistory.config.json': 'config/tistory.example.json',
    'style/profile.md': 'config/style.example.md',
    'style/samples/source-notes.md': 'config/source-notes.example.md',
    'docs/WRITING.md': 'docs/WRITING.md', 'AGENTS.md': 'AGENTS.md',
    'docs/AGENT-REFERENCE.md': 'docs/AGENT-REFERENCE.md'
  };
  for (const [relative, source] of Object.entries(defaults)) {
    const destination = path.join(root, relative);
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.join(bundle, source), destination, fs.constants.COPYFILE_EXCL);
    }
  }
  upgradeDefaultProfile(root, bundle);
  for (const dir of ['inbox', 'drafts']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  return root;
}
