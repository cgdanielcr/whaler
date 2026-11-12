// Puts the world together and runs it: builds everything, listens for the
// mouse, and moves the whole scene on every frame.
import * as THREE from 'three';
import { makeView } from './view.js';
import { makeWater } from './water.js';
import { makeLand } from './land.js';
import { makePort } from './port.js';
import { makeIce } from './ice.js';
import { makeShip } from './ship.js';
import { makeHelm } from './helm.js';
import { makeWhales } from './whales.js';
import { makeBoats } from './boats.js';
import { makeWake } from './wake.js';
import { makeGulls } from './gulls.js';
import { makeMinimap } from './minimap.js';
import { makeVoyage } from './voyage.js';
import { BERTH } from './world.js';
import { makePack } from './pack.js';
import { iceEdge } from './season.js';
import { makeShipView } from './shipview.js';
import { makeCompany } from './company.js';
import { makeBoatCrews } from './boatcrews.js';
import { makeCrisis } from './crisis.js';
import { makeCareer } from './owners.js';
import { makeQuarterdeck } from './quarterdeck.js';
import { makeWeather } from './weather.js';
import { makeMate } from './mate.js';
import { showTitle } from './title.js';
import { makePointer } from './pointer.js';
import { sound } from './sound.js';

const START = new Date(1841, 4, 1);

const view = makeView();
const { scene } = view;
const water = makeWater(scene);
makeLand(scene);
makePort(scene);
const ice = makeIce(scene);
const ship = makeShip();
const helm = makeHelm(ship, ice);
helm.pos.set(BERTH.x, 0, BERTH.z);
scene.add(helm.object);
const whales = makeWhales(scene, iceEdge(START));
const pack = makePack(scene);
const boats = makeBoats(scene);
const wake = makeWake(scene);
const gulls = makeGulls(scene);
const minimap = makeMinimap(document.getElementById('minimap'));
const company = makeCompany();
const crews = makeBoatCrews(company);
const career = makeCareer();
const remember = (date) => career.save({ men: company.men, slots: company.slots, seats: crews.seats, date: date.getTime() });
const voyage = makeVoyage({ scene, helm, whales, boats, ship, start: START, company, crews, career, remember });
const crisis = makeCrisis({ voyage, company, career, helm });
const shipView = makeShipView({ view, voyage, company, crews, ship, helm, crisis });
const quarter = makeQuarterdeck({ sailing: voyage.sail, onHold: () => voyage.hold() });
const weather = makeWeather(view, voyage);
const mate = makeMate({ voyage, career, crisis, helm });
mate.watch(whales);
const pointer = makePointer({ view, helm, whales });

let begun = false;
showTitle(career, (continuing) => {
  const saved = continuing && career.load();
  if (saved) { company.restore(saved.men, saved.slots); crews.restore(saved.seats); }
  else career.forget();
  begun = true;
  voyage.begin(saved ? saved.date : null);
});

// For testing: ?crisis=gale (or squall, fire, overboard, beset) fits her out, casts off and brings it on at once.
const test = new URLSearchParams(location.search).get('crisis');
if (test) {
  document.getElementById('titleGo').click();
  document.querySelector('#choices button')?.click();
  helm.pos.set(-100, 0, 0); voyage.v.phase = 'sea'; helm.set = true;
  if (test === 'gale') Object.assign(voyage.season, { gale: true, galeDays: 2, wind: 'strong gale' });
  crisis.start(test, test === 'overboard' ? company.alive().find((m) => m.watch) : null);
}

// A ring on the water where she has been sent.
const marker = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.7, 24).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.85, depthWrite: false }));
marker.renderOrder = 1;
scene.add(marker);

// A click (not a drag) on the sea sets her course.
let down = null;
view.canvas.addEventListener('pointerdown', (e) => {
  if (shipView.open && shipView.press(e)) { down = null; return; }    // a man on deck is picked up
  down = { x: e.clientX, y: e.clientY };
});
view.canvas.addEventListener('pointerup', (e) => {
  if (!begun || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
  down = null;
  if (shipView.open) return shipView.click(e.clientX, e.clientY);
  if (shipView.busy) return;
  const p = view.pick(e.clientX, e.clientY);
  if (!p) return;
  if (Math.hypot(p.x - helm.pos.x, p.z - helm.pos.z) < 5) shipView.show();   // a click on the ship opens her up
  else voyage.click(p.x, p.z);
});
addEventListener('wheel', (e) => { if (!shipView.busy) view.zoom(e.deltaY); }, { passive: true });
addEventListener('resize', view.resize);
addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || crisis.now || shipView.open || !document.getElementById('modal').hidden) return;
  e.preventDefault(); voyage.hold();
});

const focus = new THREE.Vector3();
let last = null, t = 0, slow = 1, swell = 1, waves = 0;
view.renderer.setAnimationLoop((ms) => {
  frame(last === null ? 0 : Math.min((ms - last) / 1000, 0.05));
  last = ms;
});

function frame(real) {
  const v = voyage.v;
  const dt = v.paused || v.held ? 0 : shipView.busy ? real * shipView.slow : real;   // the world holds still for a decision, or while you look over the ship
  t += dt;

  helm.update(dt, t);
  whales.update(dt, t, helm, voyage.season.edge);
  pack.update(voyage.season.edge);
  boats.update(dt, t, voyage.quarry, helm.pos);
  voyage.tick(dt);
  crisis.tick(real);
  const wind = helm.wind, blow = voyage.atSea() ? wind.drive : 0.5;
  swell += ((voyage.season.gale ? 2.4 : 0.6 + 0.6 * blow) - swell) * Math.min(1, real * 0.3);
  waves += real;                                    // the sea keeps running, even while the world stands still
  water.update(waves, swell, wind.from, blow);
  weather.update(real, waves, wind.from, blow, focus);
  wake.update(dt, helm.pos, helm.heading, helm.speed);
  gulls.update(dt, t, helm.pos);
  sound.weather(blow, helm.speed, shipView.busy);

  marker.visible = !!helm.target;
  if (helm.target) {
    marker.position.set(helm.target.x, 0.6, helm.target.z);
    marker.scale.setScalar(1 + 0.15 * Math.sin(waves * 4));
  }

  // Keep the ship in the middle; during a chase, look between her and the whale.
  focus.set(helm.pos.x, 0, helm.pos.z);
  if (voyage.quarry) focus.lerp(voyage.quarry.group.position, 0.4).setY(0);
  shipView.update(real);
  view.follow(shipView.look(focus), real);        // or close in on her decks, when she is opened up

  if ((slow += real) > 0.15) {
    slow = 0; voyage.draw(); minimap.draw(helm, whales, voyage.season.edge, wind.from);
    quarter.draw(begun && voyage.atSea() && !shipView.busy, v.held);
    mate.tick();
    pointer.draw(begun && voyage.v.phase === 'sea' && !shipView.busy);
  }
  view.render();
}

// For testing from the browser console: whaler.frame(0.05) steps the world.
window.whaler = { frame, voyage, helm, whales, view, scene, shipView, company, crews, crisis, career };
