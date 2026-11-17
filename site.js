// Laskuvihko-sivun toiminta: kielet ja demot. Kaikki laskut tekee sovelluksen oma calc.js.
MathfieldElement.fontsDirectory = './fonts';
const $ = s => document.querySelector(s), U = Live.U;
const en = () => Kieli.lang === 'en';
// suomeksi desimaalipilkku, englanniksi piste
const loc = tex => en() ? tex.replace(/\{,\}/g, '.') : tex;
const num = n => (en() ? String(n) : String(n).replace('.', ',')).replace('-', '−');
const thou = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, en() ? ',' : ' ');

// ---------- kielet ----------
const EN = {
  navTry: 'Try it', navGet: 'Download', navLook: 'The app', navDraw: 'Drawing',
  showH: 'This is what it looks like.', showP: 'The problem, the calculation and the steps on one page. Blue is what Laskuvihko worked out.',
  topH: 'What can you calculate with Laskuvihko?',
  topM: 'Maths', topMp: 'Solving equations step by step, quadratic equations, systems of equations, trigonometric equations, derivatives, integrals, limits, vectors, matrices, statistics and function graphs.',
  topF: 'Physics', topFp: 'Calculations with units: unit conversions (km/h and m/s, °C and K, kJ and J), solving a formula for the quantity you need, motion, forces, energy, heat and electricity. The formula sheet is always next to you.',
  topK: 'Who it’s for', topKp: 'Upper secondary and high school students, for homework and revision. It is not an exam tool.',
  h1: 'The notebook that does <span class="hl">the maths.</span>',
  lead: 'Write a problem like on paper. Laskuvihko <b>converts the units</b>, finds the answer and shows the steps.',
  tryBtn: 'Try in your browser', macBtn: 'Download for Mac', free: 'Free. Also works on Windows and Chromebook in the browser.',
  kmh: 'km/h works as is', mass: 'Mass', speed: 'Speed',
  stepsH: 'See how the answer is made.',
  stepsP: 'Laskuvihko doesn’t just give the answer. It shows every step and says what was done, so you learn along the way.',
  stepAll: 'Show all', stepNext: 'Next step',
  drawH: 'Draw the figure. The measurements come along.',
  drawP: 'Draw a triangle, a circle or a force diagram straight into the notebook. Laskuvihko measures the sides and angles for you, and one button moves them into your calculation.',
  draw1: 'Pen, lines, arrows, triangles, circles, arcs and a coordinate system',
  draw2: 'Lengths and angles are shown in the figure',
  draw3: 'Corners snap to the grid, so the drawing stays neat',
  graphH: 'Graphs on the same page.',
  graphP: 'Move the coefficients. The parabola changes at once, and the zeros are solved right away.',
  zeros: 'Zeros',
  unitsH: 'Units stay with the numbers.',
  unitsP: 'Type a calculation with units or pick an example. Laskuvihko converts and simplifies them for you.',
  wholeH: 'The whole problem on one page.',
  wholeP: 'Text, formulas, graphs, drawings and pictures in the same notebook. When you’re done, hand it in as a PDF.',
  f1b: 'Formula sheet', f1s: '315 maths and physics formulas, searchable',
  f2b: 'Systems of equations', f2s: 'non-linear ones too, with units',
  f3b: 'Derivatives and integrals', f3s: 'limits, sums, matrices and vectors',
  f4b: 'PDF and screenshot', f4s: 'ready to hand in',
  getH: 'Start now.',
  macH: 'Mac', macP: 'A real app that works offline. Your files stay on your computer.', macBtn2: 'Download for Mac',
  webH: 'Browser', webP: 'Windows, Chromebook and Mac. Nothing to install, just open and write.', webBtn: 'Open in browser',
  made: 'Laskuvihko · Made in Finland',
};
const EN_A = {aPlot: 'Graph', aCalc: 'Calculation'};
const FI_A = {};
document.querySelectorAll('[data-a]').forEach(el => { FI_A[el.dataset.a] = el.getAttribute('aria-label'); });
const TITLE = {fi: document.title, en: 'Laskuvihko – the notebook that does the maths'};
const FI = {};
document.querySelectorAll('[data-t]').forEach(el => { FI[el.dataset.t] = el.innerHTML; });
const redraw = [];
// pelkät näyttökaavat: ei fokusta eikä klikkauksia, jotta ne eivät nappaa napin painallusta
const quiet = root => root.querySelectorAll('math-field[read-only]').forEach(m => { m.tabIndex = -1; });
function applyLang() {
  const d = en() ? EN : FI;
  document.querySelectorAll('[data-t]').forEach(el => { if (d[el.dataset.t]) el.innerHTML = d[el.dataset.t]; });
  document.querySelectorAll('[data-a]').forEach(el => el.setAttribute('aria-label', (en() ? EN_A : FI_A)[el.dataset.a]));
  document.title = TITLE[Kieli.lang] || TITLE.fi;
  document.documentElement.lang = Kieli.lang;
  document.querySelectorAll('#lang span').forEach(s => s.classList.toggle('on', s.dataset.l === Kieli.lang));
  redraw.forEach(f => f());
}
$('#lang').onclick = () => { Kieli.set(en() ? 'fi' : 'en'); applyLang(); };

