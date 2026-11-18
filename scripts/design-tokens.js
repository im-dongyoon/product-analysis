// 사용: const src = await fs.readFile(<이 파일>, 'utf8'); const r = await page.evaluate(src);
// 화면에 실제로 쓰인 디자인 값(색, 글꼴, 크기, 간격, 모서리, 그림자, CSS 변수, 화면 너비 기준)을 사용 횟수와 함께 뽑는다.
// 다른 출처 CSS는 cssRules를 못 읽으므로 crossOriginSheets 목록을 fetch해서 @media·:root 변수를 따로 읽는다.
(() => {
  const els = [...document.querySelectorAll('body *')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }).slice(0, 4000);
  const tally = () => new Map();
  const bump = (m, k) => { if (k === undefined || k === null || k === '') return; m.set(k, (m.get(k) || 0) + 1); };
  const T = { color: tally(), background: tally(), border: tally(), fontFamily: tally(), fontSize: tally(), fontWeight: tally(), lineHeight: tally(), letterSpacing: tally(), radius: tally(), shadow: tally(), padding: tally(), margin: tally(), gap: tally(), textStyle: tally(), transition: tally(), zIndex: tally() };
  const isZero = v => /^(0px|0|normal|none|auto)$/.test(v);
  for (const el of els) {
    const s = getComputedStyle(el);
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText) {
      bump(T.color, s.color);
      bump(T.fontFamily, s.fontFamily);
      bump(T.fontSize, s.fontSize);
      bump(T.fontWeight, s.fontWeight);
      bump(T.lineHeight, s.lineHeight);
      if (!isZero(s.letterSpacing)) bump(T.letterSpacing, s.letterSpacing);
      bump(T.textStyle, `${s.fontSize}/${s.lineHeight} ${s.fontWeight}`);
    }
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') bump(T.background, s.backgroundColor);
    if (s.borderTopWidth !== '0px' && s.borderTopStyle !== 'none') bump(T.border, `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`);
    if (!isZero(s.borderTopLeftRadius)) bump(T.radius, s.borderRadius);
    if (s.boxShadow !== 'none') bump(T.shadow, s.boxShadow);
    for (const p of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) if (!isZero(s[p])) bump(T.padding, s[p]);
    for (const p of ['marginTop', 'marginBottom']) if (!isZero(s[p])) bump(T.margin, s[p]);
    if (!isZero(s.rowGap)) bump(T.gap, s.rowGap);
    if (!isZero(s.columnGap)) bump(T.gap, s.columnGap);
    if (s.transitionDuration !== '0s') bump(T.transition, `${s.transitionProperty} ${s.transitionDuration} ${s.transitionTimingFunction}`);
    if (s.zIndex !== 'auto') bump(T.zIndex, s.zIndex);
  }
  const top = (m, n = 25) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([v, c]) => ({ v, c }));

  const cssVars = {};
  const media = new Set();
  const keyframes = new Set();
  const crossOriginSheets = [];
  const walk = rules => {
    for (const r of rules) {
      if (r.type === 1 && /^(:root|html|body|\[data-theme[^\]]*\]|\.dark|\.light)$/.test(r.selectorText?.trim())) {
        for (const p of r.style) if (p.startsWith('--')) cssVars[`${r.selectorText.trim()} ${p}`] = r.style.getPropertyValue(p).trim();
      }
      if (r.type === 4) { media.add(r.conditionText || r.media?.mediaText); walk(r.cssRules); }
      if (r.type === 7) keyframes.add(r.name);
      if (r.cssRules && r.type !== 4) { try { walk(r.cssRules); } catch {} }
    }
  };
  for (const sh of document.styleSheets) {
    try { walk(sh.cssRules); } catch { if (sh.href) crossOriginSheets.push(sh.href); }
  }
  const fonts = [...document.fonts].map(f => `${f.family} ${f.weight} ${f.style} ${f.status}`);
  const icons = {
    svgInline: document.querySelectorAll('svg').length,
    lucide: document.querySelectorAll('[class*="lucide"]').length,
    materialSymbols: document.querySelectorAll('.material-symbols-outlined, .material-icons').length,
    fontAwesome: document.querySelectorAll('[class*="fa-"]').length,
  };
  const container = (() => {
    const widths = tally();
    for (const el of els) { const s = getComputedStyle(el); if (s.maxWidth !== 'none' && s.marginLeft === s.marginRight && s.marginLeft !== '0px') bump(widths, s.maxWidth); }
    return top(widths, 8);
  })();
  return {
    url: location.href,
    viewport: `${innerWidth}x${innerHeight}`,
    sampled: els.length,
    textColor: top(T.color), background: top(T.background), border: top(T.border, 12),
    fontFamily: top(T.fontFamily, 8), fontSize: top(T.fontSize), fontWeight: top(T.fontWeight, 8), lineHeight: top(T.lineHeight, 15), letterSpacing: top(T.letterSpacing, 10),
    textStyle: top(T.textStyle, 20),
    radius: top(T.radius, 12), shadow: top(T.shadow, 10),
    padding: top(T.padding, 20), margin: top(T.margin, 15), gap: top(T.gap, 12),
    containerMaxWidth: container,
    transition: top(T.transition, 10), zIndex: top(T.zIndex, 10),
    cssVars, mediaQueries: [...media], keyframes: [...keyframes], fonts, icons, crossOriginSheets,
  };
})()
