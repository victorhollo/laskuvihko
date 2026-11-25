// Laskuvihko: LaTeX (MathLive) -> nerdamer, and the calculations.
const Calc = (() => {
  const FUNCS = {sin:1,cos:1,tan:1,cot:1,arcsin:'asin',arccos:'acos',arctan:'atan',sinh:1,cosh:1,tanh:1,
    ln:'log',lg:'log10',log:'log10',exp:1,abs:1,sqrt:1,max:1,min:1,sgn:'sign',sign:1,floor:1,ceil:1,round:1,
    asin:1,acos:1,atan:1,arcsec:'asec',sec:1,csc:1,mod:1,nCr:1,binom:'nCr',gcd:1,lcm:1,syt:'gcd',pyj:'lcm'};
  // functions with several arguments: a comma between them is not a decimal comma (max(2,5) = 5);
  // 2 = only ; separates (round(2,5) is round(2.5), round(2,345;2) = 2,35)
  const MULTI = {max:1,min:1,mod:1,nCr:1,gcd:1,lcm:1,round:2};
  const TRIG = {sin:1,cos:1,tan:1,cot:1,sec:1,csc:1};
  const ATRIG = {asin:1,acos:1,atan:1};
  let userFns = new Set(), userDefs = {};
  let deg = true;
  let approxHit = false;   // Σ laskettiin desimaaleilla: vastaus ≈

  nerdamer.setFunction('sind',['x'],'sin(pi*x/180)');
  nerdamer.setFunction('cosd',['x'],'cos(pi*x/180)');
  nerdamer.setFunction('tand',['x'],'tan(pi*x/180)');
  nerdamer.setFunction('cotd',['x'],'cot(pi*x/180)');
  nerdamer.setFunction('secd',['x'],'sec(pi*x/180)');
  nerdamer.setFunction('cscd',['x'],'csc(pi*x/180)');
  nerdamer.setFunction('nCr',['n','k'],'factorial(n)/(factorial(k)*factorial(n-k))');
  nerdamer.setFunction('asind',['x'],'asin(x)*180/pi');
  nerdamer.setFunction('acosd',['x'],'acos(x)*180/pi');
  nerdamer.setFunction('atand',['x'],'atan(x)*180/pi');
  // jakojäännös kirjan tapaan saman merkkinen kuin jakaja: mod(−7,3) = 2 (nerdamer antoi −1)
  try { const P = nerdamer.getCore().PARSER, F = P.functions, m0 = F.mod[0];
    F.mod[0] = function (a, b) { const r = m0.apply(this, arguments);
      try { if (r.isConstant() && b.isConstant() && !r.equals(0) && r.lessThan(0) !== b.lessThan(0)) return P.add(r, b.clone()); } catch {} return r; }; } catch {}
  // round half away from zero like a calculator (nerdamer gave round(−2,5) = −2)
  try { const P = nerdamer.getCore().PARSER, F = P.functions, r0 = F.round[0], S = nerdamer.getCore().Symbol;
    F.round[0] = function (e, t) { if (e.isConstant() && e.lessThan(0)) return P.multiply(new S(-1), r0.call(this, P.multiply(new S(-1), e.clone()), t)); return r0.apply(this, arguments); }; } catch {}

  class Err extends Error {}
  // nerdamer's simplify sometimes drops a minus sign (-(b-c) became b-c): check it with test numbers
  function simp(x) {
    const plain = nerdamer(x).toString();
    let sx; try { sx = nerdamer('simplify(' + x + ')').toString(); } catch { return plain; }
    if (/\d{7,}/.test(sx) && !/\d{7,}/.test(plain)) return plain;   // simplify sometimes swaps √7 for a long fraction
    try {
      const vs = nerdamer(plain).variables();
      for (const t of [0.37, 1.91]) {
        const sub = {}; vs.forEach((v, i) => { sub[v] = String(t + i * 0.73); });
        const a = Number(nerdamer(plain, sub).evaluate().text('decimals')), b = Number(nerdamer(sx, sub).evaluate().text('decimals'));
        if (!(isFinite(a) && isFinite(b))) continue;
        if (Math.abs(a - b) > 1e-7 * Math.max(1, Math.abs(a))) return plain;
      }
    } catch { return plain; }
    return sx;
  }

  // ---------- units ----------
  // A unit becomes factor*uL^a*uM^b*… (SI base dimensions as symbols), so nerdamer does the unit algebra.
  const DIMN = ['uL', 'uM', 'uT', 'uI', 'uK', 'uN'];
  const D = (L = 0, M = 0, T = 0, I = 0, K = 0, N = 0) => [L, M, T, I, K, N];
  const BASE = {m: [1, D(1)], g: [1e-3, D(0, 1)], s: [1, D(0, 0, 1)], A: [1, D(0, 0, 0, 1)], K: [1, D(0, 0, 0, 0, 1)], mol: [1, D(0, 0, 0, 0, 0, 1)],
    N: [1, D(1, 1, -2)], J: [1, D(2, 1, -2)], W: [1, D(2, 1, -3)], Pa: [1, D(-1, 1, -2)], Hz: [1, D(0, 0, -1)], Bq: [1, D(0, 0, -1)],
    C: [1, D(0, 0, 1, 1)], V: [1, D(2, 1, -3, -1)], 'Ω': [1, D(2, 1, -3, -2)], F: [1, D(-2, -1, 4, 2)], T: [1, D(0, 1, -2, -1)],
    Wb: [1, D(2, 1, -2, -1)], H: [1, D(2, 1, -2, -2)], L: [1e-3, D(3)], l: [1e-3, D(3)], eV: [1.602176634e-19, D(2, 1, -2)],
    Wh: [3600, D(2, 1, -2)], Ah: [3600, D(0, 0, 1, 1)], bar: [1e5, D(-1, 1, -2)], cal: [4.184, D(2, 1, -2)]};
  const EXTRA = {min: [60, D(0, 0, 1)], h: [3600, D(0, 0, 1)], vrk: [86400, D(0, 0, 1)], d: [86400, D(0, 0, 1)], a: [31557600, D(0, 0, 1)], t: [1000, D(0, 1)],
    '°C': [1, D(0, 0, 0, 0, 1)], '°F': [5 / 9, D(0, 0, 0, 0, 1)], atm: [101325, D(-1, 1, -2)], mmHg: [133.322387, D(-1, 1, -2)],
    ha: [1e4, D(2)], 'Å': [1e-10, D(1)], rad: [1, D()], u: [1.66053907e-27, D(0, 1)], ly: [9.4607304725808e15, D(1)], AU: [1.495978707e11, D(1)]};
  const PREFIX = [['da', 10], ['p', 1e-12], ['n', 1e-9], ['µ', 1e-6], ['u', 1e-6], ['m', 1e-3], ['c', 1e-2], ['d', 0.1], ['h', 100], ['k', 1e3], ['M', 1e6], ['G', 1e9], ['T', 1e12]];
  const NAMED = ['N', 'J', 'W', 'Pa', 'Hz', 'C', 'V', 'Ω', 'F', 'T', 'Wb', 'H'];
  const TEMP = {'°C': 1, '°F': 1, K: 1};
  const unitVars = new Set();
  const tempVars = new Map();   // T:=80"°C → T: '°C' (the offset is used only when T alone is converted, T→"K)
  // common derived units a student expects (Hz·m → m/s, kg/s² → N/m)
  const NICE = [[D(1, 0, -1), () => unitTex('m') + '/' + unitTex('s')], [D(1, 0, -2), () => unitTex('m') + '/' + unitTex('s') + '^{2}'],
    [D(0, 1, -2), () => unitTex('N') + '/' + unitTex('m')], [D(-3, 1), () => unitTex('kg') + '/' + unitTex('m') + '^{3}'],
    [D(0, 1, -3), () => unitTex('W') + '/' + unitTex('m') + '^{2}'], [D(2, 1, -2, 0, -1), () => unitTex('J') + '/' + unitTex('K')],
    [D(2, 0, -2, 0, -1), () => unitTex('J') + '/(' + unitTex('kg') + '\\cdot ' + unitTex('K') + ')'], [D(2, 0, -2), () => unitTex('J') + '/' + unitTex('kg')],
    [D(3, -1, -2), () => '\\frac{' + unitTex('N') + '\\cdot ' + unitTex('m') + '^{2}}{' + unitTex('kg') + '^{2}}'], [D(3, 1, -3, -2), () => unitTex('Ω') + '\\cdot ' + unitTex('m')]];
  function lookupUnit(name) {
    if (EXTRA[name]) return EXTRA[name];
    if (BASE[name]) return BASE[name];
    for (const [p, f] of PREFIX) if (name.startsWith(p) && BASE[name.slice(p.length)]) { const u = BASE[name.slice(p.length)]; return [f * u[0], u[1]]; }
    return null;
  }
  const unitName = raw => raw.replace(/\\(?:operatorname|mathrm|text|mathbf)\b/g, '').replace(/\\Omega/g, 'Ω').replace(/\\mu|\\micro/g, 'µ').replace(/\\(?:text)?degree|\^\{?\\circ\}?|\\circ|[º˚]/g, '°').replace(/℃/g, '°C').replace(/℉/g, '°F')
    .replace(/\\[,;:! ]/g, '').replace(/[\s{}\\]/g, '');
  const sciNum = f => { const [m, e] = f.toExponential().split('e'); return +e ? m + '*10^(' + (+e) + ')' : m; };
  const dimStr = d => d.map((e, k) => e ? DIMN[k] + '^(' + e + ')' : '').filter(Boolean).join('*') || '1';
  const sameDims = (a, b) => a.every((x, k) => Math.abs(x - b[k]) < 1e-6);
  function unitTex(name) {
    if (name[0] === '°') return '{}^{\\circ}\\operatorname{\\mathbf{' + name.slice(1) + '}}';
    return '\\operatorname{\\mathbf{' + name.replace(/Ω/g, '\\Omega ').replace(/µ/g, '\\mu ') + '}}';
  }

  // ---------- LaTeX -> token list ----------
  function toAscii(latex, opts = {}) {
    const useDeg = opts.rad ? false : deg;
    latex = latex.replace(/℃/g, '°C').replace(/℉/g, '°F').replace(/\\textdegree/g, '\\degree');
    // MathLive muuttaa kirjoitetun "mod" muotoon \bmod: mod(−7,3) ja 17 mod 5 → mod-funktio
    const NUM = '-?\\d+(?:\\{,\\}\\d+|[.,]\\d+)?';
    latex = latex.replace(new RegExp('(' + NUM + ')\\s*\\\\[bp]?mod\\s*(' + NUM + ')', 'g'), '\\operatorname{mod}($1;$2)')
      .replace(/\\[bp]?mod\b\s*(?=\\left\(|\()/g, '\\operatorname{mod}');
    // suomalaisella näppäimistöllä MathLive tekee pilkusta desimaalipilkun {,}: mod(−7{,}3), max(3{,}7{,}2).
    // Näissä funktioissa pilkku erottaa luvut, ellei ; ole käytössä (max(3{,}7;2) = 3,7 ja 2)
    latex = (() => { let out = latex; const re = /(\\(?:max|min|gcd)|\\operatorname\{(?:mod|nCr|gcd|lcm|syt|pyj|max|min)\})\s*(\\left\(|\()/g; let m;
      while ((m = re.exec(out))) { let d = 0, k = m.index + m[0].length - m[2].length, st = m.index + m[0].length;
        for (; k < out.length; k++) { if (out.startsWith('\\left(', k)) { d++; k += 5; } else if (out[k] === '(') d++; else if (out.startsWith('\\right)', k) || out[k] === ')') { if (--d === 0) break; if (out[k] === '\\') k += 6; } }
        const inner = out.slice(st, k); if (!inner.includes(';') && inner.includes('{,}') && !inner.replace(/\{,\}/g, '').includes(',')) out = out.slice(0, st) + inner.replace(/\{,\}/g, ',') + out.slice(k); }
      return out; })();
    if (opts.units) latex = latex.replace(/[º˚]/g, '°');
    // lihavoitu yksikkö voi tulla muodossa \bm{…} tai \boldsymbol{…}, ja yhteen ryhmään voi kirjoittaa
    // monta yksikköä: \operatorname{\bm{N\cdot m^2}} → (\operatorname{\mathbf{N}}\cdot\operatorname{\mathbf{m}}^2)
    if (opts.units) {
      latex = latex.replace(/\\(?:bm|boldsymbol)\s*\{/g, '\\mathbf{');
      const OPS = /(\\cdot|·|\\times|\^\{[^{}]*\}|\^-?\d|\/)/;
      // ryhmän perään kirjoitettu potenssi näkyy viimeisen yksikön päällä (N·m²), joten se kuuluu sille
      const splitU = (c, pw) => {
        if (!/\\cdot|·|\\times|\^|\//.test(c) || lookupUnit(unitName(c))) return null;
        return '(' + c.split(OPS).map(p => !p.trim() ? '' : OPS.test(p) && p.match(OPS)[0] === p ? (p === '·' ? '\\cdot ' : p) : '\\operatorname{\\mathbf{' + p.trim() + '}}').join('') + (pw || '') + ')';
      };
      latex = latex.replace(/(?:\\(?:operatorname|mathrm|text)\{\s*\\mathbf\{((?:[^{}]|\{[^{}]*\})*)\}\s*\}|\\(?:operatorname|mathrm|text|mathbf)\{((?:[^{}]|\{[^{}]*\})*)\})(\^\{[^{}]*\}|\^-?\d)?/g, (m, a, b, pw) => splitU(a ?? b, pw) ?? m);
    }
    if (opts.units) latex = latex.replace(/(?:\{\}\^\{?\\circ\}?|\^\{?\\circ\}?|\\degree|°)\s*\\(?:mathrm|operatorname)\{(?:\\mathbf\{([CF])\}|([CF]))\}/g, (_, a, b) => '\\mathrm{°' + (a || b) + '}');
    const s = latex.replace(/\\placeholder\{[^}]*\}/g, () => { throw new Err('Kaavassa on tyhjä kohta.'); });
    let i = 0;
    const out = [];
    const absStack = [];

    const peekCmd = () => { const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i)); return m ? m[1] : null; };
    function readGroup() {
      while (s[i] === ' ') i++;
      if (s[i] === '{') {
        let d = 0, j = i;
        for (; j < s.length; j++) { if (s[j] === '\\') { j++; continue; } if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) break; }
        const inner = s.slice(i + 1, j); i = j + 1; return inner;
      }
      if (s[i] === '\\') { const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i)); i += m[0].length; return m[0]; }
      return s[i++] ?? '';
    }
    const sub = (t) => toAscii(t, opts);
    const grp = (str) => out.push({t:'grp', v:'(' + str + ')'});

    while (i < s.length) {
      const c = s[i];
      if (c === ' ' || c === '~') { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let n = '';
        while (i < s.length) {
          if (/[0-9.]/.test(s[i])) n += s[i++];
          else if (s.startsWith('{,}', i) && /[0-9]/.test(s[i+3] || '')) { n += '.'; i += 3; }
          // ohut väli numeroiden välissä ryhmittelee numeroita (6,674 30 tai 12 000), ei ole kertolasku
          else if (s.startsWith('\\,', i) && /[0-9]/.test(n.slice(-1)) && /[0-9]/.test(s[i+2] || '')) i += 2;
          else if (s[i] === ',' && /[0-9]/.test(n.slice(-1)) && /[0-9]/.test(s[i+1] || '') && !opts.commaArgs && inArgs() !== 1) { n += '.'; i++; }
          else break;
        }
        out.push({t:'num', v:n}); continue;
      }
      if (/[a-zA-Z]/.test(c)) { out.push({t:'var', v: c === 'E' ? 'Evar' : c}); i++; continue; }  // nerdamer reads E as e
      if (c === '\\') {
        const cmd = peekCmd(); i += cmd.length + 1;
        if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') { const a = readGroup(), b = readGroup();
          // d/dx written as a fraction: derivative of everything after it
          const dv = /^\s*(?:\\mathrm\{d\}|\\differentialD|d)\s*\{?([a-zA-Z])\}?\s*$/.exec(b);
          if (/^\s*(?:\\mathrm\{d\}|\\differentialD|d)\s*$/.test(a) && dv) { const body = toAscii(s.slice(i), {...opts, rad: true}); i = s.length; if (!body) throw new Err('Kirjoita derivoitava d/dx:n perään.'); grp('diff(' + body + ',' + dv[1] + ')'); continue; } const pv = out[out.length - 1];
          // mixed number 1½: a whole number right before a fraction of whole numbers
          if (pv && pv.t === 'num' && /^\d+$/.test(pv.v) && /^\s*\d+\s*$/.test(a) && /^\s*\d+\s*$/.test(b)) { out.pop(); grp(pv.v + '+' + a.trim() + '/' + b.trim()); continue; }
          grp('(' + sub(a) + ')/(' + sub(b) + ')'); continue; }
        if (cmd === 'sqrt') {
          let n = null;
          if (s[i] === '[') { const j = s.indexOf(']', i); n = s.slice(i + 1, j); i = j + 1; }
          const a = readGroup();
          grp(n ? '(' + sub(a) + ')^(1/(' + sub(n) + '))' : 'sqrt(' + sub(a) + ')'); continue;
        }
        if (cmd === 'left') {
          let d = s[i];
          if (d === '\\') { const k = peekCmd(); i += k.length + 1; d = (k === 'vert' || k === '|') ? '|' : '('; } else i++;
          if (d === '|') { out.push({t:'func', v:'abs'}); out.push({t:'lp'}); absStack.push(1); }
          else if (d !== '.') out.push({t:'lp'});
          continue;
        }
        if (cmd === 'right') {
          let d = s[i];
          if (d === '\\') { const k = peekCmd(); i += k.length + 1; d = (k === 'vert' || k === '|') ? '|' : ')'; } else i++;
          if (d !== '.') { out.push({t:'rp'}); if (d === '|') absStack.pop(); }
          continue;
        }
        if (cmd === 'vert' || cmd === '|') { absToggle(); continue; }
        if (cmd === 'cdot' || cmd === 'times' || cmd === 'ast') { out.push({t:'op', v:'*'}); continue; }
        if (cmd === 'div') { out.push({t:'op', v:'/'}); continue; }
        if (cmd === 'pi') { out.push({t:'var', v:'pi'}); continue; }
        if (cmd === 'infty') { out.push({t:'var', v:'Infinity'}); continue; }
        if (cmd === 'exponentialE') { out.push({t:'var', v:'e'}); continue; }
        if (cmd === 'imaginaryI') { out.push({t:'var', v:'i'}); continue; }
        if (cmd === 'degree' || cmd === 'circ') { degMark(); continue; }
        if (cmd === 'prime') { prime(1); continue; }
        if (cmd === 'mathrm' || cmd === 'mathit' || cmd === 'operatorname' || cmd === 'text' || cmd === 'mathbf') {
          const raw = readGroup();
          if (opts.units && cmd !== 'mathit' && cmd !== 'mathbf') {
            // letters typed one by one come as \mathrm{k}\mathrm{g}: join them
            // (but two whole units "N""m are N·m: a known unit next to a \mathbf unit is not joined)
            let name = unitName(raw), m;
            const bf = x => /^\s*\\mathbf\{/.test(x);
            while ((m = /^\s*\\(?:mathrm|text|operatorname)\{((?:[^{}]|\{[^{}]*\})*)\}/.exec(s.slice(i))) && /[a-zA-ZµΩ°Å\\]/.test(m[1]) && !(lookupUnit(name) && (bf(raw) || bf(m[1])))) { name += unitName(m[1]); i += m[0].length; }
            const u = name && lookupUnit(name);
            if (u) { opts.units.push({name, f: u[0], d: u[1]}); grp(sciNum(u[0]) + '*' + dimStr(u[1])); continue; }
            if ((name.length > 1 || cmd === 'text') && !FUNCS[name] && name !== 'log10') throw new Err('Tuntematon yksikkö ' + name + '.');
          }
          const a = raw.replace(/\\/g, '');
          if (cmd === 'text') continue;
          if (a === 'e') { out.push({t:'var', v:'e'}); continue; }
          if (FUNCS[a]) { out.push({t:'func', v: FUNCS[a] === 1 ? a : FUNCS[a]}); continue; }
          for (const ch of a) out.push({t:'var', v: ch === 'E' ? 'Evar' : ch});
          continue;
        }
        if (cmd === 'int') { integral(); continue; }
        if (cmd === 'lim') { limit(); continue; }
        if (cmd === 'sum' || cmd === 'prod') { series(cmd); continue; }
        if (cmd === 'coloneq' || cmd === 'coloneqq') { out.push({t:'op', v:':='}); continue; }
        if (cmd === 'binom') { const a = readGroup(), b = readGroup(); const n = '(' + sub(a) + ')', k = '(' + sub(b) + ')'; grp('(factorial(' + n + ')/(factorial(' + k + ')*factorial(' + n + '-' + k + ')))'); continue; }
        if (cmd === '%') { out.push({t:'op', v:'/'}); out.push({t:'num', v:'100'}); continue; }
        // sin^{-1} on paperilla arcsin (ei 1/sin)
        if ((cmd === 'sin' || cmd === 'cos' || cmd === 'tan') && /^\s*\^\s*(?:\{\s*-\s*1\s*\}|-1)/.test(s.slice(i))) { i += /^\s*\^\s*(?:\{\s*-\s*1\s*\}|-1)/.exec(s.slice(i))[0].length; out.push({t:'func', v: 'a' + cmd}); continue; }
        if (FUNCS[cmd]) { out.push({t:'func', v: FUNCS[cmd] === 1 ? cmd : FUNCS[cmd]}); continue; }
        if (/^[,;:! ]$/.test(cmd) || cmd === 'quad' || cmd === 'qquad' || cmd === 'displaystyle') continue;
        if (cmd === '{' ) { out.push({t:'lp'}); continue; }
        if (cmd === '}' ) { out.push({t:'rp'}); continue; }
        if (/^(le|ge|leq|geq|lt|gt|neq|ne|pm|mp)$/.test(cmd)) throw new Err('Merkkiä ' + ({pm:'±',mp:'∓'}[cmd] || '≤ ≥ ≠') + ' ei voi vielä laskea. Kirjoita yhtälö =-merkillä.');
        const greek = {alpha:1,beta:1,gamma:1,delta:1,theta:1,lambda:1,mu:1,phi:1,omega:1,sigma:1,rho:1,tau:1,epsilon:1,varphi:1,varepsilon:1,zeta:1,eta:1,kappa:1,nu:1,xi:1,chi:1,psi:1,vartheta:1};
        if (greek[cmd]) { out.push({t:'var', v:cmd}); continue; }
        // ΔT, Δx, Δ\theta: one variable name
        if (cmd === 'Delta') { const m = /^\s*(?:([a-zA-Z])|\\([a-zA-Z]+))/.exec(s.slice(i)); const g2 = m && (m[1] || (greek[m[2]] && m[2]));
          if (g2) i += m[0].length; out.push({t:'var', v:'Delta' + (g2 || '')}); continue; }
        throw new Err('En osaa laskea merkkiä \\' + cmd + '.');
      }
      if (c === '^') {
        i++;
        const g = readGroup();
        if (/^\s*\\circ\s*$/.test(g)) { degMark(); continue; }
        if (/^\s*(?:\\prime\s*)+$/.test(g)) { prime(g.match(/\\prime/g).length); continue; }
        if (/^\s*\\doubleprime\s*$/.test(g)) { prime(2); continue; }
        out.push({t:'op', v:'^'}); grp(sub(g)); continue;
      }
      if (c === '_') {
        i++;
        const g = readGroup();
        const prev = out[out.length - 1];
        if (prev && prev.t === 'func' && (prev.v === 'log10' || prev.v === 'log')) { prev.base = sub(g); continue; }
        if (prev && prev.t === 'var') { prev.v += g.replace(/[^a-zA-Z0-9]/g, ''); continue; }
        continue;
      }
      if (c === '{') { const g = readGroup(); grp(sub(g)); continue; }
      if (c === '}') { i++; continue; }
      if (c === '(' || c === '[') { out.push({t:'lp'}); i++; continue; }
      if (c === ')' || c === ']') { out.push({t:'rp'}); i++; continue; }
      if (c === '|') { i++; absToggle(); continue; }
      if (c === ':' && s[i+1] === '=') { out.push({t:'op', v:':='}); i += 2; continue; }
      if (c === ':') { out.push({t:'op', v:'/'}); i++; continue; }   // koulun jakomerkki: 3,6 : 1,2
      if ('+-*/='.includes(c)) { out.push({t:'op', v:c}); i++; continue; }
      if (c === '!') { out.push({t:'fact'}); i++; continue; }
      if (c === ',') { out.push({t:'comma'}); i++; continue; }
      if (c === ';') { out.push({t: inArgs() ? 'comma' : 'semi'}); i++; continue; }
      if (c === "'") { let n = 0; while (s[i] === "'") { n++; i++; } prime(n); continue; }
      if (c === '°' || c === 'º' || c === '˚') { degMark(); i++; continue; }
      throw new Err('En osaa laskea merkkiä ' + c + '.');
    }
    return factExact(join(out, useDeg));

    function absToggle() {
      const prev = out[out.length - 1];
      const operandBefore = prev && ['num','var','grp','rp','fact'].includes(prev.t);
      if (absStack.length && operandBefore) { absStack.pop(); out.push({t:'rp'}); }
      else { absStack.push(1); out.push({t:'func', v:'abs'}); out.push({t:'lp'}); }
    }
    // f'(x), f''(x) of a defined function f: its derivative as a new function
    function prime(n) {
      const p = out[out.length - 1];
      if (!(p && p.t === 'var')) return;
      const base = p.v.replace(/(?:prime)+$/, ''), name = p.v + 'prime'.repeat(n);
      p.v = name;
      const d = userDefs[base]; if (!d || userFns.has(name)) return;
      let body = d.body; for (let k = 0; k < name.length - base.length; k += 5) body = nerdamer('diff(' + body + ',' + d.v + ')').toString();
      nerdamer.setFunction(name, [d.v], body);
      nerdamer.setFunction(name + 'Qdeg', [d.v], degBody(body));
      userFns.add(name); userDefs[name] = {v: d.v, body};
    }
    // inside max(…), min(…) etc.: commas and semicolons separate the arguments
    function inArgs() {
      let d = 0;
      for (let k = out.length - 1; k >= 0; k--) {
        if (out[k].t === 'rp') d++;
        else if (out[k].t === 'lp' && d-- === 0) return out[k - 1] && out[k - 1].t === 'func' && MULTI[out[k - 1].v] || 0;
      }
      return false;
    }
    function degMark() {
      if (!useDeg) out.push({t:'grp', v:'(pi/180)'});
      // in degree mode the number already means degrees
    }
    // limits and the bounds of Σ/Π: _{...} and ^{...} right after the command
    function bounds() {
      let lo = null, hi = null;
      for (let k = 0; k < 2; k++) {
        while (s[i] === ' ') i++;
        if (s[i] === '_') { i++; lo = readGroup(); } else if (s[i] === '^') { i++; hi = readGroup(); }
      }
      return [lo, hi];
    }
    function limit() {
      const [lo] = bounds();
      const m = lo && /^\s*([a-zA-Z])\s*(?:\\to|\\rightarrow|\\longrightarrow)\s*(.+)$/.exec(lo);
      if (!m) throw new Err('Kirjoita raja-arvon alle esim. x→2.');
      let to = m[2].trim(), dir = 0;
      // toispuolinen raja-arvo x→0⁺ / x→0⁻
      const om = /\^\{?\s*([+-])\s*\}?\s*$/.exec(to); if (om) { dir = om[1] === '+' ? 1 : -1; to = to.slice(0, om.index).trim(); }
      to = /^[+]?\\infty$/.test(to) ? 'Infinity' : /^-\\infty$/.test(to) ? '-Infinity' : sub(to);
      const body = toAscii(s.slice(i), {...opts, rad: true}); i = s.length;
      if (!body) throw new Err('Kirjoita lauseke lim:n perään.');
      const lg = giacLimit(body, m[1], to, dir); if (lg !== null) { grp(lg); return; }
      if (dir) throw new Err('Toispuolisia raja-arvoja en osaa vielä laskea.');
      grp('limit(' + body + ',' + m[1] + ',' + to + ')');
    }
    function series(cmd) {
      const [lo, hi] = bounds();
      const m = lo && /^\s*([a-zA-Z])\s*=\s*(.+)$/.exec(lo);
      if (!m || hi === null) throw new Err('Kirjoita ' + (cmd === 'sum' ? 'summan' : 'tulon') + ' rajat, esim. k=1 alle ja n ylle.');
      const body = sub(s.slice(i)); i = s.length;
      if (!body) throw new Err('Kirjoita lauseke ' + (cmd === 'sum' ? 'Σ' : 'Π') + ':n perään.');
      const from = Number(nerdamer(sub(m[2])).evaluate().text('decimals'));
      if (!Number.isInteger(from)) throw new Err('Alarajan pitää olla kokonaisluku.');
      if (/^\\infty$/.test(hi.trim())) {
        if (cmd !== 'sum') throw new Err('Päättymätöntä tuloa en osaa laskea.');
        const gs = giacEval('sum(' + toG(body) + ',' + m[1] + ',' + from + ',inf)');
        if (gs && /infinity/.test(gs)) throw new Err('Summa hajaantuu.');
        const g = gs && fromGiac(GR(gs)); let gn = null; try { gn = g && numeric(g); } catch {}
        if (g && gn !== null && isFinite(gn)) { grp(g); return; }
        grp(String(infiniteSum(body, m[1], from))); return;
      }
      const to = Number(nerdamer(sub(hi)).evaluate().text('decimals'));
      if (!Number.isInteger(to)) throw new Err('Ylärajan pitää olla kokonaisluku (esim. 10), ei kirjain.');
      if (to - from > 100000) throw new Err('Summassa on liian monta termiä.');
      // with factorials (binomial sums) the terms are written out, so each factorial is exact (nerdamer's own sum rounded them)
      if (/factorial|!/.test(body) && to - from <= 200) { const ts = []; for (let k = from; k <= to; k++) ts.push('(' + body.replace(new RegExp('(?<![a-zA-Z_])' + m[1] + '(?![a-zA-Z_0-9])', 'g'), '(' + k + ')') + ')');
        grp(ts.length ? factExact(ts.join(cmd === 'sum' ? '+' : '*')) : cmd === 'sum' ? '0' : '1'); return; }
      // paljon termejä: desimaaleilla (nerdamerin tarkka lasku jumittaa); kokonaisluvut pysyvät tarkkoina
      if (cmd === 'sum' && to - from > 1000 && !vars(body).some(u => u !== m[1])) { const f = numFn(body, m[1]);
        if (f) { let S = 0, c = 0, whole = true; for (let k = from; k <= to; k++) { const t = f(k); if (!isFinite(t)) throw new Err('Summa hajaantuu.'); if (whole && t !== Math.round(t)) whole = false; const y = t - c, z = S + y; c = (z - S) - y; S = z; }
          if (!(whole && Math.abs(S) < 2 ** 53)) approxHit = true; grp(String(S)); return; } }
      grp((cmd === 'sum' ? 'sum(' : 'product(') + body + ',' + m[1] + ',' + from + ',' + to + ')');
    }
    function infiniteSum(body, v, from) {
      const f = numFn(body, v) || nerdamer(body).buildFunction([v]);
      let S = 0, small = 0;
      let t = 0;
      for (let k = from; k < from + 1000000; k++) {
        t = f(k);
        if (!isFinite(t)) throw new Err('Summa hajaantuu.');
        S += t;
        if (Math.abs(t) <= 1e-15 * Math.max(1, Math.abs(S))) { if (++small > 50) return S; } else small = 0;
      }
      if (Math.abs(t) * 1e6 < 1e-4) return S; // slow but converging, e.g. 1/k²
      throw new Err('Summa hajaantuu.');
    }
    function integral() {
      let lo = null, hi = null;
      for (let k = 0; k < 2; k++) {
        while (s[i] === ' ') i++;
        if (s[i] === '_') { i++; lo = readGroup(); } else if (s[i] === '^') { i++; hi = readGroup(); }
      }
      const rest = s.slice(i);
      const m = /(?:\\[,;! ]|\s)*(?:\\mathrm\{d\}|\\differentialD|d)\s*([a-zA-Z])\s*$/.exec(rest);
      if (!m) throw new Err('Integraalista puuttuu dx.');
      // integraali aina radiaaneina (asteet vain, jos ne on kirjoitettu: sin 30°)
      const body = toAscii(rest.slice(0, m.index), {...opts, rad: true}); const v = m[1];
      i = s.length;
      const rb = t => toAscii(t, {...opts, rad: true});
      if (lo !== null && hi !== null) grp(defInt(body, rb(lo), rb(hi), v));
      else grp('integrate(' + body + ',' + v + ')');
    }
  }

  function join(tokens, useDeg) {
    // function arguments without parentheses, powers like sin^2 x, log bases
    const t = [];
    for (let k = 0; k < tokens.length; k++) {
      const tok = tokens[k];
      if (tok.t !== 'func') { t.push(tok); continue; }
      let name = tok.v;
      if (useDeg && ATRIG[name]) name += 'd';
      let pow = null;
      if (tokens[k+1] && tokens[k+1].t === 'op' && tokens[k+1].v === '^' && tokens[k+2]) { pow = tokens[k+2].v; k += 2; }
      let argTokens;
      if (tokens[k+1] && tokens[k+1].t === 'lp') {
        let d = 0, j = k + 1;
        for (; j < tokens.length; j++) { if (tokens[j].t === 'lp') d++; else if (tokens[j].t === 'rp' && --d === 0) break; }
        argTokens = tokens.slice(k + 2, j); k = j;
      } else {
        // the argument ends at + − = , ) and at the next function name (sin x cos x = sin(x)·cos(x));
        // a function right at the start is nested (ln sin x), brackets inside are kept whole
        let j = k + 1, d = 0; const a = [];
        while (j < tokens.length) {
          const x = tokens[j], pr = a[a.length - 1];
          if (!d && x.t === 'op' && x.v !== '^') break;
          if (!d && (x.t === 'comma' || x.t === 'semi' || x.t === 'rp')) break;
          if (!d && x.t === 'func' && a.some(y => y.t !== 'func') && !(pr && pr.t === 'op')) break;
          if (x.t === 'lp') d++; else if (x.t === 'rp') d--;
          a.push(x); j++;
        }
        if (!a.length) throw new Err('Funktiolta ' + tok.v + ' puuttuu argumentti.');
        argTokens = a; k = j - 1;
      }
      const arg = join(argTokens, useDeg);
      // degrees, but an angle with π in it is in radians: cos π = −1 also in degree mode
      if (useDeg && TRIG[name] && !/\bpi\b/.test(arg)) name += 'd';
      let str = tok.base ? '(log(' + arg + ')/log(' + tok.base + '))' : name + '(' + arg + ')';
      if (pow) str = '(' + str + ')^' + pow;
      t.push({t:'grp', v:str});
    }
    let res = '';
    const left = new Set(['num','var','grp','rp','fact']);
    const right = new Set(['num','var','grp','lp','func']);
    for (let k = 0; k < t.length; k++) {
      const a = t[k - 1], b = t[k];
      if (a && left.has(a.t) && right.has(b.t)) {
        const isCall = a.t === 'var' && b.t === 'lp' && userFns.has(a.v);
        if (!isCall) res += '*';
      }
      // a defined function in degree mode: its degree version (f(x):=sin x, f(30) = 1/2)
      if (useDeg && b.t === 'var' && t[k + 1] && t[k + 1].t === 'lp' && userFns.has(b.v)) { res += b.v + 'Qdeg'; continue; }
      res += b.t === 'num' || b.t === 'var' || b.t === 'grp' || b.t === 'op' ? b.v
        : b.t === 'lp' ? '(' : b.t === 'rp' ? ')' : b.t === 'fact' ? '!' : b.t === 'comma' ? ',' : b.t === 'semi' ? ';' : '';
    }
    return res;
  }

  // whole-number factorials and binomials as exact digits (nerdamer gave 52!/(5!·47!) = 0 and 20!/(10!·10!) = 184755,99)
  function factExact(s) {
    if (!/!|factorial|nCr/.test(s)) return s;
    const int = arg => { if (/[a-zA-Z]/.test(arg)) return null; let n; try { n = Number(nerdamer(arg).evaluate().text('decimals')); } catch { return null; } return Number.isInteger(n) && n >= 0 && n <= 170 ? n : null; };
    const fact = n => { let r = 1n; for (let k = 2n; k <= BigInt(n); k++) r *= k; return r; };
    const A = '((?:[^()]|\\((?:[^()]|\\([^()]*\\))*\\))*)';
    for (let k = 0; k < 20; k++) {
      const t = s.replace(new RegExp('factorial\\(' + A + '\\)', 'g'), (w, a) => { const n = int(a); return n === null ? w : '(' + fact(n) + ')'; })
        .replace(/(\d+)!|\(([^()a-zA-Z]*)\)!/g, (w, a, b) => { const n = int(a || b); return n === null ? w : '(' + fact(n) + ')'; })
        .replace(/nCr\(([^(),;]+)[,;]([^(),;]+)\)/g, (w, a, b) => { const n = int(a), q = int(b); if (n === null || q === null) return w; if (q > n) return '0';
          let r = 1n; for (let j = 1; j <= Math.min(q, n - q); j++) r = r * BigInt(n - j + 1) / BigInt(j); return '(' + r + ')'; });
      if (t === s) break; s = t;
    }
    return s;
  }
  // a radian expression in degree mode: sin(x) → sind(x)
  const degBody = b => b.replace(/(^|[^a-zA-Z])(sin|cos|tan|cot|sec|csc)\(/g, '$1$2d(');

  // ---------- formatting ----------
  // ---------- numbers too big for the computer (over ~10^308) ----------
  // works with the base-10 logarithm instead of the number: value = s·10^l
  function bigLog(src) {
    const toks = src.replace(/\s+/g, '').match(/\d+\.?\d*(?:e[+-]?\d+)?|[a-zA-Z_]+|[-+*/^()!]/g) || [];
    let i = 0; const peek = () => toks[i], eat = t => { if (toks[i] !== t) throw 0; i++; };
    const LN10 = Math.LN10, num = x => x === 0 ? {s: 0, l: -Infinity} : {s: Math.sign(x), l: Math.log10(Math.abs(x))};
    const val = a => a.s * Math.pow(10, a.l);
    const add = (a, b) => {
      if (!a.s) return b; if (!b.s) return a; if (a.l < b.l) [a, b] = [b, a];
      const d = Math.pow(10, b.l - a.l), k = a.s === b.s ? 1 + d : 1 - d;
      return k <= 1e-15 ? {s: 0, l: -Infinity} : {s: a.s, l: a.l + Math.log10(k)};
    };
    const lgam = n => { if (n < 30) { let t = 0; for (let k = 2; k <= n; k++) t += Math.log(k); return t; } return n * Math.log(n) - n + .5 * Math.log(2 * Math.PI * n) + 1 / (12 * n); };
    const pow = (a, b) => {
      let e = val(b); if (!isFinite(e)) throw 0; if (Math.abs(e - Math.round(e)) < 1e-9 * Math.max(1, Math.abs(e))) e = Math.round(e);
      if (!a.s) return e > 0 ? a : (() => { throw 0; })();
      if (a.s < 0 && !Number.isInteger(e)) throw 0;
      return {s: a.s < 0 && e % 2 ? -1 : 1, l: e * a.l};
    };
    function expr() { let a = term(); while (peek() === '+' || peek() === '-') { const o = toks[i++], b = term(); a = add(a, o === '-' ? {s: -b.s, l: b.l} : b); } return a; }
    function term() { let a = unary(); while (peek() === '*' || peek() === '/') { const o = toks[i++], b = unary(); if (o === '/' && !b.s) throw 0; a = {s: a.s * b.s, l: o === '*' ? a.l + b.l : a.l - b.l}; } return a; }
    function unary() { if (peek() === '-') { i++; const a = unary(); return {s: -a.s, l: a.l}; } if (peek() === '+') { i++; return unary(); } return power(); }
    function power() { const a = post(); if (peek() === '^') { i++; return pow(a, unary()); } return a; }
    const fact = a => { let n = val(a); if (Math.abs(n - Math.round(n)) < 1e-9 * Math.max(1, n)) n = Math.round(n); if (!(n >= 0) || !Number.isInteger(n) || !isFinite(n)) throw 0; return {s: 1, l: lgam(n) / LN10}; };
    function post() { let a = atom(); while (peek() === '!') { i++; a = fact(a); } return a; }
    function atom() {
      const t = toks[i++]; if (t === undefined) throw 0;
      if (t === '(') { const a = expr(); eat(')'); return a; }
      if (/^\d/.test(t)) return num(parseFloat(t));
      if (t === 'pi') return num(Math.PI);
      if (t === 'e') return num(Math.E);
      if (peek() === '(') {
        i++; const a = expr(); eat(')');
        if (t === 'sqrt') return pow(a, num(.5));
        if (t === 'exp') { const x = val(a); if (!isFinite(x)) throw 0; return {s: 1, l: x / LN10}; }
        if (t === 'abs') return {s: a.s ? 1 : 0, l: a.l};
        if (t === 'factorial') return fact(a);
      }
      throw 0;
    }
    try { const r = expr(); if (i !== toks.length || !r.s || !isFinite(r.l)) return null; return r; } catch { return null; }
  }
  // 4,28·10^{369 693 099}
  function bigTex(r) {
    if (Math.abs(r.l) < 300) return null;
    const sign = r.s < 0 ? '-' : '';
    if (Math.abs(r.l) >= 1e15) return sign + '10^{' + fmtNum(r.l) + '}';
    const E = Math.floor(r.l), m = Math.pow(10, r.l - E);
    const exp = String(Math.abs(E)).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
    return sign + String(parseFloat(m.toPrecision(5))).replace('.', DEC()) + '\\cdot10^{' + (E < 0 ? '-' : '') + exp + '}';
  }
  function fmtNum(x) {
    if (!isFinite(x)) return x > 0 ? '\\infty' : x < 0 ? '-\\infty' : '\\text{ei määritelty}';
    if (x === 0) return '0';
    let str = Math.abs(x) >= 1e12 || Math.abs(x) < 1e-6 ? x.toExponential(8).replace(/\.?0+e/, 'e') : String(parseFloat(x.toPrecision(10)));
    if (str.includes('e')) { const [m, e] = str.split('e'); str = m + '\\cdot10^{' + parseInt(e) + '}'; }
    return str.replace(/\./g, DEC());
  }
  // desimaalimerkki kielen mukaan (suomeksi pilkku, englanniksi piste)
  function DEC() { return typeof Kieli === 'undefined' || Kieli.pilkku ? '{,}' : '.'; }
  function tex(expr) {
    let t = nerdamer(expr).toTeX();
    t = t.replace(/(\d)\.(\d)/g, '$1{,}$2').replace(/\\mathrm\{log10\}/g, '\\lg').replace(/\\ln_\{10\}/g, "\\lg").replace(/\\mathrm\{log\}/g, '\\ln')
      .replace(/\\mathrm\{a(sin|cos|tan)\}/g, '\\arc$1').replace(/\\mathrm\{(sin|cos|tan|cot|sinh|cosh|tanh|exp)\}/g, '\\$1').replace(/\\mathrm\{abs\}\\left\((.*?)\\right\)/g, '\\left|$1\\right|')
      .replace(/\\(ln|lg)\\left\((\d+)\\right\)/g, '\\$1 $2');   // ln(5) → ln 5
    return t;
  }
  // exact fraction p/q as a decimal through BigInt (keeps 1,6·10⁻¹⁹ and 10⁻³⁰⁰; Number() of a long fraction gives 0 or NaN)
  function ratNum(str) {
    const m = /^\(?(-?)(\d+)(?:\/(\d+))?\)?$/.exec(String(str).replace(/\s/g, ''));
    if (!m) return null;
    const q = m[3] || '1', k = q.length - m[2].length + 20, P = BigInt(m[2]), Q = BigInt(q);
    const r = k >= 0 ? P * 10n ** BigInt(k) / Q : P / (Q * 10n ** BigInt(-k));
    return parseFloat(m[1] + r + 'e' + (-k));
  }
  function numeric(expr) {
    const v = nerdamer(expr).evaluate();
    const ex = ratNum(v.toString()); if (ex) return ex;
    const txt = v.text('decimals');
    let n = /^-?[0-9.e+-]+$/.test(txt) ? parseFloat(txt) : null;
    // nerdamer can lose a result (100·0,89089^8,7 → 0) and keeps only a fixed number of decimals (√2·10⁻²⁰ → 0):
    // check with plain decimals when the number is 0, small or missing
    // (an exact 0 stays 0 unless the decimals clearly disagree: 0,1·3−0,3 leaves a decimal rest 5,6·10⁻¹⁷)
    const big = ex === 0 ? Math.max(1, ...(String(expr).match(/\d+(?:\.\d+)?/g) || []).map(Number)) * 1e-9 : 0;
    if (!n || Math.abs(n) < 1e-4) for (const e of [v.toString(), String(expr)]) { const f = jsFn(e, '__q'); if (f) { const y = f(0); if (isFinite(y) && y !== 0 && Math.abs(y) > big) { n = y; break; } } }
    return n;
  }
  function vars(expr) { try { return nerdamer(expr).variables().filter(v => !['pi','e','i'].includes(v)); } catch { return []; } }
  function pickVar(expr, want) { const v = vars(expr); return want && v.includes(want) ? want : v.includes('x') ? 'x' : v[0] || 'x'; }

  // ---------- vectors and matrices ----------
  // matrices: \begin{pmatrix}…\end{pmatrix}; vectors also as 2ī+3j̄ (bar over i, j, k). Entries stay exact (nerdamer strings).
  const matVars = new Map();
  const BAR = '\\\\(?:overline|bar|vec|overrightarrow)\\s*\\{?\\s*([a-zA-Z])\\s*\\}?';
  function matRun(latex, action) {
    const cells = [];
    let L = latex.replace(/\\left\(\s*\\begin\{matrix\}([\s\S]*?)\\end\{matrix\}\s*\\right\)/g, '\\begin{pmatrix}$1\\end{pmatrix}');
    L = L.replace(/\\begin\{([pbBvV]?matrix)\*?\}([\s\S]*?)\\end\{\1\*?\}/g, (_, k, body) => {
      const rows = body.split(/\\\\/).map(r => r.split('&').map(c => c.replace(/\\placeholder\{\}/g, '').trim())).filter(r => r.some(c => c));
      cells.push(rows); return ' Q_{' + (900 + cells.length - 1) + '} ';
    });
    const ijk = new RegExp(BAR.replace('[a-zA-Z]', '[ijk]')).test(L);
    const barred = [];
    L = L.replace(new RegExp(BAR, 'g'), (_, x) => { barred.push(x); return ' ' + x + ' '; });   // välit: \cdot\overline{v} ei saa olla \cdotv
    const dm = /^\s*([a-zA-Z])\s*(?::=|\\coloneq|\\coloneqq)([\s\S]+)$/.exec(L);
    const body = dm ? dm[2] : L;
    const marks = body.replace(/\\times/g, '\\cdot Q_{999}\\cdot ').replace(/\\det|\\operatorname\{det\}/g, ' Q_{998}');
    if (!cells.length && !ijk && !/Q_\{99[89]\}/.test(marks) && !barred.some(x => matVars.has(x))) {
      if (!matVars.size) return null;
      // stored matrix names used without bars (A·B)
      let a0; try { a0 = toAscii(marks); } catch { return null; }
      if (!(a0.match(/[A-Za-z]\w*/g) || []).some(t => matVars.has(t))) { if (dm) matVars.delete(dm[1]); return null; }
    }
    const dim = /\\(?:overline|bar|vec|overrightarrow)\s*\{?\s*k/.test(latex) || barred.some(x => matVars.has(x) && matVars.get(x).m.flat().length === 3) ? 3 : 2;
    const ascii = toAscii(marks).replace(/\bd\*e\*t\*\(/g, 'Q998*(');
    const conv = rows => rows.map(r => r.map(c => S(toAscii(c || '0', action === 'approx' ? {rad: true} : {}))));
    // vektoriyhtälö (1, t)·(3, 4) = 0 tai |(t, 3)| = 5: puolet erikseen, sitten Ratkaise (vektorit komponenteittain)
    const eqAt = ascii.indexOf('=');
    if (!dm && eqAt > 0 && ascii.indexOf('=', eqAt + 1) < 0 && ['solve', 'calc', 'approx'].includes(action)) {
      const M = cells.map(conv), d0 = ijk || barred.length ? dim : 0, Lh = matEval(ascii.slice(0, eqAt), M, d0), Rh = matEval(ascii.slice(eqAt + 1), M, d0);
      if (isMat(Lh) !== isMat(Rh)) throw ME('Yhtälön molemmilla puolilla pitää olla vektori tai molemmilla luku.');
      const eqs = isMat(Lh) ? Lh.m.flat().map((x, k) => '(' + x + ')=(' + (Rh.m.flat()[k] ?? '0') + ')') : ['(' + Lh + ')=(' + Rh + ')'];
      return solve(eqs.join(';'));
    }
    const v = matEval(ascii, cells.map(conv), ijk || barred.length ? dim : 0);
    if (dm) {
      if (!isMat(v)) { matVars.delete(dm[1]); return null; }
      matVars.set(dm[1], v);
      return {tex: '\\text{muistissa } ' + (barred.includes(dm[1]) ? '\\overline{' + dm[1] + '}' : dm[1])};
    }
    // vektorien välinen kulma arccos(…) asteina: °-merkki
    if (!isMat(v) && deg && /^\s*a(?:sin|cos|tan)d\(/.test(ascii) && /\)\s*$/.test(ascii) && (() => { let k = 0; const t = ascii.trim(); for (let j = t.indexOf('('); j < t.length; j++) { if (t[j] === '(') k++; else if (t[j] === ')' && !--k) return j === t.length - 1; } return false; })()) {
      const n = numeric(v); if (n !== null && isFinite(n)) return {tex: (action !== 'approx' && Math.abs(n - Math.round(n)) < 1e-9 ? '=' + fmtNum(Math.round(n)) : '\\approx ' + fmtNum(n)) + '^{\\circ}'}; }
    if (!isMat(v)) return {tex: action === 'approx' ? '\\approx ' + fmtNum(numeric(v)) : present(v)};
    const E = x => action === 'approx' ? (numeric(x) === null ? tex(x) : fmtNum(numeric(x))) : tex(x);
    const vec = v.m.length === 1 || v.m[0].length === 1, flat = v.m.flat();
    if ((ijk || barred.length) && vec && flat.length <= 3) {
      let out = '';
      flat.forEach((c, k) => {
        if (S(c) === '0') return;
        let t = E(c); const unit = '\\overline{' + 'ijk'[k] + '}';
        if (t === '1') t = ''; else if (t === '-1') t = '-'; else if (/[+-]/.test(t.slice(1))) t = '\\left(' + t + '\\right)';
        out += (out && !t.startsWith('-') ? '+' : '') + t + unit;
      });
      return {tex: '=' + (out || '\\overline{0}')};
    }
    return {tex: (action === 'approx' ? '\\approx' : '=') + '\\begin{pmatrix}' + v.m.map(r => r.map(x => E(x).replace(/\\frac/g, '\\dfrac')).join('&')).join('\\\\') + '\\end{pmatrix}'};
  }
  const S = s => nerdamer(s).toString();
  const isMat = v => !!(v && typeof v === 'object' && v.m);
  const ME = t => new Err(t);
  function matEval(ascii, mats, dim) {
    const toks = ascii.match(/\d+(?:\.\d+)?|[A-Za-z_]\w*|\S/g) || [];
    let i = 0;
    const peek = () => toks[i], eat = t => toks[i] === t ? (i++, true) : false;
    const shape = a => a.m.length + '×' + a.m[0].length;
    const isVec = a => isMat(a) && (a.m.length === 1 || a.m[0].length === 1);
    const map = (a, f) => ({m: a.m.map(r => r.map(f))});
    // ī + j̄ (2D) with a 3D vector: fill the missing k̄ part with 0
    const padV = (a, b) => { const n = Math.max(a.m.flat().length, b.m.flat().length), p = v => ({m: [...v.m.flat(), '0', '0', '0'].slice(0, n).map(x => [x])}); return [p(a), p(b)]; };
    const add = (a, b, s) => {
      if (!isMat(a) && !isMat(b)) return S('(' + a + ')' + (s < 0 ? '-' : '+') + '(' + b + ')');
      if (isMat(a) !== isMat(b)) throw ME('Lukua ja vektoria (tai matriisia) ei voi laskea yhteen.');
      if (isVec(a) && isVec(b) && dim) { [a, b] = padV(a, b); }
      if (isVec(a) && isVec(b) && a.m.flat().length === b.m.flat().length) { const bf = b.m.flat(); let k = 0; return map(a, x => S('(' + x + ')' + (s < 0 ? '-' : '+') + '(' + bf[k++] + ')')); }
      if (shape(a) !== shape(b)) throw ME('Yhteenlasku vaatii samankokoiset matriisit (' + shape(a) + ' ja ' + shape(b) + ').');
      return {m: a.m.map((r, y) => r.map((x, z) => S('(' + x + ')' + (s < 0 ? '-' : '+') + '(' + b.m[y][z] + ')')))};
    };
    const mul = (a, b) => {
      if (!isMat(a) && !isMat(b)) return S('(' + a + ')*(' + b + ')');
      if (!isMat(a)) return map(b, x => S('(' + a + ')*(' + x + ')'));
      if (!isMat(b)) return map(a, x => S('(' + x + ')*(' + b + ')'));
      if (isVec(a) && isVec(b) && dim) [a, b] = padV(a, b);
      if (isVec(a) && isVec(b) && a.m.flat().length === b.m.flat().length) {
        const af = a.m.flat(), bf = b.m.flat();
        return S(af.map((x, k) => '(' + x + ')*(' + bf[k] + ')').join('+')); // dot product
      }
      if (a.m[0].length !== b.m.length) throw ME('Kertolasku ei onnistu: ' + shape(a) + ' ja ' + shape(b) + ' (vasemman sarakkeita pitää olla yhtä monta kuin oikean rivejä).');
      return {m: a.m.map(r => b.m[0].map((_, z) => S(r.map((x, k) => '(' + x + ')*(' + b.m[k][z] + ')').join('+'))))};
    };
    const det = a => {
      if (!isMat(a)) return a;
      const n = a.m.length; if (n !== a.m[0].length) throw ME('Determinantti on vain neliömatriisilla (nyt ' + shape(a) + ').');
      const d = M => M.length === 1 ? M[0][0] : M.length === 2 ? S('(' + M[0][0] + ')*(' + M[1][1] + ')-(' + M[0][1] + ')*(' + M[1][0] + ')')
        : S(M[0].map((x, z) => (z % 2 ? '-' : '+') + '(' + x + ')*(' + d(M.slice(1).map(r => r.filter((_, k) => k !== z))) + ')').join(''));
      return d(a.m);
    };
    const inv = a => {
      const D = det(a); if (S(D) === '0') throw ME('Matriisilla ei ole käänteismatriisia (determinantti on 0).');
      const n = a.m.length;
      if (n === 1) return {m: [[S('1/(' + D + ')')]]};
      const minor = (y, z) => ({m: a.m.filter((_, k) => k !== y).map(r => r.filter((_, k) => k !== z))});
      return {m: a.m.map((_, y) => a.m.map((_, z) => S(((y + z) % 2 ? '-' : '') + '(' + det(minor(z, y)) + ')/(' + D + ')')))};
    };
    const cross = (a, b) => {
      if (!isVec(a) || !isVec(b)) throw ME('Ristitulo (×) lasketaan kahdelle vektorille.');
      const p = v => { const f = v.m.flat(); if (f.length > 3) throw ME('Ristitulo on vain kolmiulotteisille vektoreille.'); return [...f, '0', '0'].slice(0, 3); };
      const [x1, y1, z1] = p(a), [x2, y2, z2] = p(b), c = (u, v, w, q) => S('(' + u + ')*(' + v + ')-(' + w + ')*(' + q + ')');
      const r = [c(y1, z2, z1, y2), c(z1, x2, x1, z2), c(x1, y2, y1, x2)];
      return a.m.length === 1 ? {m: [r]} : {m: r.map(x => [x])};
    };
    const power = () => {
      let a = atom();
      if (!eat('^')) return a;
      if (peek() === '(' && toks[i + 1] === 'T' && toks[i + 2] === ')') { i += 3; return isMat(a) ? {m: a.m[0].map((_, z) => a.m.map(r => r[z]))} : a; }
      if (eat('T')) return isMat(a) ? {m: a.m[0].map((_, z) => a.m.map(r => r[z]))} : a;
      const e = power();
      if (!isMat(a)) { if (isMat(e)) throw ME('Potenssi ei voi olla matriisi.'); return S('(' + a + ')^(' + e + ')'); }
      const n = numeric(e); if (n === null || n !== Math.round(n)) throw ME('Matriisin potenssin pitää olla kokonaisluku.');
      if (a.m.length !== a.m[0].length) throw ME('Potenssiin voi korottaa vain neliömatriisin.');
      let base = n < 0 ? inv(a) : a, r = base; for (let k = 1; k < Math.abs(n); k++) r = mul(r, base);
      if (n === 0) return {m: a.m.map((rr, y) => rr.map((_, z) => y === z ? '1' : '0'))};
      return r;
    };
    const unary = () => eat('-') ? mul('-1', unary()) : eat('+') ? unary() : power();
    const term = () => {
      let a = unary();
      for (;;) {
        if (peek() === '*' && toks[i + 1] === 'Q999') { i += 2; eat('*'); a = cross(a, unary()); }
        else if (eat('*')) a = mul(a, unary());
        else if (eat('/')) { const b = unary(); if (isMat(b)) throw ME('Vektorilla tai matriisilla ei voi jakaa.'); a = isMat(a) ? map(a, x => S('(' + x + ')/(' + b + ')')) : S('(' + a + ')/(' + b + ')'); }
        else return a;
      }
    };
    const expr = () => { let a = term(); for (;;) { if (eat('+')) a = add(a, term(), 1); else if (eat('-')) a = add(a, term(), -1); else return a; } };
    function atom() {
      const t = toks[i++];
      if (t === undefined) throw ME('Lauseke jäi kesken.');
      if (t === '(') { const a = expr(); if (!eat(')')) throw ME('Tarkista sulut.'); return a; }
      if (/^\d/.test(t)) return t;
      if (t === 'Q998') { eat('*'); return det(power()); }
      if (/^Q9\d\d$/.test(t)) return {m: mats[+t.slice(1) - 900]};
      if (dim && /^[ijk]$/.test(t)) return {m: Array.from({length: dim}, (_, k) => ['ijk'.indexOf(t) === k ? '1' : '0'])};
      if (matVars.has(t)) return matVars.get(t);
      if (/^[A-Za-z]/.test(t) && peek() === '(') {
        i++; const a = expr(); if (!eat(')')) throw ME('Tarkista sulut.');
        if (t === 'abs') return !isMat(a) ? S('abs(' + a + ')') : isVec(a) ? S('sqrt(' + a.m.flat().map(x => '(' + x + ')^2').join('+') + ')') : det(a);
        if (t === 'det') return det(a);
        if (isMat(a)) throw ME('Funktiota ' + t + ' ei voi käyttää vektoriin.');
        return S(t + '(' + a + ')');
      }
      return t;
    }
    const v = expr();
    if (i < toks.length) throw ME('En ymmärrä kohtaa "' + toks.slice(i).join('') + '".');
    return v;
  }

  // ---------- statistics: numbers separated by ; ----------
  function statRun(latex) {
    // englanniksi (desimaalipiste) luvut voi erottaa myös pilkulla: 3, 4, 4, 5, 9
    const sep = latex.includes(';') ? ';' : DEC() === '.' && (latex.match(/,/g) || []).length >= 2 ? ',' : null;
    if (!sep || /[=<>]/.test(latex)) return null;
    const parts = latex.split(sep).map(p => p.replace(/\\[,;: ]|\\quad/g, '').trim()).filter(Boolean);
    if (parts.length < 2) return null;
    // a ; inside brackets separates function arguments (max(3;7;2)), not data
    if (parts.some(p => (p.match(/\(/g) || []).length !== (p.match(/\)/g) || []).length)) return null;
    const xs = [];
    for (const p of parts) { let a; try { a = toAscii(p); } catch { return null; } if (vars(a).length) return null; const n = numeric(a); if (n === null) return null; xs.push(n); }
    return statsOf(xs.map(x => [x, 1]));
  }

  // pairs [value, how many times]; used by ;-lists and the statistics table
  function statsOf(pairs) {
    const m = new Map(); for (const [x, c] of pairs) m.set(x, (m.get(x) || 0) + c);
    const cnt = [...m].filter(([, c]) => c > 0).sort((a, b) => a[0] - b[0]);
    const n = cnt.reduce((a, [, c]) => a + c, 0);
    if (!n) return null;
    const sum = cnt.reduce((a, [x, c]) => a + x * c, 0), mean = sum / n;
    // frequencies may be decimals (0,5 and 0,5): they work as weights; the sample deviation needs whole counts
    const whole = cnt.every(([, c]) => Number.isInteger(c));
    // median: where the running total of the counts passes half (exactly half: between this value and the next)
    let med = cnt[cnt.length - 1][0];
    for (let j = 0, acc = 0; j < cnt.length; j++) { acc += cnt[j][1];
      if (Math.abs(acc - n / 2) <= 1e-9 * n && j + 1 < cnt.length) { med = (cnt[j][0] + cnt[j + 1][0]) / 2; break; }
      if (acc > n / 2) { med = cnt[j][0]; break; } }
    const ss = cnt.reduce((a, [x, c]) => a + c * (x - mean) ** 2, 0), sd = !whole ? null : n > 1 ? Math.sqrt(ss / (n - 1)) : 0, sdp = Math.sqrt(ss / n);
    const top = Math.max(...cnt.map(([, c]) => c)), modes = cnt.filter(([, c]) => c === top).map(([x]) => x);
    const hasMode = modes.length < cnt.length || cnt.length === 1;
    const eq = x => { const r = parseFloat(x.toPrecision(10)); return (Math.abs(x - r) <= 1e-12 * Math.max(1, Math.abs(x)) ? '=' : '\\approx ') + fmtNum(r); };
    const row = (name, sym, x) => '\\text{' + name + '}\\ ' + sym + eq(x);
    const lines = [
      '\\text{lukuja}\\ n' + (whole ? '=' + n : eq(n)) + ',\\quad \\text{summa}' + eq(sum),
      row('keskiarvo', '\\bar{x}', mean) + ',\\quad ' + row('mediaani', 'Md', med),
      hasMode ? '\\text{tyyppiarvo}\\ Mo=' + modes.map(fmtNum).join(';\\ ') : '\\text{tyyppiarvo: ei ole (kaikkia yhtä monta)}',
      (sd === null ? '\\text{keskihajonta}\\ ' : row('keskihajonta', 's', sd) + '\\ \\text{(otos)},\\quad ') + '\\sigma' + eq(sdp) + '\\ \\text{(perusjoukko)}',
      '\\text{pienin}\\ ' + fmtNum(cnt[0][0]) + ',\\ \\text{suurin}\\ ' + fmtNum(cnt[cnt.length - 1][0]) + ',\\quad \\text{vaihteluväli}' + eq(cnt[cnt.length - 1][0] - cnt[0][0]),
    ];
    const pl = x => { const r = parseFloat(x.toPrecision(10)); return (Math.abs(x - r) > 1e-12 * Math.max(1, Math.abs(x)) ? '≈ ' : '') + String(r).replace('.', DEC() === '.' ? '.' : ',').replace('-', '−'); };
    const rows = [['Lukuja', 'n', whole ? String(n) : pl(n)], ['Summa', '', pl(sum)], ['Keskiarvo', 'x̄', pl(mean)], ['Mediaani', 'Md', pl(med)],
      ['Tyyppiarvo', 'Mo', hasMode ? modes.map(pl).join('; ') : 'ei ole'],
      ['Keskihajonta (otos)', 's', sd === null ? '–' : pl(sd)], ['Keskihajonta (perusjoukko)', 'σ', pl(sdp)],
      ['Pienin', '', pl(cnt[0][0])], ['Suurin', '', pl(cnt[cnt.length - 1][0])], ['Vaihteluväli', '', pl(cnt[cnt.length - 1][0] - cnt[0][0])]];
    return {tex: '\\begin{array}{l}' + lines.join('\\\\') + '\\end{array}', chart: cnt, rows};
  }

  // classified data: rows [lower, upper, how many]; mean and spread from class midpoints
  function classStats(rows) {
    const cls = rows.filter(r => r[2] > 0).sort((a, b) => a[0] - b[0]);
    const n = cls.reduce((a, r) => a + r[2], 0);
    if (!n) return null;
    for (let i = 1; i < cls.length; i++) if (cls[i][0] < cls[i - 1][1] - 1e-12) throw new Err('Luokat menevät päällekkäin: ' + fmtNum(cls[i - 1][0]) + '–' + fmtNum(cls[i - 1][1]) + ' ja ' + fmtNum(cls[i][0]) + '–' + fmtNum(cls[i][1]) + '.');
    const mid = r => (r[0] + r[1]) / 2;
    const mean = cls.reduce((a, r) => a + mid(r) * r[2], 0) / n;
    const ss = cls.reduce((a, r) => a + r[2] * (mid(r) - mean) ** 2, 0), sd = n > 1 ? Math.sqrt(ss / (n - 1)) : 0, sdp = Math.sqrt(ss / n);
    // median class = where the cumulative count passes n/2; estimate by assuming even spread inside the class
    let acc = 0, mc = cls[cls.length - 1], before = 0;
    for (const r of cls) { if (acc + r[2] >= n / 2) { mc = r; before = acc; break; } acc += r[2]; }
    const med = mc[0] + (n / 2 - before) / mc[2] * (mc[1] - mc[0]);
    const top = Math.max(...cls.map(r => r[2])), modes = cls.filter(r => r[2] === top);
    const pl = x => { const r = parseFloat(x.toPrecision(10)); return (Math.abs(x - r) > 1e-12 * Math.max(1, Math.abs(x)) ? '≈ ' : '') + String(r).replace('.', DEC() === '.' ? '.' : ',').replace('-', '−'); };
    const cl = r => pl(r[0]) + '–' + pl(r[1]);
    const lo = cls[0][0], hi = cls[cls.length - 1][1];
    const rows2 = [['Lukuja', 'n', String(n)], ['Keskiarvo (luokkakeskuksista)', 'x̄', pl(mean)],
      ['Mediaaniluokka', '', cl(mc)], ['Mediaani (arvio)', 'Md', '≈ ' + pl(med).replace('≈ ', '')],
      ['Moodiluokka', 'Mo', modes.length < cls.length || cls.length === 1 ? modes.map(cl).join('; ') : 'ei ole'],
      ['Keskihajonta (otos)', 's', pl(sd)], ['Keskihajonta (perusjoukko)', 'σ', pl(sdp)],
      ['Pienin alaraja', '', pl(lo)], ['Suurin yläraja', '', pl(hi)], ['Vaihteluväli', '', pl(hi - lo)]];
    return {tex: '', chart: cls, rows: rows2};
  }

  // ---------- step by step (equations of degree 1 and 2, derivatives term by term) ----------
  function stepsRun(latex, want) {
    const a = toAscii(latex);
    const rows = [['', latex, '']];
    const nice = t => t.replace(/(\d) \\cdot ([a-zA-Z\\])/g, '$1$2').replace(/([a-zA-Z]) \\cdot ([a-zA-Z])/g, '$1$2');
    const T = x => nice(tex(S(x)));
    const par = t => /^-|[+-]/.test(t.slice(1)) || t.startsWith('-') ? '\\left(' + t + '\\right)' : t;
    // rivi, joka ei muuta mitään (x²−5x+6=0 → x²−5x+6=0), jätetään pois
    const same = x => x.replace(/\\left|\\right|\\cdot|[\s{}]/g, '');
    const add = (op, body, note) => { if (same(rows[rows.length - 1][1]) !== same(body)) rows.push([op, body, note || '']); };
    const out = () => ({tex: '\\begin{array}{rll}' + rows.map(([o, b, n]) => o + '&' + b + '&' + (n ? '\\qquad ' + (n.startsWith('|') ? '\\left|\\,' + n.slice(1) + '\\right.' : '\\text{' + n + '}') : '')).join('\\\\') + '\\end{array}', steps: rows.map(r => [...r])});
    // integraali, raja-arvo, summa: ei (väärää) derivaattaa, vaan suoraan tulos
    if (/\\(?:int|lim|sum|prod)(?![a-zA-Z])/.test(latex) && !/[^:<>]=/.test(a)) {
      const r = run(/^\s*\\int(?!\s*[_^])/.test(latex) ? 'integrate' : 'calc', latex, {});
      const m = /^(\\overset\{[^{}]*\}\{=\}|=|\\approx)\s*/.exec(r.tex);
      rows.push([m ? (m[1] === '\\approx' ? '\\approx' : '=') : '', m ? r.tex.slice(m[0].length) : r.tex, '']);
      return out();
    }
    if (/[^:<>]=/.test(a)) {
      const parts = a.split('='); if (parts.length !== 2) throw new Err('Vaiheittain: kirjoita yksi yhtälö, esim. 2(x+3)=4x−2.');
      const [L, R] = parts, E = S('expand((' + L + ')-(' + R + '))'), v = pickVar(E, want);
      if (/\//.test(E) && new RegExp('/\\(?[^)]*\\b' + v + '\\b').test(E)) throw new Err('Vaiheittain osaa yhtälöt, joissa ' + v + ' ei ole nimittäjässä.');
      const deg = Number(S('deg(' + E + ',' + v + ')'));
      if (!(deg <= 2)) throw new Err('Vaiheet osaan näyttää 1. ja 2. asteen yhtälöille. Käytä Ratkaise.');
      const at = n => S(nerdamer(E, {[v]: String(n)}).toString());
      const c0 = at(0), c1 = S('((' + at(1) + ')-(' + at(-1) + '))/2'), c2 = S('((' + at(1) + ')+(' + at(-1) + '))/2-(' + c0 + ')');
      if (/\(|\\left\(/.test(latex)) add('\\Leftrightarrow', T('expand(' + L + ')') + '=' + T('expand(' + R + ')'), 'avataan sulut');
      if (deg === 0) { add('\\Leftrightarrow', T(E) + '=0', ''); rows.push(['', S(E) === '0' ? '\\text{tosi aina: kaikki luvut käyvät}' : '\\text{epätosi: ei ratkaisua}', '']); return out(); }
      if (deg === 1) {
        const k = S('-(' + c0 + ')');
        add('\\Leftrightarrow', T(c1 + '*' + v) + '=' + T(k), 'termit järjestykseen');
        if (S(c1) !== '1') add('\\Leftrightarrow', v + '=' + T('(' + k + ')/(' + c1 + ')'), '|:' + par(T(c1)));
        return out();
      }
      const Et = T(E);
      if (S(c1) !== '0') add('\\Leftrightarrow', Et + '=0', 'kaikki vasemmalle');
      if (S(c0) === '0') {  // ax² + bx = 0: take x out
        add('\\Leftrightarrow', v + '\\left(' + T(c2 + '*' + v + '+(' + c1 + ')') + '\\right)=0', v + ' yhteiseksi tekijäksi');
        rows.push(['\\Leftrightarrow', v + '=0\\ \\lor\\ ' + T(c2 + '*' + v + '+(' + c1 + ')') + '=0', 'tulon nollasääntö']);
        rows.push(['\\Leftrightarrow', v + '=0\\ \\lor\\ ' + v + '=' + T('-(' + c1 + ')/(' + c2 + ')'), '']);
        return out();
      }
      if (S(c1) === '0') {  // ax² + c = 0
        const q = S('-(' + c0 + ')/(' + c2 + ')'), qn = numeric(q);
        add('\\Leftrightarrow', v + '^2=' + T(q), S(c2) === '1' ? '' : '|:' + par(T(c2)));
        if (qn !== null && qn < 0) { rows.push(['', '\\text{ei ratkaisua, koska neliö ei ole negatiivinen}', '']); return out(); }
        rows.push(['\\Leftrightarrow', v + '=\\pm' + T('sqrt(' + q + ')'), present('sqrt(' + q + ')').includes('approx') ? '' : '']);
        return out();
      }
      rows.push(['', 'a=' + T(c2) + ',\\ b=' + T(c1) + ',\\ c=' + T(c0), '']);
      const D = S('(' + c1 + ')^2-4*(' + c2 + ')*(' + c0 + ')'), Dn = numeric(D);
      rows.push(['', 'D=b^2-4ac=' + T(D), 'diskriminantti']);
      if (Dn !== null && Dn < 0) { rows.push(['', '\\text{ei reaalisia ratkaisuja, koska } D<0', '']); return out(); }
      const top = T('-(' + c1 + ')'), den = T('2*(' + c2 + ')');
      rows.push(['\\Leftrightarrow', v + '=\\frac{-b\\pm\\sqrt{D}}{2a}=\\frac{' + top + '\\pm\\sqrt{' + T(D) + '}}{' + den + '}', '']);
      const r1 = S('(-(' + c1 + ')-sqrt(' + D + '))/(2*(' + c2 + '))'), r2 = S('(-(' + c1 + ')+sqrt(' + D + '))/(2*(' + c2 + '))');
      const sq = Dn !== null && Math.abs(Math.sqrt(Dn) - Math.round(Math.sqrt(Dn))) < 1e-9;
      if (Dn === 0) { rows.push(['\\Leftrightarrow', v + '=' + T(r1), 'yksi ratkaisu, koska D = 0']); return out(); }
      if (sq || Dn === null) rows.push(['\\Leftrightarrow', v + '=' + T(r1) + '\\ \\lor\\ ' + v + '=' + T(r2), '']);
      else { rows.push(['\\Leftrightarrow', v + '=\\frac{' + top + '-' + T('sqrt(' + D + ')') + '}{' + den + '}\\ \\lor\\ ' + v + '=\\frac{' + top + '+' + T('sqrt(' + D + ')') + '}{' + den + '}', '']);
        // yhteinen tekijä supistetaan: (2 ± 2√2)/2 → 1 ± √2
        let A = numeric('-(' + c1 + ')'), Q = numeric('2*(' + c2 + ')');
        if ([A, Q, Dn].every(z => z !== null && Number.isInteger(z)) && Dn > 0 && Dn < 1e9) {
          let K = 1; for (let j = 2; j * j <= Dn; j++) if (Dn % (j * j) === 0) K = j;
          const m = Dn / (K * K), gcd = (p, q) => q ? gcd(q, p % q) : Math.abs(p), g = gcd(gcd(Math.abs(A), K), Math.abs(Q));
          if (g > 1) { A /= g; K /= g; Q /= g; let s = 1; if (Q < 0) { A = -A; Q = -Q; s = -1; }
            const w = sg => { const k = (K === 1 ? '' : K) + '\\sqrt{' + m + '}', t = A === 0 ? (sg < 0 ? '-' : '') + k : A + (sg < 0 ? '-' : '+') + k; return Q === 1 ? t : '\\frac{' + t + '}{' + Q + '}'; };
            rows.push(['\\Leftrightarrow', v + '=' + w(-s) + '\\ \\lor\\ ' + v + '=' + w(s), 'supistetaan']); } }
        rows.push(['', v + '\\approx ' + fmtNum(numeric(r1)) + '\\ \\lor\\ ' + v + '\\approx ' + fmtNum(numeric(r2)), '']); }
      return out();
    }
    // derivative, term by term
    const ar = toAscii(latex, {rad: true}), v = pickVar(ar, want), terms = [];
    let depth = 0, cur = '';
    for (let i = 0; i < ar.length; i++) {
      const c = ar[i];
      if (c === '(') depth++; else if (c === ')') depth--;
      if ((c === '+' || c === '-') && depth === 0 && cur.trim() && !/[*/^e]$/.test(cur)) { terms.push(cur); cur = c === '-' ? '-' : ''; continue; }
      cur += c;
    }
    if (cur.trim()) terms.push(cur);
    rows[0][1] = 'D_' + v + '\\left(' + latex + '\\right)';
    const hasV = t => new RegExp('\\b' + v + '\\b').test(t);
    const top2 = (t, op) => { let d = 0; for (let i = t.length - 1; i > 0; i--) { const c = t[i]; if (c === ')') d++; else if (c === '(') d--; else if (c === op && d === 0) return [t.slice(0, i), t.slice(i + 1)]; } return null; };
    if (terms.length === 1) {
      // drop brackets around the whole term: ((x)/(x+1)) → (x)/(x+1)
      const unwrap = t => { t = t.trim(); while (t[0] === '(' && t.endsWith(')')) { let d = 0, ok = true; for (let i = 0; i < t.length - 1; i++) { if (t[i] === '(') d++; else if (t[i] === ')') d--; if (d === 0) { ok = false; break; } } if (!ok) break; t = t.slice(1, -1); } return t; };
      terms[0] = unwrap(terms[0]);
      const pq = top2(terms[0], '/'), pp = !pq && top2(terms[0], '*');
      const pr = pq || pp;
      if (pr && hasV(pr[0]) && hasV(pr[1])) {
        const [f, g] = pr, df = T('diff(' + f + ',' + v + ')'), dg = T('diff(' + g + ',' + v + ')'), F = par(T(f)), G = par(T(g));
        if (pp) rows.push(['=', 'D\\left(' + T(f) + '\\right)\\cdot ' + G + '+' + F + '\\cdot D\\left(' + T(g) + '\\right)', 'tulon derivaatta'], ['=', par(df) + '\\cdot ' + G + '+' + F + '\\cdot ' + par(dg), '']);
        else rows.push(['=', '\\frac{D\\left(' + T(f) + '\\right)\\cdot ' + G + '-' + F + '\\cdot D\\left(' + T(g) + '\\right)}{' + G + '^2}', 'osamäärän derivaatta'], ['=', '\\frac{' + par(df) + '\\cdot ' + G + '-' + F + '\\cdot ' + par(dg) + '}{' + G + '^2}', '']);
        simpRow();
        return out();
      }
    }
    const ds = terms.map(t => S('diff(' + t + ',' + v + ')'));
    const join = list => list.map((t, k) => (k && !t.startsWith('-') ? '+' : '') + t).join('');
    if (terms.length > 1) rows.push(['=', join(terms.map(t => (t.startsWith('-') ? '-' : '') + 'D\\left(' + T(t.replace(/^-/, '')) + '\\right)')), 'termeittäin']);
    const why = t => /\b(?:sin|cos|tan|log|exp|sqrt)\((?!\s*[a-z]\s*\))/.test(t) || /\)\^/.test(t) ? 'yhdistetty funktio: sisäfunktion derivaatta kertoimeksi' : '';
    const notes = [...new Set(terms.map(why).filter(Boolean))];
    rows.push(['=', join(ds.map(d => nice(tex(d)))), notes.join(', ')]);
    simpRow();
    return out();
    // sievennetty derivaatta (sama muoto kuin Derivoi-napissa), vain jos se ei ole edellistä riviä pidempi
    function simpRow() {
      let d = giacExpr('diff(' + toG(ar) + ',' + v + ')'), nd = null; try { nd = simp('diff(' + ar + ',' + v + ')'); } catch {}
      if (!(d && (!nd || sameVal(d, nd)))) d = nd; if (!d) return;
      const b = nice(pretty(d, latex)), L = x => same(x).length, K = x => same(x).replace(/[+-]/g, '').split('').sort().join(''), p = rows[rows.length - 1][1];
      if (L(b) < L(p) && K(b) !== K(p)) add('=', b, 'sievennetään');   // ei pelkkää termien järjestyksen vaihtoa
    }
  }

  // ---------- definitions from earlier rows ----------
  function resetDefs() {
    try { nerdamer.clearVars(); } catch {}
    userFns = new Set(); userDefs = {}; unitVars.clear(); matVars.clear(); tempVars.clear();
  }
  // earlier rows: matrices and vectors too (A:=…, ā:=2ī+j̄)
  function define(latex) {
    if (/:=|\\coloneq/.test(latex) && /matrix|\\overline|\\bar|\\vec|\\overrightarrow/.test(latex)) { try { if (matRun(latex, 'calc')) return; } catch {} }
    return tryDefine(latex);
  }
  function tryDefine(latex) {
    // f(x)=...  or  a:=...
    const fm = /^\s*([a-zA-Z])\s*(?:\\left)?\(\s*([a-zA-Z])\s*(?:\\right)?\)\s*(=|:=|\\coloneq)(.+)$/.exec(latex);
    if (fm) {
      const name = fm[1], v = fm[2];
      // f(x)=0 when f is already defined is an equation, not a new definition
      if (fm[3] === '=' && userFns.has(name)) return null;
      // the plain expression (radians); the degree version is used for numbers in degree mode
      const body = toAscii(fm[4], {rad: true}), bodyDeg = toAscii(fm[4]);
      userFns.add(name); userDefs[name] = {v, body};
      nerdamer.setFunction(name, [v], body);
      nerdamer.setFunction(name + 'Qdeg', [v], bodyDeg);
      return {kind:'fn', name, v, body};
    }
    // a:=5, x_1:=2, also Greek names from drawings: \alpha:=37°
    const vm = /^\s*((?:\\(?:alpha|beta|gamma|delta|epsilon|varepsilon|theta|lambda|mu|rho|sigma|tau|phi|varphi|omega)\b|\\Delta\s*(?:\\[a-zA-Z]+|[a-zA-Z])?|[a-zA-Z])(?:_\{?[a-zA-Z0-9]+\}?)?)\s*(?::=|\\coloneq|\\coloneqq)(.+)$/.exec(latex);
    if (vm) {
      let name = vm[1].replace(/[_{}\\\s]/g, ''); if (name === 'E') name = 'Evar';
      const U = [], ua = toAscii(vm[2], {units: U});
      tempVars.delete(name);
      if (U.length === 1 && TEMP[U[0].name]) tempVars.set(name, U[0].name);
      if (U.length) { nerdamer.setVar(name, ua); unitVars.add(name); return {kind: 'var', name: vm[1]}; }
      nerdamer.setVar(name, toAscii(vm[2]));
      return {kind:'var', name: vm[1]};
    }
    return null;
  }

  // ---------- actions ----------
  // split "72 km/h → m/s" at a top-level arrow
  function splitTo(latex) {
    let d = 0;
    for (let k = 0; k < latex.length; k++) {
      const c = latex[k];
      if (c === '\\' && latex[k + 1] === '{') { k++; continue; }
      if (c === '{') d++; else if (c === '}') d--;
      else if (d === 0) {
        const m = /^(?:\\to(?![a-zA-Z])|\\rightarrow|\\longrightarrow|\\Rightarrow|->|→)/.exec(latex.slice(k));
        if (m) return [latex.slice(0, k), latex.slice(k + m[0].length)];
      }
    }
    return [latex, null];
  }
  // value in SI units + dimensions, by putting numbers in for the dimension symbols
  // plain JS decimals with the dimension symbols as inputs (nerdamer's exact fractions of 10⁻³⁴ were slow and its decimals lost them)
  function jsDims(expr) {
    const F = {sqrt: 'Math.sqrt', log: 'Math.log', exp: 'Math.exp', abs: 'Math.abs', pi: 'Math.PI', e: 'Math.E'};
    let ok = true;
    const js = expr.replace(/[a-zA-Z_]\w*/g, w => DIMN.includes(w) ? '__d.' + w : F[w] || (ok = false, w)).replace(/\^/g, '**');
    if (!ok) return null;
    try { const f = new Function('__d', 'return ' + js); f(Object.fromEntries(DIMN.map(n => [n, 1]))); return f; } catch { return null; }
  }
  const numOr = x => { let r = null; try { r = numeric(x); } catch {} return r === null ? NaN : r; };
  function quantity(a) {
    a = nerdamer(a).toString();  // puts in saved values first
    const js = jsDims(a);
    const val = sub => { let r = js ? js(sub) : NaN; if (!isFinite(r)) r = numOr(nerdamer(a, sub).toString()); if (!isFinite(r)) throw new Err('Laskussa on tuntematon kirjain. Kirjoita yksikkö lainausmerkin jälkeen, esim. 5"kg'); return r; };
    const one = Object.fromEntries(DIMN.map(n => [n, 1]));
    let c = val(one);
    // decimals leave a tiny rest where the exact answer is 0 (0,1 m + 0,2 m − 0,3 m): check small values exactly
    if (js && c && Math.abs(c) < 1e-9) { try { if (nerdamer(a, one).evaluate().toString() === '0') c = 0; } catch {} }
    if (c === 0) return {c: 0, d: D()};
    const d = DIMN.map(n => {
      const e = Math.log2(val({...one, [n]: 2}) / c), e3 = val({...one, [n]: 3}) / c;
      if (!isFinite(e) || Math.abs(Math.pow(3, e) - e3) > 1e-6 * Math.max(1, Math.abs(e3))) throw new Err('Yksiköt eivät sovi yhteen.');
      return Math.round(e * 1e6) / 1e6;
    });
    return {c, d};
  }
  const toK = (n, x) => n === '°C' ? x + 273.15 : n === '°F' ? (x - 32) * 5 / 9 + 273.15 : x;
  const fromK = (n, x) => n === '°C' ? x - 273.15 : n === '°F' ? (x - 273.15) * 9 / 5 + 32 : x;
  // equation with units: solve with the unit symbols in, then show each answer with a unit
  function unitSolve(a, U, want, wantAll, pos) {
    if (a.includes(';')) return unitSolveSys(a, U, wantAll);
    const [lhs, rhs] = a.split('=');
    if (rhs === undefined || a.split('=').length > 2) throw new Err('Kirjoita yksi yhtälö, esim. 49,05"N=5"kg·a');
    const vs = [...new Set(nerdamer('(' + lhs + ')-(' + rhs + ')').variables())].filter(v => !DIMN.includes(v) && !['pi', 'e', 'i'].includes(v));
    if (!vs.length) throw new Err('Yhtälössä ei ole ratkaistavaa kirjainta.');
    const v = want && vs.includes(want) ? want : vs.includes('x') ? 'x' : vs[0];
    // solve with plain numbers (SI values); a unit symbol set to 2 shows how the answer scales = its unit
    const L = nerdamer(lhs).toString(), R = nerdamer(rhs).toString();
    const one = Object.fromEntries(DIMN.map(n => [n, 1]));
    const num = numOr;
    function roots(sub) {
      const l = nerdamer(L, sub).toString(), r = nerdamer(R, sub).toString();
      const sols = nerdamer.solve(l + '=' + r, v);
      let list; try { list = sols.symbol.elements.map(e => e.toString()); } catch { list = String(sols).replace(/^\[|\]$/g, '').split(',').filter(Boolean); }
      // square-root equation nerdamer misses: square both sides (false roots are dropped below)
      if (!list.length && /sqrt/.test(l + r)) { try { const s2 = nerdamer.solve('(' + l + ')^2=(' + r + ')^2', v); try { list = s2.symbol.elements.map(e => e.toString()); } catch { list = String(s2).replace(/^\[|\]$/g, '').split(',').filter(Boolean); } } catch {} }
      const out = [];
      for (const x of list) {
        if (/(^|[^a-z])i([^a-z]|$)/.test(x)) continue;
        if (nerdamer(x).variables().length) throw new Err('Anna muille kirjaimille arvot (esim. m:=5"kg) tai valitse toinen kirjain.');
        const n = num(x);
        if (!isFinite(n)) continue;
        // drop false roots: put it back into the equation
        const lv = num(nerdamer(l, {[v]: n}).toString()), rv = num(nerdamer(r, {[v]: n}).toString());
        if (Math.abs(lv - rv) > 1e-7 * Math.max(1, Math.abs(lv), Math.abs(rv))) continue;
        if (!out.some(y => Math.abs(y - n) <= 1e-9 * Math.max(1, Math.abs(n)))) out.push(n);
      }
      return out.sort((p, q) => p - q);
    }
    // a few Newton steps make a number-search root exact enough (25 = 100·(1/2)^(t/5730 a) gave 11460,00018 a)
    const l1 = nerdamer(L, one).toString(), r1 = nerdamer(R, one).toString();
    const f1 = x => num(nerdamer(l1, {[v]: '(' + sciNum(x) + ')'}).toString()) - num(nerdamer(r1, {[v]: '(' + sciNum(x) + ')'}).toString());
    const polish = x => { try { for (let k = 0; k < 3 && x; k++) { const fx = f1(x); if (!fx) break; const h = 1e-6 * Math.abs(x), dfx = (f1(x + h) - fx) / h;
      const x2 = x - fx / dfx; if (!isFinite(x2) || !(Math.abs(f1(x2)) < Math.abs(fx))) break; x = x2; } } catch {} return x; };
    const base = roots(one).map(polish);
    const ref = base.findIndex(x => x !== 0);
    const d = DIMN.map(n => {
      if (ref < 0) return 0;
      const sc = roots({...one, [n]: 2});
      if (sc.length !== base.length) throw new Err('Yksiköt eivät sovi yhteen.');
      return Math.round(Math.log2(sc[ref] / base[ref]) * 1e6) / 1e6;
    });
    // check: the units on both sides must match (try odd numbers for the unit symbols)
    const odd = {uL: 3, uM: 5, uT: 7, uI: 11, uK: 13, uN: 17};
    for (const c of base) {
      const val = c * DIMN.reduce((m, n, k) => m * Math.pow(odd[n], d[k]), 1);
      const lv = num(nerdamer(L, {...odd, [v]: val}).toString()), rv = num(nerdamer(R, {...odd, [v]: val}).toString());
      if (Math.abs(lv - rv) > 1e-6 * Math.max(1, Math.abs(lv), Math.abs(rv))) throw new Err('Yksiköt eivät sovi yhteen.');
    }
    // from a system of given values (pos): only the positive answer, as the whole-system solver gave (t = 10 s, not ±)
    const parts = (pos && base.some(x => x > 0) ? base.filter(x => x > 0) : base).map(c => tex(v) + '=' + showQ({c, d}, U, false));
    if (!parts.length) return {vars: vs, v, tex: '\\Leftrightarrow \\text{ei ratkaisua}'};
    return {vars: vs, v, tex: '\\Leftrightarrow ' + parts.join('\\ \\lor\\ ')};
  }
  // system of equations with units: solve with SI numbers; a unit symbol set to 2 shows each answer's unit
  function unitSolveSys(a, U, wantAll) {
    const eqs = a.split(';').map(x => x.trim()).filter(Boolean).map(e => {
      const [l, r] = e.split('=');
      if (r === undefined || e.split('=').length > 2) throw new Err('Kirjoita jokaiselle riville yksi yhtälö.');
      return [nerdamer(l).toString(), nerdamer(r).toString()];
    });
    const skip = v => DIMN.includes(v) || ['pi', 'e', 'i'].includes(v);
    let vs = [...new Set(eqs.flatMap(([l, r]) => nerdamer('(' + l + ')-(' + r + ')').variables()))].filter(v => !skip(v));
    if (wantAll && wantAll.length) vs = wantAll.filter(v => vs.includes(v));
    if (!vs.length) throw new Err('Yhtälöissä ei ole ratkaistavaa kirjainta.');
    if (vs.length > eqs.length) throw tooMany(vs, eqs.length);
    const num = numOr;
    const one = Object.fromEntries(DIMN.map(n => [n, 1]));
    // annetut arvot (t = 8 s) ovat jo käyttäjän tiedossa: vastaukseen vain lasketut kirjaimet (muuten t näkyisi 0,00222 h)
    const given = new Set(eqs.flatMap(([l, r]) => [[l, r], [r, l]].filter(([x, y]) => vs.includes(x) && !nerdamer(y).variables().some(w => !skip(w))).map(([x]) => x)));
    const shown = list => list.filter(([v]) => !given.has(v)).length ? list.filter(([v]) => !given.has(v)) : list;
    // known values (F = 1 N, G = 6,674·10⁻¹¹ …) go into the other equation; one equation with one letter left is solved alone
    // (the whole system with exact 10⁻¹¹ fractions took seconds)
    {
      const val = {}, rest = [];
      for (const [l, r] of eqs) {
        const free = x => !nerdamer(x).variables().some(w => !skip(w));
        if (vs.includes(l) && !(l in val) && free(r)) val[l] = r; else if (vs.includes(r) && !(r in val) && free(l)) val[r] = l; else rest.push([l, r]);
      }
      if (rest.length === 1 && Object.keys(val).length) {
        const sub = Object.fromEntries(Object.entries(val).map(([k, x]) => [k, '(' + x + ')']));
        const e = nerdamer(rest[0][0], sub).toString() + '=' + nerdamer(rest[0][1], sub).toString();
        const left = nerdamer('(' + e.replace('=', ')-(') + ')').variables().filter(w => !skip(w));
        if (left.length === 1) { const r = unitSolve(e, U, left[0], null, true); delete r.vars; return r; }
      }
    }
    function sol(sub) {
      let r;
      const E = eqs.map(([l, rr]) => nerdamer(l, sub).toString() + '=' + nerdamer(rr, sub).toString());
      try { r = nerdamer.solveEquations(E, vs); }
      catch { try { r = nerdamer.solveEquations(E); } catch { throw new Err('En osaa ratkaista tätä yhtälöryhmää yksiköiden kanssa. Tarkista, että yhteen- ja vähennettävillä on sama yksikkö, tai kokeile ilman yksiköitä.'); } }
      const m = {};
      for (const [v, val] of r) { const n = num(String(val)); if (!isFinite(n)) throw new Err('Anna muille kirjaimille arvot tai valitse kirjaimet: , x, y'); m[v] = n; }
      return vs.every(v => v in m) ? m : null;
    }
    // vastaukseen jää muita kirjaimia (f = 3/l m/s): ratkaistaan yksiköt kirjaimina ja näytetään lauseke + yksikkö
    {
      let symR = null;
      try { symR = nerdamer.solveEquations(eqs.map(([l, r]) => l + '=' + r), vs.slice()); } catch {}
      const params = symR ? [...new Set(symR.flatMap(([, val]) => nerdamer(String(val)).variables()))].filter(x => !skip(x) && !vs.includes(x)) : [];
      if (params.length) {
        const UT = {uL: 'm', uM: 'kg', uT: 's', uI: 'A', uK: 'K', uN: 'mol'};
        const p1 = Object.fromEntries(params.map((x, i) => [x, 1.37 + i * 0.71])), p2 = Object.fromEntries(params.map((x, i) => [x, 2.9 + i * 0.53]));
        const out = [];
        for (const v of vs) {
          const hit = symR.find(([w]) => w === v); if (!hit) continue;
          const e = String(hit[1]);
          const ev = sub => num(nerdamer(e, sub).toString());
          const dimsAt = P => DIMN.map(n => Math.log2(ev({...one, ...P, [n]: 2}) / ev({...one, ...P})));
          const d1 = dimsAt(p1), d2 = dimsAt(p2);
          if (d1.every((x, k) => isFinite(x) && Math.abs(x - d2[k]) < 1e-6)) {
            const d = d1.map(x => Math.round(x * 1e6) / 1e6);
            const unit = showQ({c: 1, d}, [], false).replace(/^1(\\,)?/, '');
            out.push([v, tex(v) + '=' + tex(simp(nerdamer(e, one).toString())) + (unit ? '\\,' + unit : '')]);
          } else out.push([v, tex(v) + '=' + tex(e).replace(/u([LMTIKN])/g, (m, c) => unitTex(UT['u' + c]))]);
        }
        if (out.length === vs.length) return {tex: '\\Leftrightarrow ' + shown(out).map(x => x[1]).join(',\\ ')};
      }
    }
    const base = sol(one);
    if (!base) return {tex: '\\text{Ei ratkaisua}'};
    const dims = {};
    for (const v of vs) dims[v] = D();
    DIMN.forEach((n, k) => {
      const sc = sol({...one, [n]: 2});
      if (!sc) throw new Err('Yksiköt eivät sovi yhteen.');
      for (const v of vs) dims[v][k] = base[v] === 0 ? 0 : Math.round(Math.log2(Math.abs(sc[v] / base[v])) * 1e6) / 1e6;
    });
    // check: both sides of every equation must have the same unit
    const odd = {uL: 3, uM: 5, uT: 7, uI: 11, uK: 13, uN: 17};
    const sub = {...odd};
    for (const v of vs) sub[v] = base[v] * DIMN.reduce((m, n, k) => m * Math.pow(odd[n], dims[v][k]), 1);
    for (const [l, r] of eqs) {
      const lv = num(nerdamer(l, sub).toString()), rv = num(nerdamer(r, sub).toString());
      if (Math.abs(lv - rv) > 1e-6 * Math.max(1, Math.abs(lv), Math.abs(rv))) throw new Err('Yksiköt eivät sovi yhteen.');
    }
    // no letter buttons for a system: the ", x, y" at the end already chooses the letters
    return {tex: '\\Leftrightarrow ' + shown(vs.map(v => [v, tex(v) + '=' + showQ({c: base[v], d: dims[v]}, U, false)])).map(x => x[1]).join(',\\ ')};
  }
  function unitRun(latex, want, wantAll, action) {
    const r = unitRun1(latex, want, wantAll);
    // ≈ button: the answer is a rounded decimal
    if (r && action === 'approx' && /^=/.test(r.tex)) r.tex = '\\approx ' + r.tex.slice(1);
    return r;
  }
  function unitRun1(latex, want, wantAll) {
    const [lhs, target] = splitTo(latex);
    const U = [];
    const a = toAscii(lhs, {units: U});
    let isUnit = U.length > 0 || target !== null;
    if (!isUnit && unitVars.size) { try { isUnit = nerdamer(a).variables().some(v => DIMN.includes(v)); } catch {} }
    if (!isUnit) return null;
    if (/[^:<>]=/.test(a)) return unitSolve(a, U, want, wantAll);
    if (!a.trim()) throw new Err('Kirjoita muunnettava arvo ennen nuolta.');
    if (target !== null) {
      const Ut = [], at = toAscii(target, {units: Ut});
      if (!Ut.length) throw new Err('Kirjoita nuolen jälkeen yksikkö, esim. → "m/s');
      const tt = target.trim();
      // one temperature value (80 °C, or T:=80"°C alone): with the offset, 80 °C = 353,15 K; differences (80 °C − 20 °C) without
      const tv = !U.length && tempVars.get(lhs.replace(/[_{}\\\s]/g, ''));
      if (((U.length === 1 && TEMP[U[0].name]) || tv) && Ut.length === 1 && TEMP[Ut[0].name]) {
        const from = tv || U[0].name, x = quantity(a).c / lookupUnit(from)[0];
        return {tex: '=' + fmtNum(fromK(Ut[0].name, toK(from, x))) + '\\,' + tt};
      }
      const q = quantity(a), qt = quantity(at);
      if (!sameDims(q.d, qt.d)) throw new Err('Yksiköt eivät sovi yhteen, joten muunnos ei onnistu.');
      return {tex: '=' + fmtNum(q.c / qt.c) + '\\,' + tt};
    }
    const q = quantity(a);
    // units cancel out (0,11 m / 0,66 m): show the exact value too, e.g. π/3 ≈ 1,047
    if (q.d.every(x => !x) && !U.some(u => TEMP[u.name])) {
      try {
        const bare = toAscii(lhs.replace(/\\operatorname\{\\mathbf\{[^{}]*\}\}/g, ''));
        if (bare.trim() && !vars(bare).length) {
          const n = numeric(bare);
          if (n !== null && Math.abs(n - q.c) <= 1e-9 * Math.max(1, Math.abs(n))) return {tex: present(nerdamer(bare).toString())};
        }
      } catch {}
    }
    // a temperature alone stays in its own unit (80 °C, T:=80"°C → T = 80 °C), not K
    const tu = U.length === 1 && TEMP[U[0].name] ? U[0].name : !U.length && tempVars.get(lhs.replace(/[_{}\\\s]/g, ''));
    if (tu && sameDims(q.d, D(0, 0, 0, 0, 1))) return {tex: '=' + fmtNum(q.c / lookupUnit(tu)[0]) + '\\,' + unitTex(tu)};
    return {tex: '=' + showQ(q, U)};
  }
  // a quantity as text: number and the most natural unit
  function showQ(q, U, pairs = true) {
    if (q.d.every(x => !x)) return fmtNum(q.c);
    // show the answer in a unit the user wrote, else a named SI unit, else SI base units
    const own = U.find(u => sameDims(u.d, q.d) && !TEMP[u.name]);
    if (own) return fmtNum(q.c / own.f) + '\\,' + unitTex(own.name);
    // a ratio or product of two units the user wrote (km/h, kW·h …)
    // kun tulos on yksi yksikkö (V·A = W, V/Ω = A, J/s = W), näytetään se eikä paria
    const yksi = NAMED.some(n => sameDims(BASE[n][1], q.d)) || (q.d.filter(x => x).length === 1 && q.d.some(x => x === 1));
    const nicer = NICE.some(([d]) => sameDims(d, q.d));   // Hz·m: m/s is nicer than the product (km/h stays)
    if (pairs) for (const u of U) for (const w of U) {
      if (u === w || TEMP[u.name] || TEMP[w.name]) continue;
      // kahden eri yksikön tulo, jolle on oma nimi (V·A = W, N·m = J); kWh säilyy
      if (u.name !== w.name && !(w.name === 'h' && /W$/.test(u.name)) && yksi) continue;
      if (!(nicer && u.name !== w.name) && sameDims(u.d.map((x, k) => x + w.d[k]), q.d)) return fmtNum(q.c / (u.f * w.f)) + '\\,' + (u.name === w.name ? unitTex(u.name) + '^{2}' : w.name === 'h' && /W$/.test(u.name) ? unitTex(u.name + 'h') : unitTex(u.name) + '\\cdot ' + unitTex(w.name));
      if (sameDims(u.d.map((x, k) => x - w.d[k]), q.d)) return fmtNum(q.c / (u.f / w.f)) + '\\,' + unitTex(u.name) + '/' + unitTex(w.name);
    }
    const named = NAMED.find(n => sameDims(BASE[n][1], q.d));
    if (named) return fmtNum(q.c) + '\\,' + unitTex(named);
    const nice = NICE.find(([d]) => sameDims(d, q.d));
    if (nice) return fmtNum(q.c) + '\\,' + nice[1]();
    const names = ['m', 'kg', 's', 'A', 'K', 'mol'], order = [1, 0, 2, 3, 4, 5];
    const part = (e, n) => unitTex(n) + (Math.abs(e) !== 1 ? '^{' + fmtNum(Math.abs(e)) + '}' : '');
    const num = [], den = [];
    for (const k of order) { const e = q.d[k]; if (e > 0) num.push(part(e, names[k])); if (e < 0) den.push(part(e, names[k])); }
    let ut = num.join('\\cdot ') || '1';
    if (den.length) ut = den.length > 1 ? '\\frac{' + ut + '}{' + den.join('\\cdot ') + '}' : ut + '/' + den[0];
    return fmtNum(q.c) + '\\,' + ut;
  }

  // split at top-level "=" (not :=, ≤, ≥ and not inside { })
  function splitEq(latex) {
    const out = []; let depth = 0, cur = '';
    for (let i = 0; i < latex.length; i++) {
      const c = latex[i];
      if (c === '{') depth++; else if (c === '}') depth--;
      if (c === '=' && depth === 0 && latex[i - 1] !== ':' && latex[i - 1] !== '<' && latex[i - 1] !== '>' && latex[i - 1] !== '!') { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }
  // "0<a<180" → {v:'a', lo:0, hi:180, loIn:false, hiIn:false, tex}; degrees are plain numbers (180° = 180)
  function parseCond(t, LET) {
    const raw = t.trim();
    const c = raw.replace(/\\left|\\right/g, '').replace(/\\(?:leqslant|leq|le)(?![a-zA-Z])/g, '≤').replace(/\\(?:geqslant|geq|ge)(?![a-zA-Z])/g, '≥').replace(/\\lt(?![a-zA-Z])/g, '<').replace(/\\gt(?![a-zA-Z])/g, '>').replace(/\\[,;: ]/g, ' ');
    const tk = c.split(/(<|>|≤|≥)/).map(x => x.trim());
    const num = x => { const n = numeric(toAscii(x.replace(/\^\{?\\circ\}?|\\degree|°/g, ''), {rad: true})); if (n === null || !isFinite(n)) throw 0; return n; };
    const o = {tex: raw};
    // x ≠ 0: every value except one
    const ne = new RegExp('^(' + LET + ')\\s*\\\\neq?(?![a-zA-Z])(.+)$').exec(c.trim());
    if (ne) { let val; try { val = num(ne[2]); } catch { return null; } o.v = ne[1].replace(/[\\_{}]/g, ''); if (o.v === 'E') o.v = 'Evar'; o.ok = x => Math.abs(x - val) > 1e-9; return o; }
    if (tk.length !== 3 && tk.length !== 5) return null;
    const isLet = x => new RegExp('^' + LET + '$').test(x);
    try {
      const put = (side, op, val) => { // side: the bound is on the 'left' or 'right' of the letter
        const small = side === 'left' ? (op === '<' || op === '≤') : (op === '>' || op === '≥');
        if (small) { o.lo = val; o.loIn = op === '≤' || op === '≥'; } else { o.hi = val; o.hiIn = op === '≤' || op === '≥'; }
      };
      if (tk.length === 5) { if (!isLet(tk[2])) return null; o.v = tk[2]; put('left', tk[1], num(tk[0])); put('right', tk[3], num(tk[4])); }
      else if (isLet(tk[0])) { o.v = tk[0]; put('right', tk[1], num(tk[2])); }
      else if (isLet(tk[2])) { o.v = tk[2]; put('left', tk[1], num(tk[0])); }
      else return null;
    } catch { return null; }
    o.v = o.v.replace(/[\\_{}]/g, '');
    if (o.v === 'E') o.v = 'Evar';
    o.ok = x => (o.lo === undefined || x > o.lo + 1e-9 || (o.loIn && Math.abs(x - o.lo) < 1e-9)) && (o.hi === undefined || x < o.hi - 1e-9 || (o.hiIn && Math.abs(x - o.hi) < 1e-9));
    return o;
  }
  // epäyhtälö: myös kaksoisepäyhtälö (1<2x+3<7), epäyhtälöryhmä (rivit), trigonometria (jaksollinen vastaus),
  // ehto pilkun perään (", 0<x<360") ja muut kirjaimet, kun ratkaistava kirjain on ensimmäisessä potenssissa.
  // Nollakohdat ja määrittelyn rajat jakavat lukusuoran väleihin; jokaisesta välistä testataan yksi luku.
  function ineqRun(latex, want, cond, info) {
    const norm = x => x.replace(/\\left|\\right/g, '').replace(/\\(?:leqslant|leq|le)(?![a-zA-Z])/g, '≤').replace(/\\(?:geqslant|geq|ge)(?![a-zA-Z])/g, '≥').replace(/\\lt(?![a-zA-Z])/g, '<').replace(/\\gt(?![a-zA-Z])/g, '>');
    const rows = latex.split(';').map(norm).map(x => x.trim()).filter(Boolean);
    const has = rows.map(r => /[<>≤≥]/.test(r));
    if (!has.some(Boolean)) return null;
    if (!has.every(Boolean)) throw new Err('Ryhmässä on sekä yhtälöitä että epäyhtälöitä. Ratkaise ne erikseen.');
    const trig = /\\(?:sin|cos|tan|cot)(?![a-zA-Z])/.test(latex), rad = !(trig && deg);
    const parts = [];
    for (const c of rows) {
      const tk = c.split(/(<|>|≤|≥)/).map(x => x.trim());
      if (tk.some(x => !x) || /=/.test(c.replace(/\\[a-z]+/g, ''))) throw new Err('Kirjoita epäyhtälö muodossa 2x+1<5 tai 1<2x+3<7.');
      if (tk.length !== 3 && tk.length !== 5) throw new Err('Epäyhtälössä voi olla enintään kaksi vertailumerkkiä, esim. 1<2x+3<7.');
      for (let i = 1; i < tk.length; i += 2) parts.push({f: '(' + toAscii(tk[i - 1], {rad}) + ')-(' + toAscii(tk[i + 1], {rad}) + ')', op: tk[i], L: tk[i - 1], R: tk[i + 1], tex: tk[i - 1] + {'<': '<', '>': '>', '≤': '\\le ', '≥': '\\ge '}[tk[i]] + tk[i + 1]});
    }
    const v = pickVar(parts.map(q => q.f).join('+'), want);
    const others = [...new Set(parts.flatMap(q => vars(q.f)))].filter(x => x !== v);
    const flip = {'<': '>', '>': '<', '≤': '≥', '≥': '≤'}, OPT = {'<': '<', '>': '>', '≤': '\\le ', '≥': '\\ge '};
    if (others.length) {
      // muut kirjaimet: x+a<3 → x<3−a (kertoimen merkin pitää olla tiedossa)
      const out = parts.map(q => {
        let c; try { if (Number(nerdamer('deg(expand(' + hideK(q.f) + '),' + v + ')').toString()) !== 1) throw 0; c = nerdamer('coeffs(expand(' + hideK(q.f) + '),' + v + ')').symbol.elements.map(e => showK(e.toString())); }
        catch { throw new Err('Kun epäyhtälössä on muitakin kirjaimia (' + others.join(', ') + '), osaan ratkaista vain, jos ' + v + ' on ensimmäisessä potenssissa, esim. 2' + v + '+a<5.'); }
        const k = numeric(c[1]);
        if (k === null || !isFinite(k)) throw new Err('En tiedä, onko kerroin ' + tex(c[1]) + ' positiivinen vai negatiivinen, joten epäyhtälön suunta jää auki. Ratkaise tapaukset erikseen.');
        return v + OPT[k < 0 ? flip[q.op] : q.op] + tex(simp('-(' + c[0] + ')/(' + c[1] + ')')).replace(/\{\\left\(([^{}]*)\\right\)\}/g, '{$1}');
      });
      if (info) Object.assign(info, {others: true, v});
      return {tex: '\\Leftrightarrow ' + out.join('\\ \\land\\ ')};
    }
    const H = trig && deg ? 180 : Math.PI, P = /\\(?:sin|cos)(?![a-zA-Z])/.test(latex) || !trig ? 2 * H : H, periodic = trig && !(cond && cond.lo !== undefined && cond.hi !== undefined);
    // kaunis muoto luvulle: kokonaisluku, murtoluku, neliöjuuri, ln, e, π
    const nice = n => niceNum(n, trig, deg) ?? fmtNum(n);
    const crit = new Map(), poles = new Set(); // likiarvo → näytettävä muoto; poles: kohdat, joissa lauseke ei ole määritelty
    const addC = (n, t) => { if (!isFinite(n)) return; for (const k of crit.keys()) if (Math.abs(k - n) < 1e-7) return; crit.set(n, t); };
    const fns = parts.map(q => { let g; try { g = nerdamer(q.f).buildFunction([v]); } catch { g = x => numeric(q.f.replace(new RegExp('(?<![a-zA-Z])' + v + '(?![a-zA-Z])', 'g'), '(' + x + ')')); }
      return x => { let y; try { y = g(x); } catch { return NaN; } return typeof y === 'number' ? y : NaN; }; });
    if (!trig) parts.forEach((q, j) => {
      try { for (const r of roots(q.f, v)) { const n = numeric(r); if (n !== null && isFinite(n) && Math.abs(fns[j](n)) < 1e-6) addC(n, /\d{6}/.test(r) ? nice(n) : tex(r)); } } catch {}
    });
    // välin päät: ehto, trigonometrialla yksi jakso, muuten koko lukusuora
    const lo = cond && cond.lo !== undefined ? cond.lo : trig ? 0 : -Infinity, hi = cond && cond.hi !== undefined ? cond.hi : trig ? P : Infinity;
    let R = 10; for (const k of crit.keys()) R = Math.max(R, Math.abs(k) * 2 + 1);
    const sLo = isFinite(lo) ? lo : -Math.max(R, isFinite(hi) ? Math.abs(hi) + 10 : 0), sHi = isFinite(hi) ? hi : Math.max(R, isFinite(lo) ? Math.abs(lo) + 10 : 0);
    const N = trig ? 7200 : 4000, sgn = y => isNaN(y) || !isFinite(y) || Math.abs(y) > 1e12 ? 'n' : y > 0 ? '+' : y < 0 ? '-' : '0';
    fns.forEach(g => {
      let x0 = sLo, s0 = sgn(g(x0));
      for (let i = 1; i <= N; i++) {
        const x1 = sLo + (sHi - sLo) * i / N, s1 = sgn(g(x1));
        if (s1 === '0') addC(x1, nice(x1));
        else if (s1 !== s0 && s0 !== '0' && ![...crit.keys()].some(k => k >= x0 - 1e-9 && k <= x1 + 1e-9)) {
          let a = x0, b = x1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (sgn(g(m)) === s0) a = m; else b = m; }
          const m = Math.abs(a) < 1e-9 ? 0 : (a + b) / 2, rn = Math.round(m);
          const n = Math.abs(m - rn) < 1e-9 ? rn : m; addC(n, nice(n));
          { const ga = g(a), gb = g(b); if ((isFinite(ga) && Math.abs(ga) > 1e3) || (isFinite(gb) && Math.abs(gb) > 1e3)) poles.add(n); }
        }
        x0 = x1; s0 = s1;
      }
    });
    const ok = x => ![...poles].some(p => Math.abs(p - x) < 1e-9) && parts.every((q, j) => { const y = fns[j](x); if (isNaN(y) || !isFinite(y) || Math.abs(y) > 1e12) return false;
      return q.op === '<' ? y < -1e-9 : q.op === '>' ? y > 1e-9 : q.op === '≤' ? y < 1e-9 : y > -1e-9; });
    const endOk = x => periodic ? ok(x) : ok(x) && (!cond || cond.ok(x));
    const pts = [...crit.keys()].filter(k => k > lo + 1e-9 && k < hi - 1e-9).sort((a, b) => a - b);
    const bounds = [lo, ...pts, hi];
    const mid = (a, b) => a === -Infinity ? (b === Infinity ? 0 : b - 1) : b === Infinity ? a + 1 : (a + b) / 2;
    const segs = []; // {a, b, aIn, bIn}
    for (let i = 0; i < bounds.length - 1; i++) {
      const a = bounds[i], b = bounds[i + 1], inA = isFinite(a) && endOk(a), last = segs[segs.length - 1];
      const joined = last && last.b === a && last.bIn;
      if (ok(mid(a, b))) { if (joined) { last.b = b; last.bIn = false; } else segs.push({a, b, aIn: inA, bIn: false}); }
      else if (inA && !joined) segs.push({a, b: a, aIn: true, bIn: true});
      const L = segs[segs.length - 1];
      if (L && L.b === b && isFinite(b) && b > L.a) L.bIn = i === bounds.length - 2 ? endOk(b) : ok(b);
    }
    const T = n => crit.get(n) ?? nice(n);
    if (info) Object.assign(info, {v, parts, fns, pts, lo, hi, mid, T});
    if (periodic && segs.length) {
      // yksi jakso [0, P): välit toistuvat; jakson rajan yli menevä väli yhdistetään
      if (segs.length > 1 && segs[0].a === 0 && segs[0].b === 0 && segs[segs.length - 1].b === P) { segs.shift(); const l = segs[segs.length - 1]; l.a -= P; l.b = 0; segs.unshift(segs.pop()); }
      const f = segs[0], l = segs[segs.length - 1];
      if (f.a === 0 && l.b === P && f.b > 0 && l.a < P && segs.length > 1) { f.a = l.a - P; f.aIn = l.aIn; segs.pop(); }
      if (segs.length === 1 && f.b - f.a >= P - 1e-9) {
        // koko jakso (mahdollisesti paitsi yksittäiset pisteet)
        const holes = [...crit.keys()].filter(k => k >= 0 && k < P && !ok(k)).sort((a, b) => a - b);
        if (!holes.length) return {tex: '\\Leftrightarrow ' + v + '\\in\\mathbb{R}'};
        return {tex: '\\Leftrightarrow ' + holes.map(h => v + '\\ne ' + (Math.abs(h) < 1e-9 ? '' : T(h) + '+') + 'n\\cdot ' + nice(P)).join(',\\ ') + ',\\ n\\in\\Z'};
      }
    }
    if (!segs.length) return {tex: '\\text{Ei ratkaisua' + (cond ? ', kun }' + cond.tex : '}')};
    if (segs.length === 1 && segs[0].a === -Infinity && segs[0].b === Infinity) return {tex: '\\Leftrightarrow ' + v + '\\in\\mathbb{R}'};
    const le = inc => inc ? '\\le ' : '<';
    const Tp = n => periodic ? (Math.abs(n) < 1e-9 ? '' : T(n) + '+') + 'n\\cdot ' + nice(P) : T(n);
    const out = segs.map(s => s.a === s.b ? v + '=' + Tp(s.a)
      : s.a === -Infinity ? v + le(s.bIn) + T(s.b)
      : s.b === Infinity ? v + (s.aIn ? '\\ge ' : '>') + T(s.a)
      : Tp(s.a) + le(s.aIn) + v + le(s.bIn) + Tp(s.b));
    return {tex: '\\Leftrightarrow ' + out.join('\\ \\lor\\ ') + (periodic ? ',\\ n\\in\\Z' : '')};
  }
  // epäyhtälön vaiheet: kaikki vasemmalle, nollakohdat, merkkikaavio ja vastaus
  function ineqSteps(latex, want, cond) {
    const info = {}, r = ineqRun(latex, want, cond, info);
    if (!r) return null;
    const rows = [['', latex, '']], OPT = {'<': '<', '>': '>', '≤': '\\le ', '≥': '\\ge '};
    const out = () => ({tex: r.tex, steps: rows});
    const ans = r.tex.replace(/^\\Leftrightarrow /, '');
    if (info.others) { rows.push(['\\Leftrightarrow', ans, 'ratkaistaan ' + info.v]); return out(); }
    if (info.parts.length > 1) {
      // kaksoisepäyhtälö tai ryhmä: jokainen ehto erikseen, sitten yhteinen osa
      for (const q of info.parts) {
        let a; try { a = ineqRun(q.tex, info.v, cond).tex.replace(/^\\Leftrightarrow /, ''); } catch { continue; }
        rows.push(['', q.tex + '\\ \\Leftrightarrow\\ ' + a, '']);
      }
      rows.push(['\\Leftrightarrow', ans, 'ehtojen yhteinen osa']);
      return out();
    }
    const q = info.parts[0], v = info.v, f0 = info.fns[0];
    let F = q.f; try { F = simp(q.f); } catch {}
    let fac = F; try { const t = nerdamer('factor(' + F + ')').toString(); if (!/factor/.test(t)) fac = t; } catch {}
    const trig = /\\(?:sin|cos|tan|cot)(?![a-zA-Z])/.test(latex), zeroR = /^\s*0\s*$/.test(q.R);
    // trigonometria näytetään kirjoitetussa muodossa (sisäinen astemuunnos olisi sotkuinen)
    const ftex = trig ? (zeroR ? q.L : q.L + '-' + (/[+-]/.test(q.R.slice(1)) ? '\\left(' + q.R + '\\right)' : q.R)) : tex(fac).replace(/(\\right\)|[a-z]) \\cdot (?=\\left\(|[a-z])/g, '$1');
    const nz = t => t.replace(/\\left|\\right|\\dfrac|\s|[()]/g, x => x === '\\dfrac' ? '\\frac' : '');
    if (!(zeroR && (trig || nz(ftex) === nz(q.L)))) rows.push(['\\Leftrightarrow', ftex + OPT[q.op] + '0', zeroR ? 'jaetaan tekijöihin' : 'kaikki termit vasemmalle']);
    // tekijät merkkikaavioon: osat, jotka on kerrottu tai jaettu keskenään
    const pieces = []; { let d = 0, cur = '', den = false;
      const push = () => { let s = cur.trim(), dn = den; const m = /^(.*)\^\(-1\)$/.exec(s); if (m) { s = m[1]; dn = !dn; } if (s) pieces.push({s, den: dn}); cur = ''; };
      for (const ch of fac) { if (ch === '(') d++; if (ch === ')') d--; if (d === 0 && (ch === '*' || ch === '/')) { push(); den = ch === '/'; continue; } cur += ch; }
      push(); }
    const facs = pieces.filter(p => vars(p.s).includes(v)).map(p => { let g; try { g = nerdamer(p.s).buildFunction([v]); } catch { return null; } return {tex: tex(p.s.replace(/^\((.*)\)$/, '$1')), g: x => { try { const y = g(x); return typeof y === 'number' ? y : NaN; } catch { return NaN; } }}; });
    const useFacs = !trig && facs.length > 1 && facs.every(Boolean);
    const zeros = info.pts.filter(p => Math.abs(f0(p)) < 1e-9), undef = info.pts.filter(p => !zeros.includes(p));
    const xs = zs => zs.map(p => v + '=' + info.T(p)).join(',\\ ');
    if (zeros.length) rows.push(['', xs(zeros), 'nollakohdat']);
    if (undef.length) rows.push(['', xs(undef), 'ei määritelty']);
    if (!zeros.length && !undef.length) rows.push(['', '\\text{ei nollakohtia}', 'merkki on sama kaikkialla']);
    // merkkikaavio: välit ja niiden väliset kohdat vuorotellen
    const pts = info.pts, lo = info.lo, hi = info.hi, cols = [];
    const bounds = [lo, ...pts, hi];
    if (isFinite(lo)) cols.push({pt: lo});
    for (let i = 0; i < bounds.length - 1; i++) { cols.push({mid: info.mid(bounds[i], bounds[i + 1])}); if (i < bounds.length - 2 || isFinite(hi)) cols.push({pt: bounds[i + 1]}); }
    const sg = (g, c) => { const y = g(c.pt ?? c.mid); if (isNaN(y) || !isFinite(y) || Math.abs(y) > 1e12) return c.pt !== undefined ? '\\nexists' : ''; if (Math.abs(y) < 1e-9) return '0'; if (c.pt !== undefined) return ''; return y > 0 ? '+' : '-'; };
    // kaavio tallennetaan JSONina ('CHART:'), sovellus piirtää siitä taulukon
    const line = (name, g) => [name, ...cols.map(c => sg(g, c))];
    const chart = 'CHART:' + JSON.stringify({head: [v, ...cols.map(c => c.pt !== undefined ? info.T(c.pt) : '')],
      rows: [...(useFacs ? facs.map(f => line(f.tex, f.g)) : []), line(useFacs ? '\\text{tulos}' : ftex, f0)], total: useFacs});
    rows.push(['', chart, 'merkkikaavio']);
    rows.push(['\\Leftrightarrow', ans, {'<': 'missä tulos on negatiivinen', '>': 'missä tulos on positiivinen', '≤': 'missä tulos on negatiivinen tai nolla', '≥': 'missä tulos on positiivinen tai nolla'}[q.op]]);
    return out();
  }
  function run(action, latex, opt = {}) {
    // an error inside nerdamer's evaluate() can leave it stuck in decimals-only mode (after x = x+1, ln 0,917 came out as a long fraction)
    try { nerdamer.getCore().Settings.PARSE2NUMBER = false; } catch {}
    latex = stripStyle(latex);
    // ± ja ∓: lasketaan molemmat merkit erikseen ja yhdistetään vastaukset (2±3 = 5 tai −1, x=±√4 → x=−2 ∨ x=2)
    const pm = /\\(pm|mp)(?![a-zA-Z])/.exec(latex);
    if (pm && action !== 'steps' && action !== 'graph') {
      const sub = (sgn) => latex.replace(/\\(pm|mp)(?![a-zA-Z])/g, (m, c) => (c === 'pm') === (sgn > 0) ? '+' : '-');
      const rs = [sub(1), sub(-1)].map(l => run(action, l, opt));
      const tx = rs.map(r => String(r && r.tex || ''));
      if (tx[0] === tx[1]) return rs[0];
      const rel = /^(\\Leftrightarrow|=|\\approx)\s*/;
      const m0 = rel.exec(tx[0]), m1 = rel.exec(tx[1]);
      if (m0 && m1 && m0[1] === '\\Leftrightarrow' && m1[1] === m0[1]) {
        const parts = [];
        for (const t of tx) for (const q of t.replace(rel, '').split('\\ \\lor\\ ')) if (!parts.includes(q)) parts.push(q);
        const real = parts.filter(q => !/ei ratkaisua/.test(q));
        return {...rs[0], tex: '\\Leftrightarrow ' + (real.length ? real : parts.slice(0, 1)).join('\\ \\lor\\ ')};
      }
      if (m0 && m1) return {...rs[0], tex: tx[0] + '\\ \\text{tai}\\ ' + (m0[1] === m1[1] ? tx[1].replace(rel, '') : tx[1])};
      return rs[0];
    }
    // a "several rows" field with only one row is a normal formula
    latex = latex.replace(/^\s*\\displaylines\{([\s\S]*)\}\s*$/, (m, b) => /\\\\/.test(b) ? m : b);
    // Nspire style: "yhtälö, x" at the end chooses the letter
    // { brace system: rows become "eq; eq"
    // Integroi-nappi määrätylle integraalille: lasketaan arvo
    // ∫ … dx ilman rajoja: integraalifunktio + C
    const ii = (action === 'integrate' || action === 'calc') && /^\s*\\int(?!\s*[_^])([\s\S]*?)(?:\\[,;! ]|\s)*(?:\\mathrm\{d\}|\\differentialD|d)\s*([a-zA-Z])\s*$/.exec(latex);
    if (ii && ii[1].trim()) { latex = ii[1]; action = 'integrate'; opt = {...opt, v: ii[2]}; }
    if (action === 'integrate' && /\\int/.test(latex)) action = 'calc';
    const isSys = /cases|displaylines/.test(latex);
    latex = latex.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_, b) =>
      b.split(/\\\\/).map(r => r.replace(/&/g, '').replace(/\\placeholder\{\}/g, '').trim()).filter(Boolean).join(';'))
      .replace(/\\left\\lbrace|\\right\./g, '')
      .replace(/^\s*\\displaylines\{([\s\S]*)\}\s*$/, (_, b) => b.split(/\\\\/).map(r => r.trim()).filter(Boolean).join(';'));
    const SEP = '\\s*(?:\\{,\\}|,)\\s*(?:\\\\[,;: ]\\s*)*';
    // a letter may have a subscript or be Greek: ", v, f_0" or ", \\lambda"
    const LET = '(?:\\\\[a-zA-Z]+|[a-zA-Z])(?:_\\{?[a-zA-Z0-9]+\\}?)?';
    // a condition for the answer at the end: ", 0<a<180" or ", x>0" (also ≤ ≥)
    const cutCond = s => {
      s = s.replace(/\\lbrack(?![a-zA-Z])/g, '[').replace(/\\rbrack(?![a-zA-Z])/g, ']');
      // x ∈ [0, 360] (also ]0,360[ and (0,2π)): the comma inside the brackets is not the cut
      const iv = new RegExp('(?:\\{,\\}|,)\\s*(?:\\\\[,;: ]\\s*)*(' + LET + ')\\s*\\\\in(?![a-zA-Z])\\s*(?:\\\\left)?\\s*(\\[|\\]|\\()\\s*((?:\\{,\\}|[^,;])+?)\\s*[,;]\\s*((?:\\{,\\}|[^,;])+?)\\s*(?:\\\\right)?\\s*(\\]|\\[|\\))\\s*$').exec(s);
      if (iv) {
        const c = parseCond(iv[3] + (iv[2] === '[' ? '\\le ' : '<') + iv[1] + (iv[5] === ']' ? '\\le ' : '<') + iv[4], LET);
        if (c) { c.tex = s.slice(s.length - iv[0].length).replace(/^\s*(?:\{,\}|,)\s*/, ''); return {cond: c, rest: s.slice(0, s.length - iv[0].length).replace(/(?:\\[,;: ]|\s)+$/, '')}; }
      }
      const cut = [...s.matchAll(/,/g)].map(x => x.index).filter(i => !(s[i - 1] === '{' && s[i + 1] === '}') && s[i - 1] !== '\\').pop();
      const tail = cut === undefined ? '' : s.slice(cut + 1);
      if (cut === undefined || !/<|>|\\[lg]e|\\[lg]t|\\neq?(?![a-zA-Z])/.test(tail) || /[^:]=/.test(tail.replace(/\\[lg]eq?/g, ''))) return null;
      const c = parseCond(tail, LET);
      return c ? {cond: c, rest: s.slice(0, cut).replace(/(?:\\[,;: ]|\s)+$/, '')} : null;
    };
    let cond = null;
    { const c1 = cutCond(latex); if (c1) { cond = c1.cond; latex = c1.rest; } }
    // ehto ennen kirjaimia (", 0<x<5, x"): ehto pois, kirjaimet jäävät loppuun
    if (!cond) { const mv = latex.match(new RegExp('^([\\s\\S]*?\\S)((?:' + SEP + LET + ')+)\\s*$'));
      if (mv) { const c2 = cutCond(mv[1]); if (c2) { cond = c2.cond; latex = c2.rest + mv[2]; } } }
    const m = latex.match(new RegExp('^([\\s\\S]*?\\S)((?:' + SEP + LET + ')+)\\s*$'));
    if (m) { latex = m[1]; const vs = m[2].match(new RegExp(LET, 'g')).map(x => x.replace(/[\\_{}]/g, '')); opt = {...opt, v: vs[0], vs}; }
    // paper style chain "f = v/λ = 4,2 m/s / 2,1 Hz": work out the last part
    const parts = splitEq(latex);
    if (parts.length > 2 && !isSys && !latex.includes(';')) { latex = parts[parts.length - 1]; if (action === 'solve') action = 'calc'; }
    if (cond && !opt.v) opt = {...opt, v: cond.v};
    const o1 = {v: opt.v === 'E' ? 'Evar' : opt.v, vs: opt.vs, cond};
    let r;
    try { r = run1(action, latex, o1); }
    catch (e) {
      // "2π·d/λ = 2π·0,11 m / 0,66 m": the equation can't be solved, so work out the right side
      if (e && e.tex) r = {tex: e.tex}; else {
      if (!(parts.length === 2 && !isSys && !latex.includes(';') && (action === 'calc' || action === 'approx' || action === 'simplify'))) throw fin(e);
      try { r = run1(action, parts[1], {}); } catch { throw fin(e); }
      if (r.vars) throw fin(e); }
    }
    // letters with a letter subscript (α_r is alphar inside): show α_r again
    const G = 'alpha|beta|gamma|delta|varepsilon|epsilon|zeta|eta|vartheta|theta|kappa|lambda|mu|nu|xi|rho|sigma|tau|varphi|phi|chi|psi|omega';
    const vsub = {};
    for (const m of latex.matchAll(new RegExp('(\\\\(?:' + G + ')(?![a-zA-Z])|(?<![\\\\a-zA-Z])[a-zA-Z])_(?:\\{([a-zA-Z0-9]+)\\}|([a-zA-Z0-9]))', 'g'))) {
      const sub = m[2] || m[3]; if (!/[a-zA-Z]/.test(sub)) continue;
      vsub[(m[1] === 'E' ? 'Evar' : m[1].replace('\\', '')) + sub] = [m[1].replace('\\', ''), sub];
    }
    for (const n of Object.keys(vsub).sort((a, b) => b.length - a.length)) {
      const [base, sub] = vsub[n];
      r.tex = r.tex.replace(new RegExp('(?<![\\\\a-zA-Z])' + n + '(?![a-zA-Z])', 'g'), (G.split('|').includes(base) ? '\\' : '') + base + '_{' + sub + '}');
    }
    if (r.vars && Object.keys(vsub).length) r.vsub = vsub;
    r.tex = r.tex.replace(/Evar/g, 'E');
    // ΔT is DeltaT inside: show it as Δ T
    r.tex = r.tex.replace(/(^|[^\\a-zA-Z])Delta/g, '$1\\Delta ');
    // Greek letters written out as words (lambda=…): show them as real letters
    r.tex = r.tex.replace(/(^|[^\\a-zA-Z])(alpha|beta|gamma|delta|varepsilon|epsilon|zeta|eta|vartheta|theta|kappa|lambda|mu|nu|xi|rho|sigma|tau|varphi|phi|chi|psi|omega)(?![a-zA-Z])/g, '$1\\$2');
    // letters with a subscript (f_0 is f0 inside): show the small number again
    r.tex = r.tex.replace(/(\\(?:alpha|beta|gamma|delta|varepsilon|epsilon|zeta|eta|vartheta|theta|kappa|lambda|mu|nu|xi|rho|sigma|tau|varphi|phi|chi|psi|omega))(\d+)(?![\d.])/g, '$1_{$2}')
      .replace(/(^|[^\\a-zA-Z0-9{.,])([a-zA-Z])(\d+)(?![\d.{])/g, '$1$2_{$3}')
      // also a whole group like {v2} (the bottom of a fraction), but not unit names like \mathbf{m2}
      .replace(/(?<!\\(?:operatorname|mathbf|mathrm|text|textbf))\{([a-zA-Z])(\d+)\}/g, '{$1_{$2}}');
    if (r.vars) r.vars = r.vars.map(v => v === 'Evar' ? 'E' : v);
    if (r.v === 'Evar') r.v = 'E';
    // equation systems choose letters with ", x, y" at the end, not with buttons
    if (isSys || latex.includes(';')) delete r.vars;
    return r;
  }
  function run1(action, latex, opt) {
    approxHit = false;
    if (action === 'steps') { const is = ineqSteps(latex, opt.v, opt.cond); if (is) return is; }
    if (action === 'steps') { const d = tryDefine(latex); if (d) throw new Err('Määrittelyllä ei ole vaiheita.'); return stepsRun(latex, opt.v); }
    if (['solve','calc','approx'].includes(action)) { const ir = ineqRun(latex, opt.v, opt.cond); if (ir) return ir; }
    const st = statRun(latex); if (st) return st;
    const mr = matRun(latex, action); if (mr) return mr;
    const def = tryDefine(latex);
    if (def) return {tex: def.kind === 'fn' ? '\\text{määritelty } ' + def.name + '(' + def.v + ')' : '\\text{muistissa } ' + def.name};
    const ur = unitRun(latex, opt.v, opt.vs, action);
    if (ur) return ur;
    const aDeg = toAscii(latex);
    if (!aDeg.trim()) throw new Err('Kirjoita ensin kaava.');
    const hasEq = /[^:<>]=/.test(aDeg) && !aDeg.includes(':=');
    // an equation with several letters gives a letter answer: keep sin x as it is (no degree factors like 122925461/7043110110)
    if (hasEq && !aDeg.includes(';') && vars(aDeg).length > 1 && (action === 'solve' || action === 'calc' || action === 'approx')) return solve(toAscii(latex, {rad: true}), opt.v, opt.vs, opt.cond);
    if (aDeg.includes(';') || (hasEq && (action === 'solve' || action === 'calc' || action === 'approx'))) return solve(aDeg, opt.v, opt.vs, opt.cond);
    if (hasEq) throw new Err('Yhtälölle käytä Ratkaise.');
    const noVars = !vars(aDeg).length;
    // arcsin 2: ei määritelty (ei kompleksilukua eikä 180·arcsin(2)/π)
    if (noVars && /\ba(?:sin|cos)d?\(/.test(aDeg)) { const f = numFn(aDeg.replace(/\b(a?(?:sin|cos|tan))d\(/g, '$1D('), '_'); if (f && isNaN(f(0))) throw new Err('Ei määritelty: arcsin ja arccos on määritelty vain luvuille −1…1.'); }
    // degrees only for plain numbers; algebra (derivative etc.) always in radians
    const a = noVars ? aDeg : toAscii(latex, {rad: true});
    // arcsin 0,5 asteina: vastaukseen °-merkki (vain kun koko lasku on yksi arcsin/arccos/arctan)
    const dg = noVars && /^\s*a(?:sin|cos|tan)d\(/.test(a) && (() => { let k = 0; const t = a.trim(); for (let i = t.indexOf('('); i < t.length; i++) { if (t[i] === '(') k++; else if (t[i] === ')' && !--k) return i === t.length - 1; } return false; })();
    if (dg && (action === 'calc' || action === 'approx')) { const n = numeric(a); if (n !== null && isFinite(n)) return {tex: (action === 'calc' && Math.abs(n - Math.round(n)) < 1e-9 ? '=' + fmtNum(Math.round(n)) : '\\approx ' + fmtNum(n)) + '^{\\circ}'}; }
    switch (action) {
      case 'calc': {
        if (noVars && approxHit) { const n = numeric(a); if (n !== null && isFinite(n)) return {tex: '\\approx ' + fmtNum(n)}; }
        if (noVars) { const big = bigTex(bigLog(a) || {l: 0}); if (big) { let r = null; try { r = numeric(a); } catch {} if (r === null || !isFinite(r) || r === 0) return {tex: '\\approx ' + big}; } return {tex: present(nerdamer(a).toString())}; }
        let r; try { r = simp(a); } catch { r = nerdamer(a).toString(); }
        return {tex: '=' + pretty(r, latex, !isPoly(a))};   // murtolauseke → polynomi: auki kerrottuna
      }
      case 'approx': {
        const n = numeric(a);
        if (n === null || !isFinite(n) || n === 0) { const big = bigTex(bigLog(a) || {l: 0}); if (big) return {tex: '\\approx ' + big}; }
        if (n !== null) return {tex: '\\approx ' + fmtNum(n)};
        // letters left (m·0,917¹⁴): numbers as decimals, not long fractions
        // (tex() would turn decimals back into fractions, so each decimal hides behind a stand-in letter name)
        try { const nums = [];
          const d = nerdamer(a).evaluate().text('decimals').replace(/\d+\.\d+(e[+-]?\d+)?/g, x => { nums.push(Number(x)); return 'qzz' + 'abcdefghijklmnopqrstuvwxyz'[nums.length - 1]; });
          if (nums.length <= 26 && !/\d{7,}/.test(d)) { let t = tex(d); nums.forEach((n, i) => { t = t.split('qzz' + 'abcdefghijklmnopqrstuvwxyz'[i]).join(fmtNum(n)); });
            if (!/qzz/.test(t)) return {tex: '\\approx ' + t}; } } catch {}
        return {tex: '\\approx ' + tex(nerdamer(a).evaluate().toString())};
      }
      case 'simplify': { const r = simp(a), g = giacExpr('simplify(' + a + ')');
        return {tex: "=" + decTex(g && g.length <= r.length + 4 ? g : r, latex)}; }
      case 'factor': return {tex: '=' + tex(nerdamer('factor(' + a + ')').toString())};
      case 'expand': return {tex: '=' + decTex(nerdamer('expand(' + a + ')').toString(), latex)};
      case 'diff': {
        const v = pickVar(a, opt.v);
        // Giac derivoi (nerdamer kaatuu esim. ln|x|:ään), nerdamer varalla; vastaus tekstikirjan muotoon
        // d/dx already written in the formula: differentiate only once
        const de = /\bdiff\(/.test(a) ? a : 'diff(' + a + ',' + v + ')', g = giacExpr(toG(de));
        let nd = null; try { nd = simp(de); } catch {}
        const d = g && (!nd || sameVal(g, nd)) ? g : nd; if (!d) throw new Err('Tätä derivaattaa en osaa laskea.');
        return {vars: vars(a), v, tex: '\\overset{D_' + v + '}{=}' + pretty(d, latex)};
      }
      case 'integrate': {
        const v = pickVar(a, opt.v);
        // Giac antaa ∫(x²+1)/x = x²/2 + ½ln(x²): ½ln(u²) = ln|u| (nerdamer tekisi siitä väärin ln u)
        const gi = giacEval('integrate(' + toG(a) + ',' + v + ')');
        const r = (gi && fromGiac(GR(gi).replace(/\bln\(((?:[^()]|\([^()]*\))+)\^2\)/g, '(2*ln(abs($1)))'))) || nerdamer('integrate(' + a + ',' + v + ')').toString();
        if (r.includes('integrate')) throw new Err('Tätä integraalia en osaa laskea.');
        return {vars: vars(a), v, tex: '\\overset{\\int}{=}' + lnAbs(tex(absLog(r, v))) + '+C'};
      }
      case 'solve': throw new Err('Ratkaise tarvitsee yhtälön, esim. 2x+1=5.');
    }
  }

  // sin, cos or tan of a first-degree expression = a number: every solution, with the period (n is any whole number)
  function trigSolve(p, v, C) {
    const m = /(?:^|[^a-z])(sin|cos|tan)(d?)\(/.exec(p); if (!m) return null;
    const name = m[1] + m[2] + '(', start = p.indexOf(name, m.index), open = start + name.length - 1;
    let depth = 0, end = -1;
    for (let i = open; i < p.length; i++) { if (p[i] === '(') depth++; else if (p[i] === ')' && --depth === 0) { end = i; break; } }
    if (end < 0) return null;
    const arg = p.slice(open + 1, end), rest = p.slice(0, start) + 'TT' + p.slice(end + 1);
    if (vars(rest).join() !== 'TT' || vars(arg).join() !== v) return null;
    const lin = (e, x) => {
      if (Number(nerdamer('deg(expand(' + e + '),' + x + ')').toString()) !== 1) return null;
      const at = n => { const r = Number(nerdamer(e, {[x]: String(n)}).evaluate().text('decimals')); return isFinite(r) ? r : null; };
      const c0 = at(0), c1 = at(1);
      return c0 !== null && c1 !== null && Math.abs(c1 - c0) > 1e-12 ? [c0, c1 - c0] : null;
    };
    const R = lin(rest, 'TT'), A = lin(arg, v); if (!R || !A) return null;
    const c = -R[0] / R[1], isDeg = m[2] === 'd', H = isDeg ? 180 : Math.PI, u = isDeg ? 180 / Math.PI : 1;
    let bases, per = 2 * H;
    if (m[1] === 'tan') { bases = [Math.atan(c) * u]; per = H; }
    else if (Math.abs(c) > 1 + 1e-12) return '\\Leftrightarrow \\text{ei ratkaisua}';
    else { const cc = Math.max(-1, Math.min(1, c)); if (m[1] === 'sin') { const t = Math.asin(cc) * u; bases = [t, H - t]; } else { const t = Math.acos(cc) * u; bases = [t, -t]; } }
    per = Math.abs(per / A[1]);
    const xs = [];
    for (const b of bases) {
      const x = (b - A[0]) / A[1];
      if (!xs.some(y => { const d = Math.abs(x - y) / per; return Math.abs(d - Math.round(d)) < 1e-9; })) xs.push(x);
    }
    xs.sort((a, b) => a - b);
    // kaksi ratkaisuparvea puolen jakson välein (sin x = 0: 0° ja 180°) → yksi: x = n·180°
    if (xs.length === 2 && Math.abs(Math.abs(xs[1] - xs[0]) - per / 2) < 1e-9 * per) { per /= 2; let x0 = ((xs[0] % per) + per) % per; if (per - x0 < 1e-9 * per) x0 = 0; xs.splice(0, 2, x0); }
    // degrees get a ° sign; radians are shown as parts of π when they are neat
    const show = x => {
      if (isDeg) return fmtNum(x) + '^{\\circ}';
      const r = x / Math.PI;
      for (let q = 1; q <= 12; q++) {
        const k = r * q;
        if (Math.abs(k - Math.round(k)) < 1e-9 && Math.round(k) !== 0) {
          const n = Math.abs(Math.round(k)), top = (n === 1 ? '' : n) + '\\pi';
          return (k < 0 ? '-' : '') + (q === 1 ? top : '\\frac{' + top + '}{' + q + '}');
        }
      }
      return fmtNum(x);
    };
    const zero = x => Math.abs(x) < 1e-9;
    if (C && C.lo !== undefined && C.hi !== undefined) {
      // every answer between the bounds, smallest first
      const list = [];
      for (const x0 of xs) {
        for (let k = Math.ceil((C.lo - x0) / per - 1e-9); x0 + k * per <= C.hi + 1e-9 && list.length < 60; k++) { const x = x0 + k * per; if (C.ok(x)) list.push(x); }
      }
      list.sort((a, b) => a - b);
      if (!list.length) return '\\Leftrightarrow \\text{ei ratkaisua, kun }' + C.tex;
      return '\\Leftrightarrow ' + list.map(x => v + '=' + (zero(x) ? (isDeg ? '0^{\\circ}' : '0') : show(x))).join('\\ \\lor\\ ');
    }
    if (C) return '\\Leftrightarrow ' + xs.map(x => v + '=' + (zero(x) ? '' : show(x) + '+') + 'n\\cdot ' + show(per)).join('\\ \\lor\\ ') + ',\\ n\\in\\Z,\\ \\text{kun }' + C.tex;
    return '\\Leftrightarrow ' + xs.map(x => v + '=' + (zero(x) ? '' : show(x) + '+') + 'n\\cdot ' + show(per)).join('\\ \\lor\\ ') + ',\\ n\\in\\Z';
  }
  // muut trigonometriset yhtälöt (sin x = cos x, sin²x = 1): nollakohdat yhdeltä kierrokselta numeerisesti, sitten jakso
  // fast decimal function of one letter (nerdamer's own turns 0,999879^a into 999879^a/1000000^a, which overflows,
  // and its exact evaluate() takes minutes for a^5730); null when the expression has other names
  function jsFn(expr, v) {
    const F = {sqrt: 'Math.sqrt', log: 'Math.log', log10: 'Math.log10', exp: 'Math.exp', abs: 'Math.abs', pi: 'Math.PI', e: 'Math.E', oddroot: '__r'};
    // pariton juuri negatiivisesta luvusta on reaalinen (∛−27 = −3): (B)^(p/q), q pariton → oddroot((B),p,q)
    for (let i = expr.search(/\^\(\(?-?\d+\)?\/\(?\d*[13579]\)?\)/), guard = 0; i > 0 && guard++ < 50; i = expr.search(/\^\(\(?-?\d+\)?\/\(?\d*[13579]\)?\)/)) {
      const m = /^\^\(\(?(-?\d+)\)?\/\(?(\d+)\)?\)/.exec(expr.slice(i));
      let s = i - 1;
      if (expr[s] === ')') { for (let d = 0; s >= 0; s--) { if (expr[s] === ')') d++; else if (expr[s] === '(' && !--d) break; } if (s < 0) return null; }
      else { while (s > 0 && /[\w.]/.test(expr[s - 1])) s--; if (!/[\w.]/.test(expr[s])) return null; }
      expr = expr.slice(0, s) + 'oddroot(' + expr.slice(s, i) + ',' + m[1] + ',' + m[2] + ')' + expr.slice(i + m[0].length);
    }
    let ok = true;
    const js = expr.replace(/[a-zA-Z_]\w*/g, w => w === v ? '__v' : F[w] || (ok = false, w)).replace(/\^/g, '**');
    if (!ok || /[^\d.,\s+\-*/()_vMathsqrtlogexpbPIE]/.test(js)) return null;
    try { const f = new Function('__v', 'const __r=(a,p,q)=>(a<0&&q%2?(p%2?-1:1):1)*Math.abs(a)**(p/q);return ' + js); f(1.234); return f; } catch { return null; }
  }
  // nerdamer misses some exponent equations (70000·0,28^x = 100): find the roots by number search instead
  function expNum(p, v) {
    if (!new RegExp('\\^\\s*\\(?[^=]*' + v).test(p)) return null;
    return numRoots(p, v);
  }
  // reaaliset nollakohdat merkin vaihdoksista (x³−3x+1 = 0, eˣ = x+2), kun tarkkaa ratkaisua ei löydy
  function numRoots(p, v) {
    let g = jsFn(p, v); if (!g) try { g = nerdamer(p).buildFunction([v]); } catch { return null; }
    const f = x => { let y; try { y = g(x); } catch { return NaN; } return typeof y === 'number' ? y : NaN; };
    const xs = [];   // dense near 0, sparse far away, from -10 million to 10 million
    for (let i = -4000; i <= 4000; i++) xs.push(Math.sign(i) * (Math.exp(Math.abs(i) * Math.log(1e7 + 1) / 4000) - 1));
    const out = [];
    for (let i = 0; i < xs.length - 1; i++) {
      const a = f(xs[i]), b = f(xs[i + 1]);
      if (!isFinite(a) || !isFinite(b)) continue;
      if (a === 0) { const c = i ? f(xs[i - 1]) : NaN; if (c && b && c * b < 0) out.push(xs[i]); continue; }   // a real crossing, not a number too small to store
      if (a * b > 0 || b === 0) continue;
      let lo = xs[i], hi = xs[i + 1], fl = a;
      for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2, fm = f(m); if (fl * fm <= 0) hi = m; else { lo = m; fl = fm; } }
      const m = (lo + hi) / 2;
      if (Math.abs(f(m)) <= 1e-6 * Math.max(Math.abs(a), Math.abs(b))) out.push(m);   // not a jump over a pole
    }
    return out.length ? out.map(x => String(Math.round(x * 1e12) / 1e12)) : null;
  }
  // käykö luku n yhtälöön L = R (desimaalifunktiot): sivut lähes samat suhteessa kokoonsa, tai molemmat lähes 0
  // ja ero on pieni verrattuna siihen, miten ero muuttuu lähellä (x·eˣ = 0 kohdassa 0; ei 0,5ˣ = 0 kohdassa 2000)
  function sameAt(L, R, n) {
    const l = L(n), r = R(n); if (!isFinite(l) || !isFinite(r)) return false;
    const s = Math.max(Math.abs(l), Math.abs(r));
    if (s > 1e-300 && Math.abs(l - r) <= 1e-7 * s) return true;
    const h = 1e-4 * Math.max(1, Math.abs(n)), d = Math.max(...[n - h, n + h].map(t => Math.abs(L(t) - R(t))).filter(isFinite), 0);
    return d > 1e-300 && Math.abs(l - r) <= 1e-6 * d;
  }
  function trigNum(p, v, C) {
    if (!/(?:^|[^a-z])(?:sin|cos|tan|cot|sec|csc)d?\(/.test(p)) return null;
    const isDeg = /(?:sin|cos|tan|cot|sec|csc)d\(/.test(p), F1 = isDeg ? 360 : 2 * Math.PI;
    let g; try { g = nerdamer(p).buildFunction([v]); } catch { return null; }
    const f = x => { let y; try { y = g(x); } catch { return NaN; } return typeof y === 'number' ? y : NaN; };
    // jakso: yksi kierros, tai 2–4 kierrosta kun kulma on jaettu (sin(x/2) toistuu 720°:n välein)
    const toistuu = F => [0.37, 1.91, 4.3].every(t => { const a = f(t * F1 / 7), b = f(t * F1 / 7 + F); return isFinite(a) && Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a)); });
    const F = [1, 2, 3, 4].map(k => k * F1).find(toistuu); if (!F) return null;
    const N = 7200 * F / F1, h = F / N, ys = [], rs = [];
    for (let i = 0; i <= N + 1; i++) ys.push(f(i * h));
    const add = x => { x = ((x % F) + F) % F; if (F - x < 1e-7) x = 0; if (!rs.some(r => Math.abs(r - x) < 1e-6 || Math.abs(Math.abs(r - x) - F) < 1e-6)) rs.push(x); };
    for (let i = 0; i < N; i++) {
      const a = ys[i], b = ys[i + 1];
      if (!isFinite(a) || !isFinite(b)) continue;
      if (a === 0) { add(i * h); continue; }
      if (a * b < 0) { let lo = i * h, hi = lo + h, fl = a;
        for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, fm = f(m); if (fl * fm <= 0) hi = m; else { lo = m; fl = fm; } }
        const m = (lo + hi) / 2; if (Math.abs(f(m)) < 1e-6) add(m); continue; }
      // kosketus (sin²x = 1): |f| pienimmillään ja lähes nolla
      const c = ys[i + 2];
      if (i > 0 && isFinite(c) && Math.abs(b) <= Math.abs(a) && Math.abs(b) <= Math.abs(c) && Math.abs(b) < 1e-2) {
        let lo = i * h, hi = (i + 2) * h;
        for (let k = 0; k < 100; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (Math.abs(f(m1)) < Math.abs(f(m2))) hi = m2; else lo = m1; }
        const m = (lo + hi) / 2; if (Math.abs(f(m)) < 1e-10) add(m);
      }
    }
    const snap = x => { const k = isDeg ? x : x / Math.PI * 180, r = Math.round(k * 1e3) / 1e3; return Math.abs(k - r) < 1e-6 ? (isDeg ? r : r * Math.PI / 180) : x; };
    let xs = rs.map(snap).sort((a, b) => a - b);
    if (!xs.length) return '\\Leftrightarrow \\text{ei ratkaisua}';
    // lyhin jakso F/k, jolla ratkaisujoukko toistuu
    let per = F;
    for (let k = 12; k >= 2; k--) { const P = F / k; if (xs.every(x => xs.some(y => { const d = (((y - x - P) % F) + F) % F; return d < 1e-5 || F - d < 1e-5; }))) { per = P; break; } }
    xs = xs.filter(x => x < per - 1e-7);
    const show = x => isDeg ? fmtNum(x) + '^{\\circ}' : (niceNum(x, true, false) ?? fmtNum(x));
    const zero = x => Math.abs(x) < 1e-9;
    if (C && C.lo !== undefined && C.hi !== undefined) {
      const list = [];
      for (const x0 of xs) for (let k = Math.ceil((C.lo - x0) / per - 1e-9); x0 + k * per <= C.hi + 1e-9 && list.length < 60; k++) { const x = x0 + k * per; if (C.ok(x)) list.push(x); }
      list.sort((a, b) => a - b);
      if (!list.length) return '\\Leftrightarrow \\text{ei ratkaisua, kun }' + C.tex;
      return '\\Leftrightarrow ' + list.map(x => v + '=' + (zero(x) ? (isDeg ? '0^{\\circ}' : '0') : show(x))).join('\\ \\lor\\ ');
    }
    return '\\Leftrightarrow ' + xs.map(x => v + '=' + (zero(x) ? '' : show(x) + '+') + 'n\\cdot ' + show(per)).join('\\ \\lor\\ ') + ',\\ n\\in\\Z' + (C ? ',\\ \\text{kun }' + C.tex : '');
  }
  // real roots of p = 0 for v, sorted, without repeats
  // coeffs() turns π and e into long fractions, so they are hidden as letters while it runs
  const hideK = x => String(x).replace(/\bpi\b/g, 'zpiz').replace(/\be\b/g, 'zeez'), showK = x => String(x).replace(/zpiz/g, 'pi').replace(/zeez/g, 'e');
  function roots(p, v, eq) { const nv = x => { try { return numeric(x); } catch { return null; } }; return rootsH(hideK(p), v, eq && hideK(eq)).map(showK).sort((a, b) => (nv(a) ?? 0) - (nv(b) ?? 0)); }
  function rootsH(p, v, eq) {
    let list = null;
    // exact roots for polynomials up to degree 2 (nerdamer gives long fractions for sqrt roots)
    try {
      const d = Number(nerdamer('deg(expand(' + p + '),' + v + ')').toString());
      const c = nerdamer('coeffs(expand(' + p + '),' + v + ')').symbol.elements.map(e => e.toString());
      if (d === 1) list = [simp('-(' + c[0] + ')/(' + c[1] + ')')];
      if (d === 2) {
        const [C0, B, A] = c, D = simp('(' + B + ')^2-4*(' + A + ')*(' + C0 + ')');
        const Dn = numeric(D);
        if (Dn !== null && Dn < 0) list = [];
        else if (Dn === 0) list = [simp('-(' + B + ')/(2*(' + A + '))')];
        else list = ['+', '-'].map(s => simp('(-(' + B + ')' + s + 'sqrt(' + D + '))/(2*(' + A + '))'));
      }
      // pure power A·x^n + B = 0 (a^5730 = 1/2): x = ⁿ√(−B/A), and also the negative root when n is even
      if (d > 2) {
        // shape check with test numbers for the other letters (a^5730·m = 0,5m): f(x) = f(0) + (f(1) − f(0))·x^d
        const others = vars(p).filter(u => u !== v);
        const shape = k => { const q = p.replace(/[a-zA-Z_]\w*/g, w => others.includes(w) ? '(' + (k ? 2.7 + 0.31 * others.indexOf(w) : 1.3 + 0.17 * others.indexOf(w)) + ')' : w);
          let g = jsFn(q, v); if (!g) g = nerdamer(q).buildFunction([v]);
          const b = g(0), a = g(1) - b; return a !== 0 && [-1, 0.9, 1.01, -1.01].every(x => { const y = g(x), w = a * Math.pow(x, d) + b; return isFinite(y) && Math.abs(y - w) <= 1e-9 * Math.max(1, Math.abs(w)); }); };
        if (shape(0) && shape(1)) {
          const B = simp(nerdamer(p, {[v]: '0'}).toString()), A = simp(nerdamer(p, {[v]: '1'}).toString() + '-(' + B + ')');
          const c = simp('-(' + B + ')/(' + A + ')'); let cn = null; try { cn = numeric(c); } catch {}
          if (cn === null) { const r = simp('(' + c + ')^(1/' + d + ')'); list = d % 2 ? [r] : [r, simp('-(' + r + ')')]; }
          else { const r = cn === 0 ? '0' : simp('(' + (cn < 0 ? '-(' + c + ')' : c) + ')^(1/' + d + ')');
            list = cn === 0 ? ['0'] : d % 2 ? [cn < 0 ? simp('-(' + r + ')') : r] : cn < 0 ? [] : [r, simp('-(' + r + ')')]; }
        }
      }
    } catch {}
    if (!list) {
      const sols = nerdamer.solve(eq || p, v);
      try { list = sols.symbol.elements.map(e => e.toString()); } catch { list = String(sols).replace(/^\[|\]$/g, '').split(',').filter(Boolean); }
      // nerdamer misses some square-root equations (3 = sqrt(7/x)): square both sides, then keep only roots that fit the original
      // (nerdamer can also give a wrong root for them, so every root is checked in the original equation)
      const sides = (eq || '').split('=');
      if (sides.length === 2 && /sqrt/.test(eq)) {
        const fits = x => { try { const l = numeric(nerdamer(sides[0], {[v]: '(' + x + ')'}).toString()), r = numeric(nerdamer(sides[1], {[v]: '(' + x + ')'}).toString()); return l !== null && r !== null && Math.abs(l - r) <= 1e-7 * Math.max(1, Math.abs(l), Math.abs(r)); } catch { return false; } };
        const numericOnly = list.every(x => { try { return numeric(x) !== null; } catch { return false; } });
        if (numericOnly) list = list.filter(fits);
        if (!list.length) {
          let sq = []; try { const s2 = nerdamer.solve('(' + sides[0] + ')^2=(' + sides[1] + ')^2', v); try { sq = s2.symbol.elements.map(e => e.toString()); } catch { sq = String(s2).replace(/^\[|\]$/g, '').split(',').filter(Boolean); } } catch {}
          list = sq.filter(fits);
        }
      }
    }
    const nv = x => { try { return numeric(x); } catch { return null; } };
    list.sort((p, q) => (nv(p) ?? 0) - (nv(q) ?? 0));
    list = list.filter(x => !/(^|[^a-z])i([^a-z]|$)/.test(x));
    const seen = new Set(), out = [];
    for (const x of list) {
      let n = null; try { n = numeric(x); } catch {}
      const key = n === null ? x : n.toFixed(9);
      if (!seen.has(key)) { seen.add(key); out.push(x); }
    }
    return out;
  }
  // system by substitution: a one-letter equation gives its roots, a linear one gives a letter to put in the others.
  // Returns a list of solutions ({} maps), [] when there is surely no solution, null when it can't tell.
  function subSolve(es, vs, depth = 0) {
    if (depth > 6) return null;
    const live = [];
    for (let e of es) {
      try { e = simp('expand(' + e + ')'); } catch { return null; }
      const vv = vars(e).filter(v => vs.includes(v));
      if (!vv.length) { if (vars(e).length) return null; let n = null; try { n = numeric(e); } catch {} if (n === null) return null; if (Math.abs(n) > 1e-9) return []; continue; }
      live.push([e, vv]);
    }
    if (!vs.length) return live.length ? null : [{}];
    if (!live.length) return 'many';   // letters left but no equations: endlessly many solutions
    const put = (e, v, val) => nerdamer(e, {[v]: '(' + val + ')'}).toString();
    const one = live.find(([, vv]) => vv.length === 1);
    if (one) {
      const v = one[1][0], rest = live.filter(x => x !== one).map(x => x[0]), out = [];
      let rs; try { rs = roots(one[0], v); } catch { return null; }
      if (!rs.length) {   // "no solution" only when it is surely a 1st or 2nd degree polynomial
        let d = NaN; try { d = Number(nerdamer('deg(' + hideK(one[0]) + ',' + v + ')').toString()); } catch {}
        if (!(d === 1 || d === 2) || /\^\s*\(?[^0-9(]|log|sin|cos|tan|sqrt|abs/.test(hideK(one[0]).replace(/\^\s*\(?\d+\)?/g, ''))) return null;
      }
      for (const r of rs) {
        let sub; try { sub = subSolve(rest.map(e => put(e, v, r)), vs.filter(u => u !== v), depth + 1); } catch { return null; }
        if (sub === null || sub === 'many') return null;
        for (const s of sub) out.push({[v]: r, ...s});
      }
      return out;
    }
    // pass 0: coefficient without unknowns; pass 1 (last resort, e.g. v=at): any coefficient, then "no solution" is not trusted
    for (const pass of [0, 1]) for (const [e, vv] of live) for (const v of vv) {
      let d, c; try { d = Number(nerdamer('deg(' + hideK(e) + ',' + v + ')').toString()); c = nerdamer('coeffs(' + hideK(e) + ',' + v + ')').symbol.elements.map(x => showK(x.toString())); } catch { continue; }
      if (d !== 1 || (!pass && vars(c[1]).some(u => vs.includes(u)))) continue;
      const expr = simp('-(' + c[0] + ')/(' + c[1] + ')'), rest = live.filter(x => x[0] !== e).map(x => x[0]);
      let sub; try { sub = subSolve(rest.map(x => put(x, v, expr)), vs.filter(u => u !== v), depth + 1); } catch { return null; }
      if (sub === null || sub === 'many') return pass ? null : sub;
      if (pass && !sub.length) return null;
      return sub.map(s => { let val = expr; for (const [u, w] of Object.entries(s)) val = put(val, u, w); return {...s, [v]: simp(val)}; });
    }
    return null;
  }
  function tooMany(vs, n) { vs = [...vs].sort((p, q) => 'xyz'.includes(q) - 'xyz'.includes(p)); const e = new Err('Kirjaimia (' + vs.join(', ') + ') on enemmän kuin yhtälöitä. Valitse ' + n + ' ratkaistavaa:'); e.pick = {vars: vs, n}; return e; }
  // sin x / sin(x/2) = n and the like: write x = 2w, use sin 2w = 2 sin w cos w and cos 2w = cos²w − sin²w, solve for w
  function halfRoots(p, v) {
    if (!/(sin|cos)d?\(/.test(p)) return null;
    let q = nerdamer(p, {[v]: '2*hw'}).toString();
    if (!/(sin|cos)d?\(2\*hw\)/.test(q)) return null;
    q = q.replace(/sin(d?)\(2\*hw\)/g, '(2*sin$1(hw)*cos$1(hw))').replace(/cos(d?)\(2\*hw\)/g, '(cos$1(hw)^2-sin$1(hw)^2)');
    try { q = simp(q); } catch {}
    let r = []; try { r = roots(q, 'hw'); } catch { return null; }
    r = r.map(x => { try { return simp('2*(' + x + ')'); } catch { return '2*(' + x + ')'; } });
    // keep only answers that really fit the first equation (checked with test numbers for the other letters)
    const others = vars(p).filter(x => x !== v), test = {};
    others.forEach((x, i) => { test[x] = String(1.3 + 0.17 * i); });
    r = r.filter(x => { try { const n = Number(nerdamer(p, {...test, [v]: '(' + nerdamer(x, test).toString() + ')'}).evaluate().text('decimals')); return !isFinite(n) || Math.abs(n) < 1e-6; } catch { return true; } });
    return r.length ? r : null;
  }
  // Giac (giac-lataa.js) ratkaisee yhtälön, kun se on latautunut. Vastaus muutetaan nerdamerin muotoon
  // (ln → log, 1.2e-05 → 1.2*10^(-5)); null = Giac ei ole käytössä tai vastaus on muodossa, jota ei osata näyttää
  function giacEval(s) { return typeof self !== 'undefined' && self.giacEval ? self.giacEval(s) : null; }
  function splitTop(s) { const out = []; let d = 0, st = 0;
    for (let k = 0; k < s.length; k++) { const c = s[k]; if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; else if (c === ',' && !d) { out.push(s.slice(st, k)); st = k + 1; } }
    out.push(s.slice(st)); return out.map(x => x.trim()); }
  function fromGiac(x) {
    if (/undef|inf|rootof|piecewise|when|sign|%|\?|assume|"|erf|\bi\b|\b(?:Ci|Si|Ei|Gamma|LambertW)\(/.test(x)) return null;
    x = x.replace(/\bln\(/g, 'log(').replace(/(\d(?:\.\d+)?)e([+-]?\d+)/g, '($1*10^($2))');
    try { nerdamer(x); return x; } catch { return null; }
  }
  // desimaalit tarkoiksi murtoluvuiksi, jotta Giac antaa tarkan vastauksen (a^5730 = 0,5 → 1/2^(1/5730)); present() päättää, näytetäänkö se
  const toG = p => p.replace(/(\d+)\.(\d+)/g, (m, a, b) => '(' + a + b + '/1' + '0'.repeat(b.length) + ')');
  function giacExpr(cmd) { const r = giacEval(cmd); return r ? fromGiac(r.trim()) : null; }
  // yhtälöryhmä: [{x: '2', y: '3'}, ...], [] = ei ratkaisua, 'many' = äärettömän monta, null = ei vastausta
  function giacSys(eqs, vs) {
    const r = giacEval('solve([' + eqs.map(toG).join(',') + '],[' + vs.join(',') + '])'); if (!r) return null;
    const m = /^(?:list)?\[([\s\S]*)\]$/.exec(r.trim()); if (!m) return null;
    if (!m[1].trim()) return [];
    const out = [];
    for (const row of splitTop(m[1])) { const k = /^\[([\s\S]*)\]$/.exec(row); if (!k) return null;
      const vals = splitTop(k[1]).map(fromGiac); if (vals.length !== vs.length || vals.some(x => x === null)) return null;
      if (vals.some(x => vars(x).some(u => vs.includes(u)))) return 'many';
      out.push(Object.fromEntries(vs.map((v, i) => [v, vals[i]]))); }
    return out;
  }
  function giacRoots(p, v) {
    const r = giacEval('solve(' + toG(p) + '=0,' + v + ')'); if (!r) return null;
    const m = /^(?:list)?\[([\s\S]*)\]$/.exec(r.trim()); if (!m) return null;
    if (!m[1].trim()) return [];
    if (/[<>]/.test(m[1])) return {ineq: splitTop(m[1])};   // |x−2| = x−2 → [x>2, 2]
    const out = splitTop(m[1]).map(fromGiac); return out.some(x => x === null) ? null : out;
  }
  // ---------- analyysi: raja-arvot, määrätyt integraalit, siisti vastaus ----------
  // vastaus, joka ei ole luku ("raja-arvoa ei ole"): heitetään ja run() näyttää sen vastauksena
  function ansErr(t) { const e = new Err(t.replace(/\\text\{([^{}]*)\}/g, '$1')); e.tex = t; return e; }
  // nerdamerin englanninkieliset virheet suomeksi
  function fin(e) { if (!e || e instanceof Err) return e; const m = String(e.message || e);
    return new Err(/division by zero/i.test(m) ? 'Nollalla ei voi jakaa.' : /is undefined|undefined for/i.test(m) ? 'Ei määritelty tällä arvolla (esim. tan 90°, ln 0, 0⁰).' : 'En osaa laskea tätä. Tarkista kaava.'); }
  const GI = x => toG(String(x)).replace(/\bInfinity\b/g, 'inf');
  // Giac lisää joskus likiarvon perään: "1/2*pi=1.5707963" → "1/2*pi"
  const GR = r => r && r.trim().replace(/=\s*[-+]?\d[\d.]*(?:e[-+]?\d+)?$/, '');
  // nopea desimaalifunktio yhdestä kirjaimesta (myös trigonometria); null jos lauseketta ei osata
  const NF = {sqrt: Math.sqrt, log: Math.log, log10: Math.log10, exp: Math.exp, abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil,
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    cot: x => 1 / Math.tan(x), sec: x => 1 / Math.cos(x), csc: x => 1 / Math.sin(x), pi: Math.PI, e: Math.E,
    sinD: x => Math.sin(x * Math.PI / 180), cosD: x => Math.cos(x * Math.PI / 180), tanD: x => Math.tan(x * Math.PI / 180), asinD: Math.asin, acosD: Math.acos, atanD: Math.atan};
  function numFn(expr, v) {
    let ok = true;
    const js = String(expr).replace(/[a-zA-Z_]\w*/g, w => w === v ? '__v' : w in NF ? 'NF.' + w : (ok = false, w)).replace(/\^/g, '**');
    if (!ok || /[^\w.\s+\-*/(),]/.test(js)) return null;
    try { const f = new Function('NF', '__v', 'return ' + js); f(NF, 1.234); return x => f(NF, x); } catch { return null; }
  }
  // numeerinen integraali (Gauss–Kronrod 7–15, väli puolitetaan); ok = false: ei suppene, nan: funktio ei ole määritelty välillä
  function numInt(f, a, b) {
    const X = [0.991455371120813, 0.949107912342759, 0.864864423359769, 0.741531185599394, 0.586087235467691, 0.405845151377397, 0.207784955007898, 0];
    const WK = [0.022935322010529, 0.063092092629979, 0.10479001032225, 0.140653259715525, 0.169004726639267, 0.190350578064785, 0.204432940075298, 0.209482141084728];
    const WG = [0, 0.12948496616887, 0, 0.279705391489277, 0, 0.381830050505119, 0, 0.417959183673469];
    const seg = (a, b) => { const c = (a + b) / 2, h = (b - a) / 2; let K = 0, G = 0, bad = false, nan = false;
      for (let j = 0; j < 8; j++) for (const x of j === 7 ? [c] : [c - h * X[j], c + h * X[j]]) { const y = f(x); if (!isFinite(y)) { bad = true; if (isNaN(y)) nan = true; } K += WK[j] * y; G += WG[j] * y; }
      if (c + h * X[6] === c) bad = true;   // väli kutistui laskentatarkkuuden rajalle: napa (tan x kohdassa π/2)
      return {a, b, K: bad ? 0 : K * h, E: bad ? Infinity : Math.abs((K - G) * h), nan}; };
    const list = [seg(a, b)];
    for (let n = 0; ; n++) {
      let tot = 0, err = 0, w = 0;
      for (let k = 0; k < list.length; k++) { tot += list[k].K; err += list[k].E; if (list[k].E > list[w].E) w = k; }
      if (err <= 1e-11 * Math.max(1, Math.abs(tot))) return {val: tot, ok: true};
      if (n >= 2500) return {val: tot, ok: err <= 1e-7 * Math.max(1, Math.abs(tot)), nan: err > 1e-7 * Math.max(1, Math.abs(tot)) && list.some(s => s.nan)};
      const s = list[w], m = (s.a + s.b) / 2; list.splice(w, 1, seg(s.a, m), seg(m, s.b));
    }
  }
  // määrätty integraali: Giac (tarkka), tarkistus numeerisesti; erikoiskohta välillä → hajaantuu
  function defInt(body, lo, hi, v) {
    const old = 'defint(' + body + ',' + lo + ',' + hi + ',' + v + ')';
    const div = () => ansErr('\\text{integraali hajaantuu (sillä ei ole äärellistä arvoa)}');
    const gt = GR(giacEval('simplify(integrate(' + GI(body) + ',' + v + ',' + GI(lo) + ',' + GI(hi) + '))'));
    if (gt && /^[+-]?infinity$/.test(gt)) throw div();
    const g = gt ? fromGiac(gt) : null;
    const nn = x => { try { const n = numeric(x); return n !== null && isFinite(n) ? n : null; } catch { return null; } };
    const free = !vars(body).some(u => u !== v && u !== 'Infinity') && !vars(lo).length && !vars(hi).length && !/Infinity/.test(lo + hi);
    const a = free ? nn(lo) : null, b = free ? nn(hi) : null;
    if (a === null || b === null) return g || old;
    if (a === b) return '0';
    let f0 = numFn(body, v); if (!f0) try { f0 = nerdamer(body).buildFunction([v]); } catch {}
    if (!f0) return g || old;
    const f = x => { try { const y = f0(x); return typeof y === 'number' ? y : NaN; } catch { return NaN; } };
    const q = numInt(f, Math.min(a, b), Math.max(a, b));
    if (q.nan) throw ansErr('\\text{integraali ei ole määritelty (funktio ei ole määritelty koko välillä)}');
    if (!q.ok) throw div();
    const val = (a < b ? 1 : -1) * q.val, close = x => x !== null && Math.abs(x - val) <= 1e-6 * Math.max(1, Math.abs(val));
    if (g && close(nn(g))) { let e = null; try { e = nerdamer('expand(' + g + ')').toString(); } catch {} return e && texLen(e) < texLen(g) ? e : g; }
    if (close(nn(old))) return old;
    approxHit = true; return String(val);
  }
  // raja-arvo Giacilla; dir 1 = oikealta, -1 = vasemmalta. null = Giac ei käytössä (nerdamer laskee)
  function giacLimit(body, v, to, dir) {
    const L = d => { const r = giacEval('limit(' + GI(body) + ',' + v + ',' + GI(to) + (d ? ',' + d : '') + ')'); return r === null ? null : GR(r); };
    const r0 = L(dir); if (r0 === null) return null;
    const k = r => r === '+infinity' ? 'Infinity' : r === '-infinity' ? '-Infinity' : r === 'infinity' ? 'U' : /bounded_function|undef/.test(r) ? null : fromGiac(r);
    const a = k(r0); if (a && a !== 'U') return a;
    const T = x => x === 'Infinity' ? '\\infty' : x === '-Infinity' ? '-\\infty' : tex(x), at = '\\lim_{' + v + '\\to ' + T(to);
    if (!dir && !/Infinity/.test(to)) { const lf = k(L(-1)), rg = k(L(1));
      if (lf && rg && lf !== 'U' && rg !== 'U') { if (lf === rg) return lf;
        throw ansErr('\\text{raja-arvoa ei ole:}\\ ' + at + '^{-}}=' + T(lf) + ',\\ ' + at + '^{+}}=' + T(rg)); } }
    if (/bounded_function/.test(r0)) throw ansErr('\\text{raja-arvoa ei ole (lauseke heilahtelee)}');
    if (a === 'U' || /undef|Unidirectional/.test(r0)) throw ansErr('\\text{raja-arvoa ei ole}');
    return null;
  }
  // tekstikirjan muoto: polynomi auki kerrottuna, muuten lyhin nerdamerin ja Giacin muodoista (ei sec/csc);
  // desimaalit syötteessä → desimaalit vastauksessa
  const texLen = x => { try { return tex(x).replace(/\\cdot|\\left|\\right|\s/g, '').length + (/\b(?:sec|csc)\(/.test(x) ? 1000 : 0); } catch { return Infinity; } };
  function sameVal(x, r) {
    const vs = vars(r); if (vars(x).some(u => !vs.includes(u))) return false;
    for (const t of [0.37, 1.91]) { const sub = {}; vs.forEach((u, i) => { sub[u] = String(t + i * 0.73); });
      let p, q; try { p = Number(nerdamer(r, sub).evaluate().text('decimals')); q = Number(nerdamer(x, sub).evaluate().text('decimals')); } catch { return false; }
      if (isFinite(p) && !(Math.abs(p - q) <= 1e-7 * Math.max(1, Math.abs(p)))) return false; }
    return true;
  }
  const isPoly = e => !/[a-zA-Z]\w*\(/.test(e) && !/\/\s*\(?[^)]*[a-zA-Z]/.test(e.replace(/\(\d+\/\d+\)/g, '1')) && !/\^\s*\(?\s*-|\^\s*\(\s*\d+\/\d+/.test(e);
  function pretty(r, latex, poly = true) {
    try { r = nerdamer(r).toString(); } catch {}
    const cands = [r]; let sx = null; try { sx = simp(r); cands.push(sx); } catch {}
    // myös: osoittaja auki ja nimittäjä tekijöinä ((−2x²+6x+2)/(x²+1)²), ja sievennetyn tekijät (eˣ/(eˣ+1)²)
    for (const c of ['simplify(R)', 'factor(R)', 'factor(simplify(R))', 'numer(simplify(R))/factor(denom(simplify(R)))']) {
      let g = giacExpr(c.replace(/R/g, toG(r))); if (g && /\/factor\(/.test(c)) g = '(' + g.replace(/\/(?=[^/]*$)/, ')/(') + ')';
      if (g && !/\d{7,}/.test(g) && sameVal(g, r)) cands.push(g); }
    const score = c => texLen(c) + (/sqrt/.test(c) && !/sqrt/.test(r) ? 1000 : 0);
    let best = cands[0]; for (const c of cands) if (score(c) < score(best)) best = c;
    if (poly) { let e = null; try { e = nerdamer('expand(' + r + ')').toString(); } catch {} if (e && isPoly(e) && texLen(e) <= texLen(best) * 1.25 + 4) best = e; }
    return decTex(best, latex);
  }
  // 1/25·x² → 0,04x², kun syötteessä on desimaaleja ja murtoluvut ovat lyhyitä desimaaleja
  function decTex(r, latex) {
    let t = tex(r);
    if (/\d(?:\{,\}|\.|,)\d/.test(latex || '') && !/[a-zA-Z]\w*\(/.test(r))
      t = t.replace(/\\frac\{(?:(\d+)(?: \\cdot )?)?((?:[^{}+\-]|\{[^{}]*\})*)\}\{(\d+)\}/g, (m, p, x, q) => {
        if (!p && !x) return m; let k = +q; while (k % 2 === 0) k /= 2; while (k % 5 === 0) k /= 5;
        const d = (p ? +p : 1) / +q, ds = String(parseFloat(d.toPrecision(12)));
        if (k !== 1 || ds.length > 8 || /\\frac/.test(x)) return m;
        return fmtNum(d) + (x ? ' \\cdot ' + x.replace(/^\s*\\cdot\s*/, '') : '');
      });
    t = t.replace(/(\\(?:ln|lg|sin|cos|tan|arcsin|arccos|arctan)\\left\((?:(?!\\left|\\right).)*\\right\)(?:\^\{\d+\})?) \\cdot ([a-z](?:\^\{[^{}]*\})?)(?![a-zA-Z{^\\])/g, '$2 \\cdot $1');   // ln(x)·x → x·ln(x)
    return t.replace(/(\{|^)-((?:[^+\-{}]|\{[^{}]*\})+?)\+(\d+)(?=\}|$)/g, '$1$3-$2');   // -x+1 → 1-x
  }
  // Giacin väli-vastaus ([x>2, 2], [((x>=1) and (x<2)), 2, 1]) epäyhtälöksi kuten kirjassa (x ≥ 2); null = ei osata
  function giacIneq(items, v, lhs, rhs, C) {
    const wraps = s => { if (s[0] !== '(' || !s.endsWith(')')) return false; for (let k = 0, d = 0; k < s.length - 1; k++) { if (s[k] === '(') d++; else if (s[k] === ')' && !--d) return false; } return true; };
    const unp = s => { s = s.trim(); while (wraps(s)) s = s.slice(1, -1).trim(); return s; };
    const num = e => { const x = fromGiac(e); if (x === null || vars(x).length) return null; let n = null; try { n = numeric(x); } catch {} return n === null || !isFinite(n) ? null : {x, n}; };
    const segs = [];
    for (const it of items) {
      const s = {a: -Infinity, aIn: false, b: Infinity, bIn: false};
      const pieces = unp(it).split(/\s+and\s+/).map(unp);
      if (pieces.length === 1 && !/[<>]/.test(pieces[0])) { const p = num(pieces[0]); if (!p) return null; segs.push({a: p.n, aIn: true, b: p.n, bIn: true, at: p.x, bt: p.x}); continue; }
      for (const pc of pieces) {
        const m = /^(.+?)(<=|>=|<|>)(.+)$/.exec(pc); if (!m) return null;
        let [, l, op, r] = m; l = l.trim(); r = r.trim();
        if (r === v) { [l, r] = [r, l]; op = {'<': '>', '>': '<', '<=': '>=', '>=': '<='}[op]; }
        if (l !== v) return null;
        const p = num(r); if (!p) return null;
        if (op[0] === '>') { s.a = p.n; s.at = p.x; s.aIn = op === '>='; } else { s.b = p.n; s.bt = p.x; s.bIn = op === '<='; }
      }
      segs.push(s);
    }
    if (C && C.lo !== undefined) for (const s of segs) if (C.lo > s.a) { s.a = C.lo; s.at = String(C.lo); s.aIn = C.ok(C.lo); }
    if (C && C.hi !== undefined) for (const s of segs) if (C.hi < s.b) { s.b = C.hi; s.bt = String(C.hi); s.bIn = C.ok(C.hi); }
    let list = segs.filter(s => s.a < s.b || (s.a === s.b && s.aIn && s.bIn)).sort((p, q) => p.a - q.a || q.aIn - p.aIn);
    const out = [];
    for (const s of list) { const t = out[out.length - 1];
      if (t && (s.a < t.b || (Math.abs(s.a - t.b) < 1e-12 && (s.aIn || t.bIn)))) { if (s.b > t.b || (s.b === t.b && s.bIn)) { t.b = s.b; t.bt = s.bt; t.bIn = s.bIn; } if (Math.abs(s.a - t.a) < 1e-12 && s.aIn) t.aIn = true; }
      else out.push({...s}); }
    // tarkistus: yksi luku jokaiselta väliltä käy alkuperäiseen yhtälöön
    const L = jsFn(lhs, v), R = jsFn(rhs, v);
    if (L && R) for (const s of out) { const t = s.a === s.b ? s.a : s.a === -Infinity ? s.b - 1 : s.b === Infinity ? s.a + 1 : (s.a + s.b) / 2; if (!sameAt(L, R, t)) return null; }
    if (!out.length) return '\\Leftrightarrow \\text{ei ratkaisua' + (C ? ', kun }' + C.tex : '}');
    if (out.length === 1 && out[0].a === -Infinity && out[0].b === Infinity) return '\\Leftrightarrow \\text{tosi aina: kaikki luvut käyvät}';
    const T = e => tex(e), le = inc => inc ? '\\le ' : '<';
    return '\\Leftrightarrow ' + out.map(s => s.a === s.b ? v + '=' + T(s.at)
      : s.a === -Infinity ? v + le(s.bIn) + T(s.bt) : s.b === Infinity ? v + (s.aIn ? '\\ge ' : '>') + T(s.at)
      : T(s.at) + le(s.aIn) + v + le(s.bIn) + T(s.bt)).join('\\ \\lor\\ ');
  }
  function solve(a, want, wantAll, cond) {
    const eqs = a.split(';').map(x => x.trim()).filter(Boolean);
    if (eqs.length > 1) {
      let r;
      const all = [...new Set(eqs.flatMap(e => e.split('=').flatMap(x => vars(x))))];
      if (!(wantAll && wantAll.length) && all.length > eqs.length) throw tooMany(all, eqs.length);
      // nerdamer sometimes gives wrong answers (π taken as a letter, or a non-linear system forced with a letter list),
      // so every answer is put back into the equations; the first that checks out is shown
      const ok = r => {
        if (!r || !r.length) return false;
        const sub = Object.fromEntries(r.map(([v, val]) => [v, String(val)]));
        return eqs.every(e => { const [l, rr] = e.split('=');
          try { const d = nerdamer('(' + l + ')-(' + rr + ')', sub);
            try { const n = Number(d.evaluate().text('decimals')); if (isFinite(n)) return Math.abs(n) < 1e-6; } catch {}
            return nerdamer('simplify(expand(' + d.toString() + '))').toString() === '0'; } catch { return false; } });
      };
      const list0 = wantAll && wantAll.length ? wantAll : all;
      // substitution first: finds every solution of systems like xy=6, x+y=5 and sees when there is none
      let ss = null; try { ss = subSolve(eqs.map(e => { const [l, rr] = e.split('='); return '(' + l + ')-(' + rr + ')'; }), list0); } catch {}
      if (!ss) ss = giacSys(eqs, list0);
      if (ss && !ss.length) return {tex: '\\text{Ei ratkaisua}'};
      if (ss === 'many') return {tex: '\\text{Äärettömän monta ratkaisua (yhtälöt kertovat saman asian)}'};
      if (ss) {
        const order = wantAll && wantAll.length ? list0 : [...list0].sort();
        const nv = x => { try { return numeric(x); } catch { return null; } };
        ss = ss.filter(s => ok(list0.map(v => [v, s[v]]))).sort((a, b) => (nv(a[order[0]]) ?? 0) - (nv(b[order[0]]) ?? 0));
        const seen = new Set(), rows = [];
        for (const s of ss) { const key = list0.map(v => { let n = null; try { n = numeric(s[v]); } catch {} return n === null ? s[v] : n.toFixed(9); }).join('|');
          if (!seen.has(key)) { seen.add(key); rows.push(order.map(v => v + present(s[v])).join(',\\ ')); } }
        if (rows.length) return {tex: '\\Leftrightarrow ' + (rows.length > 1 ? rows.map(x => '(' + x + ')').join('\\ \\lor\\ ') : rows[0])};
      }
      const list = list0, tries = wantAll && wantAll.length ? [list, null] : [null, list];
      let first = null;
      for (const vs of tries) {
        let x; try { x = vs ? nerdamer.solveEquations(eqs.slice(), vs.slice()) : nerdamer.solveEquations(eqs.slice()); } catch { continue; }   // copies: nerdamer changes the arrays it gets
        if (first === null) first = x;
        if (ok(x)) { r = x; break; }
      }
      if (!r) { if (first === null) { const bad = eqs.findIndex(e => (e.match(/\(/g) || []).length !== (e.match(/\)/g) || []).length); throw new Err(bad >= 0 ? 'Rivillä ' + (bad + 1) + ' on sulku, jolla ei ole paria. Poista ylimääräinen sulku tai lisää puuttuva.' : 'En osaa ratkaista tätä yhtälöryhmää. Tarkista, että jokaisella rivillä on yksi yhtälö.'); } r = first; }
      if (!r.length) return {tex: '\\text{Ei ratkaisua}'};
      return {tex: '\\Leftrightarrow ' + r.map(([v, val]) => v + '=' + tex(String(val))).join(',\\ ')};
    }
    const eq = eqs[0];
    const [lhs, rhs] = eq.split('=');
    const p = '(' + lhs + ')-(' + rhs + ')';
    let v = pickVar(p, want); const allVars = vars(p);
    // no x and no choice made: a letter in an exponent is the one to solve (N₀·0,5^t = 0,1N₀ → t)
    if (!want && !allVars.includes('x')) { const ex = allVars.find(u => new RegExp('\\^\\s*(?:\\([^()]*(?<![\\w])' + u + '(?![\\w])|' + u + '(?![\\w]))').test(p)); if (ex) v = ex; }
    const C = cond && cond.v === v ? cond : null;
    const cTex = C ? ',\\ \\text{kun }' + C.tex : '';
    // sama lauseke molemmin puolin (x+1=x+1): tosi kaikilla luvuilla
    { let z = null; try { z = nerdamer('expand(' + p + ')').toString(); } catch {} if (z === '0') return {vars: allVars, v, tex: '\\Leftrightarrow \\text{tosi aina: kaikki luvut käyvät}'}; }
    if (allVars.length === 1) { let tr = null; try { tr = trigSolve(p, v, C); } catch {} if (!tr) { try { tr = trigNum(p, v, C); } catch {} } if (tr) return {vars: allVars, v, tex: tr}; }
    let rs = [];
    const gr = giacRoots(p, v);
    if (gr && gr.ineq) { const t = giacIneq(gr.ineq, v, lhs, rhs, C); if (t) return {vars: allVars, v, tex: t}; }
    const JL = allVars.length === 1 ? jsFn(lhs, v) : null, JR = JL && jsFn(rhs, v);
    if (gr && gr.length && !gr.ineq) rs = gr; else { try { rs = roots(p, v, eq); } catch {} }
    if (!rs.length) { const h = halfRoots(p, v); if (h) rs = h; }
    rs = rs.filter(x => !vars(x).includes(v));   // eˣ = x+2 → "x = eˣ − 2" ei ole vastaus
    // Giac sanoi "ei ratkaisua": nerdamerin juuret käyvät vain, jos ne todella toteuttavat yhtälön (∛x = −3 → −27)
    // (muut kirjaimet: tarkistus testiluvuilla; Giac voi erehtyä myös nimistä kuten lambda)
    if (gr && !gr.length && !(JL && JR)) { const test = {}; allVars.filter(u => u !== v).forEach((u, i) => { test[u] = String(1.3 + 0.17 * i); });
      rs = rs.filter(x => { try { const n = Number(nerdamer(p, {...test, [v]: '(' + nerdamer(x, test).toString() + ')'}).evaluate().text('decimals')); return isFinite(n) && Math.abs(n) < 1e-9; } catch { return false; } }); }
    // letter in an exponent (0,28^x, m·0,917^x = c): nerdamer often finds nothing or a wrong root (x = 0). So:
    // 1) every root is checked in the equation (with test numbers for other letters, relative to the size of the sides),
    // 2) A·bˣ + B = 0 with bˣ the only place of x → x = ln(−B/A) / ln b, 3) last resort: number search over a wide range
    if (new RegExp('\\^\\s*(?:\\([^()]*(?<![\\w])' + v + '(?![\\w])|' + v + '(?![\\w]))').test(p)) {
      const others = allVars.filter(u => u !== v), nn = x => { try { return numeric(x); } catch { return null; } };
      const put = (e, k) => e.replace(/[a-zA-Z_]\w*/g, w => others.includes(w) ? '(' + (k ? 2.7 + 0.31 * others.indexOf(w) : 1.3 + 0.17 * others.indexOf(w)) + ')' : w);
      const checks = [0, 1].map(k => [jsFn(put(lhs, k), v), jsFn(put(rhs, k), v)]), usable = checks.every(([L, R]) => L && R);
      const fits = n => checks.every(([L, R]) => sameAt(L, R, n));
      if (usable) rs = rs.filter(x => { const n = nn(x); return n === null || fits(n); });
      if (!rs.length || rs.every(x => nn(x) === null)) { const re = new RegExp('(\\d+(?:\\.\\d+)?|[a-zA-Z]\\w*|\\([^()]*\\))\\^\\(?' + v + '\\)?(?![\\w.])', 'g'), bases = [...p.matchAll(re)].map(m => m[1]);
        if (bases.length && bases.every(b => b === bases[0]) && !vars(bases[0]).includes(v)) {
          const q = p.replace(re, '(tqz)');
          if (!vars(q).includes(v)) try {
            const d = Number(nerdamer('deg(expand(' + q + '),tqz)').toString());
            const c = nerdamer('coeffs(expand(' + q + '),tqz)').symbol.elements.map(e => e.toString());
            if (d === 1) { const t = simp('-(' + c[0] + ')/(' + c[1] + ')'), tn = nn(t), bn = nn(bases[0]);
              if (!(tn !== null && tn <= 0) && !(bn !== null && (bn <= 0 || bn === 1))) { const r = 'log(' + t + ')/log(' + bases[0] + ')'; if (!usable || nn(r) === null || fits(nn(r))) rs = [r]; } }
          } catch {}
        } }
      if (!rs.length && usable) { const e1 = expNum(put(p, 0), v), e2 = others.length ? expNum(put(p, 1), v) : e1;
        if (e1 && e2 && e1.length === e2.length && e1.every((x, i) => Math.abs(x - e2[i]) < 1e-9 * Math.max(1, Math.abs(x)))) rs = e1.filter(x => fits(Number(x))); }
    }
    // ei tarkkaa ratkaisua (Giacin rootof, LambertW): reaaliset juuret numeerisesti, ensin merkin vaihdoksista, sitten Giacin fsolve
    if (!rs.length && JL && JR) {
      rs = numRoots(p, v) || [];
      if (!rs.length) { const f = giacEval('fsolve(' + toG(p) + '=0,' + v + ')');
        if (f) rs = f.replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(s => /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/.test(s)).map(s => String(Number(s))); }
    }
    // pois ratkaisut, jotka eivät toteuta alkuperäistä yhtälöä tai joissa se ei ole määritelty (jako nollalla: (x+1)/(x-1)=3 ei anna x=1)
    if (allVars.length === 1) rs = rs.filter(x => { let n = null; try { n = numeric(x); } catch {} if (n === null || !isFinite(n)) return true;
      if (JL && JR) return sameAt(JL, JR, n);
      for (const side of [lhs, rhs]) { const jf = jsFn(side, v); if (jf) { if (!isFinite(jf(n))) return false; continue; }
        try { const val = Number(nerdamer(side, {[v]: String(n)}).evaluate().text('decimals')); if (!isFinite(val)) return false; } catch (e) { if (/division by zero|undefined/i.test(String(e && e.message))) return false; } }
      return true; });
    let lettered = false;
    if (C) rs = rs.filter(x => { let n = null; try { n = numeric(x); } catch {} if (n === null || !isFinite(n)) { lettered = true; return true; } return C.ok(n); });
    const parts = rs.map(x => {
      // nerdamer antaa joskus vain pitkän murtoluvun (ln x = 1, e^x = 5): etsitään tarkka muoto
      if (/\d{6,}/.test(x)) { let n = null; try { n = numeric(x); } catch {}
        const t = n !== null && isFinite(n) && Math.abs(n - Math.round(n)) > 1e-9 ? niceNum(n, false, false) : null;
        if (t && !/\d{7,}/.test(t)) return v + '=' + t + '\\approx ' + fmtNum(n);
        if (t) return v + '\\approx ' + fmtNum(n); }
      return v + present(x);
    });
    if (!parts.length) return {vars: allVars, v, tex: '\\Leftrightarrow \\text{ei ratkaisua' + (C ? ', kun }' + C.tex : '}')};
    return {vars: allVars, v, tex: '\\Leftrightarrow ' + parts.join('\\ \\lor\\ ') + (lettered ? cTex : '')};
  }

  // "=exact≈decimal", only the parts that make sense
  // kaunis tarkka muoto likiarvolle: murtoluku, neliöjuuri, e, π, ln, log; null jos ei löydy
  function niceNum(n, trig, deg) {
    const fr = (x, f) => { for (let q = 1; q <= 12; q++) { const k = x * q; if (Math.abs(k - Math.round(k)) < 1e-8) return f(Math.round(k), q); } return null; };
    const frac = (p, q, t = '') => q === 1 ? (p === 1 && t ? t : p === -1 && t ? '-' + t : p + t) : (p < 0 ? '-' : '') + '\\frac{' + (Math.abs(p) === 1 && t ? '' : Math.abs(p)) + t + '}{' + q + '}';
    if (trig && deg) return (Math.abs(n - Math.round(n)) < 1e-7 ? String(Math.round(n)) : fmtNum(n)) + '^{\\circ}';
    if (trig) { const r = fr(n / Math.PI, (p, q) => p === 0 ? '0' : frac(p, q, '\\pi')); if (r) return r; }
    let r = fr(n, (p, q) => frac(p, q)); if (r) return r;
    r = fr(n * n, (p, q) => { const s = Math.round(Math.sqrt(p)); if (s * s === p) return null; return (n < 0 ? '-' : '') + (q === 1 ? '\\sqrt{' + p + '}' : '\\sqrt{\\frac{' + p + '}{' + q + '}}'); }); if (r) return r;
    if (Math.abs(n - Math.E) < 1e-9) return 'e';
    r = fr(n / Math.PI, (p, q) => frac(p, q, '\\pi')); if (r) return r;
    r = Math.abs(n) > 14 ? null : fr(Math.exp(n), (p, q) => p > 0 && (q > 1 || p > 1) ? (q === 1 ? '\\ln ' + p : '\\ln\\frac{' + p + '}{' + q + '}') : null); if (r) return r;
    r = Math.abs(n) > 14 ? null : fr(Math.exp(-n), (p, q) => p > 1 && q === 1 ? '-\\ln ' + p : null); if (r) return r;
    if (Math.abs(n) < 40) for (const b of [2, 3, 5, 10]) { const k = Math.pow(b, n); if (Math.abs(k - Math.round(k)) < 1e-8 && Math.round(k) > 1 && Math.abs(n - Math.round(n)) > 1e-8) return b === 10 ? '\\lg ' + Math.round(k) : '\\log_{' + b + '}' + Math.round(k); }
    r = n > 0 ? fr(Math.log(n), (p, q) => p === 0 || Math.abs(p) > 60 || (p === 1 && q === 1) ? null : 'e^{' + (q === 1 ? p : (p < 0 ? '-' : '') + '\\frac{' + Math.abs(p) + '}{' + q + '}') + '}') : null; if (r) return r;
    return null;
  }
  // ∫1/x = ln|x|: logaritmin sisälle itseisarvo, ellei sisus ole aina positiivinen (esim. ln(x²+1))
  function absLog(r, v) {
    let out = '', i = 0;
    while (i < r.length) {
      const j = r.indexOf('log(', i);
      if (j < 0 || /[a-zA-Z]/.test(r[j - 1] || '')) { if (j < 0) { out += r.slice(i); break; } out += r.slice(i, j + 4); i = j + 4; continue; }
      let k = 0, e = j + 3; for (; e < r.length; e++) { if (r[e] === '(') k++; else if (r[e] === ')' && !--k) break; }
      const arg = absLog(r.slice(j + 4, e), v);
      let pos = true; for (const t of [-7.3, -2.1, -0.4, 0.6, 3.3, 9.1]) { let y = NaN; try { y = Number(nerdamer(arg, {[v]: t}).evaluate().text('decimals')); } catch {} if (!(y > 0)) { pos = false; break; } }
      out += r.slice(i, j) + 'log(' + (pos ? arg : 'abs(' + arg + ')') + ')'; i = e + 1;
    }
    return out;
  }
  const lnAbs = t => t.replace(/\\left\(\\left\|/g, '\\left|').replace(/\\right\|\\right\)/g, '\\right|');
  // asteina sin(π/12) näytetään sin 15°
  function degTrig(x) {
    const out = [], L = 'abcdefghijklmnopqrstuvwxyz'; let s = String(x), i = 0, m; const re = /\b(sin|cos|tan|cot)(d?)\(/g;
    while ((m = re.exec(s)) && out.length < 26) {
      let d = 0, e = m.index + m[0].length - 1; for (; e < s.length; e++) { if (s[e] === '(') d++; else if (s[e] === ')' && !--d) break; }
      const arg = s.slice(m.index + m[0].length, e); if (!(m[2] || /\bpi\b/.test(arg)) || vars(arg).length) continue;
      let n = null; try { n = numeric(arg); } catch {} if (n === null) continue;
      const g = m[2] ? n : n * 180 / Math.PI, r = Math.round(g * 1e6) / 1e6; if (Math.abs(g - r) > 1e-9) continue;
      out.push('\\' + m[1] + ' ' + fmtNum(r) + '^{\\circ}'); s = s.slice(0, m.index) + 'qdg' + L[out.length - 1] + s.slice(e + 1); re.lastIndex = m.index + 4;   // cosd(50) ja cos(5π/18) → cos 50°
    }
    if (!out.length) return null;
    let t; try { t = tex(s); } catch { return null; }
    out.forEach((o, k) => { t = t.replace(new RegExp('qdg' + L[k] + '(\\^)?', 'g'), (_, p) => p ? '\\left(' + o + '\\right)^' : o); });
    return /qdg/.test(t) ? null : t;
  }
  // vastaus kirjan muotoon: \frac{\left(1-\sqrt{5}\right)}{2} → \frac{1-\sqrt{5}}{2}, -\sqrt{2}+1 → 1-\sqrt{2}, -\frac{-c+b}{a} → \frac{c-b}{a}
  const TERM = '(?:[^{}+\\-=()]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})+';
  function tidyTex(t) {
    for (let i = t.indexOf('\\frac{\\left('), guard = 0; i >= 0 && guard++ < 20; i = t.indexOf('\\frac{\\left(', i + 1)) {
      let d = 0, k = i + 6;
      for (; k < t.length; k++) { if (t.startsWith('\\left(', k)) d++; else if (t.startsWith('\\right)', k) && !--d) break; }
      if (k < t.length && t[k + 7] === '}') t = t.slice(0, i + 6) + t.slice(i + 12, k) + t.slice(k + 7);
    }
    t = t.replace(new RegExp('(^|\\{)-(' + TERM + ')\\+(' + TERM + ')(?=\\}|$)', 'g'), '$1$3-$2');
    return t.replace(new RegExp('^-\\\\frac\\{(' + TERM + ')-(' + TERM + ')\\}'), '\\frac{$2-$1}');
  }
  // an exact fraction as a decimal, when it is short: whole numbers up to 40 digits (20!, 2⁶⁴), 4,8·10⁻¹⁹ (denominator only 2s and 5s)
  function exactDec(s) {
    const m = /^\(?(-?)(\d+)(?:\/(\d+))?\)?$/.exec(String(s).replace(/\s/g, ''));
    if (!m) return null;
    if (!m[3]) return m[2].length > 40 ? null : m[2].length <= 12 ? m[1] + m[2] : m[2].replace(/0+$/, '').length <= 10 ? fmtNum(parseFloat(m[1] + m[2])) : m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
    let q = BigInt(m[3]), k = 0; while (q % 10n === 0n) { q /= 10n; k++; } while (q % 2n === 0n || q % 5n === 0n) { q /= q % 2n === 0n ? 2n : 5n; k++; }
    if (q !== 1n) return null;
    const d = BigInt(m[2]) * 10n ** BigInt(k) / BigInt(m[3]);   // value = d·10^-k exactly
    if (String(d).replace(/0+$/, '').length > 10) return null;
    return fmtNum(parseFloat(m[1] + d + 'e' + (-k)));
  }
  function present(exact) {
    let et = (deg && degTrig(exact)) || tidyTex(tex(exact));
    let n = null; try { n = numeric(exact); } catch {}
    if (n === null) {
      // kirjainvastaus neliöjuurineen: √E·√m·√2/m → √(2E/m), jos se on lyhyempi
      if (/sqrt/.test(exact)) try { const s = simp('(' + exact + ')^2');
        if (!/sqrt|\^\(?-?\d+\/|abs|\./.test(s)) { const test = {}; vars(exact).forEach((u, i) => { test[u] = String(1.3 + 0.17 * i); });
          const a = Number(nerdamer(exact, test).evaluate().text('decimals')), b = Math.sqrt(Number(nerdamer(s, test).evaluate().text('decimals')));
          const sg = Math.abs(a - b) < 1e-9 * Math.max(1, b) ? '' : Math.abs(a + b) < 1e-9 * Math.max(1, b) ? '-' : null;
          const c = sg === null ? null : sg + '\\sqrt{' + tidyTex(tex(s)) + '}';
          if (c && c.length < et.length) et = c.replace(/(\d) \\cdot ([a-zA-Z\\])/g, '$1$2'); } } catch {}
      return '=' + et;
    }
    const nt = fmtNum(n);
    const ed = exactDec(exact);
    if (ed && (!/\//.test(exact) || /\d{7,}/.test(exact))) return '=' + ed;
    if (Math.abs(n - Math.round(n)) < 1e-9 && Math.abs(n) < 1e15 && Math.round(n) !== 0) return '=' + fmtNum(Math.round(n));
    // arcsin ½ = π/6 (radiaaneina)
    if (/\\arc/.test(et) && !/180/.test(String(exact))) { const t = niceNum(n, true, false); if (t && /\\pi/.test(t)) return '=' + t + '\\approx ' + nt; }
    // sin(arcsin 0,5) left as it is: a simple fraction instead
    if (/\\(?:arc)?(?:sin|cos|tan)/.test(et)) for (let k = 2; k <= 12; k++) if (Math.abs(n * k - Math.round(n * k)) < 1e-10) return '=' + tex(Math.round(n * k) + '/' + k) + '\\approx ' + nt;
    if (/\d{7,}/.test(exact) || /\d{4,}\^\(?-?\d+\/\d+/.test(exact) || (/\\ln|\\lg/.test(et) && (/\d{3,}/.test(exact) || (et.match(/\\ln|\\lg/g) || []).length > 2 || et.length > 60)) || /\\mathrm|!/.test(et)) {
      // pitkä tarkka muoto (ln 5/(ln 2+ln 5), 0,6931471806): lyhyt muoto, jos sellainen on (lg 5, ln 2)
      const t = niceNum(n, false, false); return (t && !/\d{5,}/.test(t) ? '=' + t : '') + '\\approx ' + nt; }
    if (et === nt) return '=' + et;
    return '=' + et + '\\approx ' + nt;
  }

  // graph helper: returns JS function of x
  // värikorostukset ja värit (\colorbox, \textcolor) eivät vaikuta laskuun: otetaan pois
  function stripStyle(l) {
    const re = /\\(?:colorbox|textcolor|color)\s*\{/;
    let m, guard = 0;
    while ((m = re.exec(l)) && guard++ < 200) {
      const grp = from => { let d = 0; for (let j = from; j < l.length; j++) { if (l[j] === '\\') { j++; continue; } if (l[j] === '{') d++; else if (l[j] === '}' && --d === 0) return j; } return -1; };
      const c1 = m.index + m[0].length - 1, e1 = grp(c1);
      if (e1 < 0) break;
      let k = e1 + 1; while (l[k] === ' ') k++;
      if (l[k] !== '{') { l = l.slice(0, m.index) + l.slice(k); continue; }  // \color{x} ilman sisältöä
      const e2 = grp(k); if (e2 < 0) break;
      const inner = l.slice(k + 1, e2).replace(/^\s*\$\s*|\s*\$\s*$/g, '');
      // sulut ryhmäksi, paitsi jos korostus kattaa =-merkin tms. (silloin ryhmä rikkoisi yhtälön)
      const bare = /[=<>;,]|\\(?:le|ge|leq|geq|to|neq)(?![a-zA-Z])/.test(inner);
      l = l.slice(0, m.index) + (bare ? ' ' + inner + ' ' : '{' + inner + '}') + l.slice(e2 + 1);
    }
    return l;
  }
  function fnFor(latex) {
    latex = stripStyle(latex);
    let l = latex.replace(/^\s*(?:y|[a-zA-Z]\s*(?:\\left)?\(\s*x\s*(?:\\right)?\))\s*=/, '');
    // an equation like 2x+1=√9: draw left − right, so its zeros are the solutions
    const eq = l.split('=');
    let a;
    if (eq.length === 2 && eq[0].trim() && eq[1].trim()) a = '(' + toAscii(eq[0], {rad: true}) + ')-(' + toAscii(eq[1], {rad: true}) + ')';
    else a = toAscii(l, {rad: true});
    if (!a.trim()) return null;
    // other letters (a, k…) become slider parameters; values come from P at call time
    const e = nerdamer(a), params = e.variables().filter(v => v !== 'x');
    const f = e.buildFunction(['x', ...params]);
    const fn = (x, P) => { try { return f(x, ...params.map(p => P && P[p] !== undefined ? P[p] : 1)); } catch { return NaN; } };
    fn.params = params;
    return fn;
  }

  return {
    toAscii, run, fnFor, Err, resetDefs, tryDefine, define, stats: statsOf, classStats,
    get deg() { return deg; }, set deg(v) { deg = v; },
  };
})();
