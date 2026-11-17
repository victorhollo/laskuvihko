// Kaavasto: Laskuvihon oma kaava-, teoria- ja taulukkokokoelma sivupaneelissa.
// Sisältö on kirjoitettu itse (kaavasto-*.js). Kaavan klikkaus kirjoittaa sen aktiiviselle riville (insertLatex app.js).
const R = String.raw;
const KAAVASTO = {Matematiikka: [], Fysiikka: [], Taulukot: []};
// aihe(ala, nimi, teoria-HTML, [[kaavan nimi, LaTeX, selitys], …], [{otsikko, sarakkeet, rivit}])
function aihe(ala, nimi, teoria, kaavat, taulukot) { KAAVASTO[ala].push({nimi, teoria: teoria || '', kaavat: kaavat || [], taulukot: taulukot || []}); }

const Kaavasto = (() => {
  let el, body, input, tab = 'Matematiikka', q = '', built = false;
  let auki = {}; try { auki = JSON.parse(localStorage.getItem('kvAuki') || '{}'); } catch (e) {}
  try { const t = localStorage.getItem('kvTab'); if (KAAVASTO[t]) tab = t; } catch (e) {}
  const norm = s => (s || '').toLowerCase().replace(/\\[a-z]+/g, ' ').replace(/[{}()^_\\]/g, ' ');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const typeset = n => { try { MathLive.renderMathInElement(n); } catch (e) {} };

  function kaavaEl(k) {
    const [nimi, tex, sel] = k, d = document.createElement('div'); d.className = 'kv-k';
    d.innerHTML = `<div class="kv-kn">${nimi}</div><div class="kv-km" title="${tr('Klikkaa: kaava riville')}">\\(\\displaystyle ${esc(tex)}\\)</div>` + (sel ? `<div class="kv-ks">${sel}</div>` : '');
    const m = d.querySelector('.kv-km');
    m.addEventListener('mousedown', e => e.preventDefault());
    m.onclick = () => { insertLatex(tex, null, false); m.classList.add('kv-ok'); setTimeout(() => m.classList.remove('kv-ok'), 600); };
    return d;
  }
  function taulukkoEl(t, rivit) {
    const w = document.createElement('div'); w.className = 'kv-t';
    w.innerHTML = (t.otsikko ? `<div class="kv-tt">${t.otsikko}</div>` : '') + '<table>' +
      (t.sarakkeet ? '<tr>' + t.sarakkeet.map(s => `<th>${s}</th>`).join('') + '</tr>' : '') +
      rivit.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</table>';
    return w;
  }
  function aiheEl(a, avoin, kaavat, taulukot, teoria) {
    const s = document.createElement('section'); s.className = 'kv-a' + (avoin ? ' open' : '');
    const h = document.createElement('h3'); h.textContent = a.nimi; s.appendChild(h);
    const c = document.createElement('div'); c.className = 'kv-c'; s.appendChild(c);
    let tehty = false;
    const tayta = () => {
      if (tehty) return; tehty = true;
      if (teoria && a.teoria) { const p = document.createElement('div'); p.className = 'kv-th'; p.innerHTML = a.teoria; c.appendChild(p); }
      for (const k of kaavat) c.appendChild(kaavaEl(k));
      for (const [t, r] of taulukot) c.appendChild(taulukkoEl(t, r));
      typeset(c);
    };
    if (avoin) tayta();
    h.onclick = () => {
      const on = s.classList.toggle('open'); if (on) tayta();
      if (!q) { auki[a.nimi] = on; try { localStorage.setItem('kvAuki', JSON.stringify(auki)); } catch (e) {} }
    };
    return s;
  }
  function piirra() {
    body.innerHTML = ''; body.scrollTop = 0;
    el.querySelectorAll('.kv-tab').forEach(b => b.classList.toggle('on', !q && b.dataset.tab === tab));
    if (!q) { for (const a of KAAVASTO[tab]) body.appendChild(aiheEl(a, !!auki[a.nimi], a.kaavat, a.taulukot.map(t => [t, t.rivit]), true)); return; }
    const sanat = norm(q).split(/\s+/).filter(Boolean), osuu = txt => { const n = norm(txt); return sanat.every(w => n.includes(w)); };
    let n = 0;
    for (const ala of Object.keys(KAAVASTO)) for (const a of KAAVASTO[ala]) {
      if (osuu(a.nimi)) { body.appendChild(aiheEl(a, true, a.kaavat, a.taulukot.map(t => [t, t.rivit]), true)); n++; continue; }
      const k = a.kaavat.filter(x => osuu(x.join(' ') + ' ' + a.nimi));
      const t = a.taulukot.map(x => [x, x.rivit.filter(r => osuu(r.join(' ') + ' ' + (x.otsikko || '')))]).filter(x => x[1].length);
      if (k.length || t.length) { body.appendChild(aiheEl(a, true, k, t, false)); n++; }
    }
    if (!n) body.innerHTML = tr('<div class="kv-empty">Ei osumia. Kokeile toista sanaa, esim. <i>kitka</i>, <i>derivaatta</i> tai <i>tiheys</i>.</div>');
  }
  function rakenna() {
    if (built) return; built = true; el = document.getElementById('tables');
    el.querySelector('.kv-tabs').innerHTML = Object.keys(KAAVASTO).map(t => `<button class="kv-tab" data-tab="${t}">${tr(t)}</button>`).join('');
    el.querySelectorAll('.kv-tab').forEach(b => b.onclick = () => { tab = b.dataset.tab; q = ''; input.value = ''; try { localStorage.setItem('kvTab', tab); } catch (e) {} piirra(); });
    body = el.querySelector('.kv-body'); input = el.querySelector('.kv-q');
    let ajastin; input.oninput = () => { clearTimeout(ajastin); ajastin = setTimeout(() => { q = input.value.trim(); piirra(); }, 150); };
    input.onkeydown = e => { if (e.key === 'Escape') { input.value = ''; q = ''; piirra(); } e.stopPropagation(); };
    piirra();
  }
  return {rakenna, etsi: () => { rakenna(); input.focus(); input.select(); }};
})();
