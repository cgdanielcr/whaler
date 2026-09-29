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
const whales = makeWhales(scene);
const boats = makeBoats(scene);
const wake = makeWake(scene);
const gulls = makeGulls(scene);
const minimap = makeMinimap(document.getElementById('minimap'));
const voyage = makeVoyage({ helm, whales, boats, ship });

// A ring on the water where she has been sent.
const marker = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.7, 24).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.85, depthWrite: false }));
marker.renderOrder = 1;
scene.add(marker);

// A click (not a drag) on the sea sets her course.
let down = null;
view.canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
view.canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
  down = null;
  const p = view.pick(e.clientX, e.clientY);
  if (p) voyage.click(p.x, p.z);
});
addEventListener('wheel', (e) => view.zoom(e.deltaY), { passive: true });
addEventListener('resize', view.resize);

const focus = new THREE.Vector3();
let last = null, t = 0, slow = 1;
view.renderer.setAnimationLoop((ms) => {
  frame(last === null ? 0 : Math.min((ms - last) / 1000, 0.05));
  last = ms;
});

function frame(dt) {
  t += dt;

  helm.update(dt, t);
  whales.update(dt, t, helm.pos);
  boats.update(dt, t, voyage.v.quarry, helm.pos);
  voyage.tick(dt);
  ice.update(t);
  water.update(t);
  wake.update(dt, helm.pos, helm.heading, helm.speed);
  gulls.update(dt, t, helm.pos);

  marker.visible = !!helm.target;
  if (helm.target) {
    marker.position.set(helm.target.x, 0.6, helm.target.z);
    marker.scale.setScalar(1 + 0.15 * Math.sin(t * 4));
  }

  // Keep the ship in the middle; during a chase, look between her and the whale.
  focus.set(helm.pos.x, 0, helm.pos.z);
  if (voyage.v.quarry) focus.lerp(voyage.v.quarry.group.position, 0.4).setY(0);
  view.follow(focus, dt);

  if ((slow += dt) > 0.15) { slow = 0; voyage.draw(); minimap.draw(helm, whales); }
  view.render();
}

// For testing from the browser console: whaler.frame(0.05) steps the world.
window.whaler = { frame, voyage, helm, whales };
