// Laskuvihko main app: document of text, formula and graph rows.
MathfieldElement.fontsDirectory = './fonts';
MathfieldElement.soundsDirectory = null;
MathfieldElement.decimalSeparator = ',';

const $ = s => document.querySelector(s);
const native = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.native;
const post = msg => native && native.postMessage(msg);
const docEl = $('#doc');
const uid = () => Math.random().toString(36).slice(2, 9);

let doc, dirty = false, activeId = null, lastMf = null, saveTimer = null, fileName = null;

function blank() { return {app: 'laskuvihko', v: 1, title: '', deg: true, blocks: [mk('math')]}; }
function mk(type, extra = {}) {
  const b = {id: uid(), type};
  if (type === 'text') b.html = '';
  if (type === 'math') { b.latex = ''; b.res = null; b.err = null; }
  if (type === 'image') { b.src = ''; b.w = null; }
  if (type === 'graph') Object.assign(b, {fns: [''], xmin: -10, xmax: 10, ymin: -7, ymax: 7});
  if (type === 'draw') Object.assign(b, {shapes: [], h: 385, grid: true, snap: true, scale: 1, unit: ''});
  if (type === 'table') b.rows = [['', ''], ['', ''], ['', '']];
  return Object.assign(b, extra);
}
const byId = id => doc.blocks.find(b => b.id === id);
const idx = id => doc.blocks.findIndex(b => b.id === id);
const elOf = id => docEl.querySelector(`.block[data-id="${id}"]`);

// ---------- rendering ----------
function render() {
  docEl.innerHTML = '';
  for (const b of doc.blocks) docEl.appendChild(blockEl(b));
  $('#title').value = doc.title || '';
  Calc.deg = doc.deg !== false;
  $('#angle').textContent = Calc.deg ? 'DEG' : 'RAD';
  status();
}

function blockEl(b) {
  const el = document.createElement('div');
  el.className = 'block ' + b.type;
  el.dataset.id = b.id;
  const kind = document.createElement('span');
  kind.className = 'kind';
  kind.textContent = {text: 'Aa', math: 'ƒ', graph: '⌁', image: 'kuva', draw: '✎', table: '▦'}[b.type];
  el.appendChild(kind);
  el.addEventListener('focusin', () => setActive(b.id));
  if (b.type === 'text') buildText(el, b);
  if (b.type === 'math') buildMath(el, b);
  if (b.type === 'graph') buildGraph(el, b);
  if (b.type === 'image') buildImage(el, b);
  if (b.type === 'draw') buildDraw(el, b);
  if (b.type === 'table') buildTable(el, b);
  return el;
}

// ---------- images ----------
function buildImage(el, b) {
  const box = document.createElement('div');
  box.className = 'imgbox'; box.tabIndex = 0;
  const img = document.createElement('img');
  img.src = b.src; img.draggable = false;
  if (b.w) img.style.width = b.w + 'px';
  const grip = document.createElement('span');
  grip.className = 'grip'; grip.title = 'Muuta kokoa vetämällä';
  grip.addEventListener('pointerdown', e => {
    e.preventDefault(); grip.setPointerCapture(e.pointerId);
    const x0 = e.clientX, w0 = img.getBoundingClientRect().width, max = el.getBoundingClientRect().width;
    const mv = ev => { b.w = Math.round(Math.max(60, Math.min(max, w0 + ev.clientX - x0))); img.style.width = b.w + 'px'; };
    const up = () => { grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); touch(); };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up);
  });
  box.addEventListener('keydown', e => {
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); removeBlock(b.id); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); focusNeighbour(b.id, -1); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); if (!focusNeighbour(b.id, 1)) insertAfter(b.id, mk('math')); }
    else if (e.key === 'Enter') { e.preventDefault(); insertAfter(b.id, mk('math')); }
  });
  box.append(img, grip);
  el.appendChild(box);
}
const isImg = f => f && /^image\//.test(f.type);
// read a picture file; big ones are shrunk so the notebook file stays small
function readImage(file) {
  return new Promise((ok, bad) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onerror = () => { URL.revokeObjectURL(url); bad(); };
    im.onload = () => {
      const MAX = 1800, k = Math.min(1, MAX / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      const g = c.getContext('2d');
      let out = null;
      if (file.type === 'image/png' || file.type === 'image/gif') { g.drawImage(im, 0, 0, c.width, c.height); out = c.toDataURL('image/png'); }
      if (!out || out.length > 2.5e6) { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); out = c.toDataURL('image/jpeg', 0.88); }
      URL.revokeObjectURL(url); ok(out);
    };
    im.src = url;
  });
}
async function addImages(files, afterId) {
  files = [...files].filter(isImg);
  if (!files.length) return false;
  let prev = afterId !== undefined ? afterId : activeId, last = null, failed = 0;
  const cur = prev && byId(prev);
  for (const f of files) {
    let src; try { src = await readImage(f); } catch { failed++; continue; }
    last = mk('image', {src});
    if (cur && prev === cur.id && isEmpty(cur)) {  // an empty row becomes the picture
      replaceBlock(cur.id, last);
    } else insertAfter(prev, last, false);
    prev = last.id;
  }
  if (failed) flash('Kuvaa ei voitu avata');
  if (last) { if (idx(last.id) === doc.blocks.length - 1) insertAfter(last.id, mk('math'), false); focusBlock(last.id); }
  return true;
}
document.addEventListener('paste', e => {
  const files = [...(e.clipboardData ? e.clipboardData.items : [])].filter(i => i.kind === 'file' && /^image\//.test(i.type)).map(i => i.getAsFile());
  if (!files.length) return;
  e.preventDefault(); e.stopImmediatePropagation();
  addImages(files);
}, true);
const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
document.addEventListener('dragover', e => { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
document.addEventListener('drop', e => {
  if (!hasFiles(e)) return;
  const files = [...e.dataTransfer.files];
  if (!files.some(isImg)) return;  // e.g. a notebook file: the Mac app opens it
  e.preventDefault();
  const over = e.target.closest && e.target.closest('.block');
  addImages(files, over ? over.dataset.id : (doc.blocks.length ? doc.blocks[doc.blocks.length - 1].id : null));
});

function buildText(el, b) {
  const t = document.createElement('div');
  t.className = 'text'; t.contentEditable = 'true'; t.spellcheck = true;
  t.dataset.ph = 'Kirjoita tekstiä…';
  t.innerHTML = b.html;
  t.querySelectorAll('span.im').forEach(s => hydrateIm(s, t, b));
  t.addEventListener('input', () => { b.html = textHtml(t); touch(); });
  t.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); });
  t.addEventListener('keydown', e => textKey(e, t, b));
  el.appendChild(t);
}

// ---------- formulas inside text ($ starts one, $ / Tab / → at the end goes back to the text) ----------
const ZW = '\u200B';  // invisible character so the caret can stand before/after a formula
function textHtml(t) {
  const c = t.cloneNode(true);
  const live = t.querySelectorAll('span.im');
  c.querySelectorAll('span.im').forEach((s, i) => { const mf = live[i] && live[i].querySelector('math-field'); s.dataset.tex = mf ? mf.value : (s.dataset.tex || ''); s.textContent = ''; s.removeAttribute('contenteditable'); });
  const h = c.innerHTML.replace(/\u200B/g, '');
  return h === '<br>' ? '' : h;
}
function caretAt(node, offset) { const r = document.createRange(); r.setStart(node, offset); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
function zwAround(s) {
  const nx = s.nextSibling, pv = s.previousSibling;
  if (!nx || nx.nodeType !== 3 || !nx.data.startsWith(ZW)) s.after(document.createTextNode(ZW));
  if (!pv || pv.nodeType !== 3 || !pv.data.endsWith(ZW)) s.before(document.createTextNode(ZW));
}
function hydrateIm(s, t, b) {
  s.contentEditable = 'false'; s.textContent = '';
  const mf = newMathField(s.dataset.tex || '', 'inl');
  mf.placeholder = '\text{kaava}';
  s.appendChild(mf);
  zwAround(s);
  const out = after => {
    mf.blur(); t.focus();
    if (!mf.value.trim()) { const p = s.previousSibling; s.remove(); b.html = textHtml(t); touch(); if (p && p.nodeType === 3) caretAt(p, p.data.length); else caretAt(t, 0); return; }
    if (after) caretAt(s.nextSibling, 1); else caretAt(s.previousSibling, s.previousSibling.data.length - 1);
  };
  mf.addEventListener('focusin', () => setActive(b.id));
  mf.addEventListener('input', () => { b.html = textHtml(t); touch(); });
  mf.addEventListener('move-out', e => { e.preventDefault(); out(e.detail.direction !== 'backward'); });
  mf.addEventListener('keydown', e => {
    if (e.key === '$' || (e.key === 'Tab' && !e.shiftKey) || e.key === 'Escape' || (e.key === 'Enter' && !e.metaKey)) { e.preventDefault(); e.stopImmediatePropagation(); out(true); }
    else if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); e.stopImmediatePropagation(); out(false); }
    else if (e.key === 'Backspace' && !mf.value) { e.preventDefault(); e.stopImmediatePropagation(); out(false); }
  }, true);
  s._mf = mf;
}
function insertInline(t, b) {
  const sel = getSelection(); if (!sel.rangeCount) return;
  const r = sel.getRangeAt(0); r.deleteContents();
  const s = document.createElement('span'); s.className = 'im';
  r.insertNode(s);
  hydrateIm(s, t, b);
  b.html = textHtml(t); touch();
  setTimeout(() => s._mf.focus(), 0);
}
// the formula right next to the caret in a text row (dir 1 = after, -1 = before)
function imNext(r, dir) {
  let n = r.startContainer, o = r.startOffset, sib;
  if (n.nodeType === 3) {
    const rest = dir > 0 ? n.data.slice(o) : n.data.slice(0, o);
    if (rest.replace(/\u200B/g, '')) return null;
    sib = dir > 0 ? n.nextSibling : n.previousSibling;
  } else sib = dir > 0 ? n.childNodes[o] : n.childNodes[o - 1];
  while (sib && sib.nodeType === 3 && !sib.data.replace(/\u200B/g, '')) sib = dir > 0 ? sib.nextSibling : sib.previousSibling;
  return sib && sib.classList && sib.classList.contains('im') ? sib : null;
}

// long formulas wrap to the next line after + − = (MathLive itself keeps one line).
// Only when the formula is wider than the paper: then the field gets class .wrap (full width).
const OPSP = ['cmr', 'mrel', 'mbin'].map(c => `:host(.wrap) .ML__base>.ML__${c}+span:not([class])`);
const WRAP_CSS = `:host(.wrap) .ML__container{width:100%;box-sizing:border-box}:host(.wrap) .ML__content{flex:1 1 auto;min-width:0}
:host(.wrap) .ML__latex{white-space:normal!important;min-width:0}:host(.wrap) .ML__base{display:inline!important;white-space:nowrap!important}
${OPSP.join(',')}{display:inline!important;width:auto!important;padding-left:.25em}
${OPSP.map(x => x + '::after').join(',')}{content:'\\200B';white-space:normal}
:host(:not(:focus-within)) .ML__contains-caret.ML__close,:host(:not(:focus-within)) .ML__contains-caret.ML__open,:host(:not(:focus-within)) .ML__contains-caret>.ML__close,
:host(:not(:focus-within)) .ML__contains-caret>.ML__open,:host(:not(:focus-within)) .ML__contains-caret .ML__sqrt-sign,:host(:not(:focus-within)) .ML__contains-caret .ML__sqrt-line{color:inherit}`;
// (last rule: MathLive colours √ and brackets around the cursor; drop the colour when the row is not being edited)
function fitField(mf) {
  const r = mf.shadowRoot, c = r && r.querySelector('.ML__content'), l = r && r.querySelector('.ML__latex');
  if (!c || !l || !mf.isConnected) return;
  mf.classList.remove('wrap');
  if (l.scrollWidth > c.clientWidth + 1) mf.classList.add('wrap');
}
const fitAll = () => document.querySelectorAll('math-field.main, math-field.result').forEach(fitField);
window.addEventListener('resize', () => { clearTimeout(fitAll.t); fitAll.t = setTimeout(fitAll, 100); });
function wrapField(mf) {
  // MathLive redraws the formula into .ML__content: check the width after every redraw
  const add = () => {
    const r = mf.shadowRoot, c = r && r.querySelector('.ML__content');
    if (!c) return setTimeout(add, 50);
    if (r.getElementById('wrapcss')) return;
    const st = document.createElement('style'); st.id = 'wrapcss'; st.textContent = WRAP_CSS; r.prepend(st);
    new MutationObserver(() => fitField(mf)).observe(c, {childList: true});
    fitField(mf);
  };
  add();
}

