// Where the men are, and how they get there.
//
// Every hand aboard has a place. When nothing is doing he keeps his part of
// the deck; when an order is given he goes to his post, which may be the
// wheel, or a rope on deck, or out along a yard eighty feet up. He walks
// there at a man's pace. Nothing is animated: he simply is somewhere, and
// then he is somewhere else.
import * as THREE from 'three';
import { deckAt } from './hull.js';
import { makeFigure } from './figures.js';

const WALK = 2.2;        // metres a second of your own time, going aloft or aft
const V = new THREE.Vector3();

// Where a man idles when nothing is doing, by his station on the watch bill.
const HAUNTS = {
  'the deck':  [[2.4, -11.5], [-2.4, -12.5], [0.0, -13.8]],
  topman:      [[3.0, 8.0], [-3.0, 9.0], [2.6, 11.0], [-2.4, 6.5], [3.2, 4.0], [-3.4, 3.0]],
  afterguard:  [[2.8, -6.0], [-2.8, -6.8], [3.2, -3.0], [-3.2, -3.6], [2.2, -9.0], [-2.2, -9.4]],
  waister:     [[2.6, 1.0], [-2.6, 0.4], [3.2, -1.0], [-3.2, -1.6], [1.6, 2.6], [-1.6, 2.0], [0.0, 4.4]],
  'day work':  [[0.0, 6.6], [2.2, 6.0], [-2.2, 5.4], [1.4, -0.6], [-1.4, -1.2]]
};

