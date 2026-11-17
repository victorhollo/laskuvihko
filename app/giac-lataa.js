// Lataa Giac-laskumoottorin (giac/giacwasm.js, 19 Mt) taustalla. Kun se on valmis, self.giacEval('solve(x^2=4,x)')
// antaa vastauksen merkkijonona. Siihen asti calc.js käyttää pelkkää nerdameria.
(function () {
  const M = self.Module = {print() {}, printErr() {}, onRuntimeInitialized() {
    const ev = M.cwrap('caseval', 'string', ['string']);
    self.giacEval = s => { try { return ev(s); } catch (e) { return null; } };
    if (self.onGiacReady) self.onGiacReady();
  }};
  if (typeof document !== 'undefined' && document.head) {
    const sc = document.createElement('script'); sc.src = 'giac/giacwasm.js'; sc.async = true; document.head.appendChild(sc);
  }
})();