function newMathField(latex, cls) {
  const mf = new MathfieldElement();
  mf.className = cls || '';
  mf.mathVirtualKeyboardPolicy = 'manual';
  mf.smartFence = true;
  // the exponent stays open after a digit (2^{2x+1}); leave it with → like in L'Math
  mf.smartSuperscript = false;
  wrapField(mf);
  // / with a selection: MathLive drops the ^ when the selection ends inside an exponent.
  // Grow the selection until it holds whole pieces, then make the fraction.
  mf.addEventListener('keydown', e => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || mf.mode === 'latex' || mf.selectionIsCollapsed) return;
    const v0 = mf.value, [a0, b0] = mf.selection.ranges[0].slice().sort((x, y) => x - y), L = mf.lastOffset;
    const bad = v => /[\^_]\{\}|\\sqrt\{\}/.test(v.replace(/\\frac\{[^{}]*\}\{\\placeholder\{\}\}/, ''));
    for (let d = 0; d <= L; d++) for (const [a, b] of [[a0, b0 + d], [a0 - d, b0], [a0 - d, b0 + d]]) {
      if (a < 0 || b > L) continue;
      mf.value = v0; mf.selection = {ranges: [[a, b]]};
      mf.executeCommand(['insert', '\\frac{#@}{#?}']);
      if (!bad(mf.value)) { e.preventDefault(); e.stopImmediatePropagation(); mf.dispatchEvent(new Event('input', {bubbles: true})); return; }
    }
    mf.value = v0; mf.selection = {ranges: [[a0, b0]]};
  }, true);

  mf.value = latex || '';
  mf.addEventListener('focusin', () => { lastMf = mf; });
  mf.addEventListener('keydown', e => unitKey(e, mf), true);
  mf.addEventListener('focusout', () => setUnitMode(mf, false));
  // Finnish Mac keyboard: ^ (Shift + ¨) is a "dead key" that waits for the next key.
  // Make it start an exponent at once, like L'Math.
  mf.addEventListener('keydown', e => {
    if (e.key === 'Dead' && e.code === 'BracketRight' && e.shiftKey && !e.altKey && !e.metaKey && mf.mode !== 'latex') {
      e.preventDefault(); e.stopImmediatePropagation();
      mf.executeCommand('moveToSuperscript');
    }
  }, true);
  // \nthroot and \cbrt are not real commands: turn them into roots when finished
  const ROOTS = {nthroot: '\\sqrt[#?]{#?}', cbrt: '\\sqrt[3]{#?}'};
  mf.addEventListener('input', () => setTimeout(() => {
    if (mf.mode === 'latex') return;
    const m = /\\(nthroot|cbrt)$/.exec(mf.getValue(0, mf.position));
    if (!m) return;
    mf.executeCommand('deleteBackward');
    mf.insert(ROOTS[m[1]], {selectionMode: 'placeholder'});
  }, 0));
  return mf;
}

function buildMath(el, b) {
  const row = document.createElement('div');
  row.className = 'mathrow';
  const mf = newMathField(b.latex, 'main');
  mf.placeholder = '\\text{kaava}';
  const res = new MathfieldElement();
  res.className = 'result'; res.readOnly = true; res.tabIndex = -1;
  res.mathVirtualKeyboardPolicy = 'manual';
  wrapField(res);
  const err = document.createElement('span');
  err.className = 'result err';
  const vs = document.createElement('span');
  vs.className = 'vars';
  // free text after the formula on the same row (Tab from the formula)
  const note = document.createElement('div');
  note.className = 'rnote'; note.contentEditable = 'plaintext-only'; note.spellcheck = true;
  note.dataset.ph = 'tekstiä…'; note.textContent = b.note || '';
  note.addEventListener('input', () => { b.note = note.textContent; touch(); });
  note.addEventListener('focusin', () => setActive(b.id));
  note.addEventListener('focusout', () => note.classList.remove('open'));
  note.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const sel = getSelection(), atStart = sel.isCollapsed && sel.anchorOffset === 0 && (sel.anchorNode === note || sel.anchorNode === note.firstChild);
    const back = () => { e.preventDefault(); mf.focus(); mf.executeCommand('moveToMathfieldEnd'); };
    if (e.key === 'Enter') { e.preventDefault(); insertAfter(b.id, mk(e.shiftKey ? 'text' : 'math')); }
    else if (e.key === 'Tab' && e.shiftKey) back();
    else if ((e.key === 'Backspace' || e.key === 'ArrowLeft') && atStart) back();
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); focusNeighbour(b.id, e.key === 'ArrowUp' ? -1 : 1); }
    e.stopPropagation();
  });
  note.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain').replace(/\s*\n\s*/g, ' ')); });
  row.append(mf, res, err, vs, note);
  el.appendChild(row);
  showResult(el, b);
  mf.addEventListener('input', () => {
    if (mf.value === b.latex) return;  // e.g. "2+3=" Enter removed the = itself: keep the answer
    b.latex = mf.value;
    if (b.res || b.err) { b.res = null; b.err = null; b.vars = null; b.chart = null; b.stat = null; b.steps = null; showResult(el, b); }
    touch();
  });
  mf.addEventListener('keydown', e => mathKey(e, mf, b), true);
  mf.addEventListener('move-out', e => {
    const d = e.detail.direction;
    if (d === 'upward' || d === 'backward') { if (focusNeighbour(b.id, -1)) e.preventDefault(); }
    if (d === 'downward' || d === 'forward') { if (focusNeighbour(b.id, 1)) e.preventDefault(); }
  });
}

// ---------- statistics table: value + frequency, results update while typing ----------
// a class like 10–20 or 10-20 → [10, 20]
const tclass = v => { const m = String(v).trim().replace(/\s/g, '').replace(/,/g, '.').match(/^(−?-?[\d.]+)[-–—](−?-?[\d.]+)$/); if (!m) return null; const a = tnum(m[1]), c = tnum(m[2]); return a < c ? [a, c] : null; };
const tnum = v => { const t = String(v).trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-'); return /^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(t) ? parseFloat(t) : NaN; };
function buildTable(el, b) {
  const wrap = document.createElement('div'); wrap.className = 'tablewrap';
  const t = document.createElement('table'); t.className = 'stattable';
  t.innerHTML = '<thead><tr><th>arvo <i>x</i></th><th>frekvenssi <i>f</i></th><th></th></tr></thead><tbody></tbody>';
  const tb = t.tBodies[0];
  const out = document.createElement('div'); out.className = 'tableout';
  const res = new MathfieldElement(); res.className = 'result'; res.readOnly = true; res.tabIndex = -1; res.mathVirtualKeyboardPolicy = 'manual';
  const err = document.createElement('span'); err.className = 'result err';
  const hint = document.createElement('span'); hint.className = 'thint';
  hint.textContent = 'Kirjoita arvot tai luokat (esim. 10–20). Frekvenssi = montako kertaa arvo esiintyy (tyhjä = 1). Voit myös liittää luvut Excelistä.';
  out.append(res, err);
  wrap.append(t, hint, out);
  el.appendChild(wrap);
  const cell = (r, c) => tb.rows[r] && tb.rows[r].cells[c].firstChild;
  const tidy = () => { // always one empty row at the end
    while (b.rows.length > 1 && !b.rows[b.rows.length - 1].join('') && !b.rows[b.rows.length - 2].join('')) b.rows.pop();
    if (!b.rows.length || b.rows[b.rows.length - 1].join('')) b.rows.push(['', '']);
  };
  function compute() {
    const pairs = [], cls = []; let bad = false;
    b.rows.forEach((r, i) => {
      const k = tclass(r[0]), x = k ? NaN : tnum(r[0]), f = r[1].trim() ? tnum(r[1]) : 1, empty = !r[0].trim() && !r[1].trim();
      const bx = !empty && !k && isNaN(x), bf = !empty && !(f >= 0);
      if (tb.rows[i]) { tb.rows[i].cells[0].classList.toggle('bad', bx); tb.rows[i].cells[1].classList.toggle('bad', bf); }
      if (bx || bf) bad = true; else if (k) cls.push([k[0], k[1], f]); else if (!empty) pairs.push([x, f]);
    });
    // classes (10–20) and single values can't be mixed
    const mixed = !bad && cls.length && pairs.length;
    let st = null, msg = bad ? 'Tarkista punaisella merkityt solut: niissä pitää olla luku tai luokka (esim. 10–20).' : mixed ? 'Kirjoita joko kaikki arvot luokkina (esim. 10–20) tai kaikki yksittäisinä lukuina.' : '';
    if (!msg) { try { st = cls.length ? Calc.classStats(cls) : pairs.length ? Calc.stats(pairs) : null; } catch (e) { msg = e.message; } }
    bad = !!msg;
    err.textContent = msg;
    err.style.display = bad ? '' : 'none';
    res.style.display = 'none';
    hint.style.display = pairs.length || cls.length || bad ? 'none' : '';
    out.querySelector('.statbox')?.remove();
    if (st) { const box = document.createElement('div'); box.className = 'statbox'; box.append(statTable(st.rows), statChart(st.chart)); out.appendChild(box); }
  }
  function draw(fr, fc) {
    tidy(); tb.innerHTML = '';
    b.rows.forEach((r, i) => {
      const tr = tb.insertRow();
      [0, 1].forEach(c => {
        const inp = document.createElement('input');
        inp.value = r[c]; inp.inputMode = 'decimal'; inp.spellcheck = false; inp.placeholder = c ? '1' : '';
        inp.addEventListener('input', () => {
          r[c] = inp.value;
          const n = b.rows.length; tidy();
          if (b.rows.length !== n) draw(i, c); else compute();
          touch();
        });
        inp.addEventListener('keydown', e => key(e, i, c, inp));
        inp.addEventListener('paste', e => paste(e, i, c));
        tr.insertCell().appendChild(inp);
      });
      const del = document.createElement('button'); del.className = 'tdel'; del.textContent = '×'; del.title = 'Poista rivi'; del.tabIndex = -1;
      del.onclick = () => { b.rows.splice(i, 1); draw(Math.min(i, b.rows.length - 1), 0); touch(); };
      tr.insertCell().appendChild(del);
    });
    compute();
    if (fr != null) { const x = cell(Math.min(fr, b.rows.length - 1), fc); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }
  }
  function key(e, i, c, inp) {
    const go = (r, cc) => { const x = cell(r, cc); if (x) { e.preventDefault(); x.focus(); x.select(); return true; } };
    const i0 = idx(b.id);
    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      // Enter on the empty last row (= second Enter in a row) leaves the table
      if (i === b.rows.length - 1 && !b.rows[i].join('').trim()) { const n = doc.blocks[i0 + 1]; return n && n.type === 'math' && !n.latex.trim() ? focusBlock(n.id, true) : insertAfter(b.id, mk('math')); }
      return go(i + 1, c);
    }
    if (e.key === 'ArrowDown') { if (go(i + 1, c)) return; e.preventDefault(); const n = doc.blocks[i0 + 1]; return n ? focusBlock(n.id, true) : insertAfter(b.id, mk('math')); }
    if (e.key === 'ArrowUp') { if (go(i - 1, c)) return; const p = doc.blocks[i0 - 1]; if (p) { e.preventDefault(); focusBlock(p.id, false); } return; }
    if (e.key === 'ArrowRight' && c === 0 && inp.selectionStart === inp.value.length) return go(i, 1);
    if (e.key === 'ArrowLeft' && c === 1 && inp.selectionStart === 0) return go(i, 0);
    if (e.key === 'Backspace' && !inp.value && c === 1 && inp.selectionStart === 0) return go(i, 0);
    if (e.key === 'Backspace' && !inp.value && c === 0 && i > 0 && !b.rows[i].join('')) { e.preventDefault(); b.rows.splice(i, 1); draw(i - 1, 1); touch(); }
  }
  function paste(e, i, c) {
    const txt = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
    if (!/[\n\t;]/.test(txt.trim())) return; // one value: normal paste
    e.preventDefault();
    let lines = txt.replace(/\r/g, '').split('\n').filter(l => l.trim());
    let cells = lines.map(l => l.split(/\t|;/).map(x => x.trim()));
    if (cells.length === 1) cells = cells[0].filter(Boolean).map(x => [x]); // one row of numbers: each is a value
    cells.forEach((r, k) => {
      const row = b.rows[i + k] || (b.rows[i + k] = ['', '']);
      if (r.length === 1 || c === 1) row[c] = r[0]; else { row[0] = r[0]; row[1] = r[1] || ''; }
    });
    draw(i + cells.length, 0); touch();
  }
  draw();
}

// step-by-step solution: one row per step, the note on the same line, rows divided by thin lines
function stepTable(steps) {
  const t = document.createElement('table'); t.className = 'stepbox';
  const mf = (tex, cls) => { const m = new MathfieldElement(); m.readOnly = true; m.tabIndex = -1; m.mathVirtualKeyboardPolicy = 'manual'; m.className = cls; m.value = tex; return m; };
  for (const [op, body, note] of steps) {
    const tr = t.insertRow();
    tr.insertCell().className = 'op'; if (op) tr.cells[0].textContent = '⇔';
    const c = tr.insertCell(); c.className = 'sm';
    if (body.startsWith('CHART:')) c.appendChild(signChart(JSON.parse(body.slice(6)), mf)); else c.appendChild(mf(body.replace(/\\frac/g, '\\dfrac'), 'stepm'));
    const n = document.createElement('span'); n.className = 'note'; c.appendChild(n);
    if (note.startsWith('|')) { n.appendChild(mf('\\left|\\,' + note.slice(1) + '\\right.', 'stepn')); } else n.textContent = note;
  }
  return t;
}

// merkkikaavio: ylärivillä kohdat, sitten tekijöiden ja tuloksen merkit (+, −, 0, ∄)
function signChart(d, mf) {
  const t = document.createElement('table'); t.className = 'signchart';
  const put = (tr, x, i, head) => { const td = tr.insertCell(); if (i === 0) td.className = 'nm'; else if (d.head[i] !== '') td.className = 'pt';
    if (!x) return; if (i === 0 || head) td.appendChild(mf(x, 'stepm')); else td.textContent = {'-': '−', '\\nexists': '∄'}[x] || x; };
  const h = t.insertRow(); h.className = 'hd'; d.head.forEach((x, i) => put(h, x, i, true));
  d.rows.forEach((r, k) => { const tr = t.insertRow(); if (d.total && k === d.rows.length - 1) tr.className = 'tot'; r.forEach((x, i) => put(tr, x, i, false)); });
  return t;
}

