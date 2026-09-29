// The chart in the corner: the whole sea, turned to match the view, with the
// coast, the wharf, the whaling grounds, any whales in sight, and the ship.
import { shoreX, EDGE, BERTH, GROUNDS } from './world.js';

// Once the kind of whale is made out, she gets her colour on the chart.
const KINDS = { right: '#0b1a24', bowhead: '#6d8fb0', sperm: '#c79a5b', humpback: '#7d9a73', finback: '#b9b9b9' };

export function makeMinimap(canvas) {
  const ctx = canvas.getContext('2d'), S = canvas.width, k = (S / 2) / EDGE;
  const land = new Path2D();
  land.moveTo(EDGE * 2, -EDGE * 1.5);
  for (let z = -EDGE * 1.5; z <= EDGE * 1.5; z += 8) land.lineTo(shoreX(z), z);
  land.lineTo(EDGE * 2, EDGE * 1.5);
  land.closePath();

  return {
    draw(helm, whales, edge) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, S, S);
      ctx.save();
      ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 3, 0, 7); ctx.clip();
      ctx.fillStyle = '#17556f'; ctx.fillRect(0, 0, S, S);
      ctx.translate(S / 2, S / 2);
      ctx.rotate(-Math.PI / 4);                 // east to the upper right, as on screen
      ctx.scale(k, k);

      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.fillRect(GROUNDS.x0, -EDGE + 40, GROUNDS.x1 - GROUNDS.x0, EDGE * 2 - 80);
      ctx.fillStyle = '#dfe6ea'; ctx.fill(land);
      if (edge > -EDGE * 1.5) { ctx.fillStyle = 'rgba(236,244,248,0.92)'; ctx.fillRect(-EDGE * 2, -EDGE * 2, EDGE * 4, edge + EDGE * 2); }
      ctx.fillStyle = '#e8a33c';
      ctx.beginPath(); ctx.arc(BERTH.x + 12, BERTH.z, 11, 0, 7); ctx.fill();

      for (const w of whales.list) {
        const p = w.group.position;
        if (w.state === 'dead' && !w.sinks && !w.cast) {        // a carcass afloat
          ctx.fillStyle = '#b5552f'; ctx.fillRect(p.x - 7, p.z - 7, 14, 14); continue;
        }
        if (!w.sighted || w.state === 'dead' || Math.hypot(p.x - helm.pos.x, p.z - helm.pos.z) > 140) continue;
        ctx.fillStyle = w.known ? KINDS[w.kind] : '#0b1a24'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.z, 8, 0, 7); ctx.fill(); ctx.stroke();
      }
      if (helm.target) {
        ctx.strokeStyle = '#ffe2a0'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(helm.target.x, helm.target.z, 7, 0, 7); ctx.stroke();
      }
      ctx.save();
      ctx.translate(helm.pos.x, helm.pos.z); ctx.rotate(helm.heading);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-18, 17); ctx.lineTo(-18, -17); ctx.fill();
      ctx.restore();
      ctx.restore();

      ctx.strokeStyle = 'rgba(214,178,110,0.85)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 3, 0, 7); ctx.stroke();
      ctx.fillStyle = '#f3ead6'; ctx.font = `${Math.round(S / 14)}px Georgia`; ctx.textAlign = 'center';
      ctx.fillText('N', S / 2 - S * 0.33, S / 2 - S * 0.31);
    },
  };
}
