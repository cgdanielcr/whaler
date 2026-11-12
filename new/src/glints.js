// Small lights and airs on the sea: sparkles where the sun strikes the water,
// and banks of mist that drift down the wind when the weather is thick.
import * as THREE from 'three';

const SPARKS = 110, BANKS = 7;

function softDisc() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.5, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function makeGlints(scene) {
  const diamond = new THREE.CircleGeometry(0.5, 4).rotateX(-Math.PI / 2);
  const sparks = new THREE.InstancedMesh(diamond, new THREE.MeshBasicMaterial({ color: 0xfffbe6, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending }), SPARKS);
  sparks.frustumCulled = false; sparks.renderOrder = 1;
  scene.add(sparks);
  const at = Array.from({ length: SPARKS }, (_, i) => ({ x: 0, z: 0, life: 1 + i / SPARKS, rate: 0.5 + (i % 7) * 0.22 }));

  const fog = new THREE.MeshBasicMaterial({ map: softDisc(), color: 0xeef4f6, transparent: true, opacity: 0, depthWrite: false });
  const banks = Array.from({ length: BANKS }, (_, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), fog);
    m.scale.set(60 + (i * 29) % 50, 1, 40 + (i * 43) % 40);
    m.position.set(((i * 83) % 240) - 120, 4 + (i % 3) * 3, ((i * 59) % 240) - 120);
    m.renderOrder = 3; m.visible = false;
    scene.add(m);
    return m;
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const wrapTo = (n, c, span) => c + ((((n - c + span) % (span * 2)) + span * 2) % (span * 2)) - span;

  return {
    // shine: how much the sun is on the water, 0 to 1. mist: how thick the air, 0 to 1.
    update(real, focus, from, shine, mist) {
      const show = Math.round(SPARKS * shine);
      at.forEach((a, i) => {
        a.life += real * a.rate;
        if (a.life > 1) { a.life = 0; a.x = focus.x + (Math.random() - 0.5) * 130; a.z = focus.z + (Math.random() - 0.5) * 130; }
        const k = i < show ? Math.sin(a.life * Math.PI) ** 3 * (0.5 + (i % 4) * 0.28) : 0;
        m4.compose(p.set(a.x, 0.5, a.z), q, sc.set(k + 0.0001, 1, k * 0.45 + 0.0001));
        sparks.setMatrixAt(i, m4);
      });
      sparks.instanceMatrix.needsUpdate = true;

      fog.opacity += (mist * 0.5 - fog.opacity) * Math.min(1, real * 0.5);
      const dx = -Math.cos(from), dz = -Math.sin(from);
      for (const b of banks) {
        b.visible = fog.opacity > 0.01;
        b.position.x = wrapTo(b.position.x + dx * real * 2.2, focus.x, 120);
        b.position.z = wrapTo(b.position.z + dz * real * 2.2, focus.z, 120);
      }
    },
  };
}