// classified data: bars without gaps, class limits under the bars
function histChart(cls) {
  const NS = 'http://www.w3.org/2000/svg', mk = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const lo = cls[0][0], hi = cls[cls.length - 1][1], top = Math.max(...cls.map(r => r[2]));
  const PW = Math.max(200, Math.min(520, cls.length * 60)), W = PW + 50, H = 150, base = H - 24, k = (base - 16) / top, sx = x => 34 + (x - lo) / (hi - lo) * PW;
  const svg = mk('svg', {class: 'chart', viewBox: `0 0 ${W} ${H}`, width: W, height: H});
  mk('line', {x1: 26, y1: base + .5, x2: W, y2: base + .5, class: 'ax'}, svg);
  for (let c = 1; c <= top; c += Math.max(1, Math.ceil(top / 5))) {
    const y = base - c * k; mk('line', {x1: 26, y1: y + .5, x2: W, y2: y + .5, class: 'gl'}, svg);
    mk('text', {x: 20, y: y + 4, 'text-anchor': 'end'}, svg).textContent = c;
  }
  const lab = x => String(parseFloat(x.toPrecision(6))).replace('.', ',').replace('-', '−');
  const seen = new Set();
  for (const [a, b, c] of cls) {
    mk('rect', {x: sx(a), y: base - c * k, width: Math.max(1, sx(b) - sx(a) - 1), height: c * k, rx: 2}, svg);
    for (const x of [a, b]) if (!seen.has(x)) { seen.add(x); mk('text', {x: sx(x), y: base + 15, 'text-anchor': 'middle'}, svg).textContent = lab(x); }
  }
  return svg;
}

function statTable(rows) {
  const t = document.createElement('table'); t.className = 'statres';
  for (const [name, sym, v] of rows) {
    const tr = t.insertRow(); tr.insertCell().textContent = name;
    const c = tr.insertCell(); c.className = 'sym'; c.textContent = sym;
    const d = tr.insertCell(); d.className = 'val'; d.textContent = v;
  }
  return t;
}

function statChart(data) {
  if (data.length && data[0].length === 3) return histChart(data);
  const NS = 'http://www.w3.org/2000/svg', mk = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const n = data.length, bw = Math.max(14, Math.min(44, 520 / n)), gap = bw * .3, top = Math.max(...data.map(d => d[1]));
  const W = n * (bw + gap) + gap + 30, H = 150, base = H - 24, k = (base - 16) / top;
  const svg = mk('svg', {class: 'chart', viewBox: `0 0 ${W} ${H}`, width: W, height: H});
  mk('line', {x1: 26, y1: base + .5, x2: W, y2: base + .5, class: 'ax'}, svg);
  for (let c = 1; c <= top; c += Math.max(1, Math.ceil(top / 5))) {
    const y = base - c * k; mk('line', {x1: 26, y1: y + .5, x2: W, y2: y + .5, class: 'gl'}, svg);
    mk('text', {x: 20, y: y + 4, 'text-anchor': 'end'}, svg).textContent = c;
  }
  data.forEach(([x, c], i) => {
    const X = 30 + gap + i * (bw + gap);
    mk('rect', {x: X, y: base - c * k, width: bw, height: c * k, rx: 3}, svg);
    mk('text', {x: X + bw / 2, y: base + 15, 'text-anchor': 'middle'}, svg).textContent = String(parseFloat(x.toPrecision(6))).replace('.', ',').replace('-', '−');
  });
  return svg;
}

function showResult(el, b) {
  const res = el.querySelector('math-field.result'), err = el.querySelector('.err');
  res.style.display = b.res && !b.stat && !b.steps ? '' : 'none';
  if (b.res) res.value = b.res;
  err.textContent = b.err || '';
  err.style.display = b.err ? '' : 'none';
  // statistics: bar chart of how many times each value appears
  el.querySelector(':scope > .statbox')?.remove();
  el.querySelector(':scope > .stepbox')?.remove();
  if (b.res && b.steps) el.appendChild(stepTable(b.steps));
  if (b.res && b.chart && b.chart.length) { const box = document.createElement('div'); box.className = 'statbox'; if (b.stat) box.appendChild(statTable(b.stat)); box.appendChild(statChart(b.chart)); el.appendChild(box); }
  // several letters: choose which one to solve / differentiate for
  const vs = el.querySelector('.vars');
  vs.innerHTML = '';
  // system with too many letters: pick the ones to solve with buttons, then ", v, f" is added to the row
  if (b.err && b.pick) {
    const chosen = [];
    for (const v of b.pick.vars) {
      const btn = document.createElement('button');
      btn.textContent = (TEXSYM[v.replace(/\d+$/, '')] || v.replace(/\d+$/, '')) + v.replace(/^\D+/, '').replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]);
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.onclick = () => {
        const i = chosen.indexOf(v);
        if (i >= 0) chosen.splice(i, 1); else chosen.push(v);
        btn.classList.toggle('on', i < 0);
        if (chosen.length < b.pick.n) return;
        const tex = chosen.map(x => { const m = x.match(/^(\D+)(\d*)$/) || [x, x, '']; return (m[1].length > 1 ? '\\' + m[1] : m[1]) + (m[2] ? '_{' + m[2] + '}' : ''); });
        b.latex = b.latex.replace(/\s+$/, '') + ',' + tex.join(',');
        el.querySelector('math-field.main').value = b.latex;
        const act = b.pick.act || 'solve'; b.pick = null; calc(act, b);
      };
      vs.appendChild(btn);
    }
  }
  // systems choose letters with ", x, y" (also hides buttons saved in older notebooks)
  if (b.res && b.vars && !/cases|\\\\|;/.test(b.latex || '')) {
    const lab = document.createElement('span'); lab.textContent = b.act === 'solve' || b.act === 'calc' ? 'Ratkaise:' : 'Muuttuja:';
    vs.appendChild(lab);
    for (const v of b.vars) {
      const btn = document.createElement('button');
      btn.textContent = (TEXSYM[v.replace(/\d+$/, '')] || v.replace(/\d+$/, '')) + v.replace(/^\D+/, '').replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]); if (b.vsub && b.vsub[v]) btn.innerHTML = (TEXSYM[b.vsub[v][0]] || b.vsub[v][0]) + '<sub>' + b.vsub[v][1] + '</sub>'; btn.className = v === b.v ? 'on' : '';
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.onclick = () => { b.v = v; calc(b.act || 'solve', b); };
      vs.appendChild(btn);
    }
  }
}

function buildGraph(el, b) {
  const box = document.createElement('div');
  box.className = 'graphbox';
  const fns = document.createElement('div'); fns.className = 'fns';
  const canvas = document.createElement('canvas'); canvas.className = 'plot';
  const range = document.createElement('div'); range.className = 'range';
  const sliders = document.createElement('div'); sliders.className = 'sliders';
  box.append(fns, sliders, canvas, range);
  el.appendChild(box);
  const plot = new Plot(canvas, b, (final) => { syncRange(); if (final) touch(); });
  el._plot = plot;

  const update = () => {
    plot.fns = b.fns.map((l, k) => {
      const row = fns.children[k];
      try { const f = l.trim() ? Calc.fnFor(l) : null; row && row.classList.remove('bad'); row && (row.title = ''); return f; }
      catch (e) { if (row) { row.classList.add('bad'); row.title = e.message; } return null; }
    });
    syncSliders();
    plot.draw();
  };
  // a slider for every extra letter (y = a·x² → a)
  function syncSliders() {
    const names = [...new Set(plot.fns.flatMap(f => (f && f.params) || []))].sort();
    b.params = b.params || {};
    const have = [...sliders.children].map(r => r.dataset.p);
    if (have.join() === names.join()) return;
    sliders.textContent = '';
    for (const p of names) {
      if (b.params[p] === undefined) b.params[p] = 1;
      const row = document.createElement('label'); row.className = 'slider'; row.dataset.p = p;
      const name = document.createElement('i'); name.textContent = p;
      const rng = document.createElement('input'); rng.type = 'range'; rng.step = 'any';
      const num = document.createElement('input'); num.type = 'text';
      const show = () => { const v = b.params[p]; rng.min = Math.min(-10, v); rng.max = Math.max(10, v); rng.value = v; num.value = fmtNum(v); };
      rng.oninput = () => { b.params[p] = Math.round(+rng.value * 10) / 10; num.value = fmtNum(b.params[p]); plot.draw(); };
      rng.onchange = () => touch();
      num.onchange = () => { const v = parseFloat(num.value.replace(',', '.').replace('−', '-')); if (isFinite(v)) { b.params[p] = v; plot.draw(); touch(); } show(); };
      show();
      row.append(name, document.createTextNode(' = '), num, rng);
      sliders.appendChild(row);
    }
  }
  const addRow = (latex, k) => {
    const row = document.createElement('div'); row.className = 'fn';
    const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = COLORS[k % COLORS.length];
    const mf = newMathField(latex);
    mf.placeholder = '\\text{esim. } x^2-1';
    mf.addEventListener('input', () => { b.fns[[...fns.children].indexOf(row)] = mf.value; update(); touch(); });
    mf.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && mf.mode !== 'latex') { e.preventDefault(); e.stopPropagation(); b.fns.push(''); addRow('', b.fns.length - 1).focus(); touch(); }
    }, true);
    mf.addEventListener('move-out', e => {
      const i = [...fns.children].indexOf(row);
      const d = e.detail.direction;
      if (d === 'upward') { if (i > 0) fns.children[i - 1].querySelector('math-field').focus(); else focusNeighbour(b.id, -1); e.preventDefault(); }
      if (d === 'downward') { if (i < fns.children.length - 1) fns.children[i + 1].querySelector('math-field').focus(); else focusNeighbour(b.id, 1); e.preventDefault(); }
    });
    const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Poista funktio';
    del.onclick = () => {
      const i = [...fns.children].indexOf(row);
      b.fns.splice(i, 1); row.remove();
      if (!b.fns.length) { removeBlock(b.id); return; }
      [...fns.children].forEach((r, j) => r.querySelector('.dot').style.background = COLORS[j % COLORS.length]);
      update(); touch();
    };
    row.append(dot, mf, del);
    fns.appendChild(row);
    return mf;
  };
  b.fns.forEach(addRow);

  const inputs = {};
  const lab = (t, key) => {
    const l = document.createElement('label'); l.textContent = t + ' ';
    const i = document.createElement('input'); i.type = 'text';
    i.addEventListener('change', () => {
      const v = parseFloat(i.value.replace(',', '.').replace('−', '-'));
      if (isFinite(v)) { b[key] = v; if (b.xmin < b.xmax && b.ymin < b.ymax) { plot.draw(); touch(); } }
      syncRange();
    });
    inputs[key] = i; l.appendChild(i); range.appendChild(l);
  };
  const add = document.createElement('button'); add.textContent = '+ funktio'; add.className = 'addfn';
  add.onclick = () => { b.fns.push(''); addRow('', b.fns.length - 1).focus(); touch(); };
  range.appendChild(add);
  lab('x', 'xmin'); lab('…', 'xmax'); lab('y', 'ymin'); lab('…', 'ymax');
  const marks = document.createElement('button'); marks.textContent = 'Pisteet';
  marks.title = 'Näytä nollakohdat, huiput ja leikkauspisteet (vie hiiri pisteen päälle)';
  const syncMarks = () => marks.classList.toggle('on', b.marks !== false);
  marks.onclick = () => { b.marks = b.marks === false; syncMarks(); plot.draw(); touch(); };
  syncMarks();
  range.appendChild(marks);
  const reset = document.createElement('button'); reset.textContent = 'Palauta näkymä';
  reset.onclick = () => { Object.assign(b, {xmin: -10, xmax: 10, ymin: -7, ymax: 7}); syncRange(); plot.draw(); touch(); };
  const delG = document.createElement('button'); delG.textContent = 'Poista kuvaaja';
  delG.onclick = () => removeBlock(b.id);
  range.append(reset, delG);
  const fmt = v => String(parseFloat(v.toPrecision(4))).replace('.', ',');
  function syncRange() { for (const k in inputs) if (document.activeElement !== inputs[k]) inputs[k].value = fmt(b[k]); }
  syncRange();
  requestAnimationFrame(update);
}

// ---------- focus & editing ----------
function setActive(id) {
  if (activeId === id) return;
  const old = activeId && elOf(activeId); if (old) old.classList.remove('active');
  activeId = id;
  const el = elOf(id); if (el) el.classList.add('active');
}

// no row is being written in (click outside the paper)
function deactivate() {
  const ae = document.activeElement; if (ae && ae !== document.body) ae.blur();
  getSelection().removeAllRanges();
  const old = activeId && elOf(activeId); if (old) old.classList.remove('active');
  activeId = null;
}

function focusBlock(id, atStart) {
  const el = elOf(id); if (!el) return;
  const b = byId(id);
  if (b.type === 'text') {
    const t = el.querySelector('.text'); t.focus();
    const r = document.createRange(); r.selectNodeContents(t); r.collapse(!!atStart);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  } else if (b.type === 'image') {
    el.querySelector('.imgbox').focus();
  } else if (b.type === 'draw') {
    el.querySelector('.drawbox').focus({preventScroll: true});
  } else if (b.type === 'table') {
    const ins = el.querySelectorAll('.stattable input'); (atStart ? ins[0] : ins[ins.length - 2])?.focus();
  } else {
    const mfs = el.querySelectorAll('math-field:not(.result)');
    const mf = atStart ? mfs[0] : mfs[mfs.length - 1];
    // a new formula field may mount a moment later: focus now and again shortly after
    const go = () => { if (!mf.hasFocus()) mf.focus(); try { mf.executeCommand(atStart ? 'moveToMathfieldStart' : 'moveToMathfieldEnd'); } catch {} };
    go(); requestAnimationFrame(() => { if (activeId === id && !selIds.length) go(); });
  }
  setActive(id);
  el.scrollIntoView({block: 'nearest'});
}
function focusNeighbour(id, dir) {
  const i = idx(id) + dir;
  if (i < 0 || i >= doc.blocks.length) return false;
  focusBlock(doc.blocks[i].id, dir > 0);
  return true;
}