// ---------- tausta: ruudut näkyvät kursorin ympärillä ----------
if (matchMedia('(hover: hover)').matches) {
  const r = document.documentElement.style;
  let x = -999, y = -999, queued = false;
  const paint = () => {
    queued = false;
    r.setProperty('--mx', x + 'px'); r.setProperty('--my', y + 'px');
    const gy = -Math.round(scrollY % 32);
    r.setProperty('--gy', gy + 'px');   // ruudut liikkuvat sivun mukana
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; r.setProperty('--glow', 1); ask(); }, {passive: true});
  addEventListener('scroll', ask, {passive: true});
  document.addEventListener('pointerleave', () => r.setProperty('--glow', 0));
}

// ---------- alku: autotehtävä ----------
(() => {
  const m = $('#m'), v = $('#v'), car = Car.mount($('#road'));
  function update() {
    const M = +m.value, V = +v.value;
    const mt = `<span>${thou(M)} kg</span>`, vt = `<span>${V} km/h</span>`;
    $('#task').innerHTML = en()
      ? `<b>Problem 4.</b> A car with a mass of ${mt} is driving at ${vt}. What is its kinetic energy?`
      : `<b>Tehtävä 4.</b> Auto, jonka massa on ${mt}, ajaa nopeudella ${vt}. Kuinka suuri on auton liike-energia?`;
    Live.show($('#l1'), 'E_{\\mathrm{k}}=\\frac{1}{2}mv^2');
    Live.show($('#l2'), `m=${M}${U('kg')}`);
    Live.show($('#l3'), `v=${V}${U('km')}/${U('h')}`);
    const r = Live.calc(`\\frac{1}{2}\\cdot${M}${U('kg')}\\cdot(${V}${U('km')}/${U('h')})^2\\to${U('kJ')}`);
    Live.show($('#ans'), loc('E_{\\mathrm{k}}' + r));
    $('#mo').textContent = thou(M) + ' kg'; $('#vo').textContent = V + ' km/h';
    car.set(V, M);
  }
  m.oninput = v.oninput = update; redraw.push(update);
  // sivu kääntyy hiukan hiiren mukana
  const page = $('#heroPage');
  if (matchMedia('(hover: hover) and (min-width: 901px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // kääntö pysähtyy vain liukusäädintä vetäessä, jotta säädin ei liiku osoittimen alta
    let hold = false;
    page.querySelectorAll('input[type=range]').forEach(s => s.addEventListener('pointerdown', () => { hold = true; }));
    addEventListener('pointerup', () => { hold = false; });
    addEventListener('pointercancel', () => { hold = false; });
    addEventListener('pointermove', e => {
      if (hold || scrollY > innerHeight) return;
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      page.style.transform = `rotateY(${-14 + x * 10}deg) rotateX(${8 - y * 8}deg) rotateZ(1deg)`;
    });
  }
})();

// ---------- välivaiheet ----------
(() => {
  const EQS = ['2(x-3)=4x+8', 'x^2-5x+6=0', '\\frac{x}{2}+3=7'];
  let eq = 0, steps = [], shown = 1;
  const rows = $('#stepRows');
  function chips() {
    $('#eqChips').innerHTML = EQS.map((e, i) => `<button class="chip${i === eq ? ' on' : ''}" data-i="${i}"><math-field read-only>${e}</math-field></button>`).join('');
    $('#eqChips').querySelectorAll('.chip').forEach(b => b.onclick = () => { eq = +b.dataset.i; load(); });
    quiet($('#eqChips'));
  }
  // sama rivi kahdesti peräkkäin jätetään pois
  function stepsFor(e) {
    let st;
    try { Calc.resetDefs(); st = Calc.run('steps', e).steps || []; } catch (err) { st = [['', e, '']]; }
    return st.filter((x, i, all) => !i || x[1] !== all[i - 1][1]);
  }
  // sivu pysyy saman kokoisena yhtälöä vaihdettaessa, joten napit eivät liiku
  rows.style.minHeight = Math.max(...EQS.map(e => stepsFor(e).length)) * 62 + 'px';
  function load() {
    steps = stepsFor(EQS[eq]);
    shown = 1; chips(); paint(true);
  }
  function paint(rebuild) {
    if (rebuild) {
      rows.innerHTML = steps.map(([op, tex, why], i) => `<div class="row"><span class="k">${i ? '' : ''}</span><math-field read-only>${loc(Kieli.tex((op ? op + '\\ ' : '') + tex))}</math-field><span class="why">${why ? (/\\|\|/.test(why) ? '' : Kieli.t(why)) : ''}</span></div>`).join('');
      rows.querySelectorAll('.why').forEach((w, i) => { const why = steps[i][2]; if (why && /\\|\|/.test(why)) w.innerHTML = `<math-field read-only>${why}</math-field>`; });
      quiet(rows);
      setTimeout(() => paint(false), 30);
      return;
    }
    rows.querySelectorAll('.row').forEach((r, i) => r.classList.toggle('on', i < shown));
    $('#stepCount').textContent = (en() ? 'Step ' : 'Vaihe ') + shown + ' / ' + steps.length;
    if (shown >= steps.length && document.activeElement === $('#stepNext')) $('#stepAll').focus();
    $('#stepNext').disabled = shown >= steps.length;
    $('#stepNext').style.opacity = shown >= steps.length ? .4 : 1;
  }
  $('#stepNext').onclick = () => { shown = Math.min(steps.length, shown + 1); paint(false); };
  $('#stepAll').onclick = () => { shown = steps.length; paint(false); };
  redraw.push(() => paint(true));
  load();
})();

// ---------- kuvaaja ----------
(() => {
  const cv = $('#plot'), ctx = cv.getContext('2d'), A = $('#ga'), B = $('#gb'), C = $('#gc');
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  // a·x² + b·x + c siistinä kaavana
  function poly(a, b, c, dec) {
    const n = x => dec(x);
    let s = a === 0 ? '' : (a === 1 ? '' : a === -1 ? '-' : n(a)) + 'x^2';
    if (b) s += (b < 0 ? '-' : s ? '+' : '') + (Math.abs(b) === 1 ? '' : n(Math.abs(b))) + 'x';
    if (c || !s) s += (c < 0 ? '-' : s ? '+' : '') + n(Math.abs(c));
    return s;
  }
  let fn = null, zeros = [], prog = 1; // prog 0..1: käyrä piirtyy, 1..1.3: nollakohdat ponnahtavat esiin
  function update() {
    const a = +A.value, b = +B.value, c = +C.value;
    $('#gao').textContent = num(a); $('#gbo').textContent = num(b); $('#gco').textContent = num(c);
    const p = poly(a, b, c, x => String(x));
    try { Calc.resetDefs(); fn = Calc.fnFor(p); } catch (e) { fn = null; }
    $('#fx').value = loc('f(x)=' + poly(a, b, c, x => String(x).replace('.', '{,}')));
    let z = '';
    try { Calc.resetDefs(); z = Calc.run('solve', p + '=0').tex; } catch (e) { z = '\\text{—}'; }
    // nollakohtien paikat kuvaan
    zeros = [];
    const D = b * b - 4 * a * c;
    if (a === 0) { if (b) zeros = [-c / b]; }
    else if (D >= 0) zeros = [...new Set([(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)])];
    $('#gz').value = loc(Kieli.tex(Live.tidyTex(z)));
    draw();
  }
  function draw() {
    const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const unit = Math.min(w, h) / 16, ox = w / 2, oy = h / 2;
    const X = x => ox + x * unit, Y = y => oy - y * unit;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1; ctx.strokeStyle = '#223049';
    for (let i = Math.floor(-ox / unit); i <= ox / unit; i++) { ctx.beginPath(); ctx.moveTo(X(i), 0); ctx.lineTo(X(i), h); ctx.stroke(); }
    for (let j = Math.floor(-oy / unit); j <= oy / unit; j++) { ctx.beginPath(); ctx.moveTo(0, Y(j)); ctx.lineTo(w, Y(j)); ctx.stroke(); }
    ctx.strokeStyle = '#4a5a78'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
    ctx.fillStyle = '#6f7d95'; ctx.font = '12px "Schibsted Grotesk", sans-serif';
    // luvut akseleille koko leveydeltä (joka toinen ruutu)
    const xs = Math.floor(ox / unit) - 1, ys = Math.floor(oy / unit) - 1;
    ctx.textAlign = 'center';
    for (let i = -xs; i <= xs; i++) if (i && i % 2 === 0) ctx.fillText(num(i), X(i), oy + 17);
    ctx.textAlign = 'right';
    for (let j = -ys; j <= ys; j++) if (j && j % 2 === 0) ctx.fillText(num(j), ox - 7, Y(j) + 4);
    ctx.textAlign = 'left';
    if (!fn) return;
    ctx.strokeStyle = css('--paper'); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
    let pen = false;
    for (let px = 0; px <= w * Math.min(1, prog); px += 2) {
      const y = fn((px - ox) / unit), py = Y(y);
      if (!isFinite(py) || py < -h || py > 2 * h) { pen = false; continue; }
      pen ? ctx.lineTo(px, py) : ctx.moveTo(px, py); pen = true;
    }
    ctx.stroke();
    ctx.fillStyle = css('--marker');
    const pop = Math.max(0, Math.min(1, (prog - 1) / .3)), r = 6 * (pop < 1 ? pop * (1.9 - .9 * pop) : 1);
    if (r > 0) zeros.forEach(z => { ctx.beginPath(); ctx.arc(X(z), oy, r, 0, 7); ctx.fill(); });
  }
  // kun kuvaaja tulee näkyviin, käyrä piirtyy vasemmalta oikealle ja nollakohdat ilmestyvät lopuksi
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    prog = 0;
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now() + 250, ease = t => 1 - Math.pow(1 - t, 3);
      const tick = now => { const t = Math.max(0, (now - t0) / 900); prog = t < 1 ? ease(t) : Math.min(1.3, 1 + (t - 1) * .9); draw(); if (prog < 1.3) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, {threshold: .35}).observe(cv);
  }
  A.oninput = B.oninput = C.oninput = update;
  addEventListener('resize', draw); redraw.push(update);
  update();
})();

