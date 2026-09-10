// The hull, built from numbers rather than a modelling program.
// We describe cross-sections ("stations") from transom to stem and stitch them
// into one skin. Proportions follow the Charles W. Morgan of 1841: about 108 ft
// on deck, 27 ft beam, 13 ft draught -- a bluff, deep, box-sided whaleship, not
// a yacht.
import * as THREE from 'three';
import { HUE } from './palette.js';
import { cutLight } from './flat.js';

const LENGTH    = 33.0;   // metres, transom to stem
const HALF_BEAM = 4.35;
const DRAUGHT   = 3.9;    // keel below the waterline amidships
const BULWARK   = 1.40;   // rail height above the deck edge

const STATIONS = 26;      // cross-sections along her length

const TOPSIDES  = HUE.hull;
const BAND      = HUE.band;
const BOTTOM    = HUE.bottom;

// u runs from -1 at the transom to +1 at the stem.
const halfBeamAt = (u) => u >= 0
  ? HALF_BEAM * Math.pow(Math.max(0, 1 - u * u), 0.34)                    // bluff bow
  : HALF_BEAM * Math.pow(Math.max(0, 1 - Math.pow(-u * 0.86, 4)), 0.45);  // full run, square stern

const keelAt  = (u) => -DRAUGHT * (1 - (u >= 0 ? 0.80 * u * u * u : 0.55 * Math.pow(-u, 4)));
const sheerAt = (u) => 2.35 + 0.55 * u * u * (u > 0 ? 1.35 : 1.0);   // freeboard, rising at the ends

// The stem rakes forward: the higher up the bow, the further out it reaches.
const rakeAt = (u, t) => (u > 0.7 ? (u - 0.7) / 0.3 : 0) * 2.2 * t;

// The rings that make up a half-section, given as a fraction of the way from
// the keel to the deck edge. "lift" carries a ring above the deck edge to make
// the bulwark; "band" marks the strake carrying her painted buff sheer band.
const RINGS = [
  { t: 0.00 }, { t: 0.22 }, { t: 0.43 }, { t: 0.61 }, { t: 0.76 },
  { t: 0.90, band: true }, { t: 1.00, band: true },
  { t: 1.00, lift: 0.07 }, { t: 1.00, lift: BULWARK }
];

// One half-section: points from the keel up to the top of the rail.
function halfSection(u) {
  const beam = halfBeamAt(u), keel = keelAt(u), sheer = sheerAt(u);
  return RINGS.map((r) => {
    const lift = r.lift || 0;
    const x = beam * (lift ? 0.97 : Math.pow(Math.sin(r.t * Math.PI / 2), 0.45));
    return [x, keel + r.t * (sheer - keel) + lift];
  });
}

function paint(k, y, target) {
  if (RINGS[k].band) target.copy(BAND);
  else if (y < -0.2) target.copy(BOTTOM);
  else target.copy(TOPSIDES);
}

