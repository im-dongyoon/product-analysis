// 사용: const src = await fs.readFile(<이 파일>, 'utf8'); const r = await page.evaluate(src);
// 페이지가 쓰는 프레임워크·서드파티 도구를 화면에 드러난 단서로 찾는다. 결과는 단서와 함께 돌려준다.
(() => {
  const html = document.documentElement.outerHTML;
  const scripts = [...document.scripts].map(s => s.src).filter(Boolean);
  const res = performance.getEntriesByType('resource').map(e => e.name);
  const all = [...new Set([...scripts, ...res])];
  const has = re => all.filter(u => re.test(u)).slice(0, 3);
  const w = window;
  const out = [];
  const add = (cat, name, evidence) => { if (evidence && (evidence.length === undefined || evidence.length)) out.push({ cat, name, evidence: Array.isArray(evidence) ? evidence : String(evidence) }); };

  // 프레임워크
  add('framework', 'Next.js', w.__NEXT_DATA__ ? '__NEXT_DATA__' : (has(/\/_next\//).length ? has(/\/_next\//) : (w.next ? 'window.next' : null)));
  add('framework', 'Nuxt', w.__NUXT__ || w.$nuxt ? '__NUXT__' : has(/\/_nuxt\//));
  add('framework', 'Remix', w.__remixContext ? '__remixContext' : null);
  add('framework', 'Gatsby', document.getElementById('___gatsby') ? '#___gatsby' : null);
  add('framework', 'SvelteKit', html.includes('__sveltekit') ? '__sveltekit' : null);
  add('framework', 'Astro', document.querySelector('astro-island') ? 'astro-island' : null);
  add('framework', 'Angular', document.querySelector('[ng-version]')?.getAttribute('ng-version'));
  add('framework', 'Vue', w.__VUE__ || document.querySelector('[data-v-app]') ? '__VUE__/data-v-app' : null);
  add('framework', 'React', w.React || document.querySelector('[data-reactroot]') || Object.keys(document.querySelector('body > div') || {}).some(k => k.startsWith('__react')) ? 'react root' : null);
  add('framework', 'Webflow', document.documentElement.dataset.wfPage ? 'data-wf-page' : null);
  add('framework', 'Framer', has(/framer(usercontent)?\.com/));
  add('framework', 'WordPress', has(/wp-content|wp-includes/));
  add('framework', 'Imweb', has(/imweb/));
  add('framework', 'Wix', has(/wixstatic|parastorage/));
  const gen = document.querySelector('meta[name="generator"]')?.content;
  add('framework', 'meta generator', gen);

  // 스타일
  add('style', 'Tailwind (추정)', /class="[^"]*\b(?:flex|grid) [^"]*\b(?:px|py|mt|mb|gap)-\d/.test(html) ? 'utility class pattern' : null);
  add('style', 'styled-components', document.querySelector('style[data-styled]') ? 'style[data-styled]' : null);
  add('style', 'Emotion', document.querySelector('style[data-emotion]') ? 'style[data-emotion]' : null);

  // 분석·마케팅
  const pairs = [
    ['analytics', 'Google Analytics 4', /googletagmanager\.com\/gtag|google-analytics\.com\/g\/collect/],
    ['analytics', 'Google Tag Manager', /googletagmanager\.com\/gtm\.js/],
    ['analytics', 'Amplitude', /amplitude\.com|cdn\.amplitude/],
    ['analytics', 'Mixpanel', /mixpanel/],
    ['analytics', 'Hotjar', /hotjar/],
    ['analytics', 'Microsoft Clarity', /clarity\.ms/],
    ['analytics', 'Segment', /segment\.(com|io)/],
    ['analytics', 'PostHog', /posthog/],
    ['analytics', 'Hackle', /hackle/],
    ['analytics', 'Airbridge', /airbridge/],
    ['analytics', 'AppsFlyer', /appsflyer/],
    ['analytics', 'Braze', /braze|appboy/],
    ['ads', 'Meta Pixel', /connect\.facebook\.net/],
    ['ads', 'Kakao Pixel', /kakao.*pixel|t1\.daumcdn\.net\/kas/],
    ['ads', 'Naver 광고 스크립트', /wcs\.naver\.net/],
    ['ads', 'Google Ads', /googleadservices|doubleclick/],
    ['ads', 'TikTok Pixel', /analytics\.tiktok/],
    ['support', '채널톡', /channel\.io/],
    ['support', 'Intercom', /intercom/],
    ['support', 'Zendesk', /zendesk|zdassets/],
    ['monitoring', 'Sentry', /sentry/],
    ['monitoring', 'Datadog RUM', /datadoghq|datadog-rum/],
    ['payment', 'Toss Payments', /tosspayments/],
    ['payment', 'PortOne(아임포트)', /portone|iamport/],
    ['payment', 'Stripe', /stripe\.com/],
    ['payment', 'Paddle', /paddle/],
    ['auth', 'Kakao SDK', /developers\.kakao|kakaocdn.*sdk|t1\.kakaocdn\.net\/kakao_js_sdk/],
    ['auth', 'Naver Login', /nid\.naver/],
    ['auth', 'Google Sign-In', /accounts\.google\.com\/gsi/],
    ['auth', 'Apple Sign-In', /appleid\.cdn-apple/],
    ['auth', 'Firebase', /firebase|gstatic\.com\/firebasejs/],
    ['auth', 'Supabase', /supabase\.co/],
    ['auth', 'Clerk', /clerk\./],
    ['auth', 'Auth0', /auth0/],
    ['infra', 'Vercel', /vercel(-insights|\.app|-scripts)|_vercel\//],
    ['infra', 'Cloudflare', /cdnjs\.cloudflare|cloudflareinsights|cdn-cgi/],
    ['infra', 'AWS CloudFront/S3', /cloudfront\.net|amazonaws\.com/],
    ['media', 'Cloudinary', /cloudinary/],
    ['media', 'imgix', /imgix/],
    ['cms', 'Notion 기반(oopy·super 등)', /oopy|super\.so|notion\.site/],
    ['cms', 'Contentful', /contentful/],
    ['cms', 'Sanity', /sanity\.io/],
    ['cms', 'Strapi', /strapi/],
    ['font', 'Pretendard', /pretendard/i],
    ['font', 'Google Fonts', /fonts\.googleapis|fonts\.gstatic/],
    ['font', 'Typekit', /typekit|use\.typekit/],
  ];
  for (const [cat, name, re] of pairs) add(cat, name, has(re));

  // 화면 전역 변수로 남는 도구
  const globals = { dataLayer: 'GTM dataLayer', amplitude: 'Amplitude', mixpanel: 'Mixpanel', ChannelIO: '채널톡', Kakao: 'Kakao SDK', Sentry: 'Sentry', posthog: 'PostHog', Intercom: 'Intercom', fbq: 'Meta Pixel', wcs: 'Naver wcs', TossPayments: 'Toss Payments', IMP: 'PortOne(아임포트)', Stripe: 'Stripe' };
  for (const [g, name] of Object.entries(globals)) if (w[g]) add('global', name, 'window.' + g);

  const ids = [...new Set((html.match(/\b(G-[A-Z0-9]{6,}|GTM-[A-Z0-9]{5,}|UA-\d{4,}-\d+|AW-\d{6,})\b/g) || []))];
  const sourceMaps = all.filter(u => /\.js$/.test(u)).length ? 'JS 파일 끝 //# sourceMappingURL 확인은 fetch로 별도' : null;

  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang,
    meta: {
      description: document.querySelector('meta[name="description"]')?.content || null,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
      viewport: document.querySelector('meta[name="viewport"]')?.content || null,
      jsonLdTypes: [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(s => { try { const j = JSON.parse(s.textContent); return [].concat(j).flatMap(x => x['@graph'] ? x['@graph'].map(g => g['@type']) : [x['@type']]); } catch { return ['(parse error)']; } }),
      manifest: document.querySelector('link[rel="manifest"]')?.href || null,
    },
    trackingIds: ids,
    detected: out,
    thirdPartyHosts: [...new Set(all.map(u => { const m = u.match(/^https?:\/\/([^/]+)/); return m && m[1]; }).filter(h => h && h !== location.host))].sort(),
    cookieNames: document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(Boolean),
    storageKeys: { local: Object.keys(localStorage), session: Object.keys(sessionStorage) },
    note: sourceMaps,
  };
})()
