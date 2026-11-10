import { COR } from "./tema";

export type TipoPiramide = "lisa" | "degraus" | "adobe" | "templo";

const Pedra: React.FC<{ cor: string; brilho: number }> = ({ cor, brilho }) => (
  <meshStandardMaterial
    color={cor}
    roughness={1}
    metalness={0}
    flatShading
    emissive={COR.dourado}
    emissiveIntensity={brilho}
  />
);

/**
 * Quatro pirâmides low-poly, base ~1 unidade, apoiadas em y = 0.
 * lisa = Egito · degraus = Maias · adobe = Peru · templo = Camboja
 */
export const Piramide: React.FC<{ tipo: TipoPiramide; brilho?: number }> = ({ tipo, brilho = 0 }) => {
  if (tipo === "lisa") {
    return (
      <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.78, 1.0, 4]} />
        <Pedra cor="#9C9284" brilho={brilho} />
      </mesh>
    );
  }
  if (tipo === "degraus") {
    const n = 6;
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const l = 1.1 - i * 0.15;
          return (
            <mesh key={i} position={[0, 0.065 + i * 0.13, 0]}>
              <boxGeometry args={[l, 0.13, l]} />
              <Pedra cor={i % 2 ? "#8C8377" : "#968C7F"} brilho={brilho} />
            </mesh>
          );
        })}
        {/* escadaria frontal */}
        <mesh position={[0, 0.39, 0.4]} rotation={[-0.72, 0, 0]}>
          <boxGeometry args={[0.2, 0.05, 0.98]} />
          <Pedra cor="#B5AA9A" brilho={brilho} />
        </mesh>
        {/* templo no topo */}
        <mesh position={[0, 0.89, 0]}>
          <boxGeometry args={[0.24, 0.22, 0.24]} />
          <Pedra cor="#B5AA9A" brilho={brilho} />
        </mesh>
      </group>
    );
  }
  if (tipo === "adobe") {
    return (
      <group>
        {[
          [0.82, 0.68, 0.3, 0.15],
          [0.6, 0.48, 0.26, 0.43],
          [0.4, 0.3, 0.2, 0.66],
        ].map(([rb, rt, h, y], i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[rt, rb, h, 4]} />
            <Pedra cor={i === 1 ? "#94887A" : "#857B6F"} brilho={brilho} />
          </mesh>
        ))}
        {/* rampa */}
        <mesh position={[0.2, 0.2, 0.5]} rotation={[-0.6, 0, 0]}>
          <boxGeometry args={[0.18, 0.04, 0.62]} />
          <Pedra cor="#B5AA9A" brilho={brilho} />
        </mesh>
      </group>
    );
  }
  // templo-montanha
  const torres: [number, number, number][] = [
    [0, 0, 1],
    [-0.25, -0.25, 0.62],
    [0.25, -0.25, 0.62],
    [-0.25, 0.25, 0.62],
    [0.25, 0.25, 0.62],
  ];
  return (
    <group>
      {[1.15, 0.9, 0.66].map((l, i) => (
        <mesh key={i} position={[0, 0.07 + i * 0.14, 0]}>
          <boxGeometry args={[l, 0.14, l]} />
          <Pedra cor={i % 2 ? "#7D776E" : "#878076"} brilho={brilho} />
        </mesh>
      ))}
      {torres.map(([x, z, e], i) => (
        <group key={i} position={[x, 0.42, z]} scale={e}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.24, 6]} />
            <Pedra cor="#8C8377" brilho={brilho} />
          </mesh>
          <mesh position={[0, 0.46, 0]}>
            <coneGeometry args={[0.12, 0.46, 6]} />
            <Pedra cor="#9A9184" brilho={brilho} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Luz padrão: lateral quente + preenchimento frio fraco. */
export const Luzes: React.FC<{ forca?: number }> = ({ forca = 1 }) => (
  <>
    <ambientLight intensity={0.85 * forca} color="#9AA0BC" />
    <directionalLight position={[-7, 9, 5]} intensity={2.5 * forca} color="#FFEEDA" />
    <directionalLight position={[6, 3, -4]} intensity={0.5 * forca} color="#6F7FB0" />
  </>
);