function insertAfter(id, b, focus = true) {
  if (focus && document.activeElement) document.activeElement.blur();
  const i = id ? idx(id) : doc.blocks.length - 1;
  doc.blocks.splice(i + 1, 0, b);
  const el = blockEl(b);
  const ref = id && elOf(id);
  if (ref) ref.after(el); else docEl.appendChild(el);
  if (focus) focusBlock(b.id, true);
  touch();
  return b;
}
function insertBefore(id, b) {
  if (document.activeElement) document.activeElement.blur();
  doc.blocks.splice(idx(id), 0, b);
  const el = blockEl(b);
  elOf(id).before(el);
  focusBlock(b.id, true);
  touch();
  return b;
}
function removeBlock(id) {
  const i = idx(id); if (i < 0) return;
  doc.blocks.splice(i, 1); elOf(id).remove();
  if (!doc.blocks.length) { insertAfter(null, mk('math')); return; }
  focusBlock(doc.blocks[Math.max(0, i - 1)].id, false);
  touch();
}
function replaceBlock(id, b) {
  const i = idx(id); doc.blocks[i] = b;
  elOf(id).replaceWith(blockEl(b));
  activeId = null; focusBlock(b.id, false); touch();
}
const isEmpty = b => b.type === 'text' ? !b.html.replace(/<br>|&nbsp;|\s/g, '') : b.type === 'math' ? !b.latex.trim() : false;

function add(type) {
  const cur = activeId && byId(activeId);
  if (cur && isEmpty(cur) && cur.type !== type && type !== 'graph') return replaceBlock(cur.id, mk(type));
  let extra = {};
  if (type === 'graph' && cur && cur.type === 'math' && cur.latex.trim()) extra.fns = [cur.latex];
  insertAfter(cur ? cur.id : null, mk(type, extra));
}

function caretInfo(t) {
  const s = getSelection(); if (!s.rangeCount) return {};
  const r = s.getRangeAt(0);
  const pre = document.createRange(); pre.selectNodeContents(t); pre.setEnd(r.startContainer, r.startOffset);
  const post = document.createRange(); post.selectNodeContents(t); post.setStart(r.endContainer, r.endOffset);
  const atStart = !pre.toString().replace(/\u200B/g, '').length && !pre.cloneContents().querySelector('.im'),
    atEnd = !post.toString().replace(/\u200B/g, '').length && !post.cloneContents().querySelector('img,.im');
  let rect = r.getClientRects()[0] || r.getBoundingClientRect();
  const tr = t.getBoundingClientRect();
  const firstLine = !rect || rect.height === 0 ? atStart : rect.top - tr.top < 22;
  const lastLine = !rect || rect.height === 0 ? atEnd : tr.bottom - rect.bottom < 22;
  return {r, atStart, atEnd, firstLine, lastLine, collapsed: r.collapsed};
}

function textKey(e, t, b) {
  if (e.key === '$' || (e.key === 'Tab' && !e.shiftKey && !e.metaKey && !e.altKey && !e.ctrlKey)) { e.preventDefault(); insertInline(t, b); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const c = caretInfo(t);
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && c.collapsed && !e.shiftKey) {
    const s = imNext(c.r, e.key === 'ArrowRight' ? 1 : -1);
    if (s) { e.preventDefault(); s._mf.focus(); s._mf.executeCommand(e.key === 'ArrowRight' ? 'moveToMathfieldStart' : 'moveToMathfieldEnd'); return; }
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (c.collapsed && c.atStart && !isEmpty(b)) { insertBefore(b.id, mk('text')); return; }
    const tail = document.createRange(); tail.selectNodeContents(t); tail.setStart(c.r.endContainer, c.r.endOffset);
    c.r.deleteContents();
    t.querySelectorAll('span.im').forEach(s => { s.dataset.tex = s._mf ? s._mf.value : s.dataset.tex; });
    const frag = tail.extractContents(); const d = document.createElement('div'); d.appendChild(frag);
    d.querySelectorAll('span.im').forEach(s => { s.textContent = ''; });
    // tyhjät muotoilut (esim. korostus rivin lopusta) eivät saa siirtyä uudelle riville
    [...d.querySelectorAll('*:not(.im):not(br):not(img)')].reverse().forEach(el => { if (!el.textContent.replace(/​/g, '') && !el.querySelector('.im,img')) el.replaceWith(...el.childNodes); });
    b.html = textHtml(t);
    insertAfter(b.id, mk('text', {html: d.innerHTML.replace(/\u200B/g, '').replace(/^<br>$/, '')}));
    return;
  }
  if (e.key === 'Backspace' && c.collapsed && c.atStart && isEmpty(b) && doc.blocks.length > 1) { e.preventDefault(); removeBlock(b.id); return; }
  if (e.shiftKey && ((e.key === 'ArrowDown' && c.lastLine) || (e.key === 'ArrowUp' && c.firstLine))) {
    const n = doc.blocks[idx(b.id) + (e.key === 'ArrowDown' ? 1 : -1)];
    if (n) { e.preventDefault(); selectRange(b.id, n.id); return; }
  }
  if ((e.key === 'ArrowUp' && c.firstLine) || (e.key === 'ArrowLeft' && c.atStart && c.collapsed)) { if (focusNeighbour(b.id, -1)) e.preventDefault(); }
  if ((e.key === 'ArrowDown' && c.lastLine) || (e.key === 'ArrowRight' && c.atEnd && c.collapsed)) { if (focusNeighbour(b.id, 1)) e.preventDefault(); }
}

// " starts a unit: the letters after it are written upright (5"kg). Any other key ends it.
function setUnitMode(mf, on) { mf._unit = on; mf._ubuf = ''; mf.classList.toggle('unitmode', on); mf.parentElement && mf.parentElement.classList.toggle('unitmode-on', on); }
const unitLatex = name => '\\operatorname{\\mathbf{' + name.replace(/Ω/g, '\\Omega ').replace(/µ/g, '\\mu ') + '}}';
function unitKey(e, mf) {
  if (e.metaKey || e.ctrlKey || mf.mode === 'latex') return;
  if (e.key === '"') { e.preventDefault(); e.stopImmediatePropagation(); setUnitMode(mf, !mf._unit); return; }
  if (mf._unit) {
    if (e.key.length === 1 && /[a-zA-ZµΩ°Åå]/.test(e.key)) {
      e.preventDefault(); e.stopImmediatePropagation();
      // the unit so far is one upright block: replace it with the longer name
      if (mf._ubuf) mf.executeCommand('deleteBackward');
      mf._ubuf += e.key;
      mf.insert(unitLatex(mf._ubuf));
      return;
    }
    if (!['Shift', 'Alt', 'CapsLock', 'Dead'].includes(e.key)) setUnitMode(mf, false);
  }
  // -> becomes an arrow (unit conversion)
  if (e.key === '>') {
    const p = mf.position;
    if (p > 0 && mf.getValue(p - 1, p) === '-') { e.preventDefault(); e.stopImmediatePropagation(); mf.executeCommand('deleteBackward'); mf.insert('\\to'); }
  }
}

function casesRows(latex) {
  const m = latex.match(/\\begin\{cases\}([\s\S]*)\\end\{cases\}/);
  return m ? m[1].split(/\\\\/).map(r => r.replace(/\\placeholder\{\}|&/g, '').trim()) : [];
}
function mathKey(e, mf, b) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  // while typing a command like \delta, Enter turns it into the symbol (MathLive does it)
  if (mf.mode === 'latex') return;
  if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && !mf.value.includes('\\begin{')) {
    const n = doc.blocks[idx(b.id) + (e.key === 'ArrowDown' ? 1 : -1)];
    if (n) { e.preventDefault(); e.stopPropagation(); selectRange(b.id, n.id); return; }
  }
  // Tab: write text after the formula on the same row
  if (e.key === 'Tab' && !e.shiftKey && !(mf.value.includes('\\begin{') && mf.value.includes('\\placeholder'))) {
    e.preventDefault(); e.stopPropagation();
    const n = elOf(b.id).querySelector('.rnote'); n.classList.add('open'); n.focus();
    const r = document.createRange(); r.selectNodeContents(n); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault(); e.stopPropagation();
    // cursor at the very start of a filled row: new empty row above it, like a text editor
    if (mf.position === 0 && mf.selectionIsCollapsed && mf.value.trim()) { insertBefore(b.id, mk(e.shiftKey ? 'text' : 'math')); return; }
    // inside a { brace: Enter adds a new equation row
    if (!e.shiftKey && mf.value.includes('\\begin{cases}') && mf.position > 0 && mf.position < mf.lastOffset) {
      const v0 = mf.value, p0 = mf.position;
      // Enter on an empty row: drop that row and leave the brace (like ending a list)
      const r0 = casesRows(v0);
      if (r0.length >= 2) {
        mf.executeCommand('removeRow');
        const left = [...r0];
        for (const r of casesRows(mf.value)) { const k = left.indexOf(r); if (k >= 0) left.splice(k, 1); }
        if (casesRows(mf.value).length === r0.length - 1 && left.length === 1 && left[0] === '') {
          b.latex = mf.value; touch();
          const n = doc.blocks[idx(b.id) + 1];
          if (n && n.type === 'math' && !n.latex.trim()) focusBlock(n.id, false); else insertAfter(b.id, mk('math'));
          return;
        }
        mf.value = v0; mf.position = p0;
      }
      // an empty row waiting below: go there first
      if (v0.includes('\\placeholder')) { mf.executeCommand('moveToNextPlaceholder'); if (mf.position !== p0) return; }
      mf.executeCommand('addRowAfter');
      const v1 = mf.value, rows = x => (x.match(/\\\\/g) || []).length;
      // MathLive may also wrap the whole field in rows: keep only the brace
      const unwrap = x => { const m = x.match(/^\\displaylines\{(\\begin\{cases\}[\s\S]*\\end\{cases\})(?:\\\\\s*)*\}$/); return m ? m[1] : x; };
      const u = unwrap(v1);
      if (rows(u) > rows(unwrap(v0))) {
        if (u !== v1) { mf.value = u; mf.position = 0; mf.executeCommand('moveToNextPlaceholder'); }
        b.latex = mf.value; touch(); return;
      }
      mf.value = v0; mf.position = p0;
    }
    // "2+3=" and Enter: work it out straight away
    if (!e.shiftKey && /[^=<>]=$/.test(mf.value.trim()) && !mf.value.includes('\\begin{')) {
      mf.executeCommand('moveToMathfieldEnd'); mf.executeCommand('deleteBackward'); b.latex = mf.value;
      return calc('calc', b);
    }
    insertAfter(b.id, mk(e.shiftKey ? 'text' : 'math'));
  } else if (e.key === 'Backspace' && mf.value.includes('\\begin{cases}')) {
    // Backspace on an empty row inside a { brace removes the whole row
    const v0 = mf.value, p0 = mf.position, r0 = casesRows(v0);
    if (r0.length < 2) return;
    mf.executeCommand('removeRow');
    const r1 = casesRows(mf.value);
    for (const r of r1) { const k = r0.indexOf(r); if (k >= 0) r0.splice(k, 1); }
    if (r1.length === casesRows(v0).length - 1 && r0.length === 1 && r0[0] === '') {
      e.preventDefault(); e.stopPropagation(); b.latex = mf.value; touch(); return;
    }
    mf.value = v0; mf.position = p0;
  } else if (e.key === 'Backspace' && !mf.value.trim() && doc.blocks.length > 1) {
    e.preventDefault(); e.stopPropagation();
    removeBlock(b.id);
  }
}

// ---------- calculating ----------
// a := row below the row that uses the letter: memory only reaches rows under it, so say so
function usedAbove(b) {
  const m = /^\s*((?:\\[a-zA-Z]+|[a-zA-Z])(?:_\{?[a-zA-Z0-9]+\}?)?)\s*/.exec(b.latex);
  if (!m || !/:=|\\coloneq/.test(b.latex)) return false;
  const norm = s => s.replace(/\\(?:operatorname|text|mathrm|mathbf)\{(?:[^{}]|\{[^{}]*\})*\}/g, ' ').replace(/_\{([a-zA-Z0-9]+)\}/g, '_$1');
  const name = norm(m[1]), greek = name[0] === '\\';
  const esc = name.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
  const re = new RegExp((greek ? '' : '(?<![a-zA-Z\\\\_])') + esc + (/_/.test(name) ? '(?![a-zA-Z0-9])' : '(?![a-zA-Z_])'));
  for (const x of doc.blocks) {
    if (x === b) break;
    if (x.type !== 'math' || !x.latex) continue;
    let s = norm(x.latex);
    if (!greek) s = s.replace(/\\[a-zA-Z]+/g, ' ');
    if (re.test(s)) return true;
  }
  return false;
}

function calc(action, forced) {
  let b = forced || (activeId && byId(activeId));
  if (!b || b.type !== 'math') {
    if (b && b.type === 'graph') return;
    b = [...doc.blocks].reverse().find(x => x.type === 'math' && x.latex.trim());
    if (!b) return flash('Kirjoita ensin kaava kaavariville.');
  }
  const bm = elOf(b.id).querySelector('math-field.main');
  if (bm.mode === 'latex') { try { bm.executeCommand('complete'); b.latex = bm.value; } catch {} }
  if (!b.latex.trim()) return flash('Kirjoita ensin kaava.');
  Calc.resetDefs();
  for (const x of doc.blocks) {
    if (x === b) break;
    if (x.type === 'math') { try { Calc.define(x.latex); } catch {} }
  }
  try { const r = Calc.run(action, b.latex, {v: b.v}); b.res = r.tex; b.chart = r.chart || null; b.stat = r.rows || null; b.steps = r.steps || null; b.err = null; b.act = action; b.vars = r.vars && r.vars.length > 1 ? r.vars : null; b.vsub = r.vsub || null; if (r.v) b.v = r.v;
    if (/^\\text\{(?:muistissa|määritelty) \}/.test(b.res) && usedAbove(b)) b.res += '\\quad\\text{(vain alemmille riveille – siirrä tämä rivi ylös)}'; }
  catch (e) { b.pick = e && e.pick ? {...e.pick, act: action} : null; b.res = null; b.vars = null; b.chart = null; b.stat = null; b.steps = null; b.err = e instanceof Calc.Err ? e.message : /division by zero/i.test(String(e && e.message)) ? 'Nollalla ei voi jakaa.' : /is undefined for/i.test(String(e && e.message)) ? 'Ei määritelty tällä arvolla (esim. tan 90°).' : 'En osaa laskea tätä. Tarkista kaava.'; console.warn(e); }
  showResult(elOf(b.id), b);
  touch();
  const i = idx(b.id);
  if (!b.err && i === doc.blocks.length - 1) insertAfter(b.id, mk('math'));
  else focusBlock(b.id, false);
}

