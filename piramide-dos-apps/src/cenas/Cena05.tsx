import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo } from "react";
import * as THREE from "three";
import { Camera, misturarCam, projetar, type Cam } from "../lib/Camera";
import { Instancias, type Inst } from "../lib/Instancias";
import { Legenda } from "../lib/Legenda";
import { CAM_MAPA, Mapa } from "../lib/Mapa";
import { Luzes } from "../lib/Piramides";
import { clamp, lerp, prog, semente } from "../lib/anim";
import type { PropsCena } from "../lib/cena";
import { ICONES_MAPA, INCLINACAO_ICONE } from "../lib/icones";
import { COR, MONO, SEGURO, fontFamily } from "../lib/tema";

export const LADO = 0.5;
export const N_CAMADAS = 10;
const GIRO = 0.42;

export const corDaCamada = (camada: number, u: number) => {
  if (camada >= 8) return COR.acid;
  if (camada >= 5) return COR.azul;
  return u > 0.66 ? "#6A6A6A" : u > 0.33 ? "#5C5C5C" : "#767676";
};

/** Blocos da pirâmide em camadas: 10×10 na base até 1 na ponta (385 blocos). */
export const blocosDaPiramide = () => {
  const r = semente(5);
  const lista: { alvo: [number, number, number]; camada: number; u: number }[] = [];
  for (let c = 0; c < N_CAMADAS; c++) {
    const n = N_CAMADAS - c;
    for (let ix = 0; ix < n; ix++)
      for (let iz = 0; iz < n; iz++)
        lista.push({
          alvo: [(ix - (n - 1) / 2) * LADO, (c + 0.5) * LADO, (iz - (n - 1) / 2) * LADO],
          camada: c,
          u: r(),
        });
  }
  return lista;
};

const ROTULOS = [
  { titulo: "commodity", sub: "mesma coisa, preço zero", y: 1.0, cue: "base", cor: COR.textoSuave },
  { titulo: "nicho", sub: "um público, um problema", y: 3.25, cue: "meio", cor: COR.azul },
  { titulo: "incopiável", sub: "não sai de um prompt", y: 4.55, cue: "ponta", cor: COR.acid },
];

/** Cena 5 — O formato: os ícones se empilham; a câmera sobe da base lotada à ponta dourada. */
export const Cena05: React.FC<PropsCena> = ({ cena, cue }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fBase = cue("base");
  const fMeio = cue("meio") - 12;
  const fNicho = cue("nicho");
  const fPonta = cue("lá") - 10;
  const fPoucos = cue("pouquíssimos");

  const blocos = useMemo(() => {
    const cor = new THREE.Color();
    return blocosDaPiramide().map((b, i) => ({
      ...b,
      ini: ICONES_MAPA[i % ICONES_MAPA.length].pos,
      corFinal: "#" + cor.set(corDaCamada(b.camada, b.u)).getHexString(),
    }));
  }, []);

  const janela = Math.max(30, fBase - 6);
  const c1 = new THREE.Color();
  const c2 = new THREE.Color();
  const itens: Inst[] = blocos.map((b, i) => {
    const inicio = 4 + (i / blocos.length) * janela * 0.5 + b.u * 4;
    const p = prog(frame, inicio, inicio + janela * 0.45);
    const arco = Math.sin(Math.PI * p) * (1.2 + b.u);
    const e = lerp(0.3, LADO * 0.93, p);
    return {
      pos: [lerp(b.ini[0], b.alvo[0], p), lerp(b.ini[1], b.alvo[1], p) + arco, lerp(b.ini[2], b.alvo[2], p)],
      rot: [INCLINACAO_ICONE * (1 - p), 0, 0],
      escala: [e, e, lerp(0.03, LADO * 0.93, p)],
      cor: "#" + c1.set(COR.texto).lerp(c2.set(b.corFinal), interpolate(p, [0.35, 1], [0, 1], clamp)).getHexString(),
    };
  });

  // Câmera: mapa → base (cortada, enorme) → meio → ponta (últimos segundos só nela).
  const camGeral: Cam = { pos: [0, 3.4, 15.5], alvo: [0, 1.2, 0], fov: 40 };
  const camBase: Cam = { pos: [0, 1.6, 10.5], alvo: [0, 0.6, 0], fov: 40 };
  const camBase2: Cam = { pos: [0, 2.0, 10.5], alvo: [0, 1.0, 0], fov: 40 };
  const camMeio: Cam = { pos: [0, 3.5, 9.6], alvo: [0, 2.5, 0], fov: 40 };
  const camPonta: Cam = { pos: [0, 5.0, 7.6], alvo: [0, 4.1, 0], fov: 40 };
  const camPonta2: Cam = { pos: [0, 5.05, 6.8], alvo: [0, 4.2, 0], fov: 40 };
  let cam = misturarCam(CAM_MAPA, camGeral, prog(frame, 6, fBase - 4));
  cam = misturarCam(cam, camBase, prog(frame, fBase, fBase + 34));
  cam = misturarCam(cam, camBase2, prog(frame, fBase + 34, fMeio, Easing.linear));
  cam = misturarCam(cam, camMeio, prog(frame, fMeio, fNicho));
  cam = misturarCam(cam, camPonta, prog(frame, fPonta, fPoucos));
  cam = misturarCam(cam, camPonta2, prog(frame, fPoucos, cena.duracaoFrames, Easing.linear));

  const giro = GIRO * prog(frame, 6, fBase) + (frame - fBase > 0 ? (frame - fBase) * 0.0012 : 0);
  const luzPonta = interpolate(frame, [fPonta, fPoucos], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <ThreeCanvas width={width} height={height}>
        <Camera {...cam} />
        <Luzes />
        <pointLight position={[0, 5.6, 2.2]} intensity={14 * luzPonta} color={COR.acid} distance={5} />
        <Mapa opacidade={1 - prog(frame, 4, 34)} />
        <group rotation={[0, giro, 0]}>
          <Instancias itens={itens} max={400}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial roughness={0.9} flatShading />
          </Instancias>
        </group>
      </ThreeCanvas>

      {ROTULOS.map((r) => {
        const f = frame - cue(r.cue);
        if (f < 0) return null;
        const pt = projetar(cam, [0, r.y, 0], width, height);
        if (pt.y < SEGURO.topo || pt.y > 1250) return null;
        const a = interpolate(f, [0, 10], [0, 1], clamp);
        return (
          <div
            key={r.titulo}
            style={{
              position: "absolute",
              left: SEGURO.lado - 20,
              top: pt.y - 60,
              fontFamily,
              opacity: a,
              transform: `translateX(${(1 - a) * -24}px)`,
              padding: "16px 26px 18px",
              borderLeft: `6px solid ${r.cor}`,
              background: "rgba(10,10,10,0.82)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 58, color: r.cor === COR.acid ? COR.acid : COR.texto, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {r.titulo}
            </div>
            <div style={{ ...MONO, fontSize: 20, color: COR.texto, opacity: 0.75, marginTop: 12 }}>{r.sub}</div>
          </div>
        );
      })}
      <Legenda palavras={cena.palavras} />
    </AbsoluteFill>
  );
};
