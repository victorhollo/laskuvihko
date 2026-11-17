// Nettiversion tiedostot Chromessa ja Edgessä (Windows): tallennus samaan tiedostoon, oma vihkokansio ja vihkolista.
// Vastaa samoihin viesteihin kuin Mac-sovellus (main.swift), joten app.js toimii molemmissa samalla tavalla.
// Muut selaimet (Safari, Firefox) jatkavat vanhaan tapaan: avaus tiedostovalitsimella, tallennus lataa kopion.
const WebFS = (() => {
  const inMac = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.native);
  const ok = !inMac && 'showSaveFilePicker' in window && 'showDirectoryPicker' in window && 'indexedDB' in window;
  const EXT = '.laskuvihko';
  const types = [{description: 'Laskuvihko', accept: {'application/json': [EXT, '.json']}}];
  let cur = null, folder = null, byPath = {}, starting = null;
  const base = n => n.replace(/\.[^.]+$/, '');

  // kahvat (luvat tiedostoon ja kansioon) muistetaan selaimen omassa tietokannassa
  const db = () => new Promise((res, rej) => { const r = indexedDB.open('laskuvihko-fs', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const idb = async (k, v) => { try { const d = await db(); return await new Promise(res => { const t = d.transaction('h', v === undefined ? 'readonly' : 'readwrite'), s = t.objectStore('h'); const r = v === undefined ? s.get(k) : v === null ? s.delete(k) : s.put(v, k); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }); } catch (e) { return null; } };

  const allowed = async (h, ask) => { const o = {mode: 'readwrite'}; if (await h.queryPermission(o) === 'granted') return true; return ask ? await h.requestPermission(o) === 'granted' : false; };
  const setCur = h => { cur = h; idb('cur', h || null); };
  const pathOf = async h => { if (!h || !folder) return null; try { const p = await folder.resolve(h); return p ? p.join('/') : null; } catch (e) { return null; } };

  async function write(h, data) {
    if (!await allowed(h, true)) { App.saveFailed(tr('Tallennus vaatii luvan tiedostoon.')); return; }
    const w = await h.createWritable(); await w.write(data); await w.close();
    setCur(h); App.saved(base(h.name));
  }
  async function saveAs(m) {
    let h; try { h = await showSaveFilePicker({suggestedName: (m.name || tr('Nimetön')) + EXT, types, startIn: folder || cur || 'documents'}); } catch (e) { return; }
    await write(h, m.data);
  }
  async function openHandle(h, row) {
    try { const f = await h.getFile(); const t = await f.text(); setCur(h); App.load(t, base(h.name)); if (row != null) App.jumpTo(row); }
    catch (e) { App.saveFailed(tr('Tiedostoa ei voitu avata.')); }
  }
  async function listDocs() {
    if (starting) await starting;
    if (!folder) { api.need = 'pick'; App.docs([], null); return; }
    if (!await allowed(folder)) { api.need = 'allow'; App.docs([], null); return; }
    api.need = null; byPath = {};
    const list = [];
    async function walk(dir, pre, depth) {
      for await (const [n, h] of dir.entries()) {
        if (list.length >= 300) return;
        if (h.kind === 'directory') { if (depth < 3 && !n.startsWith('.')) await walk(h, pre + n + '/', depth + 1); continue; }
        if (!n.endsWith(EXT)) continue;
        try {
          const f = await h.getFile(), d = JSON.parse(await f.text());
          if (!Array.isArray(d.blocks)) continue;
          // vain haettava teksti mukaan (kuvat ovat isoja)
          const blocks = d.blocks.map(b => { const r = {}; for (const k of ['type', 'html', 'latex', 'res', 'fns']) if (b[k] !== undefined) r[k] = b[k]; return r; });
          const path = pre + n; byPath[path] = h;
          list.push({path, name: base(n), title: d.title || '', mod: f.lastModified, blocks});
        } catch (e) {}
      }
    }
    try { await walk(folder, '', 0); } catch (e) {}
    App.docs(list, await pathOf(cur));
  }

  const api = {
    ok, need: null,
    folderName: () => folder && folder.name,
    post(m) {
      switch (m.cmd) {
        case 'open': showOpenFilePicker({types, startIn: folder || 'documents'}).then(([h]) => openHandle(h), () => {}); break;
        case 'save': if (cur) write(cur, m.data).catch(() => App.saveFailed(tr('Tallennus epäonnistui.'))); else saveAs(m); break;
        case 'saveAs': saveAs(m).catch(() => App.saveFailed(tr('Tallennus epäonnistui.'))); break;
        case 'new': setCur(null); break;
        case 'listDocs': listDocs(); break;
        case 'openPath': if (byPath[m.path]) openHandle(byPath[m.path], m.row); break;
        case 'autosave': try { localStorage.setItem('laskuvihko', m.data); localStorage.setItem('lvDirty', m.dirty ? '1' : ''); } catch (e) {} break;
      }
    },
    // vihkokansion valinta ja lupa (vaativat klikkauksen)
    async pickFolder() {
      let h; try { h = await showDirectoryPicker({id: 'laskuvihko', mode: 'readwrite', startIn: 'documents'}); } catch (e) { return; }
      folder = h; idb('folder', h); listDocs();
    },
    async allowFolder() { if (folder && await allowed(folder, true)) listDocs(); },
    // käynnistyksessä: muistettu tiedosto ja kansio takaisin
    start(hadDoc) { starting = (async () => {
      folder = await idb('folder') || null;
      const h = await idb('cur');
      if (h && hadDoc) { cur = h; let d = ''; try { d = localStorage.getItem('lvDirty') || ''; } catch (e) {} App.setFile(base(h.name), !!d); }
      // Windowsissa .laskuvihko-tiedoston kaksoisklikkaus avaa sen asennetussa sovelluksessa
      if ('launchQueue' in window) launchQueue.setConsumer(p => { if (p.files && p.files[0]) openHandle(p.files[0]); });
    })(); },
  };
  return api;
})();

// asennettava sovellus ja toiminta ilman nettiä
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.native))
  navigator.serviceWorker.register('sw.js').catch(() => {});