// ---------- palette ----------
const PALETTE = [
  ['Perus', [['<span class="frac"><span>a</span><span>b</span></span>', '\\frac{#@}{#?}'], ['√', '\\sqrt{#0}'], ['ⁿ√', '\\sqrt[#?]{#0}'], ['xⁿ', '#@^{#?}'],
    ['xₙ', '#@_{#?}'], ['|x|', '\\left|#0\\right|'], ['( )', '\\left(#0\\right)'], ['[ ]', '\\left[#0\\right]'],
    ['·', '\\cdot'], ['×', '\\times'], ['÷', '\\div'], ['±', '\\pm'],
    ['°', '\\degree'], ['%', '\\%'], ['!', '!'], ['∞', '\\infty'], ['<span style="font-size:1.3em">{</span>', '\\begin{cases}#0\\\\#?\\end{cases}'],
    ['≤', '\\le'], ['≥', '\\ge'], ['≠', '\\ne'], ['≈', '\\approx'],
    ['≡', '\\equiv'], ['∝', '\\propto'], ['<', '<'], ['>', '>']]],
  ['Funktiot', [['sin', '\\sin\\left(#0\\right)'], ['cos', '\\cos\\left(#0\\right)'], ['tan', '\\tan\\left(#0\\right)'], ['ln', '\\ln\\left(#0\\right)'],
    ['sin⁻¹', '\\arcsin\\left(#0\\right)'], ['cos⁻¹', '\\arccos\\left(#0\\right)'], ['tan⁻¹', '\\arctan\\left(#0\\right)'], ['lg', '\\lg\\left(#0\\right)'],
    ['logₐ', '\\log_{#?}\\left(#0\\right)'], ['eˣ', '\\mathrm{e}^{#?}'], ['π', '\\pi'], ['e', '\\mathrm{e}'],
    ['f(x)', 'f\\left(x\\right)='], ["f′(x)", "f'\\left(x\\right)"], ['(ⁿₖ)', '\\binom{#?}{#?}'], ['n!', '#@!']]],
  ['Analyysi', [['lim', '\\lim_{x\\to#?}#0'], ['<span class="frac"><span>d</span><span>dx</span></span>', '\\frac{d}{dx}#0'], ['∫', '\\int #0\\,dx'], ['∫ₐᵇ', '\\int_{#?}^{#?}#0\\,dx'],
    ['Σ', '\\sum_{#?}^{#?}#0'], ['Π', '\\prod_{#?}^{#?}#0'], ['/ₐᵇ', '\\Big/_{\\!#?}^{#?}'], ['→', '\\to']]],
  ['Vektorit ja geometria', [['ā', '\\overline{#0}'], ['<span class="vec">a</span>', '\\vec{#0}'], ['|ā|', '\\left|\\overline{#0}\\right|'], ['ī', '\\overline{i}'],
    ['j̄', '\\overline{j}'], ['k̄', '\\overline{k}'], ['∠', '\\angle'], ['⊥', '\\perp'],
    ['∥', '\\parallel'], ['△', '\\triangle'], ['∼', '\\sim'], ['≅', '\\cong']]],
  ['Todennäköisyys ja tilastot', [['P( )', 'P\\left(#0\\right)'], ['Ā', '\\overline{#0}'], ['x̄', '\\bar{x}'], ['σ', '\\sigma'],
    ['μ', '\\mu'], ['∪', '\\cup'], ['∩', '\\cap'], ['|', '\\mid']]],
  ['Logiikka ja joukot', [['⇒', '\\Rightarrow'], ['⇐', '\\Leftarrow'], ['⇔', '\\Leftrightarrow'], ['¬', '\\neg'],
    ['∨', '\\lor'], ['∧', '\\land'], ['∀', '\\forall'], ['∃', '\\exists'],
    ['∈', '\\in'], ['∉', '\\notin'], ['⊂', '\\subset'], ['⊆', '\\subseteq'],
    ['∪', '\\cup'], ['∩', '\\cap'], ['∖', '\\setminus'], ['∅', '\\emptyset'],
    ['ℕ', '\\N'], ['ℤ', '\\Z'], ['ℚ', '\\Q'], ['ℝ', '\\R'], ['ℂ', '\\C']]],
  ['Yksiköt', [['m', '\\operatorname{\\mathbf{m}}'],
    ['cm', '\\operatorname{\\mathbf{cm}}'],
    ['mm', '\\operatorname{\\mathbf{mm}}'],
    ['km', '\\operatorname{\\mathbf{km}}'],
    ['g', '\\operatorname{\\mathbf{g}}'],
    ['kg', '\\operatorname{\\mathbf{kg}}'],
    ['t', '\\operatorname{\\mathbf{t}}'],
    ['s', '\\operatorname{\\mathbf{s}}'],
    ['min', '\\operatorname{\\mathbf{min}}'],
    ['h', '\\operatorname{\\mathbf{h}}'],
    ['N', '\\operatorname{\\mathbf{N}}'],
    ['kN', '\\operatorname{\\mathbf{kN}}'],
    ['J', '\\operatorname{\\mathbf{J}}'],
    ['kJ', '\\operatorname{\\mathbf{kJ}}'],
    ['W', '\\operatorname{\\mathbf{W}}'],
    ['kW', '\\operatorname{\\mathbf{kW}}'],
    ['kWh', '\\operatorname{\\mathbf{kWh}}'],
    ['eV', '\\operatorname{\\mathbf{eV}}'],
    ['Pa', '\\operatorname{\\mathbf{Pa}}'],
    ['kPa', '\\operatorname{\\mathbf{kPa}}'],
    ['bar', '\\operatorname{\\mathbf{bar}}'],
    ['Hz', '\\operatorname{\\mathbf{Hz}}'],
    ['V', '\\operatorname{\\mathbf{V}}'],
    ['A', '\\operatorname{\\mathbf{A}}'],
    ['Ω', '\\operatorname{\\mathbf{\\Omega}}'],
    ['C', '\\operatorname{\\mathbf{C}}'],
    ['K', '\\operatorname{\\mathbf{K}}'],
    ['°C', '\\operatorname{\\mathbf{°C}}'],
    ['mol', '\\operatorname{\\mathbf{mol}}'],
    ['l', '\\operatorname{\\mathbf{l}}'],
    ['ml', '\\operatorname{\\mathbf{ml}}'],
    ['T', '\\operatorname{\\mathbf{T}}'],
    ['m/s', '\\operatorname{\\mathbf{m}}/\\operatorname{\\mathbf{s}}'], ['m/s²', '\\operatorname{\\mathbf{m}}/\\operatorname{\\mathbf{s}}^2'], ['km/h', '\\operatorname{\\mathbf{km}}/\\operatorname{\\mathbf{h}}'], ['m²', '\\operatorname{\\mathbf{m}}^2'],
    ['m³', '\\operatorname{\\mathbf{m}}^3'], ['kg/m³', '\\operatorname{\\mathbf{kg}}/\\operatorname{\\mathbf{m}}^3'], ['→', '\\to']]],
  ['Kreikka', [['α', '\\alpha'], ['β', '\\beta'], ['γ', '\\gamma'], ['δ', '\\delta'], ['ε', '\\varepsilon'], ['ζ', '\\zeta'], ['η', '\\eta'], ['θ', '\\theta'],
    ['ι', '\\iota'], ['κ', '\\kappa'], ['λ', '\\lambda'], ['μ', '\\mu'], ['ν', '\\nu'], ['ξ', '\\xi'], ['π', '\\pi'], ['ρ', '\\rho'],
    ['σ', '\\sigma'], ['τ', '\\tau'], ['υ', '\\upsilon'], ['φ', '\\varphi'], ['χ', '\\chi'], ['ψ', '\\psi'], ['ω', '\\omega'], ['ϑ', '\\vartheta'],
    ['Γ', '\\Gamma'], ['Δ', '\\Delta'], ['Θ', '\\Theta'], ['Λ', '\\Lambda'], ['Ξ', '\\Xi'], ['Π', '\\Pi'], ['Σ', '\\Sigma'], ['Φ', '\\Phi'],
    ['Ψ', '\\Psi'], ['Ω', '\\Omega']]],
];
// formula collection: [group, [name, latex]…]; a click writes the formula on the row you are in
const FORMULAS = [
  ['Algebra', [['2. asteen yhtälö', 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}'], ['Logaritmin kanta', '\\log_{a}x=\\frac{\\ln x}{\\ln a}'], ['Korkoa korolle', 'K=K_0\\left(1+\\frac{p}{100}\\right)^n'],
    ['Aritm. jono', 'a_n=a_1+\\left(n-1\\right)d'], ['Aritm. summa', 'S_n=n\\cdot\\frac{a_1+a_n}{2}'], ['Geom. jono', 'a_n=a_1q^{n-1}'], ['Geom. summa', 'S_n=a_1\\cdot\\frac{1-q^n}{1-q}']]],
  ['Geometria', [['Pythagoras', 'a^2+b^2=c^2'], ['Kolmion ala', 'A=\\frac{1}{2}ab\\sin\\gamma'], ['Sinilause', '\\frac{a}{\\sin\\alpha}=\\frac{b}{\\sin\\beta}'], ['Kosinilause', 'c^2=a^2+b^2-2ab\\cos\\gamma'],
    ['Ympyrän ala', 'A=\\pi r^2'], ['Ympyrän kehä', 'p=2\\pi r'], ['Sektorin ala', 'A=\\frac{\\alpha}{360\\degree}\\cdot\\pi r^2'], ['Pallon tilavuus', 'V=\\frac{4}{3}\\pi r^3'], ['Pallon pinta-ala', 'A=4\\pi r^2'],
    ['Lieriön tilavuus', 'V=\\pi r^2h'], ['Kartion tilavuus', 'V=\\frac{1}{3}\\pi r^2h']]],
  ['Koordinaatisto', [['Kulmakerroin', 'k=\\frac{y_2-y_1}{x_2-x_1}'], ['Suoran yhtälö', 'y-y_0=k\\left(x-x_0\\right)'], ['Pisteiden etäisyys', 'd=\\sqrt{\\left(x_2-x_1\\right)^2+\\left(y_2-y_1\\right)^2}'],
    ['Ympyrän yhtälö', '\\left(x-x_0\\right)^2+\\left(y-y_0\\right)^2=r^2'], ['Vektorin pituus', '\\left|\\overline{a}\\right|=\\sqrt{x^2+y^2+z^2}'], ['Vektorien kulma', '\\cos\\theta=\\frac{\\overline{a}\\cdot\\overline{b}}{\\left|\\overline{a}\\right|\\left|\\overline{b}\\right|}']]],
  ['Todennäköisyys', [['Klassinen', 'P\\left(A\\right)=\\frac{k}{n}'], ['Binomitodennäköisyys', 'P=\\binom{n}{k}p^k\\left(1-p\\right)^{n-k}'], ['Komplementti', 'P\\left(\\overline{A}\\right)=1-P\\left(A\\right)']]],
  ['Fysiikka', [['Nopeus', 'v=\\frac{s}{t}'], ['Kiihtyvyys', 'a=\\frac{\\Delta v}{\\Delta t}'], ['Newton II', 'F=ma'], ['Paino', 'G=mg'], ['Liike-energia', 'E_k=\\frac{1}{2}mv^2'], ['Potentiaalienergia', 'E_p=mgh'],
    ['Teho', 'P=\\frac{W}{t}'], ['Paine', 'p=\\frac{F}{A}'], ['Tiheys', '\\rho=\\frac{m}{V}'], ['Ohmin laki', 'U=RI'], ['Aalto', 'v=f\\lambda']]],
];
// sections open/closed, remembered on this Mac
const palClosed = (() => { try { return JSON.parse(localStorage.getItem('palClosed') || '{}'); } catch (e) { return {}; } })();
function buildPalette() {
  const p = $('#palette');
  for (const [title, items] of PALETTE) {
    const h = document.createElement('h4'); h.textContent = title; p.appendChild(h);
    const g = document.createElement('div'); g.className = 'pal';
    const setOpen = open => { h.classList.toggle('closed', !open); g.style.display = open ? '' : 'none'; };
    setOpen(!palClosed[title]);
    h.addEventListener('mousedown', e => e.preventDefault());
    h.onclick = () => { palClosed[title] = !h.classList.contains('closed'); setOpen(!palClosed[title]); try { localStorage.setItem('palClosed', JSON.stringify(palClosed)); } catch (e) {} };
    for (const [label, latex] of items) {
      const btn = document.createElement('button'); btn.innerHTML = label; btn.title = latex.includes('cases') ? 'Yhtälöpari (Enter lisää rivin, Enter tyhjällä rivillä lopettaa)' : latex; // labels are our own fixed text
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.onclick = () => insertLatex(latex, /</.test(label) ? null : label, title === 'Yksiköt' && label !== '→');
      g.appendChild(btn);
    }
    p.appendChild(g);
  }
  // Kaavat: one wide button per formula, drawn with MathLive
  {
    const title = 'Kaavat', h = document.createElement('h4'); h.textContent = title; p.appendChild(h);
    const g = document.createElement('div'); g.className = 'formulas';
    const setOpen = open => { h.classList.toggle('closed', !open); g.style.display = open ? '' : 'none'; };
    setOpen(!palClosed[title]);
    h.addEventListener('mousedown', e => e.preventDefault());
    h.onclick = () => { palClosed[title] = !h.classList.contains('closed'); setOpen(!palClosed[title]); try { localStorage.setItem('palClosed', JSON.stringify(palClosed)); } catch (e) {} };
    for (const [group, list] of FORMULAS) {
      const gh = document.createElement('div'); gh.className = 'fgroup'; gh.textContent = group; g.appendChild(gh);
      for (const [name, latex] of list) {
        const btn = document.createElement('button'); btn.title = name + ' – klikkaa, niin kaava tulee riville';
        const n = document.createElement('span'); n.className = 'fname'; n.textContent = name;
        const f = new MathfieldElement(); f.className = 'fmath'; f.readOnly = true; f.tabIndex = -1; f.value = latex;
        f.mathVirtualKeyboardPolicy = 'manual';
        btn.append(n, f);
        btn.addEventListener('mousedown', e => e.preventDefault());
        btn.onclick = () => insertLatex(latex, null, false);
        g.appendChild(btn);
      }
    }
    p.appendChild(g);
  }
  const help = document.createElement('div'); help.className = 'help';
  // shortcuts: small groups, key on the left, what it does on the right
  const K = k => k.split(' ').map(x => `<kbd>${x}</kbd>`).join('');
  const HELP = [
    ['Uusi rivi', [['⌘ E', 'kaava'], ['⌘ T', 'teksti'], ['⌘ G', 'kuvaaja'], ['⌘ ⇧ P', 'piirros'], ['⌘ ⇧ T', 'taulukko']]],
    ['Laskeminen', [['⌘ ↩', 'laske'], ['⌘ L', 'likiarvo'], ['⌘ R', 'ratkaise'], ['⌘ D', 'derivoi'], ['⌘ J', 'vaiheittain'], ['= ↩', 'laskee heti, esim. 2+3=']]],
    ['Kirjoittaminen', [['/', 'murtoluku'], ['^', 'potenssi'], ['sqrt', 'neliöjuuri'], ['pi', 'π'], ['"', 'yksikkö, esim. 5"kg'], ['->', 'muunna, esim. 72"km/"h -> "m/"s'], ['a:=5', 'tallenna muuttuja'], ['f(x)=', 'tallenna funktio'], ['Tab', 'tekstiä kaavan perään samalle riville'], ['Tab', 'tekstirivillä: kaava tekstin sekaan, Tab uudelleen palaa tekstiin']]],
    ['Rivit', [['↩', 'uusi rivi alle'], ['⇧', 'pidä pohjassa ja klikkaa rivejä: valitse monta'], ['⌘ C', 'kopioi rivit'], ['⌘ V', 'liitä rivit'], ['⌫', 'poista valitut'], ['⌘ Z', 'kumoa'], ['⌘ ⇧ F', 'etsi vihkoista']]],
    ['Muotoilu', [['⌘ B', 'lihavoi valittu teksti'], ['●', 'värinapit korostavat valitun kohdan (myös kaavassa)']]],
  ];
  help.innerHTML = '<div class="htitle">Pikanäppäimet</div>' + HELP.map(([t, rows]) =>
    `<div class="hgroup"><div class="hhead">${t}</div>` + rows.map(([k, d]) => `<div class="hrow"><span class="hkeys">${K(k)}</span><span>${d}</span></div>`).join('') + '</div>').join('') +
    '<div class="htip"><b>Ehto vastaukselle:</b> kirjoita loppuun , 0<x<360 (myös x>0, ≤ ≥)</div>' + '<div class="htip"><b>Yhtälöpari:</b> {-nappi, kirjoita loppuun , x, y</div><div class="htip"><b>Vastaus:</b> klikkaa, niin se menee kaavaan</div>';
  p.appendChild(help);
}
// the formula field a symbol button writes into: the row you are in, never a surprise new row
function targetField() {
  const cur = activeId && byId(activeId);
  if (cur && (cur.type === 'math' || cur.type === 'graph')) {
    const el = elOf(cur.id);
    if (lastMf && el.contains(lastMf) && !lastMf.readOnly) return lastMf;
    return el.querySelector('math-field:not(.result)');
  }
  // no row active: carry on in the last row if it is a formula
  const last = doc.blocks[doc.blocks.length - 1];
  if (!cur && last && last.type === 'math') { setActive(last.id); return elOf(last.id).querySelector('math-field.main'); }
  return null;
}
function insertLatex(latex, plain, asText) {
  // in a text row a single sign (α, π, ≤ …) or a unit goes straight into the text
  const cur = activeId && byId(activeId);
  const inl = cur && cur.type === 'text' && lastMf && lastMf.classList.contains('inl') && elOf(cur.id).contains(lastMf) ? lastMf : null;
  if (!inl && cur && cur.type === 'text' && plain && (asText || [...plain].length <= 2)) {
    const t = elOf(cur.id).querySelector('.text');
    if (document.activeElement !== t) focusBlock(cur.id, false);
    document.execCommand('insertText', false, plain);
    return;
  }
  let mf = inl || targetField();
  if (!mf) {
    const b = cur && cur.type === 'text' && isEmpty(cur) ? (replaceBlock(cur.id, mk('math')), byId(activeId)) : insertAfter(activeId, mk('math'));
    mf = elOf(b.id).querySelector('math-field.main');
  }
  if (!mf.hasFocus()) mf.focus();
  mf.executeCommand(['insert', latex, {selectionMode: 'placeholder', focus: true}]);
  mf.dispatchEvent(new Event('input', {bubbles: true}));
}

