// Kaavasto: taulukot (vakiot, yksiköt, ainetaulukot). Arvot yleisistä fysiikan lähteistä (CODATA 2018), pyöristetty.
{
const T = 'Taulukot';

aihe(T, 'Luonnonvakiot', R`<p>Klikkaa kaavaa, niin vakio arvoineen tulee riville.</p>`, [
  ['Valon nopeus tyhjiössä', R`c=2{,}99792458\cdot10^8\ \text{m/s}`, ''],
  ['Gravitaatiovakio', R`\gamma=6{,}674\cdot10^{-11}\ \text{Nm}^2/\text{kg}^2`, ''],
  ['Putoamiskiihtyvyys (normaali)', R`g=9{,}80665\ \text{m/s}^2`, 'Suomessa noin 9,82 m/s²; laskuissa yleensä 9,81'],
  ['Alkeisvaraus', R`e=1{,}602176634\cdot10^{-19}\ \text{C}`, ''],
  ['Planckin vakio', R`h=6{,}62607015\cdot10^{-34}\ \text{Js}`, ''],
  ['Avogadron vakio', R`N_A=6{,}02214076\cdot10^{23}\ \text{1/mol}`, ''],
  ['Boltzmannin vakio', R`k_B=1{,}380649\cdot10^{-23}\ \text{J/K}`, ''],
  ['Moolinen kaasuvakio', R`R=8{,}314\ \text{J/(mol·K)}`, ''],
  ['Sähkövakio', R`\varepsilon_0=8{,}854\cdot10^{-12}\ \text{F/m}`, ''],
  ['Magneettivakio', R`\mu_0=1{,}2566\cdot10^{-6}\ \text{N/A}^2`, '≈ 4π·10⁻⁷'],
  ['Coulombin lain vakio', R`k=8{,}988\cdot10^9\ \text{Nm}^2/\text{C}^2`, 'k = 1/(4πε₀)'],
  ['Stefanin–Boltzmannin vakio', R`\sigma=5{,}670\cdot10^{-8}\ \text{W/(m}^2\text{K}^4)`, ''],
  ['Wienin vakio', R`b=2{,}898\cdot10^{-3}\ \text{m·K}`, ''],
  ['Elektronin massa', R`m_e=9{,}109\cdot10^{-31}\ \text{kg}`, ''],
  ['Protonin massa', R`m_p=1{,}6726\cdot10^{-27}\ \text{kg}`, ''],
  ['Neutronin massa', R`m_n=1{,}6749\cdot10^{-27}\ \text{kg}`, ''],
  ['Atomimassayksikkö', R`u=1{,}66054\cdot10^{-27}\ \text{kg}`, '1 u ≙ 931,494 MeV'],
  ['Elektronivoltti', R`1\ \text{eV}=1{,}602\cdot10^{-19}\ \text{J}`, ''],
  ['Normaali ilmanpaine', R`p_0=101\,325\ \text{Pa}`, ''],
  ['Absoluuttinen nollapiste', R`0\ \text{K}=-273{,}15\ °\text{C}`, ''],
  ['Äänen nopeus ilmassa (20 °C)', R`v=343\ \text{m/s}`, ''],
]);

aihe(T, 'Maa, Kuu ja Aurinko', '', [], [{sarakkeet: ['', 'Arvo'], rivit: [
  ['Maan massa', R`\(5{,}97\cdot10^{24}\ \text{kg}\)`], ['Maan säde (keskim.)', R`\(6371\ \text{km}\)`],
  ['Kuun massa', R`\(7{,}35\cdot10^{22}\ \text{kg}\)`], ['Kuun säde', R`\(1737\ \text{km}\)`], ['Etäisyys Maa–Kuu', R`\(3{,}84\cdot10^{8}\ \text{m}\)`],
  ['Auringon massa', R`\(1{,}99\cdot10^{30}\ \text{kg}\)`], ['Auringon säde', R`\(6{,}96\cdot10^{8}\ \text{m}\)`], ['Etäisyys Maa–Aurinko (AU)', R`\(1{,}496\cdot10^{11}\ \text{m}\)`],
  ['Valovuosi', R`\(9{,}461\cdot10^{15}\ \text{m}\)`], ['Kuun putoamiskiihtyvyys', R`\(1{,}62\ \text{m/s}^2\)`],
]}]);

aihe(T, 'Kerrannaisyksiköt (etuliitteet)', '', [], [{sarakkeet: ['Etuliite', 'Tunnus', 'Kerroin'], rivit: [
  ['tera', 'T', R`\(10^{12}\)`], ['giga', 'G', R`\(10^{9}\)`], ['mega', 'M', R`\(10^{6}\)`], ['kilo', 'k', R`\(10^{3}\)`],
  ['hehto', 'h', R`\(10^{2}\)`], ['deka', 'da', R`\(10^{1}\)`], ['desi', 'd', R`\(10^{-1}\)`], ['sentti', 'c', R`\(10^{-2}\)`],
  ['milli', 'm', R`\(10^{-3}\)`], ['mikro', 'µ', R`\(10^{-6}\)`], ['nano', 'n', R`\(10^{-9}\)`], ['piko', 'p', R`\(10^{-12}\)`], ['femto', 'f', R`\(10^{-15}\)`],
]}]);

aihe(T, 'SI-yksiköt', R`<p>Perusyksiköt ja tärkeimmät johdannaisyksiköt.</p>`, [], [
  {otsikko: 'Perusyksiköt', sarakkeet: ['Suure', 'Yksikkö', 'Tunnus'], rivit: [
    ['pituus', 'metri', 'm'], ['massa', 'kilogramma', 'kg'], ['aika', 'sekunti', 's'], ['sähkövirta', 'ampeeri', 'A'],
    ['lämpötila', 'kelvin', 'K'], ['ainemäärä', 'mooli', 'mol'], ['valovoima', 'kandela', 'cd']]},
  {otsikko: 'Johdannaisyksiköt', sarakkeet: ['Suure', 'Yksikkö', 'Perusyksiköin'], rivit: [
    ['voima', 'newton N', R`\(\text{kg·m/s}^2\)`], ['energia, työ', 'joule J', R`\(\text{N·m}\)`], ['teho', 'watti W', R`\(\text{J/s}\)`],
    ['paine', 'pascal Pa', R`\(\text{N/m}^2\)`], ['taajuus', 'hertsi Hz', R`\(\text{1/s}\)`], ['varaus', 'coulombi C', R`\(\text{A·s}\)`],
    ['jännite', 'voltti V', R`\(\text{W/A}\)`], ['resistanssi', 'ohmi Ω', R`\(\text{V/A}\)`], ['kapasitanssi', 'faradi F', R`\(\text{C/V}\)`],
    ['magneettivuon tiheys', 'tesla T', R`\(\text{N/(A·m)}\)`], ['magneettivuo', 'weber Wb', R`\(\text{T·m}^2\)`], ['induktanssi', 'henry H', R`\(\text{Wb/A}\)`],
    ['aktiivisuus', 'becquerel Bq', R`\(\text{1/s}\)`], ['absorboitunut annos', 'gray Gy', R`\(\text{J/kg}\)`]]},
  {otsikko: 'Muunnoksia', sarakkeet: ['', ''], rivit: [
    ['1 km/h', R`\(=\frac{1}{3{,}6}\ \text{m/s}\)`], ['1 h', '= 3600 s'], ['1 kWh', '= 3,6 MJ'], ['1 l', R`\(=1\ \text{dm}^3=10^{-3}\ \text{m}^3\)`],
    ['1 bar', R`\(=10^5\ \text{Pa}\)`], ['1 cal', '= 4,186 J'], ['1 t', '= 1000 kg'], ['1 ha', R`\(=10\,000\ \text{m}^2\)`]]},
]);

aihe(T, 'Aineiden ominaisuuksia', R`<p>Arvot noin 20 °C:ssa ja normaalipaineessa, ellei toisin mainita.</p>`, [], [
  {otsikko: 'Tiheys ρ (kg/m³)', sarakkeet: ['Aine', 'ρ'], rivit: [
    ['ilma (20 °C)', '1,20'], ['vesi (4 °C)', '1000'], ['vesi (20 °C)', '998'], ['merivesi', '1025'], ['jää (0 °C)', '917'], ['etanoli', '789'],
    ['puu (mänty)', '≈ 500'], ['betoni', '≈ 2300'], ['lasi', '≈ 2500'], ['alumiini', '2700'], ['rauta', '7870'], ['kupari', '8960'],
    ['lyijy', '11 340'], ['elohopea', '13 550'], ['kulta', '19 300']]},
  {otsikko: 'Ominaislämpökapasiteetti c (kJ/(kg·K))', sarakkeet: ['Aine', 'c'], rivit: [
    ['vesi', '4,19'], ['jää', '2,09'], ['vesihöyry', '≈ 2,0'], ['ilma', '1,01'], ['etanoli', '2,44'], ['alumiini', '0,90'],
    ['rauta', '0,45'], ['kupari', '0,385'], ['lyijy', '0,13'], ['lasi', '≈ 0,8'], ['betoni', '≈ 0,9']]},
  {otsikko: 'Olomuodon muutokset', sarakkeet: ['Aine', 'Sulamispiste', 's (kJ/kg)', 'Kiehumispiste', 'r (kJ/kg)'], rivit: [
    ['vesi', '0 °C', '333', '100 °C', '2260'], ['etanoli', '−114 °C', '108', '78 °C', '840'], ['alumiini', '660 °C', '397', '2470 °C', '10 900'],
    ['lyijy', '327 °C', '23', '1750 °C', '860'], ['kupari', '1085 °C', '205', '2560 °C', '4730'], ['rauta', '1538 °C', '247', '2860 °C', '6090']]},
  {otsikko: 'Resistiivisyys ρ (Ω·m)', sarakkeet: ['Aine', 'ρ'], rivit: [
    ['hopea', R`\(1{,}59\cdot10^{-8}\)`], ['kupari', R`\(1{,}68\cdot10^{-8}\)`], ['kulta', R`\(2{,}44\cdot10^{-8}\)`], ['alumiini', R`\(2{,}65\cdot10^{-8}\)`],
    ['rauta', R`\(9{,}7\cdot10^{-8}\)`], ['konstantaani', R`\(4{,}9\cdot10^{-7}\)`], ['grafiitti', R`\(\approx 10^{-5}\)`]]},
  {otsikko: 'Taitekerroin n (keltainen valo)', sarakkeet: ['Aine', 'n'], rivit: [
    ['ilma', '1,0003'], ['vesi', '1,33'], ['etanoli', '1,36'], ['akryyli', '1,49'], ['lasi', '1,5…1,9'], ['timantti', '2,42']]},
  {otsikko: 'Kitkakerroin μ (suuntaa antava)', sarakkeet: ['Pinnat', 'lepo μ₀', 'liuku μ'], rivit: [
    ['kumi – kuiva asfaltti', '≈ 1,0', '≈ 0,8'], ['kumi – märkä asfaltti', '≈ 0,7', '≈ 0,5'], ['teräs – teräs', '0,7', '0,6'],
    ['puu – puu', '0,5', '0,3'], ['teräs – jää', '0,03', '0,01'], ['kumi – jää', '≈ 0,15', '≈ 0,1']]},
]);

aihe(T, 'Kreikkalaiset aakkoset', '', [], [{sarakkeet: ['', 'Nimi', '', 'Nimi'], rivit: [
  ['Α α', 'alfa', 'Ν ν', 'nyy'], ['Β β', 'beeta', 'Ξ ξ', 'ksii'], ['Γ γ', 'gamma', 'Ο ο', 'omikron'], ['Δ δ', 'delta', 'Π π', 'pii'],
  ['Ε ε', 'epsilon', 'Ρ ρ', 'rhoo'], ['Ζ ζ', 'dzeeta', 'Σ σ', 'sigma'], ['Η η', 'eeta', 'Τ τ', 'tau'], ['Θ θ', 'theeta', 'Υ υ', 'ypsilon'],
  ['Ι ι', 'ioota', 'Φ φ', 'fii'], ['Κ κ', 'kappa', 'Χ χ', 'khii'], ['Λ λ', 'lambda', 'Ψ ψ', 'psii'], ['Μ μ', 'myy', 'Ω ω', 'oomega'],
]}]);

aihe(T, 'Matemaattisia merkintöjä', '', [], [{sarakkeet: ['Merkki', 'Tarkoittaa'], rivit: [
  [R`\(\mathbb{N}\ \mathbb{Z}\ \mathbb{Q}\ \mathbb{R}\ \mathbb{C}\)`, 'luonnolliset, kokonais-, rationaali-, reaali-, kompleksiluvut'],
  [R`\(\in,\ \notin\)`, 'kuuluu, ei kuulu joukkoon'], [R`\(A\cup B,\ A\cap B\)`, 'yhdiste, leikkaus'], [R`\(\Rightarrow,\ \iff\)`, 'seuraa, yhtäpitävä'],
  [R`\(\forall,\ \exists\)`, 'kaikilla, on olemassa'], [R`\(\left[a,b\right],\ \left]a,b\right[\)`, 'suljettu, avoin väli'], [R`\(\approx,\ \ne\)`, 'likimain, erisuuri'],
  [R`\(\land,\ \lor,\ \lnot\)`, 'ja, tai, ei'],
]}]);
}
