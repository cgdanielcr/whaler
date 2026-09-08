// The sea: one large plane with a gentle swell running through it.
// The wave height is a sum of three sine waves. Because we know the wave
// function we can work out the surface normals directly, which is much cheaper
// than asking Three.js to recalculate them every frame.
import * as THREE from 'three';

const EXTENT = 1400;   // metres across
const SEGMENTS = 160;  // grid resolution

// Height of the water at a point, in metres, at game-clock time t (seconds).
export function waveHeight(x, z, t) {
  return 1.00 * Math.sin(x * 0.077 + t * 0.85)
       + 0.60 * Math.sin(z * 0.114 - t * 1.10)
       + 0.35 * Math.sin((x + z) * 0.152 + t * 1.45);
}

function waveSlope(x, z, t, out) {
  const a = Math.cos(x * 0.077 + t * 0.85);
  const b = Math.cos(z * 0.114 - t * 1.10);
  const c = Math.cos((x + z) * 0.152 + t * 1.45);
  out.x = 1.00 * 0.077 * a + 0.35 * 0.152 * c;   // dHeight/dx
  out.z = 0.60 * 0.114 * b + 0.35 * 0.152 * c;   // dHeight/dz
}

export function makeSea() {
  const geometry = new THREE.PlaneGeometry(EXTENT, EXTENT, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2);   // lay it flat, so y is height

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: '#1c4257',
    roughness: 0.32,
    metalness: 0.10
  }));
  mesh.receiveShadow = true;

  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const slope = { x: 0, z: 0 };

  mesh.userData.update = (t) => {
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      position.setY(i, waveHeight(x, z, t));
      waveSlope(x, z, t, slope);
      const len = Math.hypot(slope.x, 1, slope.z);
      normal.setXYZ(i, -slope.x / len, 1 / len, -slope.z / len);
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  };

  return mesh;
}
