import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

export type Inst = {
  pos: [number, number, number];
  rot?: [number, number, number];
  escala?: number | [number, number, number];
  cor?: THREE.ColorRepresentation;
};

const obj = new THREE.Object3D();
const corAux = new THREE.Color();

/**
 * InstancedMesh cujas matrizes/cores são recalculadas a cada render a partir
 * de `itens` (derivados do frame). Geometria e material vêm como filhos.
 */
export const Instancias: React.FC<{
  itens: Inst[];
  max: number;
  children: React.ReactNode;
}> = ({ itens, max, children }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const n = Math.min(itens.length, max);
    for (let i = 0; i < n; i++) {
      const it = itens[i];
      obj.position.set(...it.pos);
      obj.rotation.set(...(it.rot ?? [0, 0, 0]));
      const e = it.escala ?? 1;
      if (typeof e === "number") obj.scale.setScalar(e);
      else obj.scale.set(...e);
      obj.updateMatrix();
      m.setMatrixAt(i, obj.matrix);
      m.setColorAt(i, corAux.set(it.cor ?? "#ffffff"));
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, max]} frustumCulled={false}>
      {children}
    </instancedMesh>
  );
};
