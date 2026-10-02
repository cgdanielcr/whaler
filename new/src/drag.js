// Drag and drop: pick a man up (from the crew bar, or off the deck) and put
// him down on a station's badge, a station's row in the roster, or a seat in a
// boat. Whatever he is held over says how well he would do there. A press
// that does not move is a click, and chooses him instead.
import { portrait } from './portrait.js';

const TARGETS = '[data-station],[data-slot],[data-seat],[data-trouble]';

export function makeDrag({ company, preview, drop, choose }) {
  const ghost = document.getElementById('ghost');
  let held = null, start = null, moved = false, over = null;

  function begin(id, e) {
    held = id; start = { x: e.clientX, y: e.clientY }; moved = false;
    addEventListener('pointermove', move);
    addEventListener('pointerup', up, { once: true });
  }

  function move(e) {
    if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
    if (!moved) { moved = true; ghost.innerHTML = `<img src="${portrait(company.byId(held))}" alt="">`; ghost.hidden = false; document.body.classList.add('dragging'); }
    ghost.style.left = `${e.clientX}px`; ghost.style.top = `${e.clientY}px`;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(TARGETS) || null;
    if (el === over) return;
    if (over) { over.classList.remove('over'); over.removeAttribute('data-say'); }
    over = el;
    if (over) { over.classList.add('over'); over.setAttribute('data-say', preview(held, target(over))); }
  }

  function up() {
    removeEventListener('pointermove', move);
    if (moved) { if (over) drop(held, target(over)); } else choose(held);
    if (over) { over.classList.remove('over'); over.removeAttribute('data-say'); }
    ghost.hidden = true; document.body.classList.remove('dragging');
    held = null; over = null;
  }

  // What a drop target stands for: a station, one place at a station, or a seat in a boat.
  function target(el) {
    if (el.dataset.trouble) return { trouble: el.dataset.trouble };
    if (el.dataset.station) return { station: el.dataset.station };
    if (el.dataset.slot) return { slot: el.dataset.slot };
    const [b, s] = el.dataset.seat.split(':').map(Number);
    return { seat: [b, s] };
  }

  return { begin, get busy() { return held != null; } };
}
