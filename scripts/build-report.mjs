// 사용: node build-report.mjs <분석 폴더>
// <분석 폴더>/docs/*.md (파일 이름 순서) + captures/** + data/** 를 읽어 <분석 폴더>/index.html 을 만든다.
// 문서 속 캡처 파일 이름, 가이드 캡처 줄임 이름(editor.overview), data 파일 이름을 자동으로 링크하고,
// [사실]/[추정]/[미확인]/[2차] 표시를 태그로 바꾸고, 화면 ID(P01, A01, L01)로 시작하는 제목 아래에 해당 캡처를 붙인다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, '..');
const { marked } = await import(path.join(SKILL, 'assets/vendor/marked.esm.js'));

const ROOT = path.resolve(process.argv[2] || '.');
const DOCS = path.join(ROOT, 'docs');
if (!fs.existsSync(DOCS)) { console.error('docs/ 폴더가 없습니다: ' + DOCS); process.exit(1); }

const walk = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]) : [];
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const encPath = (p) => p.split('/').map(encodeURIComponent).join('/');

// ---------- 파일 색인 ----------
const IMG_RE = /\.(png|webp|jpe?g|gif)$/i;
const captures = walk(path.join(ROOT, 'captures')).filter(f => IMG_RE.test(f)).map(rel).sort();
const dataFiles = walk(path.join(ROOT, 'data')).map(rel).sort();
const capByName = new Map(captures.map(c => [path.basename(c), c]));
const capByShort = new Map(); // editor.overview-Bm9K60s6.webp -> editor.overview
for (const c of captures) { const m = path.basename(c).match(/^([a-z]+(?:\.[a-z][a-z0-9-]*)+)-[A-Za-z0-9_-]{6,}\.[a-z]+$/); if (m) capByShort.set(m[1], c); }
const dataByName = new Map(dataFiles.map(d => [path.basename(d), d]));
const capsById = (id) => captures.filter(c => path.basename(c).startsWith(id + '-'));
const used = new Set();
const missing = new Map();

// ---------- 본문 후처리 ----------
const TAG_CLASS = { '사실': 'fact', '확인': 'fact', '확정': 'fact', '추정': 'guess', '미확인': 'unknown', '2차': 'second', '검토': 'guess' };
const TOKEN_RE = /(\[(사실|추정|미확인|2차|확인|확정|검토)(?:[^\]\[]{0,80})\])|([A-Za-z0-9_.\-]+\.(?:png|webp|jpe?g|gif))|((?:data\/)?[A-Za-z0-9_\-]+(?:\.[A-Za-z0-9_\-]+)*\.(?:json|txt|csv|md|xml))|\b([a-z]+(?:\.[a-z][a-z0-9-]*)+)\b/g;
function enrichText(text) {
  return text.replace(TOKEN_RE, (all, tag, tagWord, img, dataRef, short) => {
    if (tag) return `<span class="tag t-${TAG_CLASS[tagWord] || 'fact'}">${tag.slice(1, -1)}</span>`;
    if (img) { const c = capByName.get(img); if (c) { used.add(c); return capLink(c, img); } missing.set(img, (missing.get(img) || 0) + 1); return all; }
    if (dataRef) { const d = dataByName.get(path.basename(dataRef)); if (d) return `<a class="data" href="${encPath(d)}" target="_blank">${dataRef}</a>`; return all; }
    if (short) { const c = capByShort.get(short); if (c) { used.add(c); return capLink(c, short); } return all; }
    return all;
  });
}
const capLink = (c, label) => `<a class="cap" href="${encPath(c)}" data-cap="${esc(c)}">${esc(label)}</a>`;
function enrichHtml(html) {
  html = html.replace(/<a href="([^"]+)"[^>]*>(사실|추정|미확인|2차|확인)([^<]{0,60})<\/a>/g, (m, href, w, rest) => `<a class="tag t-${TAG_CLASS[w] || 'fact'}" href="${href}" target="_blank">${w}${rest}</a>`);
  const parts = html.split(/(<[^>]+>)/);
  let inPre = 0, inA = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('<')) {
      if (/^<pre[\s>]/i.test(p)) inPre++; else if (/^<\/pre>/i.test(p)) inPre--;
      if (/^<a[\s>]/i.test(p)) inA++; else if (/^<\/a>/i.test(p)) inA--;
      continue;
    }
    if (!inPre && !inA && p) parts[i] = enrichText(p);
  }
  return parts.join('');
}

