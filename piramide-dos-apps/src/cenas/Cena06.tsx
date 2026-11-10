import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo } from "react";
import * as THREE from "three";
import { Camera, projetar, type Cam } from "../lib/Camera";
import { Legenda } from "../lib/Legenda";
import { Luzes } from "../lib/Piramides";
import { clamp, lerp, prog } from "../lib/anim";
import type { PropsCena } from "../lib/cena";
import { COR, SERIF, fontFamily } from "../lib/tema";

const H = 0.64;
const BASE_Y = 3 * H;
const DEGRAUS = [
  { texto: "DISTRIBUIÇÃO", cue: "Distribuição" },
  { texto: "DADOS PRÓPRIOS", cue: "Dados" },
  { texto: "MARCA", cue: "Marca" },
  { texto: "COMUNIDADE", cue: "Comunidade" },
  { texto: "PROBLEMA REAL", cue: "problema" },
].map((d, i) => ({ ...d, l: 4.5 - i * 0.55, y: BASE_Y + (i + 0.5) * H }));
const TOPO_Y = BASE_Y + DEGRAUS.length * H;

const Contorno: React.FC<{ l: number; y: number; opacidade: number }> = ({ l, y, opacidade }) => {
  const g = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(l, H, l)), [l]);
  return (
    <lineSegments geometry={g} position={[0, y, 0]}>
      <lineBasicMaterial color={COR.acid} transparent opacity={opacidade} />
    </lineSegments>
  );
};

