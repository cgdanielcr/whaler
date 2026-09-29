// Baking: many small things that never move on their own (planks, barrels,
// spars, the hands on deck) are flattened into one mesh per material, so the
// graphics chip draws a handful of shapes instead of hundreds. Anything in
// `keep` (sails that furl, boats that are lowered, oars that pull) is left alone.
import * as THREE from 'three';

export function bake(root, keep = []) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const m = new THREE.Matrix4(), v = new THREE.Vector3();
  const byMat = new Map(), done = [];
  const kept = (o) => { for (let p = o; p; p = p.parent) if (keep.includes(p)) return true; return false; };

  root.traverse((o) => {
    if (!o.isMesh || kept(o)) return;
    m.multiplyMatrices(inv, o.matrixWorld);
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const pos = g.attributes.position, mats = [].concat(o.material);
    const groups = Array.isArray(o.material) && g.groups.length ? g.groups : [{ start: 0, count: pos.count, materialIndex: 0 }];
    for (const gr of groups) {
      const n = Math.min(gr.count, pos.count - gr.start), arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        v.fromBufferAttribute(pos, gr.start + i).applyMatrix4(m);
        arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z;
      }
      const mat = mats[gr.materialIndex || 0];
      if (!byMat.has(mat)) byMat.set(mat, []);
      byMat.get(mat).push(arr);
    }
    done.push(o);
  });

  for (const o of done) o.parent.remove(o);
  for (const [mat, parts] of byMat) {
    const all = new Float32Array(parts.reduce((n, a) => n + a.length, 0));
    let off = 0;
    for (const a of parts) { all.set(a, off); off += a.length; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(all, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
  return root;
}
