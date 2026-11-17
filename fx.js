// Sivun liike: osiot asettuvat paikalleen kun ne tulevat näkyviin, välivaiheet etenevät itse, yläpalkki saa lasin.
// Kaikki on pois päältä, jos käyttäjä on pyytänyt vähemmän liikettä.
(() => {
  const root = document.documentElement, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // sovelluskuva ja sen kuvaus kielen mukaan
  const img = document.getElementById('shotImg');
  const ALT = {fi: img.alt, en: 'The Laskuvihko app: a physics problem with acceleration and distance calculated with units, and an equation solved step by step'};
  const dimg = document.getElementById('drawImg'), DALT = {fi: dimg ? dimg.alt : '', en: 'The Laskuvihko drawing tool: a right triangle with sides 3 m, 4 m and 5 m and its angles shown in the figure, and the measurements moved into calculation rows'};
  const shot = () => { const l = root.lang === 'en' ? 'en' : 'fi'; const src = `kuvat/sovellus-${l}.png`; if (!img.src.endsWith(src)) img.src = src; img.alt = ALT[l];
    const d = document.getElementById('drawImg'), ds = `kuvat/piirros-${l}.png`; if (d) { if (!d.src.endsWith(ds)) d.src = ds; d.alt = DALT[l]; } };
  new MutationObserver(shot).observe(root, {attributes: true, attributeFilter: ['lang']}); shot();

  // yläpalkin lasi, kun sivua on vieritetty
  const mark = document.createElement('div'); mark.style.cssText = 'position:absolute;top:0;height:40px;width:1px;pointer-events:none';
  document.body.prepend(mark);
  new IntersectionObserver(([e]) => root.classList.toggle('scrolled', !e.isIntersecting)).observe(mark);

  if (calm || !('IntersectionObserver' in window)) return;
  root.classList.add('fx');

  const tag = (sel, cls) => document.querySelectorAll(sel).forEach((el, i) => { el.classList.add(cls); el.style.setProperty('--i', i % 3); });
  tag('main h2', 'fx-h'); document.querySelectorAll('.fx-h').forEach(h => { h.innerHTML = '<span class="fx-in">' + h.innerHTML + '</span>'; });
  tag('main p.say, main .chips', 'fx-fade');
  tag('main .page, main .graph-wrap, main .facts, main .get > div, main .topics > div, main .drawpic', 'fx-paper');
  tag('main .ticks', 'fx-fade');
  if (!CSS.supports('animation-timeline: view()')) tag('main .shot', 'fx-paper');

  const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), {threshold: .05});
  document.querySelectorAll('.fx-h, .fx-fade, .fx-paper').forEach(el => seen.observe(el));

  // välivaiheet etenevät itse kerran, kunnes käyttäjä koskee niihin
  const steps = document.querySelector('.steps'), next = document.getElementById('stepNext'), sec = document.getElementById('vaiheet');
  if (steps && next) {
    let timer = 0; const stop = () => { clearInterval(timer); timer = -1; };
    sec.addEventListener('pointerdown', stop); sec.addEventListener('keydown', stop);
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting || timer) return;
      io.disconnect();
      timer = setInterval(() => { if (next.disabled) return stop(); next.onclick(); }, 900);
    }, {threshold: .6}).observe(steps);
  }
})();