/** Cena 6 — O que fica na ponta: cada palavra é um bloco dourado; depois, só a frase. */
export const Cena06: React.FC<PropsCena> = ({ cena, cue }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const fPorque = cue("Porque");
  const fCume = cue("melhor");

  const cam: Cam = {
    pos: [0, 3.6, lerp(19.5, 18, prog(frame, 0, fPorque))],
    alvo: [0, 2.7, 0],
    fov: 35,
  };
  const fantasma = interpolate(frame, [6, 20], [0, 0.4], clamp);
  const escurece = interpolate(frame, [fPorque - 8, fPorque + 6], [0, 1], clamp);

  const linha1 = ["Porque", "quando", "todo", "mundo", "consegue", "construir,"];
  const linhasGrandes: { texto: string; cue: [string, number]; ouro?: boolean }[][] = [
    [{ texto: "construir", cue: ["construir", 1] }],
    [
      { texto: "deixa", cue: ["deixa", 0] },
      { texto: "de", cue: ["de", 0] },
      { texto: "ser", cue: ["ser", 0] },
    ],
    [
      { texto: "o", cue: ["o", 1] },
      { texto: "diferencial.", cue: ["diferencial", 0], ouro: true },
    ],
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <ThreeCanvas width={width} height={height}>
        <Camera {...cam} />
        <Luzes />
        {/* topo truncado da pirâmide (camadas "nicho") */}
        {[6.3, 5.7, 5.1].map((l, i) => (
          <mesh key={i} position={[0, (i + 0.5) * H, 0]}>
            <boxGeometry args={[l, H * 0.97, l]} />
            <meshStandardMaterial color={COR.azul} roughness={0.9} flatShading />
          </mesh>
        ))}
        {DEGRAUS.map((d, i) => {
          const f = frame - cue(d.cue);
          const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 150, mass: 0.9 } });
          const flash = interpolate(f, [4, 8, 26], [0, 0.7, 0], clamp);
          return (
            <group key={d.texto}>
              {f < 6 ? <Contorno l={d.l} y={d.y} opacidade={fantasma} /> : null}
              {f >= 0 ? (
                <mesh position={[0, d.y + (1 - s) * 4.5, 0]}>
                  <boxGeometry args={[d.l, H * 0.97, d.l]} />
                  <meshStandardMaterial
                    color={COR.acid}
                    roughness={0.55}
                    metalness={0.25}
                    emissive={COR.acid}
                    emissiveIntensity={flash}
                    flatShading
                  />
                </mesh>
              ) : null}
            </group>
          );
        })}
        {/* cume */}
        {(() => {
          const f = frame - fCume;
          if (f < 0)
            return (
              <mesh position={[0, TOPO_Y + 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[1.25, 1.1, 4]} />
                <meshBasicMaterial color={COR.acid} wireframe transparent opacity={fantasma * 0.6} />
              </mesh>
            );
          const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 150 } });
          return (
            <mesh position={[0, TOPO_Y + 0.55 + (1 - s) * 4, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[1.25, 1.1, 4]} />
              <meshStandardMaterial
                color={COR.acid}
                roughness={0.4}
                metalness={0.3}
                emissive={COR.acid}
                emissiveIntensity={interpolate(f, [4, 9, 40], [0, 0.9, 0.25], clamp)}
                flatShading
              />
            </mesh>
          );
        })()}
      </ThreeCanvas>

      {/* palavras gravadas na face de cada bloco */}
      {DEGRAUS.map((d) => {
        const f = frame - cue(d.cue);
        if (f < 5) return null;
        const esq = projetar(cam, [-d.l / 2, d.y, d.l / 2], width, height);
        const dir = projetar(cam, [d.l / 2, d.y, d.l / 2], width, height);
        const cima = projetar(cam, [0, d.y + H / 2, d.l / 2], width, height);
        const baixo = projetar(cam, [0, d.y - H / 2, d.l / 2], width, height);
        const larguraPx = dir.x - esq.x;
        const alturaPx = baixo.y - cima.y;
        const fonte = Math.min(alturaPx * 0.52, (larguraPx * 0.86) / (d.texto.length * 0.66));
        return (
          <div
            key={d.texto}
            style={{
              position: "absolute",
              left: esq.x,
              top: cima.y,
              width: larguraPx,
              height: alturaPx,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily,
              fontWeight: 700,
              fontSize: fonte,
              letterSpacing: fonte * 0.04,
              color: COR.fundo,
              opacity: interpolate(f, [5, 10], [0, 0.92], clamp),
            }}
          >
            {d.texto}
          </div>
        );
      })}

      {/* pergunta de abertura */}
      <div
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
          textAlign: "center",
          fontFamily,
          fontWeight: 700,
          fontSize: 84,
          letterSpacing: "-0.03em",
          color: COR.texto,
          opacity: interpolate(frame, [2, 12, cue("Distribuição") - 6, cue("Distribuição") + 4], [0, 1, 1, 0], clamp),
        }}
      >
        O que fica <span style={{ ...SERIF, color: COR.acid, fontSize: 100 }}>na ponta?</span>
      </div>

      {/* escurece: fica só a frase */}
      <AbsoluteFill
        style={{
          backgroundColor: COR.fundo,
          opacity: escurece,
          justifyContent: "center",
          alignItems: "center",
          fontFamily,
        }}
      >
        <div style={{ width: 940, marginTop: -160 }}>
          <div style={{ fontWeight: 700, fontSize: 50, lineHeight: 1.25, color: COR.textoSuave, marginBottom: 46 }}>
            {linha1.map((w, i) => (
              <span
                key={i}
                style={{
                  opacity: interpolate(frame - cue(w, 0), [0, 5], [0, 1], clamp),
                  marginRight: 14,
                  display: "inline-block",
                }}
              >
                {w}
              </span>
            ))}
          </div>
          {linhasGrandes.map((linha, i) => (
            <div key={i} style={{ fontWeight: 700, fontSize: 132, lineHeight: 1.0, letterSpacing: "-0.04em" }}>
              {linha.map((w) => {
                const f = frame - cue(w.cue[0], w.cue[1]);
                const s = spring({ frame: f, fps, config: { damping: 18, stiffness: 200 } });
                return (
                  <span
                    key={w.texto}
                    style={{
                      display: "inline-block",
                      marginRight: 30,
                      color: w.ouro ? COR.acid : COR.texto,
                      ...(w.ouro ? { ...SERIF, fontSize: 150 } : {}),
                      opacity: interpolate(f, [0, 3], [0, 1], clamp),
                      transform: `translateY(${(1 - s) * 34}px)`,
                    }}
                  >
                    {w.texto}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <Legenda palavras={cena.palavras} ate={fPorque - 2} />
    </AbsoluteFill>
  );
};