// ---------- 마크다운 변환 ----------
const toc = [];
let docIndex = 0, headCount = 0;
const strip = (ids) => {
  const caps = [...new Set(ids.flatMap(capsById))];
  if (!caps.length) return '';
  caps.forEach(c => used.add(c));
  const shown = caps.slice(0, 8);
  return `<div class="strip">${shown.map(c => `<a class="thumb" href="${encPath(c)}" data-cap="${esc(c)}"><img loading="lazy" src="${encPath(c)}" alt=""><span>${esc(path.basename(c).replace(IMG_RE, ''))}</span></a>`).join('')}${caps.length > shown.length ? `<a class="more" href="#gallery" data-filter="${esc(ids[0])}-">+${caps.length - shown.length}</a>` : ''}</div>`;
};
marked.use({
  gfm: true,
  renderer: {
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const plain = inner.replace(/<[^>]+>/g, '').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&(?:lt|gt|quot|#39);/g, ' ').trim();
      const id = `d${docIndex}-h${++headCount}`;
      if (depth <= 3) toc.push({ doc: docIndex, depth, id, text: plain });
      const ids = [...plain.matchAll(/^(?:(P|A|L|S)\d{2})\b/g)].map(m => m[0]);
      return `<h${depth} id="${id}">${inner}</h${depth}>${depth >= 2 ? strip(ids) : ''}`;
    },
    code({ text, lang }) {
      if ((lang || '').trim() === 'mermaid') return `<pre class="mermaid">${esc(text)}</pre>`;
      return `<pre class="code"><code>${esc(text)}</code></pre>`;
    },
    table(token) {
      const html = marked.Renderer.prototype.table.call(this, token);
      return `<div class="tablewrap">${html}</div>`;
    },
  },
});

