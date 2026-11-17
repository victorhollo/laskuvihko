// Kielet: sovelluksen tekstit kirjoitetaan koodiin suomeksi, ja tr('Tallenna') hakee niille käännöksen valitun kielen tiedostosta (kielet/en.js …).
// Uusi kieli = uusi tiedosto kielet/xx.js (kopioi en.js ja käännä oikeat puolet) + rivi index.html:ään + nimi NIMET-listaan.
// {0}, {1} … ovat paikkoja vaihtuville osille: 'Tuntematon yksikkö {0}' → 'Unknown unit {0}'.
const Kieli = (() => {
  const NIMET = {fi: 'Suomi', en: 'English'};
  const dicts = {}, malli = {};
  let lang = '';
  try { lang = localStorage.getItem('lvLang') || ''; } catch (e) {}
  if (!NIMET[lang]) lang = /^fi\b/i.test((typeof window !== 'undefined' && window.LV_SYS_LANG) || (typeof navigator !== 'undefined' && navigator.language) || 'fi') ? 'fi' : 'en';
  const esc = s => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');

  function haku(s) {
    const d = dicts[lang]; if (!d) return null;
    if (Object.prototype.hasOwnProperty.call(d, s)) return d[s];
    // vaihtuvat osat: avain, jossa on {0}
    if (!malli[lang]) malli[lang] = Object.keys(d).filter(k => /\{\d\}/.test(k)).sort((a, b) => b.length - a.length)
      .map(k => [new RegExp('^' + esc(k).replace(/\\?\{(\d)\\?\}/g, '([\\s\\S]*?)') + '$'), k.match(/\{\d\}/g).map(x => +x[1]), d[k]]);
    for (const [re, nrot, kohde] of malli[lang]) { const m = s.match(re); if (m) return kohde.replace(/\{(\d)\}/g, (_, n) => t(m[nrot.indexOf(+n) + 1] ?? '')); }
    return null;
  }
  // käännös; välilyönnit alussa ja lopussa säilyvät (' riviä' → ' rows')
  function t(s) {
    if (lang === 'fi' || typeof s !== 'string' || !s) return s;
    const r = haku(s); if (r !== null) return r;
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (m[1] || m[3]) { const r2 = haku(m[2]); if (r2 !== null) return m[1] + r2 + m[3]; }
    return s;
  }
  // laskun vastaus: \text{…}-osat käännetään
  const tex = s => lang === 'fi' || typeof s !== 'string' ? s : s.replace(/\\text\{([^{}]*)\}/g, (_, c) => '\\text{' + t(c) + '}');
  // kiinteä HTML (työkalurivi ym.): napit, otsikot ja vihjetekstit
  function dom(root) {
    if (lang === 'fi') return;
    for (const el of root.querySelectorAll('[title],[placeholder]')) {
      if (el.title) el.title = t(el.title);
      if (el.placeholder) el.placeholder = t(el.placeholder);
    }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (n.nodeValue.trim() && !n.parentElement.closest('math-field')) n.nodeValue = t(n.nodeValue);
  }
  return {
    get lang() { return lang; },
    nimet: NIMET,
    add(l, d) { dicts[l] = Object.assign(dicts[l] || {}, d); delete malli[l]; },
    t, tex, dom,
    // desimaalimerkki: suomeksi pilkku, englanniksi piste
    get pilkku() { return lang === 'fi'; },
    set(l) { if (!NIMET[l]) return; try { localStorage.setItem('lvLang', l); } catch (e) {} lang = l; },
    // päivämäärä kielen mukaan
    pvm: d => new Date(d).toLocaleDateString(lang === 'fi' ? 'fi-FI' : lang),
  };
})();
const tr = Kieli.t;