// ---------- files ----------
function serialize() { doc.title = $('#title').value; return JSON.stringify(doc); }
function touch() {
  dirty = true; status();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const data = serialize();
    if (native) post({cmd: 'autosave', data, dirty});
    else try { localStorage.setItem('laskuvihko', data); } catch {}
  }, 600);
}
function status(msg) {
  const name = fileName || 'Nimetön';
  $('#status').textContent = msg || (name + (dirty ? ' — muokattu' : ''));
}
let flashT;
// short messages float at the bottom, so the toolbar never changes size and the page doesn't jump
function flash(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(flashT); flashT = setTimeout(() => t.classList.remove('show'), 2500);
}

function load(data, name) {
  try {
    const d = typeof data === 'string' ? JSON.parse(data) : data;
    if (!d || !Array.isArray(d.blocks)) throw 0;
    doc = d; if (!doc.blocks.length) doc.blocks.push(mk('math'));
    fileName = name || null; dirty = false; activeId = null; lastMf = null;
    render();
    focusBlock(doc.blocks[0].id, false);
    if (native && $('#files').classList.contains('show')) post({cmd: 'listDocs'});
  } catch { flash('Tiedostoa ei voitu avata.'); }
}

// ---------- colour themes ----------
const THEMES = [['olive', 'Alkuperäinen (oliivi)', '#f4efe3', '#3e442a'], ['apple', 'Valkoinen ja sininen', '#fff', '#0071e3'], ['coral', 'Paperi ja koralli', '#f6f4f1', '#f95c4b'], ['night', 'Yönsininen', '#0d1321', '#748cab'], ['copper', 'Hiili ja kupari', '#1c292f', '#a14c1c']];
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
let themeChoice = 'auto'; try { themeChoice = localStorage.getItem('theme') || 'auto'; } catch {}
function applyTheme(force) {
  const t = force || (themeChoice === 'auto' ? (darkMQ.matches ? 'night' : 'apple') : themeChoice);
  if (document.documentElement.dataset.theme === t) return;
  document.documentElement.dataset.theme = t;
  dispatchEvent(new Event('themechange'));
}
darkMQ.addEventListener('change', () => applyTheme());
applyTheme();
function themeMenu() {
  const old = $('#thememenu'); if (old) return old.remove();
  const m = document.createElement('div'); m.id = 'thememenu';
  const item = (id, name, bg, ac) => {
    const b = document.createElement('button'); b.className = themeChoice === id ? 'on' : '';
    b.innerHTML = `<i style="background:${ac ? `linear-gradient(135deg,${bg} 50%,${ac} 50%)` : 'linear-gradient(135deg,#fff 50%,#0d1321 50%)'}"></i>${name}`;
    b.onclick = () => { themeChoice = id; try { localStorage.setItem('theme', id); } catch {} applyTheme(); m.remove(); };
    m.appendChild(b);
  };
  item('auto', 'Seuraa Macia (vaalea / tumma)');
  m.appendChild(document.createElement('hr'));
  THEMES.forEach(t => item(...t));
  const r = $('[data-cmd=theme]').getBoundingClientRect();
  m.style.top = r.bottom + 6 + 'px'; m.style.left = Math.min(r.left, innerWidth - 230) + 'px';
  document.body.appendChild(m);
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!m.contains(e.target) && !e.target.closest('[data-cmd=theme]')) m.remove(); if (!m.isConnected) document.removeEventListener('pointerdown', off); }), 0);
}

// ---------- search in all notebooks ----------
let searchDocs = null, searchCur = null;
const TEXSYM = {alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', omega: 'ω', Delta: 'Δ', Sigma: 'Σ', Omega: 'Ω', cdot: '·', times: '×', pm: '±', le: '≤', ge: '≥', ne: '≠', approx: '≈', infty: '∞', degree: '°', circ: '°', Leftrightarrow: '⇔', Rightarrow: '⇒', lor: '∨', land: '∧', sqrt: '√', overline: '', bar: ''};
function plainLatex(l) {
  if (!l) return '';
  return l.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)').replace(/\\(?:left|right|operatorname|mathbf|mathrm|text|displaylines|begin|end)\b/g, ' ')
    .replace(/\\([a-zA-Z]+)/g, (_, w) => TEXSYM[w] || w).replace(/\{,\}/g, ',').replace(/[{}\\&]/g, ' ').replace(/\s+/g, ' ').trim();
}
function searchText(b) {
  if (b.type === 'text') { const d = document.createElement('div'); d.innerHTML = b.html || ''; d.querySelectorAll('span.im').forEach(s => { s.textContent = ' ' + plainLatex(s.dataset.tex) + ' '; }); return d.textContent; }
  if (b.type === 'math') return plainLatex(b.latex) + (b.res ? '  ' + plainLatex(b.res) : '') + (b.note ? '  ' + b.note : '');
  if (b.type === 'graph') return (b.fns || []).map(plainLatex).join('   ');
  if (b.type === 'table') return (b.rows || []).map(r => r.filter(Boolean).join(' ')).filter(Boolean).join('; ');
  return '';
}
function searchMenu() {
  const old = $('#searchbox'); if (old) return old.remove();
  const box = document.createElement('div'); box.id = 'searchbox';
  box.innerHTML = '<input type="search" placeholder="Etsi kaikista vihkoista, esim. derivaatta tai x^2"><div class="sinfo"></div><div class="sres"></div>';
  document.body.appendChild(box);
  const inp = box.querySelector('input'), info = box.querySelector('.sinfo'), list = box.querySelector('.sres');
  let first = null;
  const run = () => {
    const q = inp.value.trim().toLowerCase(), terms = q.split(/\s+/).filter(Boolean);
    list.textContent = ''; first = null;
    // the open notebook is searched as it is now (also unsaved changes)
    const docs = [{path: searchCur, cur: true, name: $('#title').value || fileName || 'Tämä vihko', blocks: doc.blocks, mod: Date.now()},
      ...(searchDocs || []).filter(d => d.path !== searchCur)];
    if (!native && !searchDocs) info.textContent = 'Selaimessa haku katsoo vain tätä vihkoa.';
    else if (native && !searchDocs) info.textContent = 'Haetaan vihkoja…';
    else info.textContent = (searchDocs.length || 1) + ' vihkoa';
    if (!terms.length) return;
    let hits = 0;
    for (const d of docs) {
      const name = d.title || d.name, rows = [];
      // the title matches when every word is in the title or the file name (e.g. "pulma 9.10")
      const names = (name + ' ' + (d.name || '')).toLowerCase();
      const nameHit = terms.every(w => names.includes(w));
      d.blocks.forEach((b, i) => { const t = searchText(b); if (t && terms.every(w => t.toLowerCase().includes(w) || names.includes(w))) rows.push([i, t]); });
      if (!rows.length && !nameHit) continue;
      hits += rows.length || 1;
      // the notebook title is a button: it opens the notebook at the top
      const h = document.createElement('button'); h.className = 'sdoc';
      const nm = document.createElement('b'); nm.textContent = name + (d.cur ? ' (auki)' : ''); h.appendChild(nm);
      const dt = document.createElement('span'); dt.textContent = d.cur ? '' : new Date(d.mod).toLocaleDateString('fi-FI'); h.appendChild(dt);
      h.onclick = () => openHit(d, null);
      if (nameHit && !first) first = h;
      list.appendChild(h);
      for (const [i, t] of rows.slice(0, 6)) {
        const r = document.createElement('button'); r.className = 'srow';
        // show the part around the first match, with the words marked
        const at = Math.max(0, t.toLowerCase().indexOf(terms[0]) - 30), snip = (at ? '…' : '') + t.slice(at, at + 110);
        const esc = x => x.replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));
        let html = esc(snip);
        for (const w of terms) html = html.replace(new RegExp('(' + esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
        r.innerHTML = html;
        r.onclick = () => openHit(d, i);
        if (!first) first = r;
        list.appendChild(r);
      }
      if (rows.length > 6) { const more = document.createElement('div'); more.className = 'smore'; more.textContent = '+ ' + (rows.length - 6) + ' riviä lisää'; list.appendChild(more); }
    }
    if (!hits) { const n = document.createElement('div'); n.className = 'smore'; n.textContent = 'Ei osumia.'; list.appendChild(n); }
  };
  const openHit = (d, i) => {
    box.remove();
    if (d.cur) { if (i === null) { window.scrollTo({top: 0, behavior: 'smooth'}); return; } return jumpTo(i); }
    if (dirty && hasContent() && !confirm('Avataanko toinen vihko? Tämän vihkon tallentamattomat muutokset häviävät.')) return;
    post(i === null ? {cmd: 'openPath', path: d.path} : {cmd: 'openPath', path: d.path, row: i});
  };
  box._run = run;
  inp.addEventListener('input', run);
  inp.addEventListener('keydown', e => { if (e.key === 'Escape') box.remove(); if (e.key === 'Enter' && first) first.click(); });
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!box.contains(e.target) && !e.target.closest('[data-cmd=search]')) box.remove(); if (!box.isConnected) document.removeEventListener('pointerdown', off); }), 0);
  searchDocs = null;
  if (native) post({cmd: 'listDocs'});
  run(); inp.focus();
}
// ---------- all notebooks in a side list ----------
function renderFiles() {
  const box = $('#files'); if (!box.classList.contains('show')) return;
  const q = (box.querySelector('input') || {}).value || '';
  if (!box.querySelector('input')) {
    box.innerHTML = '<div class="fhead">Vihkot</div><input type="search" placeholder="Suodata nimellä"><div class="flist"></div>';
    box.querySelector('input').addEventListener('input', renderFiles);
  }
  const list = box.querySelector('.flist'); list.textContent = '';
  if (!native) { list.innerHTML = '<div class="fnote">Vihkolista toimii Mac-sovelluksessa.</div>'; return; }
  if (!searchDocs) { list.innerHTML = '<div class="fnote">Haetaan vihkoja…</div>'; return; }
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const docs = searchDocs.slice().sort((a, b) => b.mod - a.mod)
    .filter(d => words.every(w => ((d.title || '') + ' ' + d.name).toLowerCase().includes(w)));
  if (!docs.length) { list.innerHTML = '<div class="fnote">' + (searchDocs.length ? 'Ei osumia.' : 'Ei tallennettuja vihkoja vielä.') + '</div>'; return; }
  for (const d of docs) {
    const btn = document.createElement('button'); btn.className = 'fitem' + (d.path === searchCur ? ' cur' : '');
    btn.title = d.path;
    const nm = document.createElement('b'); nm.textContent = d.title || d.name; btn.appendChild(nm);
    const dt = document.createElement('span'); dt.textContent = new Date(d.mod).toLocaleDateString('fi-FI') + (d.title && d.title !== d.name ? ' · ' + d.name : ''); btn.appendChild(dt);
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.onclick = () => {
      if (d.path === searchCur) return;
      if (dirty && hasContent() && !confirm('Avataanko toinen vihko? Tämän vihkon tallentamattomat muutokset häviävät.')) return;
      searchCur = d.path; renderFiles();
      post({cmd: 'openPath', path: d.path});
    };
    list.appendChild(btn);
  }
}
function jumpTo(i) {
  const b = doc.blocks[i]; if (!b) return;
  const el = elOf(b.id); if (!el) return;
  el.scrollIntoView({block: 'center', behavior: 'smooth'});
  el.classList.add('found'); setTimeout(() => el.classList.remove('found'), 1800);
}