function buildSkin() {
  const ring = RINGS.length;          // points in a half-section
  const wide = ring * 2 - 1;          // larboard rail, round the keel, to starboard rail
  const vertices = [], colours = [], indices = [];
  const c = new THREE.Color();

  for (let i = 0; i <= STATIONS; i++) {
    const u = -1 + (2 * i) / STATIONS;
    const half = halfSection(u), z = u * LENGTH / 2;
    for (let j = 0; j < wide; j++) {
      const k = Math.abs(j - (ring - 1));
      const side = j < ring - 1 ? -1 : 1;
      const [x, y] = half[k];
      vertices.push(side * x, y, z + rakeAt(u, k / (ring - 1)));
      paint(k, y, c);
      colours.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < STATIONS; i++) {
    for (let j = 0; j < wide - 1; j++) {
      const a = i * wide + j, b = a + wide;
      indices.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }

  // Close the transom with a fan of triangles across the aftmost section.
  const centre = vertices.length / 3;
  vertices.push(0, keelAt(-1) + (sheerAt(-1) + BULWARK - keelAt(-1)) * 0.5, -LENGTH / 2);
  colours.push(TOPSIDES.r, TOPSIDES.g, TOPSIDES.b);
  for (let j = 0; j < wide - 1; j++) indices.push(centre, j + 1, j);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// The deck: a ribbon laid between the two deck edges, cambered a little so
// water would run off it.
function buildDeck() {
  const vertices = [], indices = [];
  for (let i = 0; i <= STATIONS; i++) {
    const u = -1 + (2 * i) / STATIONS;
    const beam = halfBeamAt(u) * 0.96, y = sheerAt(u), z = u * LENGTH / 2 + rakeAt(u, 0.86);
    vertices.push(-beam, y, z, 0, y + 0.18, z, beam, y, z);
  }
  for (let i = 0; i < STATIONS; i++) {
    for (let j = 0; j < 2; j++) {
      const a = i * 3 + j, b = a + 3;
      indices.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Her false gunports. The Morgan carried no cannon, but had gunports painted
// black on her sides to frighten off would-be pirates -- a whaleship three
// years from home in the Pacific being worth robbing and unable to defend
// herself. Documented; the number and spacing are inferred.
//
// They are laid on the buff sheer band by working out the same surface points
// the planking uses, so they sit on her skin and follow her curve.
const PORTS = 9;

function buildPorts() {
  const vertices = [], indices = [];
  const at = (u, t, side) => {
    const beam = halfBeamAt(u), keel = keelAt(u), sheer = sheerAt(u);
    // A hair proud of the planking, or she will fight it for the same pixels.
    const x = side * beam * Math.pow(Math.sin(t * Math.PI / 2), 0.45) * 1.012;
    return [x, keel + t * (sheer - keel), u * LENGTH / 2 + rakeAt(u, t)];
  };

  let n = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < PORTS; i++) {
      const u = -0.70 + (1.48 * i) / (PORTS - 1);
      for (const [du, t] of [[-0.026, 0.905], [0.026, 0.905], [0.026, 0.985], [-0.026, 0.985]]) {
        vertices.push(...at(u + du, t, side));
      }
      indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
      n += 4;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function makeHull() {
  const ship = new THREE.Group();

  const planking = new THREE.Mesh(buildSkin(), cutLight(new THREE.MeshLambertMaterial({
    vertexColors: true, flatShading: true, side: THREE.DoubleSide
  })));
  planking.castShadow = true;
  ship.add(planking);

  const deck = new THREE.Mesh(buildDeck(), cutLight(new THREE.MeshLambertMaterial({
    color: HUE.deck, flatShading: true, side: THREE.DoubleSide
  })));
  deck.receiveShadow = true;
  ship.add(deck);

  const ports = new THREE.Mesh(buildPorts(), new THREE.MeshBasicMaterial({
    color: HUE.hull, side: THREE.DoubleSide
  }));
  ship.add(ports);

  // The bowsprit. The headsails will hang from it later.
  const spar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.32, 14, 8),
    cutLight(new THREE.MeshLambertMaterial({ color: HUE.spar, flatShading: true }))
  );
  spar.rotation.x = Math.PI / 2 - 0.20;   // forward, and a little up
  spar.position.set(0, sheerAt(1) + 0.9, LENGTH / 2 + 5.4);
  spar.castShadow = true;
  ship.add(spar);

  return ship;
}

// How high her deck stands above the waterline at a given point along her length.
// The masts need this to know where to stand.
export const deckAt = (z) => sheerAt(Math.max(-1, Math.min(1, 2 * z / LENGTH)));

// How far out her side stands from the centreline at a given point along her
// length. The channels, which the shrouds set up to, are bolted just outside it.
export const beamAt = (z) => halfBeamAt(Math.max(-1, Math.min(1, 2 * z / LENGTH)));
export const ON_DECK = LENGTH;