// ---------- yksiköt ----------
(() => {
  const mf = $('#uin');
  mf.smartFence = true;
  mf.menuItems = [];
  mf.mathVirtualKeyboardPolicy = 'manual';
  const ex = [
    `1500${U('kg')}\\cdot9{,}81${U('m')}/${U('s')}^2\\cdot10${U('m')}\\to${U('kJ')}`,
    `500${U('g')}\\to${U('kg')}`,
    `4{,}19${U('kJ')}/(${U('kg')}\\cdot${U('K')})\\cdot2${U('kg')}\\cdot30${U('K')}`,
    `90${U('km')}/${U('h')}\\cdot2{,}5${U('h')}`,
  ];
  const keys = ['kg', 'g', 'm', 'km', 's', 'h', 'N', 'J', 'kJ', 'W', 'K'];
  let pick = 0;
  function chips() {
    $('#unitChips').innerHTML = ex.map((e, i) => `<button class="chip${i === pick ? ' on' : ''}" data-i="${i}"><math-field read-only>${Live.pretty(loc(e))}</math-field></button>`).join('');
    quiet($('#unitChips'));
    $('#unitChips').querySelectorAll('.chip').forEach(b => b.onclick = () => { pick = +b.dataset.i; mf.value = loc(ex[pick]); chips(); calc(); });
  }
  $('#unitKeys').innerHTML = keys.map(k => `<button data-u="${k}">${k}</button>`).join('') + '<button data-u="→">→</button>';
  $('#unitKeys').querySelectorAll('button').forEach(b => b.onclick = () => {
    const u = b.dataset.u;
    mf.insert(u === '→' ? '\\to' : U(u), {focus: true, scrollIntoView: true});
    calc();
  });
  function calc() {
    $('#uerr').textContent = '';
    const l = mf.value.trim();
    if (!l) { $('#uout').value = ''; return; }
    try {
      Calc.resetDefs();
      const r = Calc.run(/=/.test(l) ? 'solve' : 'calc', l);
      $('#uout').value = Live.pretty(loc(Kieli.tex(Live.tidyTex(r.tex))));
      $('#uout').parentElement.style.display = '';
    } catch (e) {
      $('#uout').parentElement.style.display = 'none';
      $('#uerr').textContent = e instanceof Calc.Err ? Kieli.t(e.message) : Kieli.t('En osaa laskea tätä. Tarkista kaava.');
    }
  }
  mf.addEventListener('input', calc);
  mf.value = loc(ex[0]);
  // kielen vaihto: oma lasku säilyy, vain desimaalimerkki vaihtuu
  redraw.push(() => { mf.value = en() ? mf.value.replace(/\{,\}/g, '.') : mf.value.replace(/(\d)\.(\d)/g, '$1{,}$2'); chips(); calc(); });
  chips(); calc();
})();

quiet(document);
applyLang();
