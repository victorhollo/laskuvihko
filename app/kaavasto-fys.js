// Kaavasto: fysiikka (lukion FY-opintojaksot). Oma teksti.
{
const F = 'Fysiikka';

aihe(F, 'Suureet, yksiköt ja tarkkuus', R`
<p>Suure = lukuarvo · yksikkö, esim. \(m=2{,}5\ \text{kg}\). Laske SI-yksiköillä, niin vastaus tulee SI-yksikössä.</p>
<p><b>Tarkkuus:</b> kerto- ja jakolaskussa vastauksessa on yhtä monta merkitsevää numeroa kuin epätarkimmassa lähtöarvossa. Yhteen- ja vähennyslaskussa ratkaisee epätarkin desimaali. Pyöristä vasta lopussa.</p>
<p>Laskuvihossa yksikkö aloitetaan lainausmerkillä: <b>5"kg</b>. Muunnos: <b>72"km/"h -> "m/"s</b>.</p>`, [
  ['Tiheys', R`\rho=\frac{m}{V}`, 'ρ tiheys (kg/m³), m massa, V tilavuus'],
  ['Keskiarvo ja virhe', R`\Delta x=\frac{x_{\max}-x_{\min}}{2}`, 'mittaustuloksen vaihteluvälin puolikas'],
  ['Suhteellinen virhe', R`\frac{\Delta x}{x}\cdot100\,\%`, ''],
]);

aihe(F, 'Suoraviivainen liike', R`
<p>Paikan muutos on siirtymä. <b>Nopeus</b> on paikan muutosnopeus ja <b>kiihtyvyys</b> nopeuden muutosnopeus.</p>
<ul><li>(t, s)-kuvaajan kulmakerroin = nopeus</li><li>(t, v)-kuvaajan kulmakerroin = kiihtyvyys</li><li>(t, v)-kuvaajan ja t-akselin välinen pinta-ala = siirtymä</li></ul>`, [
  ['Keskinopeus', R`v=\frac{\Delta s}{\Delta t}`, ''],
  ['Keskikiihtyvyys', R`a=\frac{\Delta v}{\Delta t}`, ''],
  ['Tasainen liike', R`s=vt`, ''],
  ['Nopeus, tasaisesti kiihtyvä', R`v=v_0+at`, ''],
  ['Siirtymä, tasaisesti kiihtyvä', R`s=v_0t+\frac{1}{2}at^2`, ''],
  ['Siirtymä keskinopeudella', R`s=\frac{v_0+v}{2}\cdot t`, ''],
  ['Ilman aikaa', R`v^2=v_0^2+2as`, ''],
  ['Vapaa pudotus', R`v=gt,\quad h=\frac{1}{2}gt^2`, 'g ≈ 9,81 m/s²'],
]);

aihe(F, 'Heittoliike', R`
<p>Heittoliike jaetaan kahteen osaan: vaakasuunnassa tasainen liike, pystysuunnassa tasaisesti kiihtyvä liike (kiihtyvyys g alaspäin). Ilmanvastus jätetään huomiotta.</p>`, [
  ['Alkunopeuden komponentit', R`v_{0x}=v_0\cos\alpha,\quad v_{0y}=v_0\sin\alpha`, 'α heittokulma vaakatasosta'],
  ['Vaakasuunta', R`x=v_0\cos\alpha\cdot t`, ''],
  ['Pystysuunta', R`y=v_0\sin\alpha\cdot t-\frac{1}{2}gt^2`, ''],
  ['Lakikorkeus', R`h=\frac{v_0^2\sin^2\alpha}{2g}`, ''],
  ['Kantama (sama korkeus)', R`x=\frac{v_0^2\sin2\alpha}{g}`, 'suurin, kun α = 45°'],
]);

aihe(F, 'Voima ja Newtonin lait', R`
<ul><li><b>I laki (jatkavuus):</b> jos kokonaisvoima on nolla, kappale pysyy levossa tai tasaisessa liikkeessä.</li>
<li><b>II laki:</b> kokonaisvoima = massa · kiihtyvyys.</li>
<li><b>III laki (voima ja vastavoima):</b> kappaleet vaikuttavat toisiinsa yhtä suurilla, vastakkaisilla voimilla.</li></ul>
<p>Piirrä aina voimakuvio ja valitse positiivinen suunta.</p>`, [
  ['Newtonin II laki', R`\sum\overline{F}=m\overline{a}`, ''],
  ['Paino', R`G=mg`, ''],
  ['Liukukitka', R`F_\mu=\mu N`, 'μ kitkakerroin, N tukivoima'],
  ['Lepokitka (suurin)', R`F_{\mu0}\le\mu_0N`, ''],
  ['Jousivoima (Hooke)', R`F=-kx`, 'k jousivakio, x venymä'],
  ['Kalteva taso', R`G_\parallel=mg\sin\alpha,\quad G_\perp=mg\cos\alpha`, 'α tason kaltevuuskulma'],
  ['Ilmanvastus', R`F=\frac{1}{2}C\rho Av^2`, 'C muotokerroin, A poikkipinta-ala'],
]);

aihe(F, 'Paine ja noste', R`
<p>Paine on voima pinta-alaa kohti. Nesteessä paine kasvaa syvyyden mukana. <b>Arkhimedeen laki:</b> nesteeseen upotettuun kappaleeseen vaikuttaa noste, joka on yhtä suuri kuin syrjäytetyn nesteen paino.</p>`, [
  ['Paine', R`p=\frac{F}{A}`, 'yksikkö Pa = N/m²'],
  ['Hydrostaattinen paine', R`p=p_0+\rho gh`, 'p₀ pinnan paine (ilmanpaine)'],
  ['Noste', R`N=\rho_{\text{neste}}Vg`, 'V syrjäytetyn nesteen tilavuus'],
  ['Kelluminen', R`\rho_{\text{kappale}}<\rho_{\text{neste}}`, ''],
]);

aihe(F, 'Työ, energia ja teho', R`
<p><b>Energian säilymislaki:</b> energiaa ei synny eikä häviä, se muuttuu muodosta toiseen. Ilman kitkaa mekaaninen energia \(E_k+E_p\) säilyy.</p>
<p>Työ on energian siirtoa voiman avulla. Teho on työn tekemisen nopeus.</p>`, [
  ['Työ', R`W=Fs\cos\alpha`, 'α voiman ja siirtymän välinen kulma'],
  ['Liike-energia', R`E_k=\frac{1}{2}mv^2`, ''],
  ['Potentiaalienergia', R`E_p=mgh`, ''],
  ['Jousen potentiaalienergia', R`E_p=\frac{1}{2}kx^2`, ''],
  ['Mekaanisen energian säilyminen', R`\frac{1}{2}mv_1^2+mgh_1=\frac{1}{2}mv_2^2+mgh_2`, ''],
  ['Työperiaate', R`W=\Delta E_k`, 'kokonaisvoiman työ'],
  ['Teho', R`P=\frac{W}{t}=Fv`, ''],
  ['Hyötysuhde', R`\eta=\frac{P_{\text{anto}}}{P_{\text{otto}}}=\frac{E_{\text{hyöty}}}{E_{\text{otto}}}`, ''],
]);

aihe(F, 'Liikemäärä ja törmäykset', R`
<p>Suljetun systeemin <b>kokonaisliikemäärä säilyy</b> törmäyksissä. Kimmoisassa törmäyksessä myös liike-energia säilyy, kimmottomassa osa muuttuu lämmöksi. Täysin kimmottomassa kappaleet jatkavat yhdessä.</p>`, [
  ['Liikemäärä', R`\overline{p}=m\overline{v}`, ''],
  ['Impulssi', R`\overline{I}=\overline{F}\Delta t=\Delta\overline{p}`, ''],
  ['Liikemäärän säilyminen', R`m_1v_1+m_2v_2=m_1u_1+m_2u_2`, 'u nopeudet törmäyksen jälkeen'],
  ['Täysin kimmoton', R`m_1v_1+m_2v_2=\left(m_1+m_2\right)u`, ''],
]);

aihe(F, 'Ympyräliike ja pyöriminen', R`
<p>Tasaisessa ympyräliikkeessä nopeuden suunta muuttuu jatkuvasti, joten kappaleella on keskikohtaa kohti suuntautuva <b>normaalikiihtyvyys</b>. Sen aiheuttaa kokonaisvoima (esim. jännitys, kitka, gravitaatio).</p>
<p><b>Tasapaino:</b> kokonaisvoima on nolla ja momenttien summa minkä tahansa akselin suhteen on nolla.</p>`, [
  ['Kehänopeus', R`v=\frac{2\pi r}{T}=\omega r`, 'T kierrosaika'],
  ['Kulmanopeus', R`\omega=\frac{\Delta\varphi}{\Delta t}=2\pi f`, ''],
  ['Taajuus ja kierrosaika', R`f=\frac{1}{T}`, ''],
  ['Normaalikiihtyvyys', R`a_n=\frac{v^2}{r}=\omega^2r`, ''],
  ['Keskeisvoima', R`F=\frac{mv^2}{r}`, ''],
  ['Momentti', R`M=Fr`, 'r voiman varsi'],
  ['Momenttiehto', R`\sum M=0`, ''],
  ['Kulmakiihtyvyys', R`\alpha=\frac{\Delta\omega}{\Delta t}`, ''],
  ['Pyörimisen peruslaki', R`M=J\alpha`, 'J hitausmomentti'],
  ['Pyörimisenergia', R`E=\frac{1}{2}J\omega^2`, ''],
  ['Pyörimismäärä', R`L=J\omega`, ''],
]);

aihe(F, 'Gravitaatio', R`
<p>Kaikki kappaleet vetävät toisiaan puoleensa. Gravitaatio pitää planeetat ja satelliitit radoillaan: rataliikkeen keskeisvoima on gravitaatiovoima.</p>`, [
  ['Gravitaatiolaki', R`F=\gamma\frac{m_1m_2}{r^2}`, 'γ = 6,674·10⁻¹¹ Nm²/kg²'],
  ['Gravitaatiokentän voimakkuus', R`g=\gamma\frac{M}{r^2}`, ''],
  ['Ratanopeus', R`v=\sqrt{\frac{\gamma M}{r}}`, ''],
  ['Keplerin III laki', R`\frac{T^2}{r^3}=\frac{4\pi^2}{\gamma M}`, ''],
  ['Gravitaation potentiaalienergia', R`E_p=-\gamma\frac{Mm}{r}`, ''],
  ['Pakonopeus', R`v=\sqrt{\frac{2\gamma M}{r}}`, ''],
]);

aihe(F, 'Lämpö', R`
<p>Lämpö on energiaa, joka siirtyy lämpötilaerojen takia. Olomuodon muutoksen aikana lämpötila pysyy vakiona.</p>
<p>Kaasulaeissa lämpötila on aina <b>kelvineinä</b>: \(T=t+273{,}15\).</p>`, [
  ['Lämpömäärä', R`Q=cm\Delta T`, 'c ominaislämpökapasiteetti'],
  ['Lämpökapasiteetti', R`Q=C\Delta T`, ''],
  ['Sulaminen / jähmettyminen', R`Q=sm`, 's ominaissulamislämpö'],
  ['Höyrystyminen / tiivistyminen', R`Q=rm`, 'r ominaishöyrystymislämpö'],
  ['Lämpötasapaino', R`Q_{\text{luovutettu}}=Q_{\text{vastaanotettu}}`, ''],
  ['Ideaalikaasun tilanyhtälö', R`pV=nRT`, 'R = 8,314 J/(mol·K)'],
  ['Yleinen kaasun tilanyhtälö', R`\frac{p_1V_1}{T_1}=\frac{p_2V_2}{T_2}`, ''],
  ['Ainemäärä', R`n=\frac{m}{M}=\frac{N}{N_A}`, 'M moolimassa'],
  ['Pituuden lämpölaajeneminen', R`\Delta l=\alpha l_0\Delta T`, ''],
  ['Tilavuuden lämpölaajeneminen', R`\Delta V=\gamma V_0\Delta T`, ''],
  ['Lämmön johtuminen', R`P=\lambda A\frac{\Delta T}{d}`, 'λ lämmönjohtavuus, d paksuus'],
  ['Säteilyteho (Stefan–Boltzmann)', R`P=\varepsilon\sigma AT^4`, ''],
  ['Termodynamiikan I pääsääntö', R`\Delta U=Q+W`, 'W kaasuun tehty työ'],
  ['Lämpövoimakoneen hyötysuhde', R`\eta=\frac{W}{Q_1}\le1-\frac{T_2}{T_1}`, ''],
]);

aihe(F, 'Värähtely ja aallot', R`
<p>Aalto siirtää energiaa, ei ainetta. Poikittaisaallossa värähtely on kohtisuorassa etenemissuuntaa vastaan, pitkittäisaallossa (esim. ääni) etenemissuuntaan.</p>
<p>Taittumisessa aallon taajuus pysyy samana, mutta nopeus ja aallonpituus muuttuvat. <b>Interferenssi:</b> vahvistus, kun matkaero on \(n\lambda\), heikennys, kun \(\left(n+\frac12\right)\lambda\).</p>`, [
  ['Aaltoliikkeen perusyhtälö', R`v=f\lambda`, ''],
  ['Jaksonaika', R`T=\frac{1}{f}`, ''],
  ['Harmoninen värähtely', R`y=A\sin\left(\omega t\right)`, 'A amplitudi'],
  ['Jousivärähtelijä', R`T=2\pi\sqrt{\frac{m}{k}}`, ''],
  ['Matemaattinen heiluri', R`T=2\pi\sqrt{\frac{l}{g}}`, 'pienet heilahdukset'],
  ['Värähtelyn energia', R`E=\frac{1}{2}kA^2`, ''],
  ['Kieli tai kaksi avointa päätä', R`f_n=\frac{nv}{2l}`, 'n = 1, 2, 3, …'],
  ['Toisesta päästä suljettu putki', R`f_n=\frac{nv}{4l}`, 'n = 1, 3, 5, …'],
  ['Kielen aallon nopeus', R`v=\sqrt{\frac{F}{\mu}}`, 'μ pituusmassa (kg/m)'],
  ['Äänen intensiteetti', R`I=\frac{P}{4\pi r^2}`, 'pistemäinen lähde'],
  ['Äänitaso', R`L=10\,\text{dB}\cdot\lg\frac{I}{I_0}`, 'I₀ = 10⁻¹² W/m²'],
  ['Doppler (lähde liikkuu)', R`f=\frac{v}{v\mp v_l}f_0`, '− kun lähde tulee kohti'],
  ['Doppler (havaitsija liikkuu)', R`f=\frac{v\pm v_h}{v}f_0`, '+ kun havaitsija menee kohti'],
]);

aihe(F, 'Valo ja optiikka', R`
<p>Heijastuksessa tulokulma = heijastuskulma. Kulmat mitataan pinnan <b>normaalista</b>. Kokonaisheijastus tapahtuu, kun valo yrittää siirtyä optisesti harvempaan aineeseen rajakulmaa suuremmassa kulmassa.</p>
<p>Kuperalla linssillä f > 0, koveralla f < 0. Valekuvalle b < 0.</p>`, [
  ['Taitekerroin', R`n=\frac{c}{v}`, ''],
  ['Taittumislaki (Snell)', R`n_1\sin\alpha_1=n_2\sin\alpha_2`, ''],
  ['Kokonaisheijastuksen rajakulma', R`\sin\alpha_r=\frac{n_2}{n_1}`, 'n₁ > n₂'],
  ['Linssin kuvausyhtälö', R`\frac{1}{a}+\frac{1}{b}=\frac{1}{f}`, 'a esineen, b kuvan etäisyys'],
  ['Suurennus', R`m=\frac{h_k}{h_e}=-\frac{b}{a}`, ''],
  ['Taittokyky', R`D=\frac{1}{f}`, 'yksikkö dioptria = 1/m'],
  ['Hila', R`d\sin\theta=n\lambda`, 'd hilavakio, n kertaluku'],
  ['Kaksoisrako', R`\Delta y=\frac{\lambda L}{d}`, 'pienet kulmat'],
]);

aihe(F, 'Sähköstatiikka', R`
<p>Samanmerkkiset varaukset hylkivät, erimerkkiset vetävät toisiaan. Varaus säilyy aina. Sähkökentän suunta on positiiviseen varaukseen vaikuttavan voiman suunta.</p>`, [
  ['Coulombin laki', R`F=k\frac{\left|Q_1Q_2\right|}{r^2}`, 'k = 8,99·10⁹ Nm²/C²'],
  ['Sähkökentän voimakkuus', R`E=\frac{F}{q}`, ''],
  ['Pistevarauksen kenttä', R`E=k\frac{Q}{r^2}`, ''],
  ['Homogeeninen kenttä', R`E=\frac{U}{d}`, ''],
  ['Jännite', R`U=\frac{W}{q}`, ''],
  ['Varattu hiukkanen kentässä', R`qU=\frac{1}{2}mv^2`, 'levosta kiihdytys'],
  ['Kondensaattorin kapasitanssi', R`C=\frac{Q}{U}`, ''],
  ['Levykondensaattori', R`C=\varepsilon_r\varepsilon_0\frac{A}{d}`, ''],
  ['Kondensaattorin energia', R`E=\frac{1}{2}CU^2`, ''],
]);

aihe(F, 'Tasavirtapiirit', R`
<p>Sarjaankytkennässä virta on sama kaikissa komponenteissa ja jännitteet summautuvat. Rinnankytkennässä jännite on sama ja virrat summautuvat.</p>
<p><b>Kirchhoffin lait:</b> liitoskohtaan tulevien ja siitä lähtevien virtojen summat ovat yhtä suuret. Suljetun silmukan jännitteiden summa on nolla.</p>`, [
  ['Sähkövirta', R`I=\frac{Q}{t}`, ''],
  ['Ohmin laki', R`U=RI`, ''],
  ['Resistiivisyys', R`R=\rho\frac{l}{A}`, ''],
  ['Sarjaankytkentä', R`R=R_1+R_2+\ldots`, ''],
  ['Rinnankytkentä', R`\frac{1}{R}=\frac{1}{R_1}+\frac{1}{R_2}+\ldots`, ''],
  ['Sähköteho', R`P=UI=RI^2=\frac{U^2}{R}`, ''],
  ['Sähköenergia', R`E=Pt=UIt`, '1 kWh = 3,6 MJ'],
  ['Napajännite', R`U=E-R_sI`, 'E lähdejännite, Rₛ sisäinen resistanssi'],
  ['Kondensaattorit sarjassa', R`\frac{1}{C}=\frac{1}{C_1}+\frac{1}{C_2}`, ''],
  ['Kondensaattorit rinnan', R`C=C_1+C_2`, ''],
  ['RC-piirin aikavakio', R`\tau=RC`, ''],
]);

aihe(F, 'Magnetismi', R`
<p>Sähkövirta synnyttää magneettikentän. Magneettikenttä vaikuttaa liikkuvaan varaukseen ja virtajohtimeen voimalla, joka on kohtisuorassa sekä nopeutta että kenttää vastaan (oikean käden sääntö).</p>`, [
  ['Voima varattuun hiukkaseen', R`F=qvB\sin\alpha`, ''],
  ['Voima virtajohtimeen', R`F=IlB\sin\alpha`, ''],
  ['Hiukkasen ympyrärata', R`r=\frac{mv}{qB}`, ''],
  ['Suoran johtimen kenttä', R`B=\frac{\mu_0I}{2\pi r}`, ''],
  ['Pitkän käämin kenttä', R`B=\mu_0\frac{NI}{l}`, ''],
  ['Magneettivuo', R`\Phi=BA\cos\alpha`, 'α kentän ja pinnan normaalin välinen kulma'],
]);

aihe(F, 'Induktio ja vaihtovirta', R`
<p>Muuttuva magneettivuo indusoi jännitteen. <b>Lenzin laki:</b> induktiovirran suunta on sellainen, että se vastustaa vuon muutosta.</p>
<p>Verkkovirran jännitteen tehollisarvo on 230 V ja taajuus 50 Hz.</p>`, [
  ['Induktiolaki', R`e=-N\frac{\Delta\Phi}{\Delta t}`, ''],
  ['Liikkuva sauva', R`e=vBl`, ''],
  ['Pyörivä käämi', R`e=NBA\omega\sin\left(\omega t\right)`, ''],
  ['Itseinduktio', R`e=-L\frac{\Delta I}{\Delta t}`, 'L induktanssi'],
  ['Kelan energia', R`E=\frac{1}{2}LI^2`, ''],
  ['Tehollisarvot', R`U=\frac{\hat{U}}{\sqrt2},\quad I=\frac{\hat{I}}{\sqrt2}`, 'Û huippuarvo'],
  ['Muuntaja', R`\frac{U_1}{U_2}=\frac{N_1}{N_2}`, ''],
  ['Värähtelypiiri', R`f=\frac{1}{2\pi\sqrt{LC}}`, ''],
]);

aihe(F, 'Moderni fysiikka', R`
<p>Valo on sekä aaltoa että hiukkasia (fotoneja). Fotonin energia riippuu vain taajuudesta. Myös hiukkasilla on aaltoluonne (de Broglie).</p>
<p>Atomin elektroni voi olla vain tietyillä energiatasoilla; siirtyessään alemmalle tasolle atomi lähettää fotonin.</p>`, [
  ['Fotonin energia', R`E=hf=\frac{hc}{\lambda}`, ''],
  ['Valosähköinen ilmiö', R`hf=W_0+E_{k,\max}`, 'W₀ irrotustyö'],
  ['Fotonin liikemäärä', R`p=\frac{h}{\lambda}`, ''],
  ['de Broglien aallonpituus', R`\lambda=\frac{h}{p}=\frac{h}{mv}`, ''],
  ['Energiatasot', R`\Delta E=E_2-E_1=hf`, ''],
  ['Vetyatomin energiatasot', R`E_n=-\frac{13{,}6\ \text{eV}}{n^2}`, ''],
  ['Wienin siirtymälaki', R`\lambda_{\max}T=b`, 'b = 2,898·10⁻³ m·K'],
  ['Massa ja energia', R`E=mc^2`, ''],
  ['Epätarkkuusperiaate', R`\Delta x\Delta p\ge\frac{h}{4\pi}`, ''],
  ['Suhteellisuusteoria: aika', R`\Delta t=\frac{\Delta t_0}{\sqrt{1-\frac{v^2}{c^2}}}`, ''],
]);

aihe(F, 'Ydinfysiikka ja säteily', R`
<p>Radioaktiivisessa hajoamisessa ydin muuttuu toiseksi ja lähettää säteilyä (α, β, γ). Ydinreaktioissa nukleoniluku ja varausluku säilyvät.</p>
<p><b>Massavaje</b> on ytimen osasten yhteenlasketun massan ja ytimen massan erotus; se vastaa sidosenergiaa.</p>`, [
  ['Hajoamislaki', R`N=N_0e^{-\lambda t}=N_0\left(\frac{1}{2}\right)^{\frac{t}{T_{1/2}}}`, ''],
  ['Hajoamisvakio', R`\lambda=\frac{\ln2}{T_{1/2}}`, ''],
  ['Aktiivisuus', R`A=\lambda N`, 'yksikkö Bq = 1/s'],
  ['Massavaje', R`\Delta m=Zm_p+\left(A-Z\right)m_n-m_{\text{ydin}}`, ''],
  ['Sidosenergia', R`E_B=\Delta mc^2`, '1 u vastaa 931,5 MeV'],
  ['Reaktioenergia', R`Q=\left(m_{\text{alku}}-m_{\text{loppu}}\right)c^2`, ''],
  ['Absorboitunut annos', R`D=\frac{E}{m}`, 'yksikkö Gy = J/kg'],
  ['Säteilyn vaimeneminen', R`I=I_0e^{-\mu x}`, 'μ vaimennuskerroin'],
]);
}