let shotScroll = 0;
// browser version: draw the page into a PNG (vendor/modern-screenshot.js, loaded on first use) and put it on the clipboard
function webShot() {
  shotScroll = $('#scroll').scrollTop; deactivate(); applyTheme('apple'); document.documentElement.classList.add('shot');
  const lib = window.modernScreenshot ? Promise.resolve() : new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/modern-screenshot.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  const blob = lib.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    .then(() => { const pg = $('#page'); return modernScreenshot.domToBlob(pg, {scale: 2, type: 'image/png', backgroundColor: getComputedStyle(pg).backgroundColor}); });
  const done = msg => { document.documentElement.classList.remove('shot'); applyTheme(); $('#scroll').scrollTop = shotScroll; flash(msg); };
  const save = () => blob.then(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = ($('#title').value || 'Nimetön') + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); done('Selain ei antanut kopioida, joten kuva ladattiin tiedostona'); });
  let copy;
  try { copy = navigator.clipboard.write([new ClipboardItem({'image/png': blob})]); } catch (e) { copy = Promise.reject(e); }
  copy.then(() => done('Sivu kopioitu kuvana – liitä ' + (/Mac/.test(navigator.platform) ? '⌘V' : 'Ctrl+V')), () => save())
    .catch(e => { console.warn(e); done('Kuvakaappaus epäonnistui'); });
}
// ---------- lihavointi ja värikorostus (valittu kohta tekstissä tai kaavassa) ----------
function fmtTarget() {
  const a = document.activeElement;
  if (a && a.tagName === 'MATH-FIELD' && !a.readOnly) return {mf: a};
  const t = a && a.closest && a.closest('.text');
  if (t && t.isContentEditable) return {t};
  // kohdistus karkasi (esim. napin painallus): käytä aktiivista riviä
  const cur = activeId && byId(activeId);
  if (cur && (cur.type === 'math' || cur.type === 'graph')) { const mf = targetField(); if (mf) return {mf}; }
  if (cur && cur.type === 'text') { const tt = elOf(cur.id).querySelector('div.text'); if (tt) return {t: tt}; }
  return null;
}
function fmtMath(mf, style) {
  if (mf.selectionIsCollapsed) { flash('Valitse ensin kohta, jonka haluat korostaa'); return; }
  mf.applyStyle(style);
  mf.dispatchEvent(new Event('input', {bubbles: true}));
}
function highlight(color) {
  const f = fmtTarget();
  if (!f) { flash('Valitse ensin teksti tai kaavan osa'); return; }
  if (f.mf) return fmtMath(f.mf, color ? {backgroundColor: color, color: '#1c1c1e'} : {backgroundColor: 'none', color: 'none'});
  if (getSelection().isCollapsed) { flash('Valitse ensin teksti, jonka haluat korostaa'); return; }
  document.execCommand('styleWithCSS', false, true);
  if (color) document.execCommand('hiliteColor', false, color);
  else document.execCommand('removeFormat');
  document.execCommand('styleWithCSS', false, false);
  f.t.dispatchEvent(new Event('input', {bubbles: true}));
}
const commands = {
  bold() {
    const f = fmtTarget();
    if (!f) { flash('Valitse ensin teksti'); return; }
    if (f.mf) { flash('Lihavointi toimii tekstissä. Kaavaan käytä korostusta.'); return; }
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('bold');
    f.t.dispatchEvent(new Event('input', {bubbles: true}));
  },
  hlY() { highlight('#fde68a'); }, hlG() { highlight('#bbf7d0'); }, hlB() { highlight('#bfdbfe'); }, hlP() { highlight('#fbcfe8'); },
  unformat() { highlight(null); },
  tables() {
    const t = $('#tables'), on = t.classList.toggle('show');
    $('[data-cmd=tables]').classList.toggle('on', on);
    const fr = t.querySelector('iframe');
    if (on && !fr.src) fr.src = 'https://mafytaulukot.fi/';
    // kapea ikkuna: muut sivupaneelit pois, ettei vihko litisty
    if (on && innerWidth < 1400) { if ($('#palette').classList.contains('show')) commands.palette(); if ($('#files').classList.contains('show')) commands.files(); }
    try { localStorage.setItem('tables', on ? '1' : ''); } catch {}
  },
  new() { if (dirty && fileName !== null && !confirm('Aloitetaanko uusi? Tallentamattomat muutokset häviävät.')) return; if (dirty && fileName === null && hasContent() && !confirm('Aloitetaanko uusi? Tätä vihkoa ei ole tallennettu.')) return; doc = blank(); fileName = null; dirty = false; render(); focusBlock(doc.blocks[0].id); post({cmd: 'new'}); touch(); dirty = false; status(); },
  open() { if (native) post({cmd: 'open'}); else { const i = document.createElement('input'); i.type = 'file'; i.accept = '.laskuvihko,.json'; i.onchange = () => i.files[0].text().then(t => load(t, i.files[0].name.replace(/\.[^.]+$/, ''))); i.click(); } },
  save() { if (native) post({cmd: 'save', data: serialize(), name: $('#title').value || 'Nimetön'}); else download(); },
  saveAs() { if (native) post({cmd: 'saveAs', data: serialize(), name: $('#title').value || 'Nimetön'}); else download(); },
  pdf() { document.activeElement && document.activeElement.blur(); applyTheme('apple'); if (native) post({cmd: 'pdf', name: $('#title').value || fileName || 'Nimetön'}); else { print(); applyTheme(); } },
  shot() {  // whole page as one picture on the clipboard (Mac app does the capture)
    if (!native) return webShot();
    shotScroll = $('#scroll').scrollTop; deactivate(); applyTheme('apple'); document.documentElement.classList.add('shot');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const r = $('#page').getBoundingClientRect(), d = document.documentElement;
      post({cmd: 'shot', x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, docW: d.scrollWidth, docH: d.scrollHeight});
    }));
  },
  print() { document.activeElement && document.activeElement.blur(); applyTheme('apple'); if (native) post({cmd: 'print'}); else { print(); applyTheme(); } },
  // ^ key from the Mac side (native code stops the dead key from waiting)
  caret() {
    const a = document.activeElement;
    if (a && a.tagName === 'MATH-FIELD') { if (a.mode === 'latex') a.insert('^'); else a.executeCommand('moveToSuperscript'); }
    else document.execCommand('insertText', false, '^');
  },
  addText() { add('text'); }, addMath() { add('math'); }, addGraph() { add('graph'); }, addDraw() { add('draw'); }, addTable() { add('table'); },
  addImage() { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true; i.onchange = () => addImages(i.files); i.click(); },
  calc() { calc('calc'); }, approx() { calc('approx'); }, simplify() { calc('simplify'); }, solve() { calc('solve'); },
  factor() { calc('factor'); }, expand() { calc('expand'); }, diff() { calc('diff'); }, steps() { calc('steps'); }, integrate() { calc('integrate'); },
  angle() { doc.deg = !Calc.deg; Calc.deg = doc.deg; $('#angle').textContent = Calc.deg ? 'DEG' : 'RAD'; flash(Calc.deg ? 'Kulmat asteina' : 'Kulmat radiaaneina'); touch(); },
  theme() { themeMenu(); },
  search() { searchMenu(); },
  files() {
    const f = $('#files'); f.classList.toggle('show'); const on = f.classList.contains('show');
    $('[data-cmd=files]').classList.toggle('on', on);
    try { localStorage.setItem('files', on ? '1' : ''); } catch {}
    if (on) { renderFiles(); if (native) post({cmd: 'listDocs'}); }
  },
  palette() { const p = $('#palette'); p.classList.toggle('show'); if (p.classList.contains('show') && innerWidth < 1400 && $('#tables').classList.contains('show')) commands.tables(); $('[data-cmd=palette]').classList.toggle('on', p.classList.contains('show')); post({cmd: 'pref', palette: p.classList.contains('show')}); },
};
const hasContent = () => doc.blocks.some(b => !isEmpty(b)) || $('#title').value;
function download() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([serialize()], {type: 'application/json'}));
  a.download = ($('#title').value || 'Nimetön') + '.laskuvihko'; a.click();
  dirty = false; status();
}

// called from the Mac app
window.App = {
  cmd: name => commands[name] && commands[name](),
  pasteImages(urls) {  // pictures read from the clipboard by the Mac app
    addImages(urls.map((u, i) => { const b = atob(u.split(',')[1]), a = new Uint8Array(b.length); for (let j = 0; j < b.length; j++) a[j] = b.charCodeAt(j); return new File([a], 'kuva' + i + '.png', {type: 'image/png'}); }));
  },
  load,
  saved(name) { fileName = name; dirty = false; flash('Tallennettu'); if ($('#files').classList.contains('show') && native) post({cmd: 'listDocs'}); post({cmd: 'autosave', data: serialize(), dirty: false}); },
  restore(data, name, wasDirty) { load(data, name); dirty = !!wasDirty; status(); },
  showPalette(v) { if (v !== $('#palette').classList.contains('show')) commands.palette(); },
  isDirty: () => dirty,
  printDone: () => applyTheme(),
  shotDone(ok) { document.documentElement.classList.remove('shot'); applyTheme(); $('#scroll').scrollTop = shotScroll; flash(ok ? 'Sivu kopioitu kuvana – liitä ⌘V' : 'Kuvakaappaus epäonnistui'); },
  docs(list, cur) { searchDocs = list; searchCur = cur; const b = $('#searchbox'); if (b) b._run(); renderFiles(); },
  showFiles(v) { if (v !== $('#files').classList.contains('show')) commands.files(); },
  jumpTo: i => setTimeout(() => jumpTo(i), 150),
};

// ---------- wiring ----------
document.querySelectorAll('#toolbar button').forEach(btn => {
  btn.addEventListener('mousedown', e => e.preventDefault());
  btn.addEventListener('click', () => commands[btn.dataset.cmd]());
});
$('#title').addEventListener('input', touch);
$('#title').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); focusBlock(doc.blocks[0].id, true); } });