export function makeHands(company, crew, rig, ship, camera, dom) {
  const group = new THREE.Group();
  ship.add(group);

  const figures = new Map();
  for (const man of company.all) {
    const f = makeFigure(man);
    const [x, z] = spotIn(man.station, man.id);
    f.position.set(x, deckAt(z) + 0.05, z);
    group.add(f);
    figures.set(man, f);
  }

  function spotIn(station, i) {
    const list = HAUNTS[station] || HAUNTS.waister;
    return list[i % list.length];
  }

  // Yards of a tier, taken in her own frame so that bracing and reefing carry
  // the men round and up and down with them.
  function alongYards(tier, i, n) {
    const sails = rig.sails.filter((s) => s.tier === tier && s.yard);
    if (!sails.length) return null;
    const per = Math.max(1, Math.ceil(n / sails.length));
    const sail = sails[Math.min(sails.length - 1, Math.floor(i / per))];
    const k = i % per;
    const half = sail.headHalf || 6;
    // Spread them out along the yard from the slings to the yardarm.
    const along = per === 1 ? 0 : (k / (per - 1) - 0.5) * 1.7 * half;
    sail.yard.getWorldPosition(V);
    ship.worldToLocal(V);
    return [V.x + along * Math.cos(sail.yard.parent.rotation.y || 0),
            V.y + 0.55,
            V.z - along * Math.sin(sail.yard.parent.rotation.y || 0)];
  }

  // A post named in stations.js, turned into a place on the ship.
  function placeOf(at, i, n) {
    const s = at.toLowerCase();
    if (s.includes('royal yard')) return alongYards('royal', i, n);
    if (s.includes('topgallant yard')) return alongYards('topgallant', i, n);
    if (s.includes('topsail yard')) return alongYards('topsail', i, n);
    if (s.includes('course yard')) return alongYards('course', i, n);
    if (s === 'the yard') return alongYards('topsail', i, n);
    if (s.includes('topmast head')) {
      const m = rig.sails.find((x) => x.mast === 'main' && x.tier === 'topgallant');
      if (m && m.yard) { m.yard.getWorldPosition(V); ship.worldToLocal(V); return [V.x, V.y + 0.6, V.z]; }
    }
    if (s.includes('jibboom')) return [(i % 2 ? 0.5 : -0.5), 5.4 + i * 0.3, 19 + i * 1.6];

    // Everything else is deck work. Put them where the rope is.
    const spread = (n0) => (n0 <= 1 ? 0 : ((i % n0) / (n0 - 1) - 0.5));
    if (s.includes('wheel')) return onDeck(0, -13.2);
    if (s.includes('head sheet') || s.includes('downhaul') || s.includes('bowline'))
      return onDeck(spread(4) * 4, 13.5 + (i % 2) * 1.4);
    if (s.includes('fore brace')) return onDeck(spread(4) * 5.4, 5.4);
    if (s.includes('after brace') || s.includes('spanker') || s.includes('boom') ||
        s.includes('peak and throat') || s.includes('brail') || s.includes('outhaul'))
      return onDeck(spread(5) * 4.6, -9.0 - (i % 2) * 1.6);
    if (s.includes('brace')) return onDeck(spread(6) * 6.0, -2.0 + (i % 2) * 1.8);
    if (s.includes('top rope') || s.includes('whip') || s.includes('spar'))
      return onDeck(spread(6) * 4.0, 0.6);
    if (s.includes('tack')) return onDeck(spread(4) * 6.4, 8.0);
    return onDeck(spread(6) * 5.0, 2.0 + (i % 3) * 1.8);   // halyards, sheets, buntlines
  }

  const onDeck = (x, z) => [x, deckAt(z) + 0.05, z];

  // Every man's place this instant: his post if he has one, else his haunt.
  function whereEveryoneShouldBe() {
    const want = new Map();
    for (const order of crew.running) {
      for (const post of order.posted || []) {
        post.men.forEach((m, i) => {
          const p = placeOf(post.at, i, post.men.length);
          if (p) want.set(m, p);
        });
      }
    }
    for (const man of company.all) {
      if (want.has(man)) continue;
      const [x, z] = spotIn(man.station, man.id);
      want.set(man, onDeck(x, z));
    }
    return want;
  }

  // --- hovering a man ---------------------------------------------------------

  const card = document.createElement('div');
  card.id = 'man';
  card.style.display = 'none';
  document.body.appendChild(card);

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let at = null;

  dom.addEventListener('mousemove', (e) => {
    const box = dom.getBoundingClientRect();
    pointer.x = ((e.clientX - box.left) / box.width) * 2 - 1;
    pointer.y = -((e.clientY - box.top) / box.height) * 2 + 1;
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects([...figures.values()], false)[0];
    const man = hit && hit.object.userData.man;
    if (man === at) { if (man) place(e); return; }
    at = man || null;
    if (!at) { card.style.display = 'none'; return; }

    const doing = at.employed || at.job || (at.idler ? `at ${at.idler}` : null);
    card.innerHTML = `<h4>${at.name}</h4>` +
      `<p>${at.berth}, rated ${at.rate}<br>` +
      `${at.watch ? `${at.watch} watch` : 'no watch'} &mdash; ${at.strength}` +
      `${at.health === 'sound' ? '' : ` &mdash; <em>${at.health}</em>`}` +
      `${doing ? `<br>${doing}` : ''}</p>`;
    card.style.display = '';
    place(e);
  });

  const place = (e) => {
    card.style.left = `${Math.min(window.innerWidth - 230, e.clientX + 16)}px`;
    card.style.top = `${Math.max(8, e.clientY - 20)}px`;
  };

  dom.addEventListener('mouseleave', () => { at = null; card.style.display = 'none'; });

  // --- the frame --------------------------------------------------------------

  return function tick(seen) {
    const want = whereEveryoneShouldBe();
    const step = WALK * seen;
    for (const [man, f] of figures) {
      // A man who is hurt keeps out of the way; a man who is gone is gone.
      f.visible = man.health !== 'lost';
      const to = want.get(man);
      if (!to) continue;
      V.set(to[0], to[1], to[2]);
      const gap = V.distanceTo(f.position);
      // Going aloft is climbing, not walking, so it is no faster; but a man
      // who is a long way from his post is not made to crawl there.
      if (gap < 0.02) continue;
      f.position.lerp(V, Math.min(1, (gap > 24 ? step * 4 : step) / gap));
    }
  };
}
