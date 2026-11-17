// Sivun demot laskevat Laskuvihkon omalla laskimella (app/calc.js).
const Live = (() => {
  const U = u => `\\operatorname{\\mathbf{${u}}}`;
  // pyöristää pitkät desimaalit kahteen ja siistii vastauksen
  const tidy = tex => tex.replace(/\\Leftrightarrow\s*/g, '').replace(/(\d+)(\{,\}|\.)(\d+)/g, (_, a, sep, b) => {
    const n = Math.round(parseFloat(a + '.' + b) * 100) / 100;
    return String(n).replace('.', sep);
  });
  function solve(latex) {
    try { Calc.resetDefs(); return tidy(Calc.run('solve', latex).tex); } catch (e) { return '\\text{?}'; }
  }
  function calc(latex) {
    try { Calc.resetDefs(); return tidy(Calc.run('calc', latex).tex); } catch (e) { return '=\\text{?}'; }
  }
  // F = m·a, F ja m annettu → a
  const fma = (F, m) => solve(`F=m\\cdot a; F=${F}${U('N')}; m=${m}${U('kg')}`);
  // näyttöön: yksikkö lihavoituna tavallisena merkkinä, jotta · ja / saavat tasaiset välit
  const pretty = tex => tex.replace(/\\operatorname\{\\mathbf\{([^}]*)\}\}/g, '\\mathbf{$1}').replace(/(\d)\s*\\mathbf\{/g, '$1\\,\\mathbf{');
  function show(el, latex) { el.value = pretty(latex); }
  return {U, solve, calc, fma, show, pretty, tidyTex: tidy};
})();
