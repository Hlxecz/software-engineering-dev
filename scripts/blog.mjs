import { javaStore } from './java-store.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { articleBlocks, manifestImage, normalizeCategory } from '../web/draft-model.js';
import { articleAttributes, articleCss, renderArticleContent } from '../web/article-renderer.js';
import { readReferences } from './references.mjs';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMAGE = /\.(png|jpe?g|webp)$/i;
const sha = data => createHash('sha256').update(data).digest('hex');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const check = (condition, message) => { if (!condition) throw new Error(message); };

// 저장과 입력 사본은 화면과 CLI 모두 같은 Java 구현을 사용한다.
export const newJob = (root, id) => javaStore(root, 'job.create', { id });
export const readyJob = (root, id, options = {}) => javaStore(root, 'job.ready', { id, value: options });
export const listJobs = root => javaStore(root, 'job.list');
export const prepareJob = (root, id) => javaStore(root, 'job.prepare', { id });

const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function requiredText(value, label) {
  check(typeof value === 'string' && value.trim(), `${label}에 텍스트가 필요합니다.`);
  return value;
}

export function buildPreview(draft, manifest, { includeToc = true } = {}) {
  if (draft.category != null) normalizeCategory(draft.category);
  const title = requiredText(draft.title, 'title');
  check(Array.isArray(draft.blocks) && draft.blocks.length, 'blocks가 비어 있습니다.');
  check(Array.isArray(draft.tags) && draft.tags.every(t => typeof t === 'string'), 'tags는 문자열 배열이어야 합니다.');
  const imageMap = new Map(manifest.images.map(i => [i.name, i]));
  if (draft.cover != null) {
    check(typeof draft.cover === 'string' && draft.cover === path.basename(draft.cover) && !/[\\/]/.test(draft.cover) && manifestImage(manifest, draft.cover), '표지 사진을 찾을 수 없습니다. 다시 선택해 주세요.');
    imageMap.set(draft.cover, manifestImage(manifest, draft.cover));
  }
  const usedImages = new Set();
  const blocks = articleBlocks(draft);
  for (const block of blocks) {
    check(block && typeof block === 'object', '각 block은 객체여야 합니다.');
    if (block.type === 'image') {
      const item = imageMap.get(block.file);
      check(item && path.basename(block.file) === block.file, `입력에 없는 이미지입니다: ${block.file}`);
      usedImages.add(block.file);
    }
  }
  const body = renderArticleContent(blocks, { includeToc, githubCard:draft.githubCard });
  const html = `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n` +
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'">\n` +
    `<title>${escapeHtml(title)}</title><style>body{max-width:760px;margin:40px auto;padding:0 20px}.status{font-size:13px;color:#607286;border-bottom:1px solid #dbe3ec;padding-bottom:16px;margin-bottom:28px}${articleCss}</style></head>\n` +
    `<body class="hdev-article"><p class="status">로컬 검토용 초안 · 티스토리 저장 여부는 별도 확인</p><h1 ${articleAttributes('title')}>${escapeHtml(title)}</h1>${body}</body></html>\n`;
  return { html, body, usedImages: [...usedImages] };
}

export function renderDraft(directory) {
  const dest = path.resolve(directory), draft = readJson(path.join(dest, 'draft.json'));
  const manifest = readJson(path.join(dest, 'manifest.json'));
  const { html, usedImages } = buildPreview(draft, manifest);
  for (const name of usedImages) {
    const item = manifestImage(manifest, name);
    check(sha(fs.readFileSync(path.join(dest, 'images', name))) === item.sha256, `보관 이미지가 변경됐습니다: ${name}`);
  }
  fs.writeFileSync(path.join(dest, 'preview.html'), html);
  // Use JSON blocks to populate the editor; local image paths are not upload URLs.
  writeJson(path.join(dest, 'render.json'), { renderedAt: new Date().toISOString(),
    inputDigest: manifest.inputDigest, draftDigest: sha(fs.readFileSync(path.join(dest, 'draft.json'))),
    usedImages: [...usedImages], omittedImages: manifest.images.map(i => i.name).filter(n => !usedImages.includes(n)) });
  return { preview: path.join(dest, 'preview.html'), usedImages: [...usedImages] };
}

async function main() {
  const { initializeAssignment } = await import('./workspace.mjs');
  const dataRoot = initializeAssignment();
  const [command, arg] = process.argv.slice(2);
  const commands = {
    new: () => newJob(dataRoot, arg), ready: () => readyJob(dataRoot, arg),
    list: () => listJobs(dataRoot), prepare: () => prepareJob(dataRoot, arg),
    render: () => { check(arg, '초안 폴더의 경로가 필요합니다.'); return renderDraft(arg); }
  };
  if (!command || command === 'help') {
    console.log('node scripts/blog.mjs new <글-ID>\nnode scripts/blog.mjs ready <글-ID>\nnode scripts/blog.mjs list\nnode scripts/blog.mjs prepare <글-ID>\nnode scripts/blog.mjs render <초안-폴더>');
    return;
  }
  check(Object.hasOwn(commands, command), `알 수 없는 명령: ${command}`);
  console.log(JSON.stringify(commands[command](), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
