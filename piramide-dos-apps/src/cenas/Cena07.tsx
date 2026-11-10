import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo } from "react";
import * as THREE from "three";
import { Camera, misturarCam, type Cam } from "../lib/Camera";
import { Instancias, type Inst } from "../lib/Instancias";
import { Legenda } from "../lib/Legenda";
import { CAM_MAPA, Mapa } from "../lib/Mapa";
import { clamp, prog, semente } from "../lib/anim";
import type { PropsCena } from "../lib/cena";
import { COR, SEGURO, fontFamily } from "../lib/tema";

const useCeu = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 256, 0, 0);
    grad.addColorStop(0.0, "#F7B15C");
    grad.addColorStop(0.1, "#E0763F");
    grad.addColorStop(0.28, "#8C3F3A");
    grad.addColorStop(0.55, "#33203A");
    grad.addColorStop(1.0, "#0B0B0F");
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

/** Montes de blocos cinza ao redor: as pirâmides fáceis, que ninguém lembra. */
const montes = (): Inst[] => {
  const r = semente(21);
  // posições escolhidas para caber no enquadramento vertical final (campo de visão estreito)
  const centros: [number, number][] = [
    [-3.9, 6], [4.1, 5], [-6.2, -2], [6.6, -3], [-9, -10], [9.5, -9], [-4, -16], [5, -18],
    [-13, -21], [13, -23], [0.5, -27], [-8, -33], [8.5, -35], [-17, -40], [17, -42], [-2, -46],
  ];
  const itens: Inst[] = [];
  for (const c of centros) {
    const n = 10 + Math.floor(r() * 12);
    const esp = 0.9 + r() * 0.8;
    for (let i = 0; i < n; i++) {
      const dx = (r() + r() - 1) * esp * 1.6;
      const dz = (r() + r() - 1) * esp * 1.6;
      const d = Math.hypot(dx, dz);
      const y = 0.22 + Math.max(0, esp * 1.3 - d) * r() * 0.9;
      const tom = r();
      itens.push({
        pos: [c[0] + dx, y, c[1] + dz],
        rot: [(r() - 0.5) * 0.8, r() * 3, (r() - 0.5) * 0.8],
        escala: 0.36 + r() * 0.2,
        cor: tom > 0.5 ? "#8E8982" : "#77726C",
      });
    }
  }
  return itens;
};

const PERGUNTA = "Qual app você já viu em dez versões iguais?";
const INICIO_OURO = PERGUNTA.indexOf("dez");

/** Cena 7 — Fechamento: a pirâmide dourada sozinha no deserto, e a pergunta. */
export const Cena07: React.FC<PropsCena> = ({ cena, cue }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const ceu = useCeu();
  const itens = useMemo(montes, []);
  const fSao = cue("São");
  const fQual = cue("qual");
  const fFimFala = cue("iguais", 0, true);

  const perto: Cam = { pos: [0.6, 4.3, 7.5], alvo: [0, 3.7, 0], fov: 40 };
  const longe: Cam = { pos: [0, 2.6, 27], alvo: [0, 3.5, 0], fov: 40 };
  const cam = misturarCam(perto, longe, prog(frame, 0, fSao + 70, Easing.out(Easing.cubic)));

  const letras = Math.floor(interpolate(frame, [fQual, Math.max(fQual + 20, fFimFala - 4)], [0, PERGUNTA.length], clamp));
  const entradaCta = interpolate(frame, [fQual - 6, fQual + 8], [0, 1], clamp);
  const fimP = prog(frame, cena.duracaoFrames - 16, cena.duracaoFrames - 2);

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <ThreeCanvas width={width} height={height}>
        <Camera {...cam} />
        <fog attach="fog" args={["#B5693F", 22, 110]} />
        <ambientLight intensity={0.75} color="#9A7FA8" />
        {/* luz quente lateral, sol baixo */}
        <directionalLight position={[14, 5, 3]} intensity={3.6} color="#FFB36B" />
        <directionalLight position={[-8, 6, 8]} intensity={0.5} color="#7A6FB5" />
        {/* céu e sol */}
        <mesh position={[0, 58, -130]}>
          <planeGeometry args={[520, 120]} />
          <meshBasicMaterial map={ceu} fog={false} />
        </mesh>
        <mesh position={[17, 5.5, -128]}>
          <circleGeometry args={[5.5, 48]} />
          <meshBasicMaterial color="#FFD489" fog={false} />
        </mesh>
        {/* chão */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
          <planeGeometry args={[520, 240]} />
          <meshStandardMaterial color="#8A5A3C" roughness={1} />
        </mesh>
        {/* a pirâmide que ninguém conseguiu fazer igual */}
        <mesh position={[0, 2.5, 0]} rotation={[0, Math.PI / 4 + 0.3, 0]}>
          <coneGeometry args={[3.9, 5, 4]} />
          <meshStandardMaterial
            color={COR.dourado}
            roughness={0.42}
            metalness={0.35}
            emissive={COR.dourado}
            emissiveIntensity={0.16}
            flatShading
          />
        </mesh>
        <Instancias itens={itens} max={400}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={1} flatShading />
        </Instancias>
      </ThreeCanvas>

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          left: SEGURO.lado,
          right: SEGURO.lado,
          top: 300,
          fontFamily,
          opacity: entradaCta,
          transform: `translateY(${(1 - entradaCta) * 26}px)`,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 34, letterSpacing: 8, color: COR.douradoClaro, marginBottom: 26 }}>
          ME CONTA AÍ
        </div>
        <div
          style={{
            fontWeight: 900,
            fontSize: 92,
            lineHeight: 1.06,
            letterSpacing: -3,
            color: COR.texto,
            textShadow: "0 4px 30px rgba(11,11,15,0.55)",
          }}
        >
          <span>{PERGUNTA.slice(0, Math.min(letras, INICIO_OURO))}</span>
          <span style={{ color: COR.dourado }}>{PERGUNTA.slice(INICIO_OURO, Math.max(letras, INICIO_OURO))}</span>
          <span style={{ opacity: 0 }}>{PERGUNTA.slice(Math.max(letras, 0))}</span>
        </div>
      </div>
      <Legenda palavras={cena.palavras} ate={fQual - 2} />

      {/* Loop: escurece no mesmo mapa do primeiro frame da Cena 1 */}
      {fimP > 0 ? (
        <AbsoluteFill style={{ backgroundColor: COR.fundo, opacity: fimP }}>
          <ThreeCanvas width={width} height={height}>
            <Camera {...CAM_MAPA} />
            <Mapa />
          </ThreeCanvas>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
