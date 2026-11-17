// Kaavasto: matematiikka (lukion MAA-opintojaksot + vähän yliopiston alkua). Oma teksti.
{
const M = 'Matematiikka';

aihe(M, 'Laskujärjestys ja murtoluvut', R`
<p>Laskujärjestys: <b>sulut → potenssit ja juuret → kerto- ja jakolaskut → yhteen- ja vähennyslaskut</b>, samanarvoiset vasemmalta oikealle.</p>
<p>Murtoluvut lavennetaan samannimisiksi ennen yhteenlaskua. Jakolasku murtoluvulla = kertolasku sen käänteisluvulla.</p>`, [
  ['Yhteenlasku', R`\frac{a}{b}+\frac{c}{d}=\frac{ad+bc}{bd}`, ''],
  ['Kertolasku', R`\frac{a}{b}\cdot\frac{c}{d}=\frac{ac}{bd}`, ''],
  ['Jakolasku', R`\frac{a}{b}:\frac{c}{d}=\frac{a}{b}\cdot\frac{d}{c}`, 'jakajan käänteisluvulla kertominen'],
  ['Itseisarvo', R`\left|a\right|=\begin{cases}a, & a\ge0\\-a, & a<0\end{cases}`, 'luvun etäisyys nollasta'],
  ['Kolmio­epäyhtälö', R`\left|a+b\right|\le\left|a\right|+\left|b\right|`, ''],
]);

aihe(M, 'Prosentit ja korko', R`
<p>Prosentti on sadasosa: \(1\,\%=0{,}01\). <b>Muutoskerroin</b> on luku, jolla alkuperäinen kerrotaan: kasvu 8 % → 1,08, lasku 8 % → 0,92.</p>
<p>Peräkkäiset muutokset kerrotaan keskenään. Prosenttiyksikkö on kahden prosenttiluvun erotus (esim. 4 % → 6 % on 2 prosenttiyksikköä).</p>`, [
  ['Prosenttiosuus', R`p=\frac{a}{b}\cdot100\,\%`, 'kuinka monta prosenttia a on b:stä'],
  ['Muutosprosentti', R`p=\frac{\text{uusi}-\text{vanha}}{\text{vanha}}\cdot100\,\%`, ''],
  ['Muutoskerroin', R`q=1+\frac{p}{100}`, 'kasvu: p > 0, lasku: p < 0'],
  ['Korkoa korolle', R`K_n=K_0\left(1+\frac{p}{100}\right)^n`, 'K₀ alkupääoma, p korkoprosentti kaudessa, n kausien määrä'],
  ['Yksinkertainen korko', R`r=K\cdot\frac{p}{100}\cdot t`, 't aika vuosina'],
  ['Hintaindeksi', R`\text{reaaliarvo}=\frac{\text{nimellisarvo}}{\text{indeksi}}\cdot100`, ''],
]);

aihe(M, 'Potenssit ja juuret', R`
<p>Potenssissa \(a^n\) kantaluku a kerrotaan itsellään n kertaa. Juuri on potenssin käänteistoimitus: \(\sqrt[n]{a}=a^{1/n}\).</p>
<p>Parillisen juuren alla ei saa olla negatiivista lukua (reaaliluvuilla). \(\sqrt{a^2}=\left|a\right|\).</p>`, [
  ['Samankantaiset kertolasku', R`a^m\cdot a^n=a^{m+n}`, ''],
  ['Samankantaiset jakolasku', R`\frac{a^m}{a^n}=a^{m-n}`, ''],
  ['Potenssin potenssi', R`\left(a^m\right)^n=a^{mn}`, ''],
  ['Tulon potenssi', R`\left(ab\right)^n=a^nb^n`, ''],
  ['Osamäärän potenssi', R`\left(\frac{a}{b}\right)^n=\frac{a^n}{b^n}`, ''],
  ['Nolla ja negatiivinen eksponentti', R`a^0=1,\quad a^{-n}=\frac{1}{a^n}`, 'a ≠ 0'],
  ['Murtopotenssi', R`a^{\frac{m}{n}}=\sqrt[n]{a^m}`, 'a ≥ 0'],
  ['Juurien tulo', R`\sqrt{a}\cdot\sqrt{b}=\sqrt{ab}`, 'a, b ≥ 0'],
  ['Juurien osamäärä', R`\frac{\sqrt{a}}{\sqrt{b}}=\sqrt{\frac{a}{b}}`, 'a ≥ 0, b > 0'],
  ['Kymmenpotenssimuoto', R`a\cdot10^n,\quad1\le\left|a\right|<10`, 'esim. 0,00052 = 5,2·10⁻⁴'],
]);

aihe(M, 'Polynomit ja muistikaavat', R`
<p>Polynomi on muotoa \(a_nx^n+\ldots+a_1x+a_0\). Aste on suurin eksponentti. Muistikaavoilla voi kehittää sulkuja ja jakaa tekijöihin.</p>
<p>Jos \(P(a)=0\), polynomi on jaollinen tekijällä \(x-a\) (tekijälause).</p>`, [
  ['Summan neliö', R`\left(a+b\right)^2=a^2+2ab+b^2`, ''],
  ['Erotuksen neliö', R`\left(a-b\right)^2=a^2-2ab+b^2`, ''],
  ['Summan ja erotuksen tulo', R`\left(a+b\right)\left(a-b\right)=a^2-b^2`, 'neliöiden erotus'],
  ['Summan kuutio', R`\left(a+b\right)^3=a^3+3a^2b+3ab^2+b^3`, ''],
  ['Erotuksen kuutio', R`\left(a-b\right)^3=a^3-3a^2b+3ab^2-b^3`, ''],
  ['Kuutioiden summa', R`a^3+b^3=\left(a+b\right)\left(a^2-ab+b^2\right)`, ''],
  ['Kuutioiden erotus', R`a^3-b^3=\left(a-b\right)\left(a^2+ab+b^2\right)`, ''],
  ['2. asteen tekijöihin jako', R`ax^2+bx+c=a\left(x-x_1\right)\left(x-x_2\right)`, 'x₁ ja x₂ ovat yhtälön ax²+bx+c=0 ratkaisut'],
  ['Binomikaava', R`\left(a+b\right)^n=\sum_{k=0}^{n}\binom{n}{k}a^{n-k}b^k`, ''],
]);

aihe(M, 'Yhtälöt ja epäyhtälöt', R`
<p>Yhtälön molemmille puolille saa tehdä saman laskutoimituksen (ei kuitenkaan jakaa nollalla). Epäyhtälössä <b>merkki kääntyy</b>, kun kerrotaan tai jaetaan negatiivisella luvulla.</p>
<p>Toisen asteen yhtälön ratkaisujen määrä riippuu diskriminantista D: D > 0 kaksi ratkaisua, D = 0 yksi, D < 0 ei reaalisia ratkaisuja.</p>
<p>Epäyhtälö \(ax^2+bx+c>0\) ratkaistaan katsomalla, millä välillä paraabeli on x-akselin yläpuolella (merkkikaavio).</p>`, [
  ['1. asteen yhtälö', R`ax+b=0\iff x=-\frac{b}{a}`, 'a ≠ 0'],
  ['2. asteen yhtälön ratkaisukaava', R`x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}`, 'yhtälölle ax² + bx + c = 0'],
  ['Diskriminantti', R`D=b^2-4ac`, ''],
  ['Vajaa 2. asteen yhtälö', R`ax^2+bx=0\iff x\left(ax+b\right)=0`, 'tulon nollasääntö: x = 0 tai x = −b/a'],
  ['Ratkaisujen summa ja tulo', R`x_1+x_2=-\frac{b}{a},\quad x_1x_2=\frac{c}{a}`, ''],
  ['Tulon nollasääntö', R`ab=0\iff a=0\ \text{tai}\ b=0`, ''],
  ['Itseisarvoyhtälö', R`\left|x\right|=a\iff x=a\ \text{tai}\ x=-a`, 'a ≥ 0'],
  ['Itseisarvoepäyhtälö', R`\left|x\right|<a\iff-a<x<a`, ''],
  ['Yhtälöpari', R`\begin{cases}a_1x+b_1y=c_1\\a_2x+b_2y=c_2\end{cases}`, 'ratkaistaan sijoitus- tai yhteenlaskukeinolla'],
]);

aihe(M, 'Funktiot', R`
<p>Funktio liittää jokaiseen määrittelyjoukon alkioon täsmälleen yhden arvon. <b>Nollakohta</b> on x, jolla \(f(x)=0\).</p>
<p>Suoran \(y=kx+b\) kulmakerroin k kertoo jyrkkyyden, b on leikkauskohta y-akselilla. Paraabelin \(y=ax^2+bx+c\) aukeamissuunta: a > 0 ylös, a < 0 alas.</p>
<p>Käänteisfunktio \(f^{-1}\) on olemassa, kun f on aidosti monotoninen. Sen kuvaaja on f:n kuvaajan peilikuva suoran y = x suhteen.</p>`, [
  ['Suora', R`y=kx+b`, 'k kulmakerroin, b vakiotermi'],
  ['Suora pisteen kautta', R`y-y_0=k\left(x-x_0\right)`, ''],
  ['Paraabelin huippu', R`x_0=-\frac{b}{2a},\quad y_0=f\left(x_0\right)`, ''],
  ['Huippumuoto', R`y=a\left(x-x_0\right)^2+y_0`, 'huippu (x₀, y₀)'],
  ['Yhdistetty funktio', R`\left(f\circ g\right)\left(x\right)=f\left(g\left(x\right)\right)`, ''],
  ['Käänteisfunktio', R`y=f\left(x\right)\iff x=f^{-1}\left(y\right)`, ''],
  ['Parillinen / pariton', R`f\left(-x\right)=f\left(x\right)\quad/\quad f\left(-x\right)=-f\left(x\right)`, 'parillinen symmetrinen y-akselin suhteen, pariton origon suhteen'],
]);

aihe(M, 'Eksponentti ja logaritmi', R`
<p>Logaritmi vastaa kysymykseen ”mihin potenssiin kantaluku korotetaan”: \(\log_a x=y\iff a^y=x\). Määritelty, kun x > 0, a > 0 ja a ≠ 1.</p>
<p>\(\lg\) on 10-kantainen ja \(\ln\) e-kantainen logaritmi, \(e\approx2{,}71828\).</p>
<p>Eksponentiaalinen kasvu: suure kasvaa joka aikayksikkö samalla kertoimella.</p>`, [
  ['Logaritmin määritelmä', R`\log_ax=y\iff a^y=x`, ''],
  ['Tulon logaritmi', R`\log_a\left(xy\right)=\log_ax+\log_ay`, ''],
  ['Osamäärän logaritmi', R`\log_a\frac{x}{y}=\log_ax-\log_ay`, ''],
  ['Potenssin logaritmi', R`\log_ax^r=r\log_ax`, ''],
  ['Kantaluvun vaihto', R`\log_ax=\frac{\ln x}{\ln a}`, ''],
  ['Erikoisarvot', R`\log_a1=0,\quad\log_aa=1,\quad a^{\log_ax}=x`, ''],
  ['Eksponentiaalinen malli', R`f\left(t\right)=f_0\cdot q^t`, 'q muutoskerroin aikayksikössä'],
  ['Luonnollinen kasvu', R`N\left(t\right)=N_0e^{kt}`, 'k > 0 kasvu, k < 0 väheneminen'],
  ['Puoliintumisaika', R`N=N_0\left(\frac{1}{2}\right)^{\frac{t}{T_{1/2}}}`, ''],
]);

aihe(M, 'Tasogeometria', R`
<p>Kolmion kulmien summa on 180°, n-kulmion \(\left(n-2\right)\cdot180°\). Yhdenmuotoisissa kuvioissa vastinosien suhde on vakio k (mittakaava); pinta-alojen suhde on \(k^2\) ja tilavuuksien \(k^3\).</p>
<p><b>Kehäkulma</b> on puolet samaa kaarta vastaavasta keskuskulmasta. Puoliympyrää vastaava kehäkulma on suora (Thaleen lause).</p>`, [
  ['Pythagoraan lause', R`a^2+b^2=c^2`, 'c hypotenuusa'],
  ['Kolmion ala', R`A=\frac{1}{2}ah`, 'a kanta, h korkeus'],
  ['Kolmion ala (kulma)', R`A=\frac{1}{2}ab\sin\gamma`, 'γ sivujen a ja b välinen kulma'],
  ['Heronin kaava', R`A=\sqrt{p\left(p-a\right)\left(p-b\right)\left(p-c\right)},\ p=\frac{a+b+c}{2}`, ''],
  ['Suorakulmio', R`A=ab`, ''],
  ['Suunnikas', R`A=ah`, ''],
  ['Puolisuunnikas', R`A=\frac{a+b}{2}\cdot h`, 'a ja b yhdensuuntaiset sivut'],
  ['Ympyrän kehä', R`p=2\pi r`, ''],
  ['Ympyrän ala', R`A=\pi r^2`, ''],
  ['Kaaren pituus', R`b=\frac{\alpha}{360°}\cdot2\pi r`, 'radiaaneina b = αr'],
  ['Sektorin ala', R`A=\frac{\alpha}{360°}\cdot\pi r^2`, 'radiaaneina A = ½αr²'],
  ['Kehäkulma', R`\beta=\frac{\alpha}{2}`, 'α keskuskulma'],
  ['Monikulmion kulmasumma', R`\left(n-2\right)\cdot180°`, ''],
  ['Yhdenmuotoisuus', R`\frac{A_1}{A_2}=k^2,\quad\frac{V_1}{V_2}=k^3`, 'k pituuksien suhde'],
]);

aihe(M, 'Avaruusgeometria', R`
<p>Lieriön ja särmiön tilavuus on pohjan ala kertaa korkeus. Kartion ja pyramidin tilavuus on <b>kolmasosa</b> vastaavasta lieriöstä tai särmiöstä.</p>`, [
  ['Kuutio', R`V=a^3,\quad A=6a^2`, ''],
  ['Suorakulmainen särmiö', R`V=abc,\quad A=2\left(ab+bc+ac\right)`, ''],
  ['Särmiö ja lieriö', R`V=A_ph`, 'Aₚ pohjan ala'],
  ['Ympyrälieriö', R`V=\pi r^2h,\quad A_v=2\pi rh`, 'Aᵥ vaipan ala'],
  ['Pyramidi ja kartio', R`V=\frac{1}{3}A_ph`, ''],
  ['Ympyräkartio', R`V=\frac{1}{3}\pi r^2h,\quad A_v=\pi rs`, 's sivujana, s² = r² + h²'],
  ['Katkaistu kartio', R`V=\frac{\pi h}{3}\left(R^2+Rr+r^2\right)`, ''],
  ['Pallo', R`V=\frac{4}{3}\pi r^3,\quad A=4\pi r^2`, ''],
  ['Avaruuslävistäjä', R`d=\sqrt{a^2+b^2+c^2}`, 'suorakulmainen särmiö'],
]);

aihe(M, 'Trigonometria', R`
<p>Suorakulmaisessa kolmiossa: sini = vastainen kateetti / hypotenuusa, kosini = viereinen / hypotenuusa, tangentti = vastainen / viereinen.</p>
<p>Yksikköympyrällä kulman α kehäpisteen koordinaatit ovat \(\left(\cos\alpha,\sin\alpha\right)\). Radiaani: \(180°=\pi\) rad.</p>
<p><b>Trigonometrisilla yhtälöillä on äärettömän monta ratkaisua</b> – muista jakso (+ n·360° tai + n·2π).</p>`, [
  ['Sini, kosini, tangentti', R`\sin\alpha=\frac{a}{c},\ \cos\alpha=\frac{b}{c},\ \tan\alpha=\frac{a}{b}`, 'a vastainen, b viereinen kateetti, c hypotenuusa'],
  ['Asteet ja radiaanit', R`\alpha_{\text{rad}}=\frac{\pi}{180°}\cdot\alpha`, ''],
  ['Peruskaava', R`\sin^2\alpha+\cos^2\alpha=1`, ''],
  ['Tangentti', R`\tan\alpha=\frac{\sin\alpha}{\cos\alpha}`, ''],
  ['Sinilause', R`\frac{a}{\sin\alpha}=\frac{b}{\sin\beta}=\frac{c}{\sin\gamma}`, ''],
  ['Kosinilause', R`c^2=a^2+b^2-2ab\cos\gamma`, ''],
  ['sin x = a', R`x=\alpha+n\cdot360°\ \text{tai}\ x=180°-\alpha+n\cdot360°`, ''],
  ['cos x = a', R`x=\pm\alpha+n\cdot360°`, ''],
  ['tan x = a', R`x=\alpha+n\cdot180°`, ''],
  ['Kaksinkertainen kulma', R`\sin2\alpha=2\sin\alpha\cos\alpha`, ''],
  ['Kaksinkertainen kulma (cos)', R`\cos2\alpha=\cos^2\alpha-\sin^2\alpha=1-2\sin^2\alpha`, ''],
  ['Summakaava (sin)', R`\sin\left(\alpha\pm\beta\right)=\sin\alpha\cos\beta\pm\cos\alpha\sin\beta`, ''],
  ['Summakaava (cos)', R`\cos\left(\alpha\pm\beta\right)=\cos\alpha\cos\beta\mp\sin\alpha\sin\beta`, ''],
  ['Komplementtikulma', R`\sin\left(90°-\alpha\right)=\cos\alpha`, ''],
  ['Suplementtikulma', R`\sin\left(180°-\alpha\right)=\sin\alpha,\ \cos\left(180°-\alpha\right)=-\cos\alpha`, ''],
], [{otsikko: 'Tarkat arvot', sarakkeet: ['α', 'sin α', 'cos α', 'tan α'], rivit: [
  [R`\(0°\)`, R`\(0\)`, R`\(1\)`, R`\(0\)`],
  [R`\(30°=\frac{\pi}{6}\)`, R`\(\frac{1}{2}\)`, R`\(\frac{\sqrt3}{2}\)`, R`\(\frac{1}{\sqrt3}\)`],
  [R`\(45°=\frac{\pi}{4}\)`, R`\(\frac{\sqrt2}{2}\)`, R`\(\frac{\sqrt2}{2}\)`, R`\(1\)`],
  [R`\(60°=\frac{\pi}{3}\)`, R`\(\frac{\sqrt3}{2}\)`, R`\(\frac{1}{2}\)`, R`\(\sqrt3\)`],
  [R`\(90°=\frac{\pi}{2}\)`, R`\(1\)`, R`\(0\)`, '–'],
  [R`\(180°=\pi\)`, R`\(0\)`, R`\(-1\)`, R`\(0\)`],
]}]);

aihe(M, 'Analyyttinen geometria', R`
<p>Suorat ovat yhdensuuntaiset, kun kulmakertoimet ovat samat, ja kohtisuorassa, kun kulmakertoimien tulo on −1.</p>`, [
  ['Kulmakerroin', R`k=\frac{y_2-y_1}{x_2-x_1}=\tan\alpha`, 'α suoran kaltevuuskulma'],
  ['Kohtisuorat suorat', R`k_1k_2=-1`, ''],
  ['Pisteiden etäisyys', R`d=\sqrt{\left(x_2-x_1\right)^2+\left(y_2-y_1\right)^2}`, ''],
  ['Keskipiste', R`\left(\frac{x_1+x_2}{2},\frac{y_1+y_2}{2}\right)`, ''],
  ['Suoran yleinen muoto', R`ax+by+c=0`, ''],
  ['Pisteen etäisyys suorasta', R`d=\frac{\left|ax_0+by_0+c\right|}{\sqrt{a^2+b^2}}`, ''],
  ['Ympyrä', R`\left(x-x_0\right)^2+\left(y-y_0\right)^2=r^2`, 'keskipiste (x₀, y₀), säde r'],
  ['Paraabeli (polttopiste)', R`x^2=4py`, 'polttopiste (0, p), johtosuora y = −p'],
  ['Ellipsi', R`\frac{x^2}{a^2}+\frac{y^2}{b^2}=1`, ''],
  ['Suorien välinen kulma', R`\tan\theta=\left|\frac{k_1-k_2}{1+k_1k_2}\right|`, ''],
]);

aihe(M, 'Vektorit', R`
<p>Vektorilla on suuruus ja suunta. Koordinaattimuodossa \(\overline{a}=x\overline{i}+y\overline{j}+z\overline{k}\).</p>
<p>Vektorit ovat kohtisuorassa, kun pistetulo on 0, ja yhdensuuntaiset, kun \(\overline{a}=t\overline{b}\).</p>`, [
  ['Pituus', R`\left|\overline{a}\right|=\sqrt{x^2+y^2+z^2}`, ''],
  ['Vektori pisteestä A pisteeseen B', R`\overline{AB}=\left(x_B-x_A\right)\overline{i}+\left(y_B-y_A\right)\overline{j}+\left(z_B-z_A\right)\overline{k}`, ''],
  ['Yksikkövektori', R`\overline{a}^0=\frac{\overline{a}}{\left|\overline{a}\right|}`, ''],
  ['Pistetulo', R`\overline{a}\cdot\overline{b}=a_xb_x+a_yb_y+a_zb_z`, ''],
  ['Pistetulo ja kulma', R`\overline{a}\cdot\overline{b}=\left|\overline{a}\right|\left|\overline{b}\right|\cos\theta`, ''],
  ['Vektorien kulma', R`\cos\theta=\frac{\overline{a}\cdot\overline{b}}{\left|\overline{a}\right|\left|\overline{b}\right|}`, ''],
  ['Projektio', R`\overline{a}_{\overline{b}}=\frac{\overline{a}\cdot\overline{b}}{\left|\overline{b}\right|^2}\overline{b}`, 'a:n projektio b:n suuntaan'],
  ['Ristitulo', R`\overline{a}\times\overline{b}=\begin{vmatrix}\overline{i}&\overline{j}&\overline{k}\\a_x&a_y&a_z\\b_x&b_y&b_z\end{vmatrix}`, ''],
  ['Suunnikkaan ala', R`A=\left|\overline{a}\times\overline{b}\right|`, 'kolmion ala on puolet'],
  ['Suora avaruudessa', R`\overline{OP}=\overline{OP_0}+t\overline{s}`, 's suuntavektori, t reaaliluku'],
  ['Taso', R`a\left(x-x_0\right)+b\left(y-y_0\right)+c\left(z-z_0\right)=0`, 'normaalivektori ai + bj + ck'],
]);

aihe(M, 'Lukujonot ja summat', R`
<p>Aritmeettisessa jonossa peräkkäisten jäsenten <b>erotus</b> d on vakio, geometrisessa <b>suhde</b> q on vakio.</p>
<p>Geometrinen sarja suppenee, kun \(\left|q\right|&lt;1\).</p>`, [
  ['Aritmeettinen jono', R`a_n=a_1+\left(n-1\right)d`, ''],
  ['Aritmeettinen summa', R`S_n=n\cdot\frac{a_1+a_n}{2}`, ''],
  ['Geometrinen jono', R`a_n=a_1q^{n-1}`, ''],
  ['Geometrinen summa', R`S_n=a_1\cdot\frac{1-q^n}{1-q}`, 'q ≠ 1'],
  ['Geometrinen sarja', R`S=\frac{a_1}{1-q}`, '|q| < 1'],
  ['Summamerkintä', R`\sum_{k=1}^{n}a_k=a_1+a_2+\ldots+a_n`, ''],
  ['Lukujen 1…n summa', R`\sum_{k=1}^{n}k=\frac{n\left(n+1\right)}{2}`, ''],
  ['Neliöiden summa', R`\sum_{k=1}^{n}k^2=\frac{n\left(n+1\right)\left(2n+1\right)}{6}`, ''],
]);

aihe(M, 'Raja-arvo ja jatkuvuus', R`
<p>Raja-arvo \(\lim_{x\to a}f(x)\) kertoo, mitä arvoa kohti f lähestyy, kun x lähestyy a:ta. Funktio on jatkuva kohdassa a, jos raja-arvo on sama kuin \(f(a)\).</p>
<p>Muotoa ”0/0” oleva raja-arvo ratkeaa usein sieventämällä (tekijöihin jako) ennen sijoitusta.</p>`, [
  ['Jatkuvuus', R`\lim_{x\to a}f\left(x\right)=f\left(a\right)`, ''],
  ['Tärkeä raja-arvo', R`\lim_{x\to0}\frac{\sin x}{x}=1`, 'x radiaaneina'],
  ['Neperin luku', R`\lim_{n\to\infty}\left(1+\frac{1}{n}\right)^n=e`, ''],
  ['Rationaalifunktio äärettömyydessä', R`\lim_{x\to\infty}\frac{1}{x^n}=0`, 'n > 0'],
]);

aihe(M, 'Derivaatta', R`
<p>Derivaatta \(f'(a)\) on funktion kuvaajalle kohtaan a piirretyn tangentin kulmakerroin eli hetkellinen muutosnopeus.</p>
<ul><li>\(f'(x)>0\) → f kasvaa, \(f'(x)&lt;0\) → f vähenee.</li>
<li>Ääriarvo voi olla derivaatan nollakohdassa, derivoitumattomassa kohdassa tai välin päätepisteessä. Tutki merkkikaaviolla.</li>
<li>Suljetulla välillä suurin ja pienin arvo löytyvät vertaamalla näitä kohtia.</li></ul>`, [
  ['Määritelmä', R`f'\left(a\right)=\lim_{h\to0}\frac{f\left(a+h\right)-f\left(a\right)}{h}`, ''],
  ['Potenssi', R`D\,x^n=nx^{n-1}`, ''],
  ['Vakio ja vakiokerroin', R`D\,c=0,\quad D\,cf=cf'`, ''],
  ['Summa', R`D\left(f+g\right)=f'+g'`, ''],
  ['Tulo', R`D\left(fg\right)=f'g+fg'`, ''],
  ['Osamäärä', R`D\frac{f}{g}=\frac{f'g-fg'}{g^2}`, ''],
  ['Yhdistetty funktio (ketjusääntö)', R`D\,f\left(g\left(x\right)\right)=f'\left(g\left(x\right)\right)g'\left(x\right)`, ''],
  ['Tangentin yhtälö', R`y-f\left(a\right)=f'\left(a\right)\left(x-a\right)`, ''],
  ['Normaali', R`k_n=-\frac{1}{f'\left(a\right)}`, ''],
  ['Käänteisfunktion derivaatta', R`\left(f^{-1}\right)'\left(y\right)=\frac{1}{f'\left(x\right)}`, 'y = f(x)'],
], [{otsikko: 'Perusfunktioiden derivaatat', sarakkeet: ['f(x)', "f′(x)"], rivit: [
  [R`\(x^n\)`, R`\(nx^{n-1}\)`], [R`\(\sqrt{x}\)`, R`\(\frac{1}{2\sqrt{x}}\)`], [R`\(\frac{1}{x}\)`, R`\(-\frac{1}{x^2}\)`],
  [R`\(e^x\)`, R`\(e^x\)`], [R`\(a^x\)`, R`\(a^x\ln a\)`], [R`\(\ln x\)`, R`\(\frac{1}{x}\)`], [R`\(\log_ax\)`, R`\(\frac{1}{x\ln a}\)`],
  [R`\(\sin x\)`, R`\(\cos x\)`], [R`\(\cos x\)`, R`\(-\sin x\)`], [R`\(\tan x\)`, R`\(1+\tan^2x=\frac{1}{\cos^2x}\)`],
  [R`\(\arcsin x\)`, R`\(\frac{1}{\sqrt{1-x^2}}\)`], [R`\(\arccos x\)`, R`\(-\frac{1}{\sqrt{1-x^2}}\)`], [R`\(\arctan x\)`, R`\(\frac{1}{1+x^2}\)`],
]}]);

aihe(M, 'Integraali', R`
<p>Integraalifunktio F on funktio, jonka derivaatta on f. Integraalifunktioita on äärettömän monta: lisää aina vakio C.</p>
<p>Määrätty integraali on kuvaajan ja x-akselin väliin jäävä <b>pinta-ala etumerkkeineen</b>: x-akselin alapuolinen osa lasketaan negatiivisena.</p>`, [
  ['Integraalifunktio', R`\int f\left(x\right)\,dx=F\left(x\right)+C,\quad F'=f`, ''],
  ['Analyysin peruslause', R`\int_a^bf\left(x\right)\,dx=F\left(b\right)-F\left(a\right)`, ''],
  ['Potenssi', R`\int x^n\,dx=\frac{x^{n+1}}{n+1}+C`, 'n ≠ −1'],
  ['Käänteisluku', R`\int\frac{1}{x}\,dx=\ln\left|x\right|+C`, ''],
  ['Kahden käyrän välinen ala', R`A=\int_a^b\left(f\left(x\right)-g\left(x\right)\right)dx`, 'f ≥ g välillä [a, b]'],
  ['Pyörähdyskappale (x-akseli)', R`V=\pi\int_a^bf\left(x\right)^2\,dx`, ''],
  ['Osittaisintegrointi', R`\int fg'\,dx=fg-\int f'g\,dx`, ''],
  ['Sijoitus', R`\int f\left(g\left(x\right)\right)g'\left(x\right)dx=F\left(g\left(x\right)\right)+C`, ''],
  ['Keskiarvo välillä', R`\bar{f}=\frac{1}{b-a}\int_a^bf\left(x\right)dx`, ''],
], [{otsikko: 'Perusintegraalit (+ C)', sarakkeet: ['f(x)', '∫ f(x) dx'], rivit: [
  [R`\(x^n\)`, R`\(\frac{x^{n+1}}{n+1}\)`], [R`\(\frac{1}{x}\)`, R`\(\ln\left|x\right|\)`], [R`\(e^x\)`, R`\(e^x\)`], [R`\(e^{kx}\)`, R`\(\frac{1}{k}e^{kx}\)`],
  [R`\(a^x\)`, R`\(\frac{a^x}{\ln a}\)`], [R`\(\sin x\)`, R`\(-\cos x\)`], [R`\(\cos x\)`, R`\(\sin x\)`], [R`\(\frac{1}{\cos^2x}\)`, R`\(\tan x\)`],
  [R`\(\frac{1}{1+x^2}\)`, R`\(\arctan x\)`], [R`\(\frac{1}{\sqrt{1-x^2}}\)`, R`\(\arcsin x\)`], [R`\(\ln x\)`, R`\(x\ln x-x\)`],
]}]);

aihe(M, 'Kombinatoriikka', R`
<p><b>Tuloperiaate:</b> jos valinta tehdään vaiheittain ja vaiheissa on \(n_1, n_2, \ldots\) vaihtoehtoa, kaikkiaan vaihtoehtoja on \(n_1\cdot n_2\cdots\).</p>
<p>Järjestyksellä on väliä → permutaatio / variaatio. Järjestyksellä ei väliä → kombinaatio (binomikerroin).</p>`, [
  ['Kertoma', R`n!=1\cdot2\cdot3\cdots n,\quad0!=1`, ''],
  ['Permutaatiot', R`n!`, 'n alkion kaikki järjestykset'],
  ['k alkion jono n:stä', R`\frac{n!}{\left(n-k\right)!}`, 'järjestyksellä väliä, ei toistoa'],
  ['Kombinaatiot', R`\binom{n}{k}=\frac{n!}{k!\left(n-k\right)!}`, 'k alkion osajoukot n:stä'],
  ['Toistollinen valinta', R`n^k`, 'k valintaa, kussakin n vaihtoehtoa'],
]);

aihe(M, 'Todennäköisyys', R`
<p>Todennäköisyys on luku väliltä 0–1. <b>Komplementtisääntö</b> on usein helpoin tie, kun kysytään ”ainakin yksi”.</p>
<p>Tapahtumat ovat riippumattomia, jos toisen sattuminen ei vaikuta toiseen. Erillisillä tapahtumilla ei ole yhteisiä alkeistapauksia.</p>`, [
  ['Klassinen todennäköisyys', R`P\left(A\right)=\frac{k}{n}`, 'k suotuisat, n kaikki (yhtä todennäköiset) tapaukset'],
  ['Komplementti', R`P\left(\overline{A}\right)=1-P\left(A\right)`, ''],
  ['Yleinen yhteenlaskusääntö', R`P\left(A\cup B\right)=P\left(A\right)+P\left(B\right)-P\left(A\cap B\right)`, 'erillisillä viimeinen termi on 0'],
  ['Kertolaskusääntö', R`P\left(A\cap B\right)=P\left(A\right)P\left(B\mid A\right)`, 'riippumattomilla P(A)·P(B)'],
  ['Ehdollinen todennäköisyys', R`P\left(B\mid A\right)=\frac{P\left(A\cap B\right)}{P\left(A\right)}`, ''],
  ['Bayesin kaava', R`P\left(A\mid B\right)=\frac{P\left(B\mid A\right)P\left(A\right)}{P\left(B\right)}`, ''],
  ['Binomitodennäköisyys', R`P\left(X=k\right)=\binom{n}{k}p^k\left(1-p\right)^{n-k}`, 'k onnistumista n toistossa'],
  ['Odotusarvo', R`E\left(X\right)=\sum x_ip_i`, ''],
  ['Varianssi', R`D^2\left(X\right)=\sum\left(x_i-\mu\right)^2p_i`, 'keskihajonta D(X) on sen neliöjuuri'],
  ['Binomijakauman odotusarvo', R`E\left(X\right)=np,\quad D\left(X\right)=\sqrt{np\left(1-p\right)}`, ''],
]);

aihe(M, 'Tilastot ja normaalijakauma', R`
<p>Keskiluvut: <b>keskiarvo</b>, <b>mediaani</b> (keskimmäinen suuruusjärjestyksessä) ja <b>tyyppiarvo</b> (yleisin). Hajonta kertoo, kuinka paljon arvot vaihtelevat.</p>
<p>Normaalijakaumassa noin 68 % arvoista on välillä \(\mu\pm\sigma\), 95 % välillä \(\mu\pm2\sigma\) ja 99,7 % välillä \(\mu\pm3\sigma\).</p>`, [
  ['Keskiarvo', R`\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i`, ''],
  ['Frekvensseillä', R`\bar{x}=\frac{\sum f_ix_i}{\sum f_i}`, ''],
  ['Otoskeskihajonta', R`s=\sqrt{\frac{\sum\left(x_i-\bar{x}\right)^2}{n-1}}`, ''],
  ['Populaation keskihajonta', R`\sigma=\sqrt{\frac{\sum\left(x_i-\mu\right)^2}{n}}`, ''],
  ['Standardointi', R`z=\frac{x-\mu}{\sigma}`, 'z-arvo luetaan normaalijakauman taulukosta'],
  ['Normaalijakauma', R`P\left(X\le x\right)=\Phi\left(\frac{x-\mu}{\sigma}\right)`, ''],
  ['95 %:n luottamusväli', R`\bar{x}\pm1{,}96\cdot\frac{s}{\sqrt{n}}`, ''],
]);

aihe(M, 'Kompleksiluvut', R`
<p>Imaginaariyksikölle \(i^2=-1\). Kompleksiluku \(z=a+bi\), jossa a on reaaliosa ja b imaginaariosa. Tarvitaan yliopistossa ja sähkötekniikassa.</p>`, [
  ['Itseisarvo', R`\left|z\right|=\sqrt{a^2+b^2}`, ''],
  ['Liittoluku', R`\bar{z}=a-bi`, ''],
  ['Napakoordinaattimuoto', R`z=r\left(\cos\varphi+i\sin\varphi\right)=re^{i\varphi}`, ''],
  ['Eulerin kaava', R`e^{i\varphi}=\cos\varphi+i\sin\varphi`, ''],
  ['de Moivren kaava', R`z^n=r^n\left(\cos n\varphi+i\sin n\varphi\right)`, ''],
]);
}
