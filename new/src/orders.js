// What the owner is offered and told: the buttons for what may be done next,
// the hint under the objective, and everything the panels show.
import { BERTH } from './world.js';
import { describe } from './species.js';
import { room, oil, daysHome, SHIPKEEPERS, PER_BOAT } from './stores.js';
import { hud } from './hud.js';

const REACH = 28;         // how near a whale must be to lower for her
const ALONGSIDE = 16;     // how near a floating carcass must be to take her alongside
const far = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);

// Which boats go down: the best-manned of those marked to lower, no more than
// two (one while trying out), and never so many the ship is left without keepers.
function boatsToLower({ v, crews, company }) {
  const most = Math.min(v.phase === 'trying' ? 1 : 2, Math.floor((company.count - SHIPKEEPERS) / PER_BOAT));
  return crews.ready().slice(0, Math.max(0, most));
}

export function offer(g) {
  const { v, helm, whales, trying, season, acts } = g;
  if (v.phase === 'port') return hud.action(v.fitted ? 'Set sail' : null, acts.setSail);
  if (v.phase !== 'sea' && v.phase !== 'trying') return hud.action(null);

  const ids = boatsToLower(g), n = ids.length;
  const w = !season.gale && n > 0 && room(v) >= 10 && whales.nearest(helm.pos, REACH);
  const lower = w ? [`Lower ${n === 1 ? 'a boat' : 'the boats'} for the ${describe(w)}`, () => acts.lower(w, ids)] : [null, null];
  if (v.phase === 'trying') return hud.action(...lower, 'Cast her off', acts.castOff);
  if (w) return hud.action(...lower);
  const c = trying.near(helm.pos, ALONGSIDE);
  if (c) return hud.action('Take her alongside', () => acts.alongside(c));
  if (far(helm.pos, BERTH) < 70 && v.days > 0) return hud.action('Make fast at the wharf', acts.dock);
  hud.action(null);
}

function hint(g) {
  const { v, helm, trying, season } = g;
  if (v.phase === 'port') return v.fitted ? 'Press Set sail, or click the sea.' : 'Choose how much provision to take.';
  if (v.phase === 'docking') return 'Standing in for the wharf. Click the sea to haul off.';
  if (v.phase === 'trying') return season.gale ? 'Too rough to work alongside. The tryworks wait on the weather.'
    : 'Cutting in and trying out. She lies still meanwhile; cast the carcass off to sail.';
  if (v.phase !== 'sea') return '';
  if (helm.slow === 0) return 'Beset in the ice. She cannot move until it opens, and it grinds at her hull.';
  if (trying.floating().some((c) => !c.alongside)) return 'A dead whale is adrift. Sail close and take her alongside before the sharks have her.';
  if (room(v) < 10) return 'The hold is full. Make for home: the wharf is the orange mark on the chart.';
  if (v.stores <= daysHome(helm.pos)) return 'There are not provisions enough for the passage home. Turn for home now.';
  if (season.gale) return 'No boat can be lowered in a gale.';
  if (!boatsToLower(g).length) return 'No boat is manned and marked to lower. Look to the boats in the ship view, or make for home.';
  return 'Bowheads keep along the edge of the ice, sperm whales to the south, right whales and humpbacks between. Click the sea to set a course.';
}

export function draw(g) {
  const { v, helm, trying, season, chase } = g;
  const full = room(v) < 10;
  hud.ship(v, { room: room(v), home: daysHome(helm.pos), atSea: v.phase !== 'port' && v.phase !== 'ended' });
  hud.where(v.phase === 'port' || v.phase === 'ended' ? 'At the wharf'
    : helm.slow === 0 ? 'Beset in the ice' : helm.slow < 1 ? 'In the pack ice' : helm.pos.x < -60 ? 'On the whaling grounds' : 'At sea',
    season.wind, season.gale);
  const goal = { port: v.fitted ? 'Set sail' : 'Fit out', sea: full ? 'Make for home' : 'Hunt whales', hunt: 'Take the whale',
    trying: 'Try out the whale', docking: 'Come alongside the wharf', ended: 'The voyage is made', lost: 'The ship is lost' }[v.phase];
  hud.objective(goal, [
    ['Fit out and set sail', v.phase !== 'port'],
    [`Fill the hold (${oil(v)} barrels of oil)`, full],
    ['Return to port', v.phase === 'ended'],
  ], hint(g));
  const w = trying.whale;
  if (v.phase === 'hunt') hud.chase(...chase.status);
  else if (w) hud.chase(`Trying out: ${w.tried} barrels stowed, about ${Math.round(w.left)} still in her`, w.tried / (w.tried + w.left));
  else hud.chase(null);
}
