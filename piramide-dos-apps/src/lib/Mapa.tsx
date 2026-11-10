import { useMemo } from "react";
import * as THREE from "three";
import landDots from "../data/land-dots.json";
import type { Cam } from "./Camera";

/** Projeção equiretangular: 36° = 1 unidade; latitude esticada p/ compensar a inclinação. */
export const geo = (lon: number, lat: number): [number, number, number] => [
  lon / 36,
  0,
  (-(lat - 10) / 36) * 1.6,
];

/** Mesmo enquadramento nas Cenas 1, 4 e no último frame da 7 (rima visual + loop). */
export const CAM_MAPA: Cam = { pos: [0.2, 13.2, 9.8], alvo: [0.2, 0.2, -0.35], fov: 42 };

export const PONTOS_TERRA = (landDots as [number, number][]).map(([lon, lat]) => geo(lon, lat));

/** Mapa-múndi minimalista: um ponto por célula de terra. Estático. */
export const Mapa: React.FC<{ cor?: string; opacidade?: number }> = ({
  cor = "#3A3A3A",
  opacidade = 1,
}) => {
  const geometria = useMemo(() => {
    const g = new THREE.CircleGeometry(0.021, 6);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const matrizes = useMemo(() => {
    const o = new THREE.Object3D();
    const arr = new Float32Array(PONTOS_TERRA.length * 16);
    PONTOS_TERRA.forEach((p, i) => {
      o.position.set(p[0], 0, p[2]);
      o.updateMatrix();
      o.matrix.toArray(arr, i * 16);
    });
    return arr;
  }, []);
  return (
    <instancedMesh args={[geometria, undefined, PONTOS_TERRA.length]} frustumCulled={false}>
      <instancedBufferAttribute attach="instanceMatrix" args={[matrizes, 16]} />
      <meshBasicMaterial color={cor} transparent opacity={opacidade} />
    </instancedMesh>
  );
};

/** Anel que acende no chão do mapa. `p` 0→1 expande e some. */
export const Anel: React.FC<{ pos: [number, number, number]; p: number; cor: string; raio?: number }> = ({
  pos,
  p,
  cor,
  raio = 1,
}) => {
  if (p <= 0 || p >= 1) return null;
  const r = 0.15 + p * raio;
  return (
    <mesh position={[pos[0], 0.01, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r, r + 0.035, 48]} />
      <meshBasicMaterial color={cor} transparent opacity={(1 - p) * 0.9} />
    </mesh>
  );
};
