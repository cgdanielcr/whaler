// The quarterdeck: the panel the ship is sailed from. A dial with her head
// uppermost shows where the wind is and the six points either side of it she
// cannot lie in; below it, the orders for her canvas, all hands, and holding
// the world still to think.
import { CLOSE } from './wind.js';
import { wearyWord } from './hands.js';

const $ = (id) => document.getElementById(id);

export function makeQuarterdeck({ sailing, onHold }) {
  const dial = $('dial'), ctx = dial.getContext('2d'), S = dial.width, R = S / 2 - 10;
  const btns = sailing.state.names.map((name, i) => {
    const b = document.createElement('button');
    b.className = 'lesser'; b.textContent = name; b.onclick = () => sailing.order(i);
    $('canvasBtns').append(b);
    return b;
  });
  $('allHands').onclick = () => sailing.allHands(!sailing.state.all);
  $('hold').onclick = onHold;

  function drawDial(st) {
    const rel = st.from - st.heading - Math.PI / 2;        // the wind's eye on the dial, her head uppermost
    ctx.clearRect(0, 0, S, S);
    ctx.save(); ctx.translate(S / 2, S / 2);
    ctx.fillStyle = 'rgba(8, 20, 30, 0.75)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.fillStyle = st.gale ? 'rgba(226, 103, 79, 0.42)' : 'rgba(226, 103, 79, 0.26)';        // where she cannot lie
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, rel - CLOSE, rel + CLOSE); ctx.fill();
    ctx.strokeStyle = 'rgba(214, 178, 110, 0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke();
    for (let i = 0; i < 32; i++) {                         // the thirty-two points
      const a = (i / 32) * Math.PI * 2 - st.heading - Math.PI / 2, long = i % 8 === 0 ? 10 : i % 4 === 0 ? 6 : 3;
      ctx.strokeStyle = 'rgba(236, 226, 204, 0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R); ctx.lineTo(Math.cos(a) * (R - long), Math.sin(a) * (R - long)); ctx.stroke();
    }
    const n = -Math.PI / 2 - st.heading - Math.PI / 2;     // north on the rim
    ctx.fillStyle = '#e0b252'; ctx.font = `${S * 0.085}px Georgia`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', Math.cos(n) * (R - 20), Math.sin(n) * (R - 20));
    // Her hull, head up.
    ctx.fillStyle = '#ece2cc'; ctx.beginPath();
    ctx.moveTo(0, -R * 0.42); ctx.quadraticCurveTo(R * 0.17, -R * 0.2, R * 0.13, R * 0.34); ctx.lineTo(-R * 0.13, R * 0.34);
    ctx.quadraticCurveTo(-R * 0.17, -R * 0.2, 0, -R * 0.42); ctx.fill();
    // The wind, blowing in from the rim.
    ctx.rotate(rel);
    ctx.strokeStyle = ctx.fillStyle = st.gale ? '#ff9c84' : '#9fd8ea'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(R - 4, 0); ctx.lineTo(R * 0.56, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(R * 0.46, 0); ctx.lineTo(R * 0.62, -8); ctx.lineTo(R * 0.62, 8); ctx.fill();
    ctx.restore();
  }

  return {
    draw(show, held) {
      $('quarter').hidden = !show;
      $('heldMark').hidden = !held;
      if (!show) return;
      const st = sailing.state;
      drawDial(st);
      $('windSays').textContent = st.says;
      $('windSays').className = st.gale ? 'gale' : '';
      $('pointSays').textContent = `${st.point}${st.knots > 0.4 ? ` · ${st.knots.toFixed(1)} knots` : ''}`;
      btns.forEach((b, i) => {
        b.classList.toggle('on', i === st.plan);
        b.classList.toggle('over', i < st.bear);
        b.title = i < st.bear ? `More than a ${st.wind} will bear` : '';
      });
      $('jobLine').hidden = !st.job;
      if (st.job) { $('jobText').textContent = st.job.label; $('jobB').style.width = `${st.job.k * 100}%`; }
      $('lostLine').hidden = !st.lost;
      $('lostLine').textContent = st.lost === 1 ? 'A topsail is lost: she is slower until a new one is bent.' : `${st.lost} topsails are lost: she is slower until new ones are bent.`;
      $('allHands').textContent = st.all ? 'Send the watch below' : 'Call all hands';
      $('allHands').classList.toggle('on', st.all);
      $('wearyLine').textContent = `The hands: ${wearyWord(st.weary).toLowerCase()}${st.all ? ' · all hands on deck' : ''}`;
      $('hold').textContent = held ? 'Let her run (Space)' : 'Hold (Space)';
    },
  };
}
