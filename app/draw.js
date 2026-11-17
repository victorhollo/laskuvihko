// Drawing row: shapes on squared paper with side lengths, angles and names, to illustrate calculations.
// Block: {type:'draw', shapes:[], h, grid, snap, scale, unit}. Coordinates are in a 700-wide picture; 1 square = 35.
const DRAW_W = 700, STEP = 35;
const DRAW_COLORS = ['#1b1b1b', '#2f6db0', '#b5532a', '#2f8f6b', '#8a4fb0', '#c08a1e'];
const NS = 'http://www.w3.org/2000/svg';
const TOOLS = [
  ['select', tr('Valitse ja siirrä (V)'), '<path d="M5 3l12 7-5 1.5L9.5 17z"/>'],
  ['pen', tr('Kynä (P)'), '<path d="M3 17c3-1 4-5 7-6s3 3 6 1"/><path d="M14 3l3 3-8 8H6v-3z" fill="none"/>'],
  ['curve', tr('Käyrä: klikkaa pisteitä, lopeta Enterillä, tuplaklikkaamalla tai 1. pisteeseen (U)'), '<path d="M3 15C6 3 10 3 11 10s5 7 6-4"/>'],
  ['line', tr('Jana (L)'), '<path d="M4 16L16 4"/><circle cx="4" cy="16" r="1.6"/><circle cx="16" cy="4" r="1.6"/>'],
  ['arrow', tr('Nuoli / vektori (N)'), '<path d="M4 16L16 4M9 4h7v7"/>'],
  ['rect', tr('Suorakulmio (R) – Vaihto: neliö'), '<rect x="3.5" y="5.5" width="13" height="9" rx="1"/>'],
  ['tri', tr('Kolmio: klikkaa 3 kärkeä (T)'), '<path d="M10 3.5L17 16H3z"/>'],
  ['poly', tr('Monikulmio: klikkaa kärjet, lopeta klikkaamalla 1. kärkeä tai Enter (M)'), '<path d="M6 3.5h8l3 7-5 6H6l-3-6z"/>'],
  ['circle', tr('Ympyrä: vedä keskipisteestä (O)'), '<circle cx="10" cy="10" r="6.5"/>'],
  ['ellipse', tr('Ellipsi: vedä keskipisteestä (J) – Vaihto: ympyrä'), '<ellipse cx="10" cy="10" rx="7.5" ry="4.5"/>'],
  ['arc', tr('Kaari tai sektori: klikkaa keskipiste, kaaren alku ja loppu (A)'), '<path d="M16 16A12 12 0 0 0 4 4"/><circle cx="4" cy="16" r="1.5" fill="currentColor"/><path d="M4 16h12M4 16V4" stroke-dasharray="2 2"/>'],
  ['angle', tr('Kulma: klikkaa kärki, sitten kyljet – mikä tahansa kulma (K). Vaihto: 15° välein, Alt: ei kiinnitystä'), '<path d="M17 16H3l9-11"/><path d="M8 16a5 5 0 0 0-1.6-3.7"/>'],
  ['axes', tr('Koordinaatisto: vedä alue, siirrä origoa sen kahvasta (G). Tuplaklikkaa lukua 1 vaihtaaksesi askelta'), '<path d="M10 17V3M3 10h14M8 5l2-2 2 2M15 8l2 2-2 2"/>'],
  ['dim', tr('Mitta: vedä mitattavan matkan yli (D)'), '<path d="M3 13h14M3 10v6M17 10v6M6 11l-3 2 3 2M14 11l3 2-3 2"/>'],
  ['tick', tr('Yhtä pitkät sivut: klikkaa sivua (1, 2 tai 3 viivaa, 4. klikkaus poistaa) (Y)'), '<path d="M3 16L17 4M7.5 9l3 3.5M9.5 7.5l3 3.5"/>'],
  ['text', tr('Teksti: klikkaa paikkaa (X)'), '<path d="M4 5h12M10 5v11"/>'],
  ['point', tr('Piste (I)'), '<circle cx="10" cy="10" r="2.6" fill="currentColor"/>'],
  ['erase', tr('Pyyhekumi: klikkaa tai vedä kuvion yli (E)'), '<path d="M8 16h8M4 12l6-7 6 5-5 6H8z"/>'],
];
const GREEK = 'αβγδεζηθ';
// pen: soften hand shake (3 rounds of neighbour averaging, ends kept), then drop points that add nothing
function smoothPen(P) {
  if (P.length < 4) return P;
  let Q = P;
  for (let r = 0; r < 3; r++) Q = Q.map((q, k) => k === 0 || k === Q.length - 1 ? q : [(Q[k - 1][0] + 2 * q[0] + Q[k + 1][0]) / 4, (Q[k - 1][1] + 2 * q[1] + Q[k + 1][1]) / 4]);
  const keep = new Uint8Array(Q.length); keep[0] = keep[Q.length - 1] = 1;
  const rdp = (a, b) => { let m = 0, mi = -1; const dx = Q[b][0] - Q[a][0], dy = Q[b][1] - Q[a][1], L = Math.hypot(dx, dy) || 1;
    for (let k = a + 1; k < b; k++) { const d = Math.abs(dx * (Q[a][1] - Q[k][1]) - dy * (Q[a][0] - Q[k][0])) / L; if (d > m) { m = d; mi = k; } }
    if (m > .4) { keep[mi] = 1; rdp(a, mi); rdp(mi, b); } };
  rdp(0, Q.length - 1);
  return Q.filter((q, k) => keep[k]).map(q => [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]);
}
const KEYS = {v: 'select', p: 'pen', u: 'curve', j: 'ellipse', a: 'arc', g: 'axes', y: 'tick', l: 'line', n: 'arrow', r: 'rect', t: 'tri', m: 'poly', o: 'circle', k: 'angle', d: 'dim', x: 'text', i: 'point', e: 'erase'};

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = v => Math.hypot(v[0], v[1]);
const dist = (a, b) => len(sub(a, b));
const unit = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const fmtNum = n => String(Math.round(n * 100) / 100).replace('.', Kieli.pilkku ? ',' : '.').replace('-', '−');
const pretty = s => s.replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/sqrt\(([^)]*)\)/g, '√$1').replace(/\balpha\b/g, 'α').replace(/\bbeta\b/g, 'β').replace(/\bgamma\b/g, 'γ');

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

class Drawing {
  constructor(box, b, onChange) {
    this.box = box; this.b = b; this.onChange = onChange;
    Object.assign(this, {view: {z: 1, x: 0, y: 0}, tool: 'select', sel: null, act: null, pending: null, mouse: null, undo: [], redo: []});
    this.style = {c: DRAW_COLORS[0], w: 2, dash: false, fill: false, len: true, ang: false, names: false, rad: true, meas: false, big: false, sector: false, arms: true};
    this.buildUI();
    this.render();
  }