// ---------- selecting many rows (drag across rows, or Shift-click) ----------
let selIds = [], selAnchor = null, selFocus = null, dragFrom = null, lastRemoved = null;
// the row under the pointer; with `loose`, the row nearest in height (margins, gaps, above/below the page)
function blockAt(x, y, loose) {
  const el = document.elementFromPoint(x, y); const bl = el && el.closest && el.closest('#doc .block');
  if (bl) return bl.dataset.id;
  if (!loose) return null;
  let best = null, bd = Infinity;
  for (const e of docEl.children) {
    const r = e.getBoundingClientRect();
    const d = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
    if (d < bd) { bd = d; best = e; }
  }
  return best ? best.dataset.id : null;
}
// hidden text box that holds the selected rows as text, so ⌘C / ⌘X / ⌘V work through the normal menu
const clipEl = document.createElement('textarea');
clipEl.id = 'clip'; clipEl.setAttribute('aria-hidden', 'true'); clipEl.tabIndex = -1;
document.body.appendChild(clipEl);
let rowClip = null;
function rowText(b) {
  if (b.type === 'math') return b.latex || '';
  if (b.type === 'text') { const d = document.createElement('div'); d.innerHTML = b.html || ''; return d.textContent; }
  return '';
}
function holdSelection() {
  clipEl.value = selIds.map(id => rowText(byId(id))).join('\n') || ' ';
  clipEl.focus({preventScroll: true}); clipEl.select();
}
function pasteRows(after) {
  let prev = after, first = null, last = null;
  for (const src of rowClip.blocks) {
    const b = Object.assign(JSON.parse(JSON.stringify(src)), {id: uid()});
    insertAfter(prev, b, false); prev = b.id; first = first || b.id; last = b.id;
  }
  if (first) selectRange(first, last);
  flash(rowClip.blocks.length === 1 ? '1 rivi liitetty.' : rowClip.blocks.length + ' riviä liitetty.');
}
clipEl.addEventListener('copy', e => {
  if (!selIds.length) return;
  rowClip = {text: clipEl.value, blocks: selIds.map(id => JSON.parse(JSON.stringify(byId(id))))};
  flash(selIds.length === 1 ? '1 rivi kopioitu.' : selIds.length + ' riviä kopioitu.');
});
clipEl.addEventListener('cut', e => {
  if (!selIds.length) return;
  rowClip = {text: clipEl.value, blocks: selIds.map(id => JSON.parse(JSON.stringify(byId(id))))};
  const ids = selIds.slice(); setTimeout(() => removeMany(ids), 0);
});
clipEl.addEventListener('paste', e => {
  e.preventDefault();
  const t = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
  const after = selIds[selIds.length - 1] || activeId;
  if (rowClip && t === rowClip.text) return pasteRows(after);
  if (t.trim()) { rowClip = {text: t, blocks: t.split('\n').filter(s => s.trim()).map(s => mk('math', {latex: s}))}; pasteRows(after); }
});
// pasting copied rows while writing in a row: several rows (or a text row) come in as rows, not as one formula
document.addEventListener('paste', e => {
  if (!rowClip || !e.clipboardData || e.target === clipEl) return;
  const t = e.clipboardData.getData('text/plain');
  if (t !== rowClip.text || (rowClip.blocks.length === 1 && rowClip.blocks[0].type === 'math')) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const cur = activeId && byId(activeId);
  if (cur && isEmpty(cur) && doc.blocks.length > 1) { const p = doc.blocks[idx(cur.id) - 1]; doc.blocks.splice(idx(cur.id), 1); elOf(cur.id).remove(); pasteRows(p ? p.id : null); }
  else pasteRows(activeId);
}, true);

// click an answer: it goes into the formula you are writing (or is copied if you are not writing one)
function answerValue(tex) {
  let t = String(tex).trim().replace(/^(=|\\approx|\\Leftrightarrow)\s*/, '');
  const m = t.match(/^(?:[a-zA-Z]|\\[a-zA-Z]+)(?:_\{?\w+\}?)?\s*(?:=|\\approx)\s*(.+)$/);
  if (m && !/=|\\approx/.test(m[1])) t = m[1];
  return t.trim();
}
function useAnswer(resEl) {
  const bl = resEl.closest('.block'); const b = bl && byId(bl.dataset.id);
  if (!b || !b.res) return;
  let val = answerValue(b.res);
  const cur = activeId && activeId !== b.id && byId(activeId);
  const mf = cur && cur.type === 'math' ? (lastMf && elOf(cur.id).contains(lastMf) && !lastMf.classList.contains('result') ? lastMf : elOf(cur.id).querySelector('math-field.main')) : null;
  const writing = !!mf;
  if (writing) {
    if (mf.value.trim() && /[+\-]/.test(val.replace(/^-/, '').replace(/\{[^{}]*\}/g, ''))) val = '\\left(' + val + '\\right)';
    mf.focus();
    let before = ''; try { before = mf.getValue(0, mf.position, 'latex'); } catch {}
    if (/[\d}.\w]\s*$/.test(before) && !/\\[a-zA-Z]+\s*$/.test(before)) val = '\\cdot ' + val;
    mf.executeCommand(['insert', val, {format: 'latex', focus: true}]);
    mf.dispatchEvent(new Event('input', {bubbles: true}));
    flash('Vastaus lisätty kaavaan.');
  } else {
    const ae = document.activeElement;
    clipEl.value = val; clipEl.focus({preventScroll: true}); clipEl.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    rowClip = null;
    if (ae && ae !== document.body && ae !== clipEl) ae.focus({preventScroll: true}); else clipEl.blur();
    const done = () => flash('Vastaus kopioitu. ⌘V liittää sen kaavaan.');
    if (ok) done();
    else if (navigator.clipboard) navigator.clipboard.writeText(val).then(done, () => flash('Kopiointi ei onnistunut.'));
    else flash('Kopiointi ei onnistunut.');
  }
}
function selectRange(a, z) {
  const i = idx(a), j = idx(z); if (i < 0 || j < 0) return;
  const [lo, hi] = i < j ? [i, j] : [j, i];
  selAnchor = a; selFocus = z;
  selIds = doc.blocks.slice(lo, hi + 1).map(b => b.id);
  document.querySelectorAll('.block.sel').forEach(el => el.classList.remove('sel'));
  selIds.forEach(id => elOf(id).classList.add('sel'));
  const ae = document.activeElement; if (ae && ae !== document.body && ae !== clipEl) ae.blur();
  getSelection().removeAllRanges();
  docEl.classList.add('selecting');
  holdSelection();
}
function clearSel() {
  if (!selIds.length) return;
  selIds = []; selAnchor = selFocus = null;
  document.querySelectorAll('.block.sel').forEach(el => el.classList.remove('sel'));
  docEl.classList.remove('selecting');
  if (document.activeElement === clipEl) clipEl.blur();
}
function removeMany(ids) {
  const items = ids.map(id => ({i: idx(id), b: byId(id)})).sort((a, b) => a.i - b.i);
  for (const {b} of items.slice().reverse()) { doc.blocks.splice(idx(b.id), 1); elOf(b.id).remove(); }
  clearSel();
  if (!doc.blocks.length) insertAfter(null, mk('math'), false);
  touch();
  const at = doc.blocks[Math.max(0, Math.min(doc.blocks.length - 1, items[0].i - 1))];
  focusBlock(at.id, false);
  lastRemoved = {items, blank: null};
  if (doc.blocks.length === 1 && isEmpty(doc.blocks[0]) && !items.some(x => x.b === doc.blocks[0])) lastRemoved.blank = doc.blocks[0].id;
  flash((items.length === 1 ? '1 rivi' : items.length + ' riviä') + ' poistettu. ⌘Z palauttaa.');
}
function restoreRemoved() {
  const r = lastRemoved; lastRemoved = null;
  if (r.blank) { const k = idx(r.blank); if (k >= 0 && isEmpty(doc.blocks[k])) doc.blocks.splice(k, 1); }
  for (const {i, b} of r.items) doc.blocks.splice(Math.min(i, doc.blocks.length), 0, b);
  render(); touch();
  selectRange(r.items[0].b.id, r.items[r.items.length - 1].b.id);
  flash('Rivit palautettu.');
}
let dragY = 0, scrollRaf = 0;
function autoScroll() {
  scrollRaf = 0;
  if (!dragFrom) return;
  const sc = $('#scroll'), r = sc.getBoundingClientRect();
  const d = dragY < r.top + 40 ? -(r.top + 40 - dragY) : dragY > r.bottom - 40 ? dragY - (r.bottom - 40) : 0;
  if (!d) return;
  sc.scrollTop += Math.max(-30, Math.min(30, d / 2));
  const id = blockAt(r.left + r.width / 2, Math.max(r.top + 1, Math.min(r.bottom - 1, dragY)), true);
  if (id) selectRange(dragFrom, id);
  scrollRaf = requestAnimationFrame(autoScroll);
}
document.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const res = e.target.closest && e.target.closest('#doc math-field.result');
  if (res) { e.preventDefault(); e.stopPropagation(); clearSel(); useAnswer(res); return; }
  const sign = e.target.closest('.block .kind'), grey = e.target.id === 'scroll';
  const id = blockAt(e.clientX, e.clientY, !!e.target.closest('#scroll') && !e.target.closest('#title'));
  if (e.shiftKey && id && (selAnchor || activeId) && (selAnchor || activeId) !== id) {
    e.preventDefault(); e.stopPropagation(); selectRange(selAnchor || activeId, id); return;
  }
  clearSel();
  dragFrom = id && !e.target.closest('canvas, .grip, button, input, .drawbox') ? id : null;
  // the row sign (ƒ, Aa): a click picks the whole row at once
  if (dragFrom && sign) { e.preventDefault(); e.stopPropagation(); selectRange(id, id); }
  // the grey area outside the paper: no row stays active
  else if (grey) deactivate();
}, true);
document.addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('#doc math-field.result')) e.preventDefault(); }, true);
document.addEventListener('pointermove', e => {
  if (!dragFrom || !(e.buttons & 1)) { dragFrom = null; return; }
  dragY = e.clientY;
  const id = blockAt(e.clientX, e.clientY, true);
  if (id && (id !== dragFrom || selIds.length)) selectRange(dragFrom, id);
  if (selIds.length && !scrollRaf) scrollRaf = requestAnimationFrame(autoScroll);
}, true);
document.addEventListener('pointerup', () => { dragFrom = null; }, true);
document.addEventListener('input', () => { lastRemoved = null; }, true);
document.addEventListener('keydown', e => {
  const m = e.metaKey || e.ctrlKey;
  if (m && e.key.toLowerCase() === 'z' && !e.shiftKey && lastRemoved) { e.preventDefault(); e.stopPropagation(); return restoreRemoved(); }
  if (!selIds.length) return;
  if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); e.stopPropagation(); return removeMany(selIds); }
  if (e.key === 'Escape') { e.preventDefault(); const f = selFocus; clearSel(); return focusBlock(f, false); }
  if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    e.preventDefault(); e.stopPropagation();
    const k = Math.max(0, Math.min(doc.blocks.length - 1, idx(selFocus) + (e.key === 'ArrowDown' ? 1 : -1)));
    return selectRange(selAnchor, doc.blocks[k].id);
  }
  if (e.key === 'Shift' || m) return;
  if (e.key.startsWith('Arrow')) { e.preventDefault(); const f = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? selIds[0] : selIds[selIds.length - 1]; clearSel(); return focusBlock(f, false); }
  clearSel();
}, true);

// the browser keeps ⌘T, ⌘⇧T and ⌘N for itself: on the web they are ⌃ (Mac) or Alt (Windows) instead
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
const webAlt = !native && !isMac;
document.addEventListener('keydown', e => {
  const m = e.metaKey || e.ctrlKey || (webAlt && e.altKey);
  if (!m) return;
  const k = webAlt && e.altKey && /^Key/.test(e.code) ? e.code.slice(3).toLowerCase() : e.key.toLowerCase();
  const map = {enter: 'calc', e: 'addMath', t: 'addText', g: 'addGraph', l: 'approx', r: 'solve', d: 'diff', b: 'bold'};
  if (!native) Object.assign(map, {s: 'save', o: 'open', p: 'print', n: 'new'});
  if (e.shiftKey && k === 's' && !native) { e.preventDefault(); return commands.saveAs(); }
  if (e.shiftKey && k === 'i') { e.preventDefault(); return commands.addImage(); }
  if (e.shiftKey && k === 'p') { e.preventDefault(); return commands.addDraw(); }
  if (e.shiftKey && k === 't') { e.preventDefault(); return commands.addTable(); }
  if (map[k] && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); commands[map[k]](); }
}, true);
// a click on the paper beside, between or below the rows puts the cursor in the nearest row, like a text editor
document.addEventListener('click', e => {
  const t = e.target;
  if (selIds.length || !t.closest || !t.closest('#page')) return;
  if (!(t.id === 'page' || t === docEl || ['block', 'mathrow', 'vars', 'err'].some(c => t.classList.contains(c)))) return;
  if (e.clientY < docEl.getBoundingClientRect().top) return;
  const id = blockAt(e.clientX, e.clientY, true); if (!id) return;
  const f = elOf(id).querySelector('math-field.main, .text');
  focusBlock(id, !!f && e.clientX < f.getBoundingClientRect().left + 4);
});

buildPalette();
if (!native) for (const b of document.querySelectorAll('[title]')) b.title = b.title.replace(/⌘(⇧?)([TN])\b/g, (_, sh, c) => isMac ? '⌃' + sh + c : 'Alt+' + (sh ? 'Shift+' : '') + c);
if (native) { doc = blank(); render(); post({cmd: 'ready'}); }
else {
  let saved = null; try { saved = localStorage.getItem('laskuvihko'); } catch {}
  doc = blank(); render();
  if (saved) load(saved); else focusBlock(doc.blocks[0].id);
  $('#palette').classList.add('show'); $('[data-cmd=palette]').classList.add('on');
}

try { if (localStorage.getItem('files')) commands.files(); } catch {}
// taulukkopaneeli: sulku-nappi, leveys vetämällä (muistetaan)
{ const t = $('#tables');
  t.querySelector('[data-tcmd=close]').onclick = () => commands.tables();
  // pienennys: sivu piirretään leveämmäksi ja skaalataan, jolloin puolikkaassa ikkunassa näkyy enemmän
  let z = .8; try { z = +localStorage.getItem('tablesZ') || .8; } catch {}
  const setZ = v => { z = Math.round(Math.max(.5, Math.min(1.2, v)) * 10) / 10; t.querySelector('iframe').style.setProperty('--z', z); t.querySelector('.tzoom').textContent = Math.round(z * 100) + ' %'; try { localStorage.setItem('tablesZ', z); } catch {} };
  setZ(z);
  t.querySelector('[data-tcmd=zout]').onclick = () => setZ(z - .1);
  t.querySelector('[data-tcmd=zin]').onclick = () => setZ(z + .1);
  try { const w = +localStorage.getItem('tablesW'); if (w) t.style.width = w + 'px'; } catch {}
  t.querySelector('.tgrip').addEventListener('pointerdown', e => {
    e.preventDefault(); const x0 = e.clientX, w0 = t.offsetWidth; t.classList.add('drag');
    const mv = ev => { t.style.width = Math.max(280, Math.min(innerWidth - 360, w0 + x0 - ev.clientX)) + 'px'; };
    const up = () => { t.classList.remove('drag'); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); try { localStorage.setItem('tablesW', t.offsetWidth); } catch {} };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  });
  try { if (localStorage.getItem('tables')) commands.tables(); } catch {} }
