// Piirretty auto tiellä. Liike lasketaan joka ruudulla, joten nopeuden muutos on sujuva:
// tie ja renkaat kulkevat samaa vauhtia, kori joustaa ja nojaa taakse kiihdyttäessä.
// Värit tulevat CSS-muuttujista --car-ink, --car-fill, --car-glass.
const Car = (() => {
  const W = [38, 118]; // renkaiden paikat (takana, edessä)
  const wheel = x => `<g class="wheel"><circle cx="${x}" cy="46" r="11"/><circle cx="${x}" cy="46" r="3.5" fill="var(--car-ink)" stroke="none"/><path d="M${x} 37v5M${x} 50v5M${x - 9} 46h5M${x + 4} 46h5"/></g>`;
  const SVG = `<svg class="car" viewBox="0 0 160 62" fill="var(--car-fill)" stroke="var(--car-ink)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" overflow="visible">
    <defs><linearGradient id="carBeam" x1="0" x2="1"><stop offset="0" stop-color="#ffe680" stop-opacity=".55"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></linearGradient></defs>
    <g class="speedlines" stroke-width="1.6"><path d="M-6 22h-16M-4 32h-24M-6 42h-14"/></g>
    <g class="body">
      <path d="M8 44V33q1-7 12-8l26-2q12-13 32-13h24q13 1 23 13l20 3q7 2 7 9v10z"/>
      <path d="M52 23q9-9 24-9h8v9zM90 14h11q9 1 16 9H90z" fill="var(--car-glass)"/>
      <path class="beam" d="M151.5 30.5L218 21v26L151.5 33.5z" fill="url(#carBeam)" stroke="none"/>
      <path d="M140.5 28.2l6.4.9q4.2 1 4.7 4.6h-7.8q-3.1-1.3-3.3-5.5z" fill="#fff4bf" stroke-width="1.6"/>
      <path d="M9 30.6h3.6v5.2H9z" fill="#e8705f" stroke-width="1.4"/>
    </g>
    ${W.map(wheel).join('')}
  </svg>`;
  const DASH = 36;          // tien viivan jakso pikseleinä
  const PX_PER_M = 6;       // kuinka monta pikseliä tie liikkuu metriä kohden

  function mount(road) {
    road.insertAdjacentHTML('beforeend', SVG);
    const car = road.querySelector('.car'), body = car.querySelector('.body');
    const wheels = [...car.querySelectorAll('.wheel')], lines = car.querySelector('.speedlines');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let target = 72, cur = 72, size = 1, sizeCur = 1, off = 0, ang = 0, t = 0, last = 0, visible = true, running = false;
    let carW = car.getBoundingClientRect().width || 200;
    new ResizeObserver(() => { carW = car.getBoundingClientRect().width / sizeCur || carW; }).observe(road);

    function draw(dt) {
      const prev = cur;
      cur += (target - cur) * Math.min(1, dt * 2.5);            // nopeus muuttuu pehmeästi
      sizeCur += (size - sizeCur) * Math.min(1, dt * 6);
      const acc = dt ? (cur - prev) / dt : 0;                   // km/h sekunnissa
      const px = cur / 3.6 * PX_PER_M * dt;                     // tien siirtymä tällä ruudulla
      off = (off - px) % DASH;
      road.style.backgroundPosition = off.toFixed(2) + 'px 100%';
      const rPx = 11 * carW * sizeCur / 160;                   // renkaan säde pikseleinä
      ang = (ang + px / rPx * 57.2958) % 360;                   // rengas pyörii täsmälleen tien tahtiin
      wheels.forEach((w, i) => w.setAttribute('transform', `rotate(${ang.toFixed(1)} ${W[i]} 46)`));
      t += dt;
      const bounce = Math.sin(t * (9 + cur / 12)) * 0.55 * Math.min(1, cur / 120);
      const lean = Math.max(-3, Math.min(3, -acc * 0.025));
      body.setAttribute('transform', `translate(0 ${bounce.toFixed(2)}) rotate(${lean.toFixed(2)} 80 44)`);
      lines.style.opacity = Math.max(0, Math.min(1, (cur - 40) / 60));
      car.style.transform = `scale(${sizeCur.toFixed(3)})`;
    }
    function frame(now) {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      draw(dt);
      if (visible) requestAnimationFrame(frame); else { running = false; last = 0; }
    }
    const start = () => { if (!running && !still) { running = true; requestAnimationFrame(frame); } };
    // liike pysähtyy, kun auto ei näy (säästää akkua)
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(road);
    if (still) draw(0); else start();
    return {
      set(V, M) {
        target = V; size = 0.82 + (M - 600) / 2000 * 0.4;
        if (still) { cur = target; sizeCur = size; draw(0); }
      },
    };
  }
  return {mount};
})();