  // ---------- toolbar ----------
  buildUI() {
    const bar = document.createElement('div'); bar.className = 'drawtools';
    const tools = document.createElement('div'); tools.className = 'dgroup';
    for (const [id, title, icon] of TOOLS) {
      const btn = document.createElement('button'); btn.dataset.tool = id; btn.title = title;
      btn.innerHTML = `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`;
      btn.onclick = () => this.setTool(id);
      tools.appendChild(btn);
    }
    const opts = document.createElement('div'); opts.className = 'dopts';
    const colors = document.createElement('div'); colors.className = 'dgroup';
    for (const c of DRAW_COLORS) {
      const btn = document.createElement('button'); btn.className = 'swatch'; btn.dataset.c = c; btn.title = tr('Väri');
      btn.innerHTML = `<i style="background:${c}"></i>`;
      btn.onclick = () => this.setOpt('c', c);
      colors.appendChild(btn);
    }
    const widths = document.createElement('div'); widths.className = 'dgroup';
    for (const [w, t] of [[1.2, tr('Ohut')], [2, tr('Normaali')], [3.5, tr('Paksu')]]) {
      const btn = document.createElement('button'); btn.dataset.w = w; btn.title = t + ' viiva';
      btn.innerHTML = `<svg viewBox="0 0 20 20" width="18" height="18"><path d="M3 10h14" stroke="currentColor" stroke-width="${w * 1.1}" stroke-linecap="round"/></svg>`;
      btn.onclick = () => this.setOpt('w', w);
      widths.appendChild(btn);
    }
    const toggles = document.createElement('div'); toggles.className = 'dgroup';
    for (const [k, t, tip] of [['dash', tr('Katko'), tr('Katkoviiva')], ['fill', tr('Täyttö'), tr('Vaalea täyttö')], ['len', tr('Pituudet'), tr('Näytä sivujen pituudet (tuplaklikkaa lukua muuttaaksesi, esim. a tai 5 cm)')],
      ['ang', tr('Kulmat'), tr('Näytä kulmat (tuplaklikkaa muuttaaksesi, esim. α)')], ['names', tr('Kärjet'), tr('Nimeä kärjet A, B, C…')], ['rad', tr('Säde'), tr('Näytä ympyrän tai kaaren säde')],
      ['meas', tr('Lukuarvot'), tr('Päällä: mitatut luvut (5 cm, 37°). Pois: kirjaimet a, b, α, β – kun arvo on se mitä lasketaan. Tyhjennä merkintä tuplaklikkaamalla, niin se piiloutuu')],
      ['arms', tr('Kyljet'), tr('Kulman kyljet näkyviin. Pois: pelkkä kulmakaari, esim. valmiiden viivojen väliin')],
      ['big', tr('Iso puoli'), tr('Kulma tai kaari toiselle puolelle (yli 180°)')], ['sector', tr('Sektori'), tr('Kaaresta sektori: säteet keskipisteeseen')]]) {
      const btn = document.createElement('button'); btn.dataset.opt = k; btn.textContent = t; btn.title = tip;
      btn.onclick = () => this.setOpt(k, !this.cur(k));
      toggles.appendChild(btn);
    }
    const acts = document.createElement('div'); acts.className = 'dgroup';
    const actBtn = (t, tip, fn) => { const btn = document.createElement('button'); btn.innerHTML = t; btn.title = tip; btn.onclick = fn; acts.appendChild(btn); return btn; };
    this.dupBtn = actBtn(tr('Monista'), tr('Monista valittu kuvio'), () => this.duplicate());
    actBtn(tr('Mitat laskuun'), tr('Tee mitoista laskurivit (a:=5 m, α:=37°), niin voit laskea niillä. Valittu kuvio tai koko piirros'), () => this.exportMeasures());
    this.delBtn = actBtn(tr('Poista'), tr('Poista valittu kuvio (⌫)'), () => this.deleteSel());
    actBtn('<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5L3 9l4 4"/><path d="M3 9h9a5 5 0 0 1 0 10h-2"/></svg>', tr('Kumoa (⌘Z)'), () => this.doUndo());
    actBtn('<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l4 4-4 4"/><path d="M17 9H8a5 5 0 0 0 0 10h2"/></svg>', tr('Tee uudelleen (⌘⇧Z)'), () => this.doRedo());
    const page = document.createElement('div'); page.className = 'dgroup dpage';
    const grid = document.createElement('button'); grid.textContent = tr('Ruudukko'); grid.title = tr('Näytä ruudukko'); grid.dataset.page = 'grid';
    grid.onclick = () => { this.b.grid = !this.b.grid; this.changed(); };
    const snap = document.createElement('button'); snap.textContent = tr('Kiinnitä'); snap.title = tr('Kärjet tarttuvat ruudukon pisteisiin'); snap.dataset.page = 'snap';
    snap.onclick = () => { this.b.snap = !this.b.snap; this.changed(); };
    const lab = document.createElement('label'); lab.title = tr('Mittakaava pituuksille');
    lab.innerHTML = tr('1 ruutu =') + ' <input class="dscale" value=""> <input class="dunit" placeholder="' + tr('yks.') + '" value="">';
    const [sc, un] = lab.querySelectorAll('input');
    sc.value = fmtNum(this.b.scale || 1); un.value = this.b.unit || '';
    sc.onchange = () => { const v = parseFloat(sc.value.replace(',', '.')); this.b.scale = v > 0 ? v : 1; sc.value = fmtNum(this.b.scale); this.changed(); };
    un.oninput = () => { this.b.unit = un.value.trim(); this.render(); this.onChange(); };
    const zoom = document.createElement('div'); zoom.className = 'dgroup dzoom';
    const zb = (t, tip, fn) => { const btn = document.createElement('button'); btn.textContent = t; btn.title = tip; btn.onclick = () => { fn(); this.box.focus({preventScroll: true}); }; zoom.appendChild(btn); return btn; };
    zb('−', tr('Loitonna (−)'), () => this.zoomBy(1 / 1.4));
    this.zoomLabel = zb('100 %', tr('Koko piirros näkyviin (0)'), () => this.zoomTo(1));
    zb('+', kb(tr('Lähennä (+). Myös nipistys ohjauslevyllä tai ⌘ + vieritys')), () => this.zoomBy(1.4));
    page.append(grid, snap, lab);
    bar.appendChild(zoom);
    bar.append(tools, colors, widths, toggles, acts, page);
    bar.appendChild(bar.querySelector('.dzoom'));
    this.bar = bar;

    this.svg = el('svg', {class: 'drawsvg', viewBox: `0 0 ${DRAW_W} ${this.b.h}`});
    const grip = document.createElement('span'); grip.className = 'dgrip'; grip.title = tr('Muuta korkeutta vetämällä');
    grip.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); grip.setPointerCapture(e.pointerId);
      const y0 = e.clientY, h0 = this.b.h, k = DRAW_W / this.svg.getBoundingClientRect().width;
      const mv = ev => { this.b.h = Math.round(Math.max(140, Math.min(1400, h0 + (ev.clientY - y0) * k))); this.setView(); this.render(); };
      const up = () => { grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); this.onChange(); };
      grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up);
    });
    const wrap = document.createElement('div'); wrap.className = 'dwrap';
    wrap.append(this.svg, grip);
    this.wrap = wrap;
    this.box.append(bar, wrap);

    this.svg.addEventListener('pointerdown', e => this.down(e));
    this.svg.addEventListener('pointermove', e => this.move(e));
    this.svg.addEventListener('pointerup', e => this.up(e));
    this.svg.addEventListener('pointerleave', () => { if (this.pending) { this.mouse = null; this.render(); } });
    this.box.addEventListener('keydown', e => this.key(e));
    const noSpace = () => { this.space = false; this.svg.classList.remove('panning'); };
    this.box.addEventListener('keyup', e => { if (e.key === ' ') noSpace(); });
    this.box.addEventListener('focusout', noSpace);
    // zoom: pinch on the trackpad (WebKit gesture or ctrl+wheel), ⌘ + scroll; when zoomed in, scrolling moves the picture
    this.svg.addEventListener('wheel', e => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); return this.zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .003)), e); }
      if (this.view.z <= 1) return;
      const k = DRAW_W / this.view.z / this.svg.getBoundingClientRect().width, v = this.view, x = v.x, y = v.y;
      v.x += e.deltaX * k; v.y += e.deltaY * k; this.setView();
      if (v.x !== x || v.y !== y) e.preventDefault();   // at the edge the page scrolls on
    }, {passive: false});
    let g0 = null;
    this.svg.addEventListener('gesturestart', e => { e.preventDefault(); g0 = this.view.z; });
    this.svg.addEventListener('gesturechange', e => { e.preventDefault(); if (g0) this.zoomTo(g0 * e.scale, e.clientX !== undefined ? e : null); });
    this.svg.addEventListener('gestureend', e => { e.preventDefault(); g0 = null; });
    bar.addEventListener('mousedown', e => { if (!e.target.closest('input')) e.preventDefault(); });
    this.setView();
    this.syncBar();
  }

  cur(k) { const s = this.sel !== null && this.b.shapes[this.sel]; return s && s[k] !== undefined ? s[k] : this.style[k]; }
  setOpt(k, v) {
    this.style[k] = v;
    const s = this.sel !== null && this.b.shapes[this.sel];
    // label toggles with nothing selected: apply to the whole drawing, not only to new shapes
    const all = !s && ['len', 'ang', 'names', 'rad', 'meas'].includes(k) ? this.b.shapes.filter(x => x[k] !== undefined || (k === 'meas' && ['line', 'arrow', 'poly', 'circle', 'angle', 'dim', 'arc'].includes(x.t))) : [];
    const targets = s ? [s] : all;
    if (targets.length) { this.save(); for (const x of targets) { x[k] = v; if (k === 'meas') this.clearAutoLike(x, v); } this.changed(); } else this.syncBar();
    this.box.focus({preventScroll: true});
  }
  setTool(t) {
    this.finishPending(); this.tool = t; if (t !== 'select') this.sel = null;
    this.svg.dataset.tool = t; this.render(); this.syncBar();
    this.box.focus({preventScroll: true});
  }
  syncBar() {
    for (const btn of this.bar.querySelectorAll('[data-tool]')) btn.classList.toggle('on', btn.dataset.tool === this.tool);
    for (const btn of this.bar.querySelectorAll('[data-c]')) btn.classList.toggle('on', btn.dataset.c === this.cur('c'));
    for (const btn of this.bar.querySelectorAll('[data-w]')) btn.classList.toggle('on', +btn.dataset.w === this.cur('w'));
    for (const btn of this.bar.querySelectorAll('[data-opt]')) btn.classList.toggle('on', !!this.cur(btn.dataset.opt));
    for (const btn of this.bar.querySelectorAll('[data-page]')) btn.classList.toggle('on', !!this.b[btn.dataset.page]);
    this.dupBtn.disabled = this.delBtn.disabled = this.sel === null;
  }

  // ---------- zoom ----------
  setView() {
    const v = this.view, w = DRAW_W / v.z, h = this.b.h / v.z;
    v.x = Math.max(0, Math.min(DRAW_W - w, v.x)); v.y = Math.max(0, Math.min(this.b.h - h, v.y));
    this.svg.setAttribute('viewBox', `${v.x} ${v.y} ${w} ${h}`);
    if (this.zoomLabel) this.zoomLabel.textContent = Math.round(v.z * 100) + ' %';
    if (this.svg) this.svg.classList.toggle('zoomed', v.z > 1);
  }
  zoomTo(z, e) {
    const v = this.view; z = Math.max(1, Math.min(8, z));
    const r = this.svg.getBoundingClientRect();
    const sx = e ? (e.clientX - r.left) / r.width : .5, sy = e ? (e.clientY - r.top) / r.height : .5;
    const px = v.x + sx * DRAW_W / v.z, py = v.y + sy * this.b.h / v.z;   // this point stays under the pointer
    v.z = z; v.x = px - sx * DRAW_W / z; v.y = py - sy * this.b.h / z;
    this.setView(); this.closeEditor();
  }
  zoomBy(f, e) { this.zoomTo(this.view.z * f, e); }

  // ---------- history ----------
  save() { this.undo.push(JSON.stringify(this.b.shapes)); if (this.undo.length > 80) this.undo.shift(); this.redo = []; }
  doUndo() { if (!this.undo.length) return; this.redo.push(JSON.stringify(this.b.shapes)); this.b.shapes = JSON.parse(this.undo.pop()); this.sel = null; this.changed(); }
  doRedo() { if (!this.redo.length) return; this.undo.push(JSON.stringify(this.b.shapes)); this.b.shapes = JSON.parse(this.redo.pop()); this.sel = null; this.changed(); }
  changed() { this.render(); this.syncBar(); this.onChange(); }

  // ---------- geometry helpers ----------
  pt(e) {
    const p = this.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(this.svg.getScreenCTM().inverse());
    return [q.x, q.y];
  }
  snapPt(p, skip, e, free) {
    if (e && e.altKey) return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
    let best = null, bd = 9;
    this.b.shapes.forEach((s, i) => { if (i === skip || s.t === 'pen' || s.t === 'text') return; for (const q of this.corners(s)) { const d = dist(p, q); if (d < bd) { bd = d; best = q; } } });
    if (best) return [best[0], best[1]];
    if (this.b.snap && !free) return [Math.round(p[0] / STEP) * STEP, Math.round(p[1] / STEP) * STEP];
    return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
  }
  corners(s) { return s.t === 'circle' || s.t === 'ellipse' ? [s.pts[0]] : s.t === 'axes' ? [s.pts[2]] : s.pts; }
  // angle arms and the end of an arc may point anywhere: they only stick to corners, not to the grid
  freePick() { const pd = this.pending; return !!pd && (pd.t === 'angle' || (pd.t === 'arc' && pd.pts.length === 2)); }
  anchor() { const pd = this.pending, P = pd.pts; return pd.t === 'angle' || pd.t === 'arc' ? P[0] : P[P.length - 1]; }
  fixArc(s) { if (s.t !== 'arc') return; const c = s.pts[0], r = dist(c, s.pts[1]), v = unit(sub(s.pts[2], c)); s.pts[2] = [c[0] + v[0] * r, c[1] + v[1] * r]; }
  // Shift: lines keep to steps of 15°
  constrain(a, p, e) {
    if (!e.shiftKey) return p;
    const v = sub(p, a), r = len(v), ang = Math.round(Math.atan2(v[1], v[0]) / (Math.PI / 12)) * (Math.PI / 12);
    return [a[0] + r * Math.cos(ang), a[1] + r * Math.sin(ang)];
  }
  // switching numbers/letters: drop typed labels that are just the other kind, so the switch shows
  clearAutoLike(s, meas) {
    const re = meas ? /^[A-Za-zΑ-Ωα-ω][′'₀-₉0-9]*$/ : /^[−-]?[0-9][0-9,.\s]*(°|\s*\S{1,3})?$/;
    for (const key of ['txt', 'atxt']) if (s[key]) s[key] = s[key].map(t => t && t !== ' ' && re.test(t) ? '' : t);
  }
  // remember every shown measure as name + value, for "Mitat laskuun"
  note(i, letter, custom, v, kind) {
    if (i < 0 || !this.meas) return;
    custom = (custom || '').trim();
    let name = letter, val = kind === 'len' ? v / STEP * (this.b.scale || 1) : v;
    if (/^[A-Za-zα-ω][′']?(?:_?[0-9])?$/.test(custom)) name = custom;              // own letter: a, x, β
    else { const m = /^[−-]?\d+(?:[.,]\d+)?/.exec(custom); if (m) val = parseFloat(m[0].replace(',', '.').replace('−', '-')); } // own value: 5 cm
    this.meas.push({i, name, val, kind});
  }
  // math rows a:=5 m, α:=37° after the drawing (selected shape, or all)
  exportMeasures() {
    this.render();
    const want = this.sel !== null ? this.meas.filter(m => m.i === this.sel) : this.meas;
    const seen = new Set(), rows = [];
    const GK = {α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'epsilon', ζ: 'zeta', η: 'eta', θ: 'theta'};
    for (const m of want) {
      if (seen.has(m.name)) continue; seen.add(m.name);
      const name = GK[m.name] ? '\\' + GK[m.name] : m.name.replace(/^([A-Za-z])_?([0-9])$/, '$1_{$2}').replace(/[′']/g, '');
      if (!/^\\?[A-Za-z]+(_\{\d\})?$/.test(name) || GK[m.name] === 'zeta' || GK[m.name] === 'eta') continue;
      const num = String(Math.round(m.val * 1000) / 1000).replace('.', Kieli.pilkku ? '{,}' : '.').replace('-', '-');
      const u = this.b.unit && m.kind === 'len' ? '\\operatorname{\\mathbf{' + this.b.unit.replace(/[^A-Za-zµ]/g, '') + '}}' : '';
      rows.push([name, name + ':=' + num + (m.kind === 'deg' ? '\\degree' : u)]);
    }
    if (!rows.length) return flash(tr('Ei mittoja: laita Pituudet tai Kulmat päälle.'));
    let after = this.box.closest('.block').dataset.id;
    for (const [name, latex] of rows) after = insertAfter(after, Object.assign(mk('math'), {latex, res: Kieli.tex('\\text{muistissa } ') + name}), false).id;
    flash(rows.length + (rows.length === 1 ? ' mitta' : ' mittaa') + ' laskuriveiksi');
  }
  auto(s, num, letter) { return s.meas === false ? letter : num; }
  lenText(px) { const u = this.b.unit; return fmtNum(px / STEP * (this.b.scale || 1)) + (u ? ' ' + u : ''); }

  newShape(t, pts) {
    const st = this.style, s = {t, pts, c: st.c, w: st.w};
    if (['line', 'arrow', 'poly', 'circle', 'angle', 'pen', 'curve', 'ellipse', 'arc'].includes(t)) s.dash = st.dash;
    if (['poly', 'circle', 'ellipse', 'curve', 'arc'].includes(t)) s.fill = st.fill;
    if (['line', 'arrow', 'poly', 'circle', 'angle', 'dim', 'arc'].includes(t)) s.meas = st.meas;
    if (t === 'angle' || t === 'arc') s.big = st.big;
    if (t === 'angle') s.arms = st.arms;
    if (t === 'arc') Object.assign(s, {sector: st.sector, rad: st.rad, ang: st.ang, len: st.len, txt: []});
    if (t === 'axes') Object.assign(s, {len: true, txt: []});
    if (t === 'line' || t === 'arrow' || t === 'poly') { s.len = t === 'arrow' ? false : st.len; s.txt = []; }
    if (t === 'poly') { s.ang = st.ang; s.names = st.names; s.atxt = []; s.ntxt = []; }
    if (t === 'circle') { s.rad = st.rad; s.txt = []; }
    if (t === 'dim' || t === 'angle') s.txt = [];
    return s;
  }
  commit(s) { this.fixArc(s); this.save(); this.b.shapes.push(s); this.sel = this.b.shapes.length - 1; this.changed(); }

  // ---------- mouse ----------
  down(e) {
    if (e.button === 1 || (e.button === 0 && this.space)) { e.preventDefault(); this.svg.setPointerCapture(e.pointerId); this.act = {kind: 'pan', cx: e.clientX, cy: e.clientY, v: {...this.view}}; return; }
    if (e.button !== 0) return;
    e.preventDefault(); this.closeEditor(); this.box.focus({preventScroll: true});
    const raw = this.pt(e), t = this.tool;
    // double-click, detected by hand (pointer capture stops the browser's own dblclick)
    const now = Date.now(), last = this.lastDown;
    this.lastDown = {t: now, x: e.clientX, y: e.clientY};
    if (last && now - last.t < 450 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 6) { this.lastDown = null; if (this.dbl(e)) return; }
    this.svg.setPointerCapture(e.pointerId);
    if (t === 'select') {
      const h = e.target.closest('[data-h]'), g = e.target.closest('[data-i]');
      if (h && this.sel !== null) { this.act = {kind: 'vertex', k: +h.dataset.h, saved: false}; return; }
      if (g) { this.sel = +g.dataset.i; this.act = {kind: 'move', from: raw, orig: JSON.stringify(this.b.shapes[this.sel].pts), saved: false}; }
      else { this.sel = null; if (this.view.z > 1) this.act = {kind: 'pan', cx: e.clientX, cy: e.clientY, v: {...this.view}}; }
      this.render(); this.syncBar(); return;
    }
    if (t === 'erase') { this.act = {kind: 'erase', saved: false}; this.eraseAt(e); return; }
    const p = this.snapPt(raw, undefined, e, this.freePick());
    if (t === 'tick') {
      const g = e.target.closest('[data-i]'), s = g && this.b.shapes[+g.dataset.i];
      if (!s || !(s.t === 'line' || s.t === 'poly')) return;
      let k = 0, bd = 1e9;
      const n = s.t === 'line' ? 1 : s.pts.length;
      for (let j = 0; j < n; j++) { const a = s.pts[j], b = s.pts[(j + 1) % s.pts.length], v = sub(b, a), L = len(v) || 1;
        const tt = Math.max(0, Math.min(1, ((raw[0] - a[0]) * v[0] + (raw[1] - a[1]) * v[1]) / (L * L))), d = dist(raw, [a[0] + v[0] * tt, a[1] + v[1] * tt]);
        if (d < bd) { bd = d; k = j; } }
      this.save(); s.ticks = s.ticks || []; s.ticks[k] = ((s.ticks[k] || 0) + 1) % 4; this.changed(); return;
    }
    if (t === 'text') {
      const g = e.target.closest('[data-i]'), lab = e.target.closest('[data-lab]');
      this.act = {kind: 'text', p, lab, i: g && this.b.shapes[+g.dataset.i].t === 'text' ? +g.dataset.i : null}; return;
    }
    if (t === 'point') { const n = this.b.shapes.filter(s => s.t === 'point').length; this.commit(Object.assign(this.newShape('point', [p]), {name: String.fromCharCode(65 + n % 26)})); return; }
    if (t === 'tri' || t === 'poly' || t === 'angle' || t === 'arc' || t === 'curve') { this.clickPoint(p, e); return; }
    if (t === 'pen') { this.act = {kind: 'draw', s: this.newShape('pen', [raw])}; return; }
    const kind = {line: 'line', arrow: 'arrow', rect: 'poly', circle: 'circle', dim: 'dim', ellipse: 'ellipse', axes: 'axes'}[t];
    this.act = {kind: 'draw', s: this.newShape(kind, t === 'axes' ? [p, p, p] : [p, p]), rect: t === 'rect'};
  }
  move(e) {
    const raw = this.pt(e), a = this.act;
    if (!a) { if (this.pending) { const last = this.pending.pts[this.pending.pts.length - 1]; this.mouse = this.constrain(this.anchor(), this.snapPt(raw, undefined, e, this.freePick()), e); this.render(); } return; }
    const s = a.s || this.b.shapes[this.sel];
    if (a.kind === 'erase') return this.eraseAt(e);
    if (a.kind === 'pan') {
      const k = DRAW_W / this.view.z / this.svg.getBoundingClientRect().width;
      this.view.x = a.v.x - (e.clientX - a.cx) * k; this.view.y = a.v.y - (e.clientY - a.cy) * k; return this.setView();
    }
    if (a.kind === 'move') {
      if (!a.saved) { this.save(); a.saved = true; }
      let dx = raw[0] - a.from[0], dy = raw[1] - a.from[1];
      const orig = JSON.parse(a.orig);
      if (this.b.snap && s.t !== 'pen' && s.t !== 'text') { const q = this.snapPt([orig[0][0] + dx, orig[0][1] + dy], this.sel); dx = q[0] - orig[0][0]; dy = q[1] - orig[0][1]; }
      s.pts = orig.map(q => [q[0] + dx, q[1] + dy]);
    } else if (a.kind === 'vertex') {
      if (!a.saved) { this.save(); a.saved = true; }
      const other = s.pts.length === 2 ? s.pts[1 - a.k] : null;
      const free = (s.t === 'angle' && a.k !== 1) || (s.t === 'arc' && a.k === 2);
      const q = this.snapPt(raw, this.sel, e, free);
      s.pts[a.k] = other && s.t !== 'circle' && s.t !== 'ellipse' ? this.constrain(other, q, e) : (s.t === 'angle' && a.k !== 1) || (s.t === 'arc' && a.k) ? this.constrain(s.pts[s.t === 'arc' ? 0 : 1], q, e) : q;
      this.fixArc(s);
    } else if (a.kind === 'draw') {
      if (s.t === 'pen') { const last = s.pts[s.pts.length - 1]; if (dist(last, raw) > 2) s.pts.push([Math.round(raw[0] * 10) / 10, Math.round(raw[1] * 10) / 10]); }
      else if (a.rect) {
        const p0 = s.pts[0]; let p = this.snapPt(raw);
        if (e.shiftKey) { const d = Math.max(Math.abs(p[0] - p0[0]), Math.abs(p[1] - p0[1])); p = [p0[0] + Math.sign(p[0] - p0[0] || 1) * d, p0[1] + Math.sign(p[1] - p0[1] || 1) * d]; }
        s.pts = [p0, [p[0], p0[1]], p, [p0[0], p[1]]]; s.rectFrom = p0;
      } else if (s.t === 'axes') {
        const p0 = s.pts[0], p = this.snapPt(raw, undefined, e), c = [(p0[0] + p[0]) / 2, (p0[1] + p[1]) / 2];
        s.pts = [p0, p, [Math.round(c[0] / STEP) * STEP, Math.round(c[1] / STEP) * STEP]];
      } else if (s.t === 'ellipse') {
        const c = s.pts[0]; let p = this.snapPt(raw, undefined, e);
        if (e.shiftKey) { const d = Math.max(Math.abs(p[0] - c[0]), Math.abs(p[1] - c[1])); p = [c[0] + Math.sign(p[0] - c[0] || 1) * d, c[1] + Math.sign(p[1] - c[1] || 1) * d]; }
        s.pts[1] = p;
      } else s.pts[1] = s.t === 'circle' ? this.snapPt(raw, undefined, e) : this.constrain(s.pts[0], this.snapPt(raw, undefined, e), e);
    }
    this.render();
  }
  up(e) {
    const a = this.act; this.act = null;
    if (!a) return;
    // open the text box when the click is over (a click that steals its focus right away is undone in openEditor)
    if (a.kind === 'text') {
      if (a.lab) { const [i, kind, k] = a.lab.dataset.lab.split(':'); this.editLabel(+i, kind, +k, a.lab); }
      else this.editText(a.i, a.p);
      return;
    }
    if (a.kind === 'draw') {
      const s = a.s; delete s.rectFrom;
      if (s.t === 'pen' && e) { const q = this.pt(e), l = s.pts[s.pts.length - 1]; if (dist(q, l) > .5) s.pts.push([Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]); }
      const size = s.t === 'axes' ? Math.min(Math.abs(s.pts[1][0] - s.pts[0][0]), Math.abs(s.pts[1][1] - s.pts[0][1])) : s.t === 'pen' ? s.pts.reduce((t, q, k) => k ? t + dist(q, s.pts[k - 1]) : 0, 0) : dist(s.pts[0], s.pts[a.rect ? 2 : 1]);
      if (size > 3) this.commit(s); else this.render();
      return;
    }
    if (a.kind === 'pan') return;
    if (a.saved) this.onChange();
    this.render(); this.syncBar();
  }
  eraseAt(e) {
    const t = document.elementFromPoint(e.clientX, e.clientY), g = t && t.closest && t.closest('.drawsvg [data-i]');
    if (!g) return;
    if (!this.act.saved) { this.save(); this.act.saved = true; }
    this.b.shapes.splice(+g.dataset.i, 1); this.sel = null; this.changed();
  }
  clickPoint(p, e) {
    if (!this.pending) { this.pending = {t: this.tool, pts: [p]}; this.mouse = p; this.render(); return; }
    const pts = this.pending.pts;
    p = this.constrain(this.anchor(), p, e);
    if ((this.pending.t === 'poly' || this.pending.t === 'curve') && pts.length >= 3 && dist(p, pts[0]) < 10) { this.pending.closed = true; return this.finishPending(); }
    if (dist(p, pts[pts.length - 1]) < 2 || dist(p, pts[0]) < 2) return;
    pts.push(p);
    const need = {tri: 3, angle: 3, arc: 3}[this.pending.t];
    if (need && pts.length === need) this.finishPending(); else this.render();
  }
  finishPending() {
    const pd = this.pending; this.pending = null; this.mouse = null;
    if (!pd) return;
    const P = pd.pts;
    if (pd.t === 'angle' || pd.t === 'arc') { if (P.length === 3) this.commit(this.newShape(pd.t, pd.t === 'angle' ? [P[1], P[0], P[2]] : P)); else this.render(); }
    else if (pd.t === 'curve') { if (P.length >= 2) this.commit(Object.assign(this.newShape('curve', P), {closed: !!pd.closed && P.length >= 3})); else this.render(); }
    else if (pd.pts.length >= 3) this.commit(this.newShape('poly', pd.pts));
    else if (pd.t === 'poly' && pd.pts.length === 2) this.commit(this.newShape('line', pd.pts));
    else this.render();
  }
  dbl(e) {
    const lab = e.target.closest('[data-lab]');
    if (lab && this.tool !== 'text') { const [i, kind, k] = lab.dataset.lab.split(':'); this.act = {kind: 'text', lab}; return true; }
    const g = e.target.closest('[data-i]');
    if (g && this.tool !== 'text' && this.b.shapes[+g.dataset.i].t === 'text') { this.act = {kind: 'text', i: +g.dataset.i}; return true; }
    if ((this.tool === 'poly' || this.tool === 'curve') && this.pending) { this.pending.pts.pop(); this.finishPending(); return true; }
    return false;
  }

  // ---------- keyboard ----------
  key(e) {
    if (e.target.closest('input')) return;
    const m = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (m && k === 'z') { stop(); return e.shiftKey ? this.doRedo() : this.doUndo(); }
    if (m) return;
    if (e.key === 'Escape') { stop(); if (this.pending) { this.pending = null; this.render(); } else if (this.sel !== null) { this.sel = null; this.render(); this.syncBar(); } else this.setTool('select'); return; }
    if (e.key === 'Enter' && this.pending) { stop(); return this.finishPending(); }
    if ((e.key === 'Backspace' || e.key === 'Delete')) {
      stop();
      if (this.sel !== null) return this.deleteSel();
      if (!this.b.shapes.length) removeBlock(this.box.closest('.block').dataset.id);
      return;
    }
    if (e.key.startsWith('Arrow') && this.sel !== null) {
      stop(); this.save();
      const d = (e.shiftKey ? STEP : 1), dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0, dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0;
      const s = this.b.shapes[this.sel]; s.pts = s.pts.map(q => [q[0] + dx, q[1] + dy]); return this.changed();
    }
    if (e.key === 'ArrowUp') { stop(); return focusNeighbour(this.box.closest('.block').dataset.id, -1); }
    if (e.key === 'ArrowDown') { stop(); const id = this.box.closest('.block').dataset.id; if (!focusNeighbour(id, 1)) insertAfter(id, mk('math')); return; }
    if (e.key === 'Enter') { stop(); return insertAfter(this.box.closest('.block').dataset.id, mk('math')); }
    if (e.key === '+' || e.key === '=') { stop(); return this.zoomBy(1.4); }
    if (e.key === '-') { stop(); return this.zoomBy(1 / 1.4); }
    if (e.key === '0') { stop(); return this.zoomTo(1); }
    if (e.key === ' ') { stop(); this.space = true; this.svg.classList.add('panning'); return; }
    if (KEYS[k] && !e.shiftKey && !e.altKey) { stop(); this.setTool(KEYS[k]); }
  }
  deleteSel() { if (this.sel === null) return; this.save(); this.b.shapes.splice(this.sel, 1); this.sel = null; this.changed(); this.box.focus({preventScroll: true}); }
  duplicate() {
    if (this.sel === null) return;
    const s = JSON.parse(JSON.stringify(this.b.shapes[this.sel]));
    s.pts = s.pts.map(q => [q[0] + STEP, q[1] + STEP]);
    if (s.t === 'point') s.name = String.fromCharCode(65 + this.b.shapes.filter(x => x.t === 'point').length % 26);
    this.commit(s); this.box.focus({preventScroll: true});
  }

  // ---------- small text editor over the picture ----------
  openEditor(p, value, done, cls) {
    this.closeEditor();
    const q = this.svg.createSVGPoint(); q.x = p[0]; q.y = p[1];
    const s = q.matrixTransform(this.svg.getScreenCTM()), r = this.wrap.getBoundingClientRect();
    const inp = document.createElement('input'); inp.className = 'dedit ' + (cls || ''); inp.value = value;
    inp.style.left = (s.x - r.left) + 'px'; inp.style.top = (s.y - r.top) + 'px';
    let finished = false;
    const opened = Date.now();
    const end = ok => { if (finished) return; finished = true; inp.remove(); this.editor = null; this.endEditor = null; if (ok) done(inp.value); };
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); end(true); this.box.focus({preventScroll: true}); } if (e.key === 'Escape') { e.preventDefault(); end(false); this.box.focus({preventScroll: true}); } });
    inp.addEventListener('pointerdown', e => e.stopPropagation());
    // a click right after opening may steal the focus: take it back; later, leaving the box saves it
    inp.addEventListener('blur', () => { if (finished) return; if (Date.now() - opened < 400) setTimeout(() => !finished && inp.focus()); else end(true); });
    this.wrap.appendChild(inp); this.editor = inp; this.endEditor = end;
    inp.focus(); inp.select();
  }
  closeEditor() { if (this.endEditor) this.endEditor(true); }
  editText(i, p) {
    const s = i !== null ? this.b.shapes[i] : null;
    this.openEditor(s ? s.pts[0] : p, s ? s.s : '', v => {
      v = pretty(v.trim());
      if (s) { this.save(); if (v) s.s = v; else { this.b.shapes.splice(i, 1); this.sel = null; } this.changed(); }
      else if (v) this.commit(Object.assign(this.newShape('text', [p]), {s: v}));
    }, 'left');
  }
  editLabel(i, kind, k, lab) {
    const s = this.b.shapes[i];
    if (kind === 'u') {
      const key = k ? 'uy' : 'ux', bb = lab.getBBox();
      return this.openEditor([bb.x + bb.width / 2, bb.y + bb.height / 2], fmtNum(s[key] || 1), v => {
        const n = parseFloat(v.replace(',', '.').replace('−', '-'));
        if (n > 0) { this.save(); s[key] = n; this.changed(); }
      });
    }
    const arr = kind === 'a' ? (s.atxt = s.atxt || []) : kind === 'n' ? (s.ntxt = s.ntxt || []) : (s.txt = s.txt || []);
    const bb = lab.getBBox();
    // an emptied label is kept as ' ': nothing shows (handy when the value is what you calculate)
    this.openEditor([bb.x + bb.width / 2, bb.y + bb.height / 2], arr[k] === ' ' ? lab.dataset.auto : arr[k] || lab.textContent, v => {
      this.save(); v = pretty(v.trim());
      if (kind === 'p') { if (v) s.name = v; } else arr[k] = v === lab.dataset.auto ? '' : v === '' ? ' ' : v;
      this.changed();
    });
  }

  // ---------- drawing ----------
  render() {
    const svg = this.svg, b = this.b, W = DRAW_W, H = b.h;
    svg.textContent = '';
    el('rect', {x: 0, y: 0, width: W, height: H, fill: '#fff'}, svg);
    if (b.grid) {
      let d = '';
      for (let x = STEP; x < W; x += STEP) d += `M${x} 0V${H}`;
      for (let y = STEP; y < H; y += STEP) d += `M0 ${y}H${W}`;
      el('path', {d, stroke: '#cfd8e3', 'stroke-width': .6, fill: 'none'}, svg);
    }
    this.meas = [];
    b.shapes.forEach((s, i) => this.drawShape(s, i, svg));
    if (this.act && this.act.kind === 'draw') this.drawShape(this.act.s, -1, svg);
    if (this.pending) {
      const pd = this.pending, pts = pd.pts.concat(this.mouse ? [this.mouse] : []);
      let pv;
      if ((pd.t === 'angle' || pd.t === 'arc') && pts.length === 3) { pv = this.newShape(pd.t, pd.t === 'angle' ? [pts[1], pts[0], pts[2]] : pts.map(q => q.slice())); this.fixArc(pv); pv.meas = true; if (pd.t === 'arc') pv.ang = true; }
      else if (pd.t === 'curve') pv = this.newShape('curve', pts);
      else { pv = this.newShape('poly', pts); Object.assign(pv, {open: true, ang: false, names: false}); if (pd.t === 'angle' || pd.t === 'arc') Object.assign(pv, {len: pd.t === 'arc', meas: true, dash: pd.t === 'arc'}); }
      if (pts.length >= 2) this.drawShape(pv, -1, svg);
      for (const q of this.pending.pts) el('circle', {cx: q[0], cy: q[1], r: 3.5, fill: this.style.c}, svg);
      if ((pd.t === 'poly' || pd.t === 'curve') && pd.pts.length >= 3) { const f = this.pending.pts[0]; el('circle', {cx: f[0], cy: f[1], r: 8, fill: 'none', stroke: this.style.c, 'stroke-dasharray': '2 2'}, svg); }
    }
    if (this.sel !== null && this.b.shapes[this.sel] && this.tool === 'select') {
      const s = this.b.shapes[this.sel];
      if (s.t === 'pen' || s.t === 'text') {
        const g = svg.querySelector(`[data-i="${this.sel}"]`); const bb = g && g.getBBox();
        if (bb) el('rect', {x: bb.x - 5, y: bb.y - 5, width: bb.width + 10, height: bb.height + 10, rx: 4, fill: 'none', stroke: '#3e442a', 'stroke-dasharray': '4 3', 'pointer-events': 'none'}, svg);
      } else s.pts.forEach((q, k) => el('circle', {cx: q[0], cy: q[1], r: 5.5, fill: '#fff', stroke: '#3e442a', 'stroke-width': 1.6, 'data-h': k, class: 'handle'}, svg));
    }
  }

  label(g, p, text, attrs) {
    const ghost = text === ' ';
    const t = el('text', Object.assign({x: p[0], y: p[1], 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'dlabel'}, attrs), g);
    if (ghost) t.setAttribute('class', t.getAttribute('class') + ' ghost');
    t.textContent = ghost ? '·' : text;
    return t;
  }
  sideLabel(g, s, i, k, a, b, outFrom, letter) {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], v = unit(sub(b, a));
    let n = [-v[1], v[0]];
    if (outFrom) { if ((m[0] - outFrom[0]) * n[0] + (m[1] - outFrom[1]) * n[1] < 0) n = [-n[0], -n[1]]; }
    else if (n[1] > 0 || (n[1] === 0 && n[0] > 0)) n = [-n[0], -n[1]];
    const auto = this.auto(s, this.lenText(dist(a, b)), letter || 'a'), txt = (s.txt && s.txt[k]) || auto;
    this.note(i, letter || 'a', s.txt && s.txt[k], dist(a, b), 'len');
    const off = 12 + (Math.abs(n[0]) > .5 ? txt.length * 3 : 0);
    this.label(g, [m[0] + n[0] * off, m[1] + n[1] * off], txt, {fill: s.c, 'data-lab': `${i}:l:${k}`, 'data-auto': auto});
  }
  // angle at v between rays to a and b; reflex = take the outer side
  angleMark(g, s, i, k, a, v, b, reflex, kind, letter) {
    const u = unit(sub(a, v)), w = unit(sub(b, v));
    let th = Math.acos(Math.max(-1, Math.min(1, u[0] * w[0] + u[1] * w[1])));
    if (reflex) th = 2 * Math.PI - th;
    const deg = th * 180 / Math.PI;
    let bis = unit([u[0] + w[0], u[1] + w[1]]);
    if (len([u[0] + w[0], u[1] + w[1]]) < 1e-6) bis = [u[1], -u[0]];
    if (reflex) bis = [-bis[0], -bis[1]];
    const r = Math.max(10, Math.min(24, .35 * Math.min(dist(a, v), dist(b, v))));
    const attrs = {fill: 'none', stroke: s.c, 'stroke-width': 1.3};
    if (Math.abs(deg - 90) < .05 && !s.round) {
      const q = 11; el('path', Object.assign({d: `M${v[0] + u[0] * q} ${v[1] + u[1] * q}l${w[0] * q} ${w[1] * q}l${-u[0] * q} ${-u[1] * q}`}, attrs), g);
    } else {
      const a1 = Math.atan2(u[1], u[0]), a2 = Math.atan2(w[1], w[0]);
      const d = ((a2 - a1) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const sweep = Math.abs(d - th) < Math.abs(2 * Math.PI - d - th) ? 1 : 0;
      el('path', Object.assign({d: `M${v[0] + u[0] * r} ${v[1] + u[1] * r}A${r} ${r} 0 ${th > Math.PI ? 1 : 0} ${sweep} ${v[0] + w[0] * r} ${v[1] + w[1] * r}`}, attrs), g);
    }
    const auto = this.auto(s, fmtNum(Math.round(deg * 10) / 10) + '°', letter || 'α'), arr = kind === 'a' ? s.atxt : s.txt;
    this.note(i, letter || 'α', arr && arr[k], deg, 'deg');
    this.label(g, [v[0] + bis[0] * (r + 15), v[1] + bis[1] * (r + 15)], (arr && arr[k]) || auto, {fill: s.c, 'data-lab': `${i}:${kind}:${k}`, 'data-auto': auto, class: 'dlabel small'});
    return bis;
  }
  ticks(g, s, a, b, n) {
    if (!n) return;
    const v = unit(sub(b, a)), q = [-v[1] * 6, v[0] * 6], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let d = '';
    for (let j = 0; j < n; j++) { const o = (j - (n - 1) / 2) * 5, c = [m[0] + v[0] * o, m[1] + v[1] * o]; d += `M${c[0] - q[0]} ${c[1] - q[1]}l${2 * q[0]} ${2 * q[1]}`; }
    el('path', {d, stroke: s.c, 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round'}, g);
  }
  // smooth curve through the points (Catmull-Rom)
  curvePath(P, closed) {
    const n = P.length; if (n < 3 && !closed) return 'M' + P.map(q => q[0] + ' ' + q[1]).join('L');
    const at = k => closed ? P[(k + n) % n] : P[Math.max(0, Math.min(n - 1, k))];
    let d = `M${P[0][0]} ${P[0][1]}`;
    for (let k = 0; k < (closed ? n : n - 1); k++) {
      const p0 = at(k - 1), p1 = at(k), p2 = at(k + 1), p3 = at(k + 2);
      d += `C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
    }
    return d + (closed ? 'Z' : '');
  }
  arrowHead(g, a, b, s) {
    const v = unit(sub(b, a)), n = [-v[1], v[0]], L = 8 + s.w * 2, Wd = 4 + s.w;
    el('path', {d: `M${b[0]} ${b[1]}L${b[0] - v[0] * L + n[0] * Wd} ${b[1] - v[1] * L + n[1] * Wd}L${b[0] - v[0] * L - n[0] * Wd} ${b[1] - v[1] * L - n[1] * Wd}Z`, fill: s.c}, g);
  }
  greekFor(i) { const n = (i < 0 ? this.b.shapes : this.b.shapes.slice(0, i)).filter(x => (x.t === 'angle' || (x.t === 'arc' && x.ang))).length; return GREEK[n % GREEK.length]; }
  drawShape(s, i, svg) {
    const g = el('g', {'data-i': i >= 0 ? i : null}, svg);
    const stroke = {stroke: s.c, 'stroke-width': s.w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': s.dash ? `${6 + s.w * 2} ${4 + s.w * 2}` : null};
    const hit = d => el('path', {d, stroke: 'transparent', 'stroke-width': 14, fill: 'none', 'pointer-events': 'stroke'}, g);
    const P = s.pts, line = pts => 'M' + pts.map(q => q[0] + ' ' + q[1]).join('L');
    if (s.t === 'pen') {
      const P = smoothPen(s.pts);
      let d = `M${P[0][0]} ${P[0][1]}`;
      for (let k = 1; k < P.length - 1; k++) d += `Q${P[k][0]} ${P[k][1]} ${(P[k][0] + P[k + 1][0]) / 2} ${(P[k][1] + P[k + 1][1]) / 2}`;
      if (P.length > 1) d += `L${P[P.length - 1][0]} ${P[P.length - 1][1]}`;
      el('path', Object.assign({d}, stroke), g); hit(d);
    } else if (s.t === 'line' || s.t === 'arrow') {
      const d = line(P);
      el('path', Object.assign({d}, stroke), g); hit(d);
      if (s.t === 'arrow') this.arrowHead(g, P[0], P[1], s);
      if (s.t === 'line') this.ticks(g, s, P[0], P[1], s.ticks && s.ticks[0]);
      if (s.len) this.sideLabel(g, s, i, 0, P[0], P[1], null, s.t === 'arrow' ? 'v' : 'a');
    } else if (s.t === 'dim') {
      const v = unit(sub(P[1], P[0])), n = [-v[1] * 6, v[0] * 6], d = line(P);
      const thin = {c: s.c, w: 1};
      el('path', {d: `${d}M${P[0][0] - n[0]} ${P[0][1] - n[1]}l${2 * n[0]} ${2 * n[1]}M${P[1][0] - n[0]} ${P[1][1] - n[1]}l${2 * n[0]} ${2 * n[1]}`, stroke: s.c, 'stroke-width': 1.1, fill: 'none'}, g);
      this.arrowHead(g, P[1], P[0], thin); this.arrowHead(g, P[0], P[1], thin);
      hit(d); this.sideLabel(g, s, i, 0, P[0], P[1], null, 'x');
    } else if (s.t === 'poly') {
      const closed = !s.open, d = line(P) + (closed ? 'Z' : '');
      el('path', Object.assign({d}, stroke, s.fill ? {fill: s.c, 'fill-opacity': .1} : {}), g);
      el('path', {d, stroke: 'transparent', 'stroke-width': 14, fill: s.fill ? 'transparent' : 'none', 'pointer-events': s.fill ? 'all' : 'stroke'}, g);
      const n = P.length, cen = [P.reduce((a, q) => a + q[0], 0) / n, P.reduce((a, q) => a + q[1], 0) / n];
      let area = 0; for (let k = 0; k < n; k++) { const a = P[k], b = P[(k + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
      const sides = closed ? n : n - 1;
      for (let k = 0; k < sides; k++) if (dist(P[k], P[(k + 1) % n]) > 1) {
        this.ticks(g, s, P[k], P[(k + 1) % n], s.ticks && s.ticks[k]);
        // in a triangle side a lies opposite corner A
        if (s.len) this.sideLabel(g, s, i, k, P[k], P[(k + 1) % n], closed ? cen : null, closed && n === 3 ? 'abc'[(k + 2) % 3] : 'abcdefghijkl'[k % 12]);
      }
      if (closed && (s.ang || s.names)) for (let k = 0; k < n; k++) {
        const a = P[(k - 1 + n) % n], v = P[k], b = P[(k + 1) % n];
        if (dist(a, v) < 1 || dist(b, v) < 1) continue;
        const cr = (v[0] - a[0]) * (b[1] - v[1]) - (v[1] - a[1]) * (b[0] - v[0]);
        const reflex = cr * area < 0;
        let bis;
        if (s.ang) bis = this.angleMark(g, s, i, k, a, v, b, reflex, 'a', GREEK[k % GREEK.length]);
        else { const u = unit(sub(a, v)), w = unit(sub(b, v)); bis = unit([u[0] + w[0], u[1] + w[1]]); if (reflex) bis = [-bis[0], -bis[1]]; }
        if (s.names) { const nm = (s.ntxt && s.ntxt[k]) || String.fromCharCode(65 + k % 26); this.label(g, [v[0] - bis[0] * 15, v[1] - bis[1] * 15], nm, {fill: s.c, 'data-lab': `${i}:n:${k}`, 'data-auto': String.fromCharCode(65 + k % 26), class: 'dlabel name'}); }
      }
    } else if (s.t === 'circle') {
      const c = P[0], r = dist(P[0], P[1]);
      el('circle', Object.assign({cx: c[0], cy: c[1], r}, stroke, s.fill ? {fill: s.c, 'fill-opacity': .1} : {}), g);
      el('circle', {cx: c[0], cy: c[1], r, stroke: 'transparent', 'stroke-width': 14, fill: s.fill ? 'transparent' : 'none', 'pointer-events': s.fill ? 'all' : 'stroke'}, g);
      el('circle', {cx: c[0], cy: c[1], r: 2.4, fill: s.c}, g);
      if (s.rad && r > 4) {
        el('path', {d: line(P), stroke: s.c, 'stroke-width': 1.1, 'stroke-dasharray': '4 3', fill: 'none'}, g);
        const auto = s.meas === false ? 'r' : 'r = ' + this.lenText(r);
        this.note(i, 'r', s.txt && s.txt[0], r, 'len');
        const m = [(c[0] + P[1][0]) / 2, (c[1] + P[1][1]) / 2], v = unit(sub(P[1], c)); let n = [-v[1], v[0]]; if (n[1] > 0) n = [-n[0], -n[1]];
        this.label(g, [m[0] + n[0] * 12, m[1] + n[1] * 12], (s.txt && s.txt[0]) || auto, {fill: s.c, 'data-lab': `${i}:l:0`, 'data-auto': auto});
      }
    } else if (s.t === 'angle') {
      const d = line([P[0], P[1], P[2]]), ok = dist(P[0], P[1]) > 1 && dist(P[2], P[1]) > 1;
      // arms off: only the arc mark shows (for an angle between lines that are already drawn); a short invisible stub keeps it clickable
      if (s.arms !== false) { el('path', Object.assign({d}, stroke), g); hit(d); }
      else if (ok) { const q = k => { const u = unit(sub(P[k], P[1])), r = Math.min(34, dist(P[k], P[1])); return [P[1][0] + u[0] * r, P[1][1] + u[1] * r]; }; hit(line([q(0), P[1], q(2)])); }
      if (dist(P[0], P[1]) > 1 && dist(P[2], P[1]) > 1) this.angleMark(g, s, i, 0, P[0], P[1], P[2], !!s.big, 'l', this.greekFor(i));
    } else if (s.t === 'arc') {
      const c = P[0], r = dist(c, P[1]), S = P[1], E = P[2];
      const a1 = Math.atan2(S[1] - c[1], S[0] - c[0]), a2 = Math.atan2(E[1] - c[1], E[0] - c[0]);
      const dd = ((a2 - a1) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      let sweep = dd <= Math.PI ? 1 : 0, span = sweep ? dd : 2 * Math.PI - dd;
      if (s.big) { sweep = 1 - sweep; span = 2 * Math.PI - span; }
      const arc = `M${S[0]} ${S[1]}A${r} ${r} 0 ${span > Math.PI ? 1 : 0} ${sweep} ${E[0]} ${E[1]}`;
      const d = s.sector ? `M${c[0]} ${c[1]}L${S[0]} ${S[1]}` + arc.slice(arc.indexOf('A')) + 'Z' : arc;
      el('path', Object.assign({d}, stroke, s.fill ? {fill: s.c, 'fill-opacity': .1} : {}), g);
      el('path', {d, stroke: 'transparent', 'stroke-width': 14, fill: s.fill ? 'transparent' : 'none', 'pointer-events': s.fill ? 'all' : 'stroke'}, g);
      el('circle', {cx: c[0], cy: c[1], r: 2.4, fill: s.c}, g);
      if (!s.sector && (s.rad || s.ang) && r > 4) el('path', {d: `M${S[0]} ${S[1]}L${c[0]} ${c[1]}L${E[0]} ${E[1]}`, stroke: s.c, 'stroke-width': 1.1, 'stroke-dasharray': '4 3', fill: 'none'}, g);
      if (s.rad && r > 4) this.sideLabel(g, s, i, 0, c, S, E, 'r');
      if (s.ang && r > 4 && span > .02) this.angleMark(g, Object.assign({}, s, {round: span > Math.PI}), i, 1, S, c, E, span > Math.PI, 'l', this.greekFor(i));
      if (s.len && r > 4 && span > .02) {
        const mid = a1 + (sweep ? 1 : -1) * span / 2, o = r + 14;
        const auto = this.auto(s, this.lenText(r * span), 'b');
        this.note(i, 'b', s.txt && s.txt[2], r * span, 'len');
        this.label(g, [c[0] + Math.cos(mid) * o, c[1] + Math.sin(mid) * o], (s.txt && s.txt[2]) || auto, {fill: s.c, 'data-lab': `${i}:l:2`, 'data-auto': auto});
      }
    } else if (s.t === 'ellipse') {
      const c = P[0], rx = Math.abs(P[1][0] - c[0]), ry = Math.abs(P[1][1] - c[1]);
      el('ellipse', Object.assign({cx: c[0], cy: c[1], rx, ry}, stroke, s.fill ? {fill: s.c, 'fill-opacity': .1} : {}), g);
      el('ellipse', {cx: c[0], cy: c[1], rx, ry, stroke: 'transparent', 'stroke-width': 14, fill: s.fill ? 'transparent' : 'none', 'pointer-events': s.fill ? 'all' : 'stroke'}, g);
    } else if (s.t === 'curve') {
      const d = this.curvePath(P, s.closed);
      el('path', Object.assign({d}, stroke, s.fill && s.closed ? {fill: s.c, 'fill-opacity': .1} : {}), g);
      el('path', {d, stroke: 'transparent', 'stroke-width': 14, fill: s.fill && s.closed ? 'transparent' : 'none', 'pointer-events': s.fill && s.closed ? 'all' : 'stroke'}, g);
    } else if (s.t === 'axes') {
      const x0 = Math.min(P[0][0], P[1][0]), x1 = Math.max(P[0][0], P[1][0]), y0 = Math.min(P[0][1], P[1][1]), y1 = Math.max(P[0][1], P[1][1]);
      const O = [Math.max(x0, Math.min(x1, P[2][0])), Math.max(y0, Math.min(y1, P[2][1]))];
      const th = {c: s.c, w: 1.4}, d = `M${x0} ${O[1]}H${x1}M${O[0]} ${y1}V${y0}`;
      el('path', {d, stroke: s.c, 'stroke-width': 1.4, fill: 'none'}, g); hit(d);
      this.arrowHead(g, [x0, O[1]], [x1, O[1]], th); this.arrowHead(g, [O[0], y1], [O[0], y0], th);
      let t = '';
      const ux = s.ux || 1, uy = s.uy || 1, small = {fill: s.c, class: 'dlabel small'};
      for (let k = -Math.floor((O[0] - x0) / STEP); O[0] + k * STEP < x1 - 14; k++) if (k) {
        const x = O[0] + k * STEP; t += `M${x} ${O[1] - 4}v8`;
        if (s.len) this.label(g, [x, O[1] + 14], fmtNum(k * ux), k === 1 ? Object.assign({'data-lab': `${i}:u:0`}, small) : small);
      }
      for (let k = -Math.floor((y1 - O[1]) / STEP); O[1] - k * STEP > y0 + 14; k++) if (k) {
        const y = O[1] - k * STEP; t += `M${O[0] - 4} ${y}h8`;
        if (s.len) this.label(g, [O[0] - 8, y], fmtNum(k * uy), Object.assign({'text-anchor': 'end'}, k === 1 ? Object.assign({'data-lab': `${i}:u:1`}, small) : small));
      }
      el('path', {d: t, stroke: s.c, 'stroke-width': 1.2, fill: 'none'}, g);
      if (s.len) this.label(g, [O[0] - 8, O[1] + 14], '0', Object.assign({'text-anchor': 'end'}, small));
      this.label(g, [x1 - 4, O[1] - 15], (s.txt && s.txt[0]) || 'x', {fill: s.c, 'data-lab': `${i}:l:0`, 'data-auto': 'x', class: 'dlabel name'});
      this.label(g, [O[0] + 14, y0 + 6], (s.txt && s.txt[1]) || 'y', {fill: s.c, 'data-lab': `${i}:l:1`, 'data-auto': 'y', 'text-anchor': 'start', class: 'dlabel name'});
    } else if (s.t === 'text') {
      const t = el('text', {x: P[0][0], y: P[0][1], fill: s.c, 'font-size': 10 + s.w * 4, 'dominant-baseline': 'central', class: 'dtext', 'pointer-events': 'all'}, g);
      t.textContent = s.s;
    } else if (s.t === 'point') {
      el('circle', {cx: P[0][0], cy: P[0][1], r: 2.5 + s.w * .6, fill: s.c}, g);
      el('circle', {cx: P[0][0], cy: P[0][1], r: 9, fill: 'transparent', 'pointer-events': 'all'}, g);
      if (s.name) { const t = this.label(g, [P[0][0] + 9, P[0][1] - 11], s.name, {fill: s.c, 'text-anchor': 'start', 'data-lab': `${i}:p:0`, class: 'dlabel name'}); t.removeAttribute('data-auto'); }
    }
  }
}

function buildDraw(el, b) {
  b.shapes = b.shapes || [];
  const box = document.createElement('div'); box.className = 'drawbox'; box.tabIndex = 0;
  el.appendChild(box);
  el._draw = new Drawing(box, b, () => touch());
}
