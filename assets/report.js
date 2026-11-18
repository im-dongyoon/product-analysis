(() => {
  // 확대 보기
  const lb = document.querySelector('.lightbox');
  const img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
  let list = [], pos = 0;
  const show = (i) => { pos = (i + list.length) % list.length; img.src = list[pos]; cap.textContent = decodeURIComponent(list[pos]) + `  (${pos + 1}/${list.length})`; };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-cap]');
    if (!a) return;
    e.preventDefault();
    const scope = a.closest('.grid, .strip, .doc') || document;
    list = [...new Set([...scope.querySelectorAll('[data-cap]')].filter(x => x.offsetParent !== null || x === a).map(x => x.getAttribute('href')))];
    lb.hidden = false; show(list.indexOf(a.getAttribute('href')));
  });
  lb.querySelector('.lb-close').onclick = () => { lb.hidden = true; };
  lb.querySelector('.lb-prev').onclick = () => show(pos - 1);
  lb.querySelector('.lb-next').onclick = () => show(pos + 1);
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.hidden = true; });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lb.hidden = true;
    if (e.key === 'ArrowLeft') show(pos - 1);
    if (e.key === 'ArrowRight') show(pos + 1);
  });

  // 캡처 찾기
  const filter = document.querySelector('.filter');
  const applyFilter = (q) => {
    q = q.trim().toLowerCase();
    document.querySelectorAll('#gallery .grid .thumb').forEach(t => { t.style.display = !q || t.dataset.name.toLowerCase().includes(q) ? '' : 'none'; });
  };
  if (filter) filter.addEventListener('input', () => applyFilter(filter.value));
  document.querySelectorAll('.more[data-filter]').forEach(m => m.addEventListener('click', () => { filter.value = m.dataset.filter; applyFilter(filter.value); }));

  // 현재 위치 목차 표시
  const links = new Map([...document.querySelectorAll('.side a[href^="#"]')].map(a => [a.getAttribute('href').slice(1), a]));
  const targets = [...document.querySelectorAll('.doc h1[id], .doc h2[id], section.doc[id]')].filter(h => links.has(h.id));
  let current;
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) {
      if (current) current.classList.remove('active');
      current = links.get(en.target.id); current && current.classList.add('active');
    }
  }, { rootMargin: '0px 0px -75% 0px' });
  targets.forEach(t => io.observe(t));

  // 다이어그램
  if (window.mermaid) {
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    mermaid.initialize({ startOnLoad: true, theme: dark ? 'dark' : 'neutral', fontFamily: 'Pretendard Variable, Pretendard, sans-serif', securityLevel: 'strict' });
  }
})();
