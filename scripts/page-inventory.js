// 사용: const src = await fs.readFile(<이 파일>, 'utf8'); const r = await page.evaluate(src);
// 한 화면의 명세 재료를 뽑는다: 제목 구조, 같은 사이트 링크(화면 목록용), 버튼, 폼 입력 규칙, 보이는 문구 원문, 영역 구성.
// 폼은 규칙만 읽는다. 제출하지 않는다.
(() => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const txt = el => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const labelOf = el => {
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) return txt(l); }
    const p = el.closest('label'); if (p) return txt(p);
    return el.getAttribute('aria-label') || el.getAttribute('placeholder') || null;
  };
  const headings = [...document.querySelectorAll('h1,h2,h3,h4')].filter(vis).map(h => `${h.tagName} ${txt(h).slice(0, 120)}`);
  const links = [...document.querySelectorAll('a[href]')].map(a => ({ text: txt(a).slice(0, 60), href: a.href }));
  const internal = [...new Map(links.filter(l => l.href.startsWith(location.origin)).map(l => [l.href.split('#')[0], l])).values()];
  const external = [...new Set(links.filter(l => /^https?:/.test(l.href) && !l.href.startsWith(location.origin)).map(l => l.href.match(/^https?:\/\/[^/]+/)[0]))];
  const buttons = [...document.querySelectorAll('button,[role="button"],input[type="submit"],a[class*="btn"],a[class*="button"]')].filter(vis).map(b => ({ text: (txt(b) || b.value || b.getAttribute('aria-label') || '').slice(0, 60), disabled: b.disabled || b.getAttribute('aria-disabled') === 'true' }));
  const forms = [...document.querySelectorAll('form')].map(f => f.querySelectorAll('input,select,textarea'));
  const looseInputs = [...document.querySelectorAll('input,select,textarea,[contenteditable="true"],[role="textbox"],[role="combobox"],[role="checkbox"],[role="switch"]')];
  const fields = looseInputs.filter(el => el.type !== 'hidden').map(el => ({
    tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), type: el.type || null, name: el.name || null, label: labelOf(el),
    placeholder: el.placeholder || null, required: el.required || el.getAttribute('aria-required') === 'true',
    maxlength: el.maxLength > 0 ? el.maxLength : null, minlength: el.minLength > 0 ? el.minLength : null,
    pattern: el.pattern || null, min: el.min || null, max: el.max || null, inputmode: el.inputMode || null, autocomplete: el.autocomplete || null,
    options: el.tagName === 'SELECT' ? [...el.options].map(o => o.text).slice(0, 40) : null,
    visible: vis(el),
  }));
  const landmarks = [...document.querySelectorAll('header,nav,main,aside,footer,section,[role="dialog"],[role="tablist"]')].filter(vis).map(el => ({ tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), id: el.id || null, firstText: txt(el).slice(0, 80), height: Math.round(el.getBoundingClientRect().height) }));
  const copy = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode; const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t || seen.has(t) || !n.parentElement || !vis(n.parentElement)) continue;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(n.parentElement.tagName)) continue;
    seen.add(t); copy.push(t);
  }
  return {
    url: location.href, title: document.title, docHeight: document.documentElement.scrollHeight,
    headings, landmarks, buttons: buttons.slice(0, 80), fields, formCount: forms.length,
    internalLinks: internal.slice(0, 300), externalHosts: external,
    copy: copy.slice(0, 600),
  };
})()
