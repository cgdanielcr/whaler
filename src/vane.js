// The pennant at the main truck, and what it is for.
//
// A ship carried a long narrow pennant -- a coach-whip -- at the main
// masthead, and the officer of the watch read the wind off it a hundred times
// a day. It streams away from where the wind comes from, so it points where
// the wind is going. That is the one instrument aboard that tells you the wind
// without your having to think about it, and it is the reason a man on deck
// always knows which way it blows.
//
// She also gets a windsock's worth of ripple, because a pennant that hangs
// dead still reads as a stick.
import * as THREE from 'three';
import { wrap } from './wind.js';
import { deckAt } from './hull.js';

const LENGTH = 9.5;        // metres of bunting
const SEGMENTS = 10;
const TRUCK = 33.0;        // the main truck above her deck, from rig.js
const Z = -0.6;            // where the mainmast is stepped, from rig.js

export function makeVane() {
  const group = new THREE.Group();
  // The mast is stepped on the deck, so the truck stands that much higher
  // again than the figure in the rig.
  group.position.set(0, deckAt(Z) + TRUCK + 1.2, Z);

  // A long triangle tapering to nothing, streaming along +z, with its cloth
  // hanging in the vertical -- which is how bunting hangs, and also the only
  // way it is visible from a deck. A flag lying flat is a hairline.
  const positions = [], indices = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const v = i / SEGMENTS;
    const half = 0.75 * (1 - v) + 0.04;
    positions.push(0, -half, v * LENGTH, 0, half, v * LENGTH);
  }
  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const cloth = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: '#c4442b', side: THREE.DoubleSide
  }));
  group.add(cloth);

  const position = geometry.attributes.position;
  const flat = positions.slice();

  // When the pilot points at her she swells and pales, so that a man who has
  // never looked aloft in his life knows which scrap of cloth is meant.
  let showing = false;
  group.userData.show = (yes) => { showing = yes; };

  // The wind blows away from where it comes from, and the group turns with
  // her, so what it wants is the difference between the two.
  group.userData.update = (t, windFrom, heading) => {
    group.rotation.y = wrap(windFrom + 180 - heading) * Math.PI / 180;

    const beat = showing ? 1 + 0.55 * (0.5 + 0.5 * Math.sin(t * 5.5)) : 1;
    group.scale.set(beat, beat, 1 + (beat - 1) * 0.35);
    cloth.material.color.set(showing ? '#ff6a3c' : '#c4442b');

    // A slow ripple running out along her length, biggest at the fly, so she
    // reads as cloth in a breeze rather than as a painted stick.
    for (let i = 0; i <= SEGMENTS; i++) {
      const v = i / SEGMENTS;
      const wave = Math.sin(t * 2.6 - v * 4.5) * 0.9 * v * v;
      position.setX(i * 2, wave);
      position.setX(i * 2 + 1, wave);
      position.setY(i * 2, flat[i * 6 + 1] + wave * 0.25);
      position.setY(i * 2 + 1, flat[i * 6 + 4] + wave * 0.25);
    }
    position.needsUpdate = true;
  };

  return group;
}