// 한국어 문서의 범위 표기(A01~A82)가 취소선으로 바뀌지 않게, 코드 밖의 물결표 하나를 문자 참조로 바꾼다
const protectTilde = (md) => md.split(/(```[\s\S]*?```|`[^`\n]*`)/).map((p, i) => i % 2 ? p : p.replace(/~~/g, '\u0000').replace(/~/g, '&#126;').replace(/\u0000/g, '~~')).join('');
const docFiles = fs.readdirSync(DOCS).filter(f => f.endsWith('.md')).sort();
const sections = [];
let title = path.basename(ROOT), summary = '', checkedAt = '';
for (const f of docFiles) {
  docIndex++;
  headCount = 0;
  const md = fs.readFileSync(path.join(DOCS, f), 'utf8');
  if (docIndex === 1) {
    const h1 = md.match(/^#\s+(.+)$/m); if (h1) title = h1[1].trim();
    const s = md.match(/^한 줄 요약:\s*(.+)$/m); if (s) summary = s[1].trim();
    const d = title.match(/\((\d{4}-\d{2}-\d{2})[^)]*\)/); if (d) checkedAt = d[1];
  }
  const body = docIndex === 1 ? md.replace(/^#\s+.+\n/m, '').replace(/^한 줄 요약:.*\n/m, '') : md;
  if (docIndex === 1) toc.push({ doc: 1, depth: 1, id: 'doc-1', text: '개요' });
  const html = enrichHtml(marked.parse(protectTilde(body)));
  sections.push({ file: f, html, idx: docIndex });
}

// ---------- 캡처 모아보기·데이터 목록 ----------
const groups = {};
for (const c of captures) { const g = c.split('/')[1] || 'etc'; (groups[g] ||= []).push(c); }
const GROUP_ORDER = ['public', 'app', 'official', 'external'];
const GROUP_LABEL = { public: '공개 화면', app: '앱 실사용', official: '공식 자료 캡처', external: '외부(광고·커뮤니티)' };
const groupEntries = Object.entries(groups).sort((a, b) => (GROUP_ORDER.indexOf(a[0]) + 99) % 99 - (GROUP_ORDER.indexOf(b[0]) + 99) % 99);
const gallery = groupEntries.map(([g, list]) => `<h3>${esc(GROUP_LABEL[g] || g)} <small>${list.length}장</small></h3><div class="grid">${list.map(c => `<a class="thumb" href="${encPath(c)}" data-cap="${esc(c)}" data-name="${esc(path.basename(c))}"><img loading="lazy" src="${encPath(c)}" alt=""><span>${esc(path.basename(c).replace(IMG_RE, ''))}</span></a>`).join('')}</div>`).join('');
const sizeOf = (p) => { const b = fs.statSync(path.join(ROOT, p)).size; return b > 1e6 ? (b / 1e6).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1e3)) + 'KB'; };
const dataGroups = {};
for (const d of dataFiles) { const g = d.split('/').length > 2 ? d.split('/')[1] : '(기타)'; (dataGroups[g] ||= []).push(d); }
const DATA_LABEL = { api: 'API 요청 기록', samples: '실제 응답 예시', extract: '스크립트 추출 결과', snapshots: '화면 구조 스냅숏', source: '원문 자료' };
const dataList = Object.entries(dataGroups).map(([g, list]) => `<h3>${esc(DATA_LABEL[g] || g)} <small>${list.length}개</small></h3><ul class="files">${list.map(d => `<li><a class="data" href="${encPath(d)}" target="_blank">${esc(d.replace(/^data\//, ''))}</a><span>${sizeOf(d)}</span></li>`).join('')}</ul>`).join('');

// ---------- 목차 ----------
const navText = (s) => s.replace(/\s*\((?:상세|http)[^)]*\)/g, '').replace(/\s+—\s+https?:\/\/\S+/g, '').replace(/\s*\[(?:사실|추정|미확인|2차)[^\]]*\]/g, '').trim();
const docTitle = (i) => (toc.find(t => t.doc === i && t.depth === 1) || {}).text || docFiles[i - 1];
const nav = sections.map(s => {
  const subs = toc.filter(t => t.doc === s.idx && t.depth === 2);
  return `<li><a href="#doc-${s.idx}" class="navdoc">${esc(navText(docTitle(s.idx)))}</a>${subs.length ? `<ul>${subs.map(t => `<li><a href="#${t.id}">${esc(navText(t.text))}</a></li>`).join('')}</ul>` : ''}</li>`;
}).join('') + `<li><a href="#gallery" class="navdoc">캡처 모아보기 <small>${captures.length}</small></a></li><li><a href="#datafiles" class="navdoc">데이터 파일 <small>${dataFiles.length}</small></a></li>`;

const needMermaid = sections.some(s => s.html.includes('class="mermaid"'));
if (needMermaid) {
  fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
  fs.copyFileSync(path.join(SKILL, 'assets/vendor/mermaid.min.js'), path.join(ROOT, 'assets/mermaid.min.js'));
}
const css = fs.readFileSync(path.join(SKILL, 'assets/report.css'), 'utf8');
const js = fs.readFileSync(path.join(SKILL, 'assets/report.js'), 'utf8');

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>${css}</style>
</head>
<body>
<aside class="side">
  <div class="brand">${esc(title.replace(/\s*\(\d{4}-.*$/, ''))}</div>
  ${checkedAt ? `<div class="meta">확인 ${esc(checkedAt)}</div>` : ''}
  <nav><ul>${nav}</ul></nav>
  <div class="legend"><span class="tag t-fact">사실</span><span class="tag t-guess">추정</span><span class="tag t-unknown">미확인</span><span class="tag t-second">2차</span></div>
</aside>
<main>
  <header class="hero">
    <p class="eyebrow">서비스 분석 보고서</p>
    <h1 class="title">${esc(title.replace(/\s*\(\d{4}-.*$/, ''))}</h1>
    ${summary ? `<p class="lede">${enrichText(esc(summary))}</p>` : ''}
    <dl class="stats">
      <div><dt>문서</dt><dd>${sections.length}</dd></div>
      <div><dt>캡처</dt><dd>${captures.length}</dd></div>
      ${groupEntries.map(([g, l]) => `<div><dt>${esc(GROUP_LABEL[g] || g)}</dt><dd>${l.length}</dd></div>`).join('')}
      <div><dt>데이터 파일</dt><dd>${dataFiles.length}</dd></div>
    </dl>
  </header>
  ${sections.map(s => `<section class="doc" id="doc-${s.idx}"><div class="docsrc">docs/${esc(s.file)}</div>${s.html}</section>`).join('\n')}
  <section class="doc" id="gallery"><h1>캡처 모아보기</h1><input class="filter" type="search" placeholder="파일 이름으로 찾기 (예: P08, wireframe, mo)">${gallery}</section>
  <section class="doc" id="datafiles"><h1>데이터 파일</h1><p class="muted">스크립트 추출 원본, API 응답 구조, 원문 자료. 누르면 새 탭에서 열립니다.</p>${dataList}</section>
</main>
<div class="lightbox" hidden><button class="lb-close" aria-label="닫기">닫기</button><button class="lb-prev" aria-label="이전">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-next" aria-label="다음">›</button></div>
${needMermaid ? '<script src="assets/mermaid.min.js"></script>' : ''}
<script>${js}</script>
</body>
</html>`;
fs.writeFileSync(path.join(ROOT, 'index.html'), html);

const unused = captures.filter(c => !used.has(c));
console.log(JSON.stringify({
  index: rel(path.join(ROOT, 'index.html')), docs: docFiles, captures: captures.length, dataFiles: dataFiles.length,
  linkedCaptures: used.size, unreferencedCaptures: unused.length,
  missingImageRefs: [...missing.entries()].slice(0, 30),
  sizeKB: Math.round(Buffer.byteLength(html) / 1024),
}, null, 1));
