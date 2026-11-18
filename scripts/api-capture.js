// 1단계 설치: const src = await fs.readFile(<이 파일>, 'utf8'); await page.evaluate(src);
// 2단계: 화면에서 행동(탭 전환, 필터, 검색, 다음 페이지 등)을 한다. 이미 그려진 화면은 다시 요청하지 않는다.
// 3단계 읽기: const cap = await page.evaluate(() => window.__cap);
// 같은 페이지에서 새로고침·이동하면 지워지므로 이동마다 다시 설치한다.
// 응답 값은 저장하지 않고 '모양'(키와 자료형, 배열 길이, 짧은 예시값)만 남긴다. 개인정보로 보이는 값은 가린다.
(() => {
  if (window.__capInstalled) return 'already installed';
  window.__capInstalled = true;
  window.__cap = [];
  const MASK = /(email|phone|mobile|^tel$|user_?name|real_?name|full_?name|nickname|birth|token|password|secret|^auth|session|card_?no|account_?no|resident|ssn|jumin|^em$|^ph$|^fn$|^ln$)/i;
  const shape = (v, depth = 0, key = '') => {
    if (depth > 5) return '…';
    if (v === null) return 'null';
    if (Array.isArray(v)) return v.length ? [`len=${v.length}`, shape(v[0], depth + 1, key)] : ['len=0'];
    if (typeof v === 'object') { const o = {}; for (const k of Object.keys(v).slice(0, 60)) o[k] = shape(v[k], depth + 1, k); return o; }
    if (typeof v === 'string') return MASK.test(key) ? 'string(masked)' : `string: ${v.slice(0, 40)}`;
    return `${typeof v}: ${MASK.test(key) ? '(masked)' : String(v).slice(0, 40)}`;
  };
  const parseBody = b => {
    if (!b) return null;
    if (typeof b === 'string') { try { return shape(JSON.parse(b)); } catch { return `text(${b.length})`; } }
    if (b instanceof FormData) return { formData: [...b.keys()] };
    if (b instanceof URLSearchParams) return { urlencoded: [...b.keys()] };
    return typeof b;
  };
  const skip = /\/events\?cee|facebook\.com\/tr|analytics\.tiktok|wcs\.naver|kakao.*pixel|google-analytics|googletagmanager|doubleclick|facebook\.net|clarity\.ms|amplitude\.com\/2|api2\.amplitude|hotjar|sentry|channel\.io|datadog|mixpanel|\/collect\b|\.(png|jpe?g|webp|gif|svg|woff2?|css)(\?|$)/;
  const rec = async (method, url, status, reqBody, resText, ctype) => {
    if (skip.test(url)) return;
    let res = null;
    if (/json/.test(ctype || '') || /^[\[{]/.test((resText || '').trim())) { try { res = shape(JSON.parse(resText)); } catch { res = `text(${(resText || '').length})`; } }
    else if (resText) res = `${ctype || 'unknown'} (${resText.length} chars)`;
    const host = (url.match(/^https?:\/\/([^/]+)/) || [])[1] || '';
    const root = h => { const p = h.split('.'); return p.slice(/^(co|or|go|ne|ac|com|net|org)$/.test(p[p.length - 2]) && p.length > 2 ? -3 : -2).join('.'); };
    const firstParty = root(host) === root(location.host);
    window.__cap.push({ t: Date.now(), firstParty, method, url: url.replace(/([?&](?:token|key|auth|sig)[^=]*=)[^&]+/gi, '$1(masked)'), status, req: parseBody(reqBody), res });
  };
  const of = window.fetch;
  window.fetch = async function (input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || (input && input.method) || 'GET').toUpperCase();
    const r = await of.apply(this, arguments);
    try { const c = r.clone(); c.text().then(t => rec(method, new Request(url, { method: 'GET' }).url, r.status, init.body, t, r.headers.get('content-type'))); } catch {}
    return r;
  };
  const oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__m = m; this.__u = u; return oo.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener('loadend', () => { try { rec((this.__m || 'GET').toUpperCase(), new Request(this.__u).url, this.status, body, this.responseType === '' || this.responseType === 'text' ? this.responseText : '', this.getResponseHeader('content-type')); } catch {} });
    return os.apply(this, arguments);
  };
  const ows = window.WebSocket;
  window.WebSocket = function (u, p) { window.__cap.push({ t: Date.now(), method: 'WS', url: String(u) }); return p ? new ows(u, p) : new ows(u); };
  window.WebSocket.prototype = ows.prototype;
  const oes = window.EventSource;
  if (oes) { window.EventSource = function (u, c) { window.__cap.push({ t: Date.now(), method: 'SSE', url: String(u) }); return new oes(u, c); }; window.EventSource.prototype = oes.prototype; }
  return 'installed';
})()
