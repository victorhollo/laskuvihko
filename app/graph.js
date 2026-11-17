// Function plotter on a canvas. Drag to move, scroll/pinch to zoom.
// colours come from the theme (style.css --p0..--p5, --pgrid, --paxis)
const COLORS = [0, 1, 2, 3, 4, 5].map(k => `var(--p${k})`);
const themeVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const Plots = new Set();
window.addEventListener('themechange', () => Plots.forEach(p => p.c.isConnected ? p.draw() : Plots.delete(p)));

class Plot {
  constructor(canvas, block, onRange) {
    this.c = canvas; this.b = block; this.onRange = onRange;
    this.fns = []; Plots.add(this); this.pts = []; this.hover = null;
    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, r: {...this.b}}; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
    canvas.addEventListener('pointermove', e => {
      if (!drag) {
        // hovering a marked point shows its coordinates
        const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        let best = null, bd = 10;
        for (const q of this.pts) { const d = Math.hypot(q.px - mx, q.py - my); if (d < bd) { bd = d; best = q; } }
        canvas.style.cursor = best ? 'pointer' : '';
        if (best !== this.hover) { this.hover = best; this.draw(); }
        return;
      }
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dx = (e.clientX - drag.x) / w * (drag.r.xmin - drag.r.xmax);
      const dy = (e.clientY - drag.y) / h * (drag.r.ymax - drag.r.ymin);
      Object.assign(this.b, {xmin: drag.r.xmin + dx, xmax: drag.r.xmax + dx, ymin: drag.r.ymin + dy, ymax: drag.r.ymax + dy});
      this.draw(); this.onRange(false);
    });
    canvas.addEventListener('pointerleave', () => { if (this.hover) { this.hover = null; this.draw(); } });
    const end = () => { if (drag) { drag = null; canvas.style.cursor = ''; this.onRange(true); } };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      const k = Math.exp(e.deltaY * 0.002);
      const b = this.b;
      const cx = b.xmin + px * (b.xmax - b.xmin), cy = b.ymax - py * (b.ymax - b.ymin);
      Object.assign(b, {xmin: cx + (b.xmin - cx) * k, xmax: cx + (b.xmax - cx) * k, ymin: cy + (b.ymin - cy) * k, ymax: cy + (b.ymax - cy) * k});
      this.draw(); this.onRange(true);
    }, {passive: false});
    new ResizeObserver(() => this.draw()).observe(canvas);
  }

  static step(range, px) {
    const raw = range / Math.max(2, px / 70);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 5, 10]) if (m * p >= raw) return m * p;
    return 10 * p;
  }
  static label(v, step) {
    const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    return (Math.abs(v) < step / 1e6 ? 0 : v).toFixed(dec).replace('.', typeof Kieli === 'undefined' || Kieli.pilkku ? ',' : '.').replace(/^-/, '−');
  }

  draw() {
    const c = this.c, dpr = window.devicePixelRatio || 1;
    const W = c.clientWidth, H = c.clientHeight;
    if (!W || !H) return;
    if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const {xmin, xmax, ymin, ymax} = this.b;
    const X = x => (x - xmin) / (xmax - xmin) * W;
    const Y = y => (ymax - y) / (ymax - ymin) * H;
    const sx = Plot.step(xmax - xmin, W), sy = Plot.step(ymax - ymin, H);

    // grid
    g.lineWidth = 1;
    g.strokeStyle = themeVar('--pgrid');
    g.beginPath();
    for (let x = Math.ceil(xmin / sx) * sx; x <= xmax; x += sx) { const p = Math.round(X(x)) + .5; g.moveTo(p, 0); g.lineTo(p, H); }
    for (let y = Math.ceil(ymin / sy) * sy; y <= ymax; y += sy) { const p = Math.round(Y(y)) + .5; g.moveTo(0, p); g.lineTo(W, p); }
    g.stroke();

    // axes
    const ax = Math.min(Math.max(Y(0), 0), H), ay = Math.min(Math.max(X(0), 0), W);
    const axis = themeVar('--paxis'); g.strokeStyle = axis;
    g.beginPath(); g.moveTo(0, Math.round(ax) + .5); g.lineTo(W, Math.round(ax) + .5); g.moveTo(Math.round(ay) + .5, 0); g.lineTo(Math.round(ay) + .5, H); g.stroke();
    g.fillStyle = axis;
    g.beginPath(); g.moveTo(W, ax); g.lineTo(W - 8, ax - 4); g.lineTo(W - 8, ax + 4); g.fill();
    g.beginPath(); g.moveTo(ay, 0); g.lineTo(ay - 4, 8); g.lineTo(ay + 4, 8); g.fill();
    g.font = 'italic 13px Georgia, serif';
    g.fillText('x', W - 14, ax - 8); g.fillText('y', ay + 8, 14);

    // ticks
    g.font = '11px -apple-system, sans-serif';
    g.fillStyle = axis;
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let x = Math.ceil(xmin / sx) * sx; x <= xmax; x += sx) {
      if (Math.abs(x) < sx / 2) continue;
      const p = X(x); if (p < 12 || p > W - 12) continue; g.fillRect(Math.round(p), ax - 3, 1, 6);
      g.fillText(Plot.label(x, sx), p, Math.min(ax + 5, H - 14));
    }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let y = Math.ceil(ymin / sy) * sy; y <= ymax; y += sy) {
      if (Math.abs(y) < sy / 2) continue;
      const p = Y(y); if (p < 8 || p > H - 8) continue; g.fillRect(ay - 3, Math.round(p), 6, 1);
      g.fillText(Plot.label(y, sy), Math.max(ay - 6, 30), p);
    }
    if (xmin < 0 && xmax > 0 && ymin < 0 && ymax > 0) { g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText('0', ay - 5, ax + 5); }

    // functions
    g.lineWidth = 2.2; g.lineJoin = 'round';
    this.fns.forEach((f, idx) => {
      if (!f) return;
      g.strokeStyle = themeVar(`--p${idx % COLORS.length}`);
      g.beginPath();
      let pen = false, prev = null;
      const n = Math.ceil(W * 2);
      for (let k = 0; k <= n; k++) {
        const x = xmin + (xmax - xmin) * k / n;
        const y = f(x, this.b.params);
        if (typeof y !== 'number' || !isFinite(y)) { pen = false; prev = null; continue; }
        const py = Y(y);
        if (prev !== null && Math.abs(py - prev) > H * 1.5) pen = false; // jump (asymptote)
        const cy = Math.max(-H, Math.min(2 * H, py));
        if (pen) g.lineTo(k / n * W, cy); else g.moveTo(k / n * W, cy);
        pen = true; prev = py;
      }
      g.stroke();
    });

    // zeros, extremes and intersections
    this.pts = [];
    if (this.b.marks === false) return;
    const pts = this.findPoints(xmin, xmax, ymin, ymax);
    const showAll = pts.length <= 8;
    g.font = '11px -apple-system, sans-serif'; g.textBaseline = 'bottom'; g.textAlign = 'left';
    for (const q of pts) {
      q.px = X(q.x); q.py = Y(q.y);
      if (q.py < -5 || q.py > H + 5) continue;
      // same spot found twice (e.g. minimum seen from both sides): keep one
      if (this.pts.some(o => Math.abs(o.px - q.px) < 4 && Math.abs(o.py - q.py) < 4)) continue;
      this.pts.push(q);
      // points are found anew on every redraw: hover must point to the new copy
      if (this.hover && this.hover !== q && this.hover.c === q.c && Math.abs(this.hover.x - q.x) < 1e-9 && Math.abs(this.hover.y - q.y) < 1e-9) this.hover = q;
      g.beginPath(); g.arc(q.px, q.py, q === this.hover ? 5 : 3.5, 0, 7);
      g.fillStyle = themeVar('--card') || '#fff'; g.fill();
      g.lineWidth = 2; g.strokeStyle = q.c < 0 ? axis : themeVar(`--p${q.c % COLORS.length}`); g.stroke();
    }
    if (this.hover && !this.pts.includes(this.hover)) this.hover = null;
    // labels: try four spots around the dot, skip if all overlap (hover still shows it)
    const placed = [], hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const order = this.hover ? [this.hover, ...this.pts.filter(q => q !== this.hover)] : this.pts;
    for (const q of order) {
      if (!showAll && q !== this.hover) continue;
      const t = (q === this.hover ? q.kind + ' ' : '') + '(' + Plot.num(q.x) + (typeof Kieli === 'undefined' || Kieli.pilkku ? '; ' : ', ') + Plot.num(q.y) + ')';
      const w = g.measureText(t).width + 4, h = 14;
      const spots = [[6, -h - 4], [6, 4], [-w - 6, -h - 4], [-w - 6, 4]].map(([dx, dy]) => ({x: Math.min(Math.max(q.px + dx, 2), W - w - 2), y: Math.min(Math.max(q.py + dy, 2), H - h - 2), w, h}));
      const box = spots.find(b => !placed.some(p => hit(b, p)) && !this.pts.some(o => o !== q && hit(b, {x: o.px - 4, y: o.py - 4, w: 8, h: 8})))
        || (q === this.hover ? spots[0] : null);
      if (!box) continue;
      placed.push(box);
      g.fillStyle = themeVar('--card'); g.globalAlpha = .88; g.fillRect(box.x, box.y, w, h); g.globalAlpha = 1;
      g.fillStyle = axis; g.fillText(t, box.x + 2, box.y + h - 1);
    }
  }

  static num(v) {
    const r = Math.round(v * 1000) / 1000;
    return (Math.abs(r) < 1e-9 ? 0 : r).toString().replace('.', typeof Kieli === 'undefined' || Kieli.pilkku ? ',' : '.').replace(/^-/, '−');
  }

  // numeric search in the visible range; c = function index (−1 = intersection)
  findPoints(xmin, xmax, ymin, ymax) {
    const P = this.b.params, fs = this.fns.map(f => f && (x => f(x, P)));
    const n = 600, dx = (xmax - xmin) / n, yr = ymax - ymin, out = [];
    const xs = Array.from({length: n + 1}, (_, k) => xmin + k * dx);
    const bisect = (g, a, b) => { let ga = g(a); for (let i = 0; i < 60; i++) { const m = (a + b) / 2, gm = g(m); if ((gm < 0) === (ga < 0)) { a = m; ga = gm; } else b = m; } return (a + b) / 2; };
    const roots = (g, ys) => {
      const r = [];
      for (let k = 0; k < n; k++) {
        const a = ys[k], b = ys[k + 1];
        if (!isFinite(a) || !isFinite(b)) continue;
        if (a === 0) { r.push(xs[k]); continue; }
        if ((a < 0) !== (b < 0) && b !== 0) {
          const x = bisect(g, xs[k], xs[k + 1]);
          if (Math.abs(g(x)) < yr * 1e-3) r.push(x); // not an asymptote jump
        }
      }
      // touching zero (x² type): small local minimum of |g|
      for (let k = 1; k < n; k++) {
        const a = Math.abs(ys[k - 1]), b = Math.abs(ys[k]), c = Math.abs(ys[k + 1]);
        if (b <= a && b <= c && (ys[k - 1] < 0) === (ys[k + 1] < 0) && b < yr * 0.02) {
          const x = golden(t => Math.abs(g(t)), xs[k - 1], xs[k + 1]);
          if (Math.abs(g(x)) < yr * 1e-7) r.push(x);
        }
      }
      return r.filter((x, i) => !r.some((y, j) => j < i && Math.abs(x - y) < dx));
    };
    const golden = (g, a, b) => { const R = .618034; for (let i = 0; i < 60; i++) { const c = b - R * (b - a), d = a + R * (b - a); if (g(c) < g(d)) b = d; else a = c; } return (a + b) / 2; };
    const snap = v => { const r = Math.round(v * 1e6) / 1e6; return Math.abs(v - r) < 1e-7 ? r : v; };
    const Y = fs.map(f => f ? xs.map(x => { const y = f(x); return typeof y === 'number' ? y : NaN; }) : null);
    fs.forEach((f, c) => {
      if (!f) return;
      const ys = Y[c];
      for (const x of roots(f, ys)) out.push({x: snap(x), y: 0, c, kind: 'nollakohta'});
      // extremes: slope changes sign
      for (let k = 1; k < n; k++) {
        const a = ys[k - 1], b = ys[k], cc = ys[k + 1];
        if (![a, b, cc].every(isFinite)) continue;
        const up = b - a, dn = cc - b;
        if (Math.abs(up) + Math.abs(dn) < yr * 1e-9) continue; // flat
        const isMax = up > 0 && dn <= 0, isMin = up < 0 && dn >= 0;
        if (!isMax && !isMin) continue;
        if (Math.abs(up) > yr * .5 || Math.abs(dn) > yr * .5) continue; // asymptote
        const x = golden(isMax ? t => -f(t) : f, xs[k - 1], xs[k + 1]), y = f(x);
        if (!isFinite(y)) continue;
        if (out.some(q => q.c === c && Math.abs(q.x - x) < dx * 1.5)) { // touching zero: keep one point, name both
          const q = out.find(q => q.c === c && Math.abs(q.x - x) < dx * 1.5); q.kind = (isMax ? 'maksimi' : 'minimi') + ', nollakohta'; continue; }
        out.push({x: snap(x), y: snap(y), c, kind: isMax ? 'maksimi' : 'minimi'});
      }
    });
    // intersections between each pair
    for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) {
      if (!fs[i] || !fs[j]) continue;
      const g = x => fs[i](x) - fs[j](x), ys = xs.map((_, k) => Y[i][k] - Y[j][k]);
      if (ys.every(v => !isFinite(v) || Math.abs(v) < yr * 1e-9)) continue; // same curve
      for (const x of roots(g, ys)) { const y = fs[i](x); if (isFinite(y)) out.push({x: snap(x), y: snap(y), c: -1, kind: 'leikkauspiste'}); }
    }
    return out;
  }
}
