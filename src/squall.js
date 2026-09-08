// The dark line on the horizon. It stands out of the fog at whatever bearing
// the squall is coming up from, and grows as she closes.
import * as THREE from 'three';

const ARC = Math.PI * 0.30;   // how much of the horizon she blots out
const HEIGHT = 560;
const RINGS = 7, SEGMENTS = 36;

export function makeSquall() {
  const geometry = new THREE.CylinderGeometry(1, 1, HEIGHT, SEGMENTS, RINGS, true, -ARC / 2, ARC);
  const position = geometry.attributes.position;

  // Dark and heavy at the foot where the rain is, thinning away at her top and
  // at both edges, so she has no hard rim against the sky.
  // Vertex colours are read in the working colour space, so a dark grey has to
  // be given as the very small numbers that grey really is.
  const ink = new THREE.Color('#1b2026').convertSRGBToLinear();

  const colours = [];
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i) / HEIGHT + 0.5;                 // 0 at the foot
    const across = Math.atan2(position.getX(i), position.getZ(i)) / (ARC / 2);
    const edge = Math.max(0, 1 - Math.pow(Math.abs(across), 2.2));
    // A ragged top, so she is a squall and not a wall.
    const ragged = 0.62 + 0.38 * (Math.sin(across * 11.3) * 0.5 + Math.sin(across * 4.7 + 1.9) * 0.5);
    const up = Math.max(0, 1 - y / ragged);
    colours.push(ink.r, ink.g, ink.b, Math.pow(up, 1.25) * edge);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 4));

  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, side: THREE.DoubleSide,
    depthWrite: false, fog: false, opacity: 0
  }));
  mesh.position.y = HEIGHT / 2 - 40;      // her foot sits a little below the horizon
  mesh.renderOrder = -1;
  mesh.visible = false;

  // nearness runs 0 when she is first raised to 1 when she is on top of you.
  mesh.userData.update = (warning) => {
    if (!warning) { mesh.visible = false; return; }
    mesh.visible = true;
    const distance = 780 + 2900 * Math.pow(1 - warning.nearness, 1.4);
    mesh.scale.set(distance, 1, distance);
    mesh.rotation.y = warning.bearing * Math.PI / 180;
    // She fades out as she comes over you and the whole sky goes dark instead.
    mesh.material.opacity = warning.here
      ? Math.max(0, 1 - warning.strength * 2.2)
      : Math.min(1, 0.25 + warning.nearness * 0.9);
  };

  return mesh;
}
