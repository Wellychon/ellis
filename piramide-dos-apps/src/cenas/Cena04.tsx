import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera, projetar } from "../lib/Camera";
import { IconeApp, useTexturaIcone } from "../lib/IconeApp";
import { Instancias, type Inst } from "../lib/Instancias";
import { Legenda } from "../lib/Legenda";
import { Anel, CAM_MAPA, Mapa, geo } from "../lib/Mapa";
import { Luzes, Piramide } from "../lib/Piramides";
import { clamp, prog, saltar } from "../lib/anim";
import type { PropsCena } from "../lib/cena";
import { ICONES_MAPA, INCLINACAO_ICONE, TOTAL_ICONES } from "../lib/icones";
import { COR, SEGURO, fontFamily } from "../lib/tema";
import { LOCAIS } from "./Cena01";

const APPS = [
  { nome: "Gestor de gastos", cue: "Gestor" },
  { nome: "App de hábitos", cue: "App" },
  { nome: "Lista de tarefas", cue: "Lista" },
];
const PAISES = [
  { nome: "BRASIL", cue: "Brasil", pos: geo(-50, -12) },
  { nome: "ÍNDIA", cue: "Índia", pos: geo(79, 21) },
  { nome: "EUA", cue: "Estados", pos: geo(-98, 39) },
];

const IconesMapa: React.FC<{ itens: Inst[] }> = ({ itens }) => {
  const textura = useTexturaIcone();
  return (
    <Instancias itens={itens} max={TOTAL_ICONES}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={textura} alphaTest={0.5} transparent />
    </Instancias>
  );
};

/** Cena 4 — A explosão: mesmo mapa da Cena 1, agora brotam apps iguais. */
export const Cena04: React.FC<PropsCena> = ({ cena, cue }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const fMundo = cue("mundo");
  const fFim = cena.duracaoFrames - 14;
  const cuesPaises = PAISES.map((p) => cue(p.cue));

  const itens: Inst[] = [];
  for (const ic of ICONES_MAPA) {
    // densidade crescente: poucos no começo, enxurrada no fim
    let nasce = fMundo + Math.sqrt(ic.u) * (fFim - fMundo);
    PAISES.forEach((p, i) => {
      const d = Math.hypot(ic.pos[0] - p.pos[0], ic.pos[2] - p.pos[2]);
      if (d < 0.95) nasce = Math.min(nasce, cuesPaises[i] + ic.u * 12);
    });
    const s = interpolate(frame, [nasce, nasce + 9], [0, 1], { ...clamp, easing: saltar });
    if (s <= 0) continue;
    itens.push({ pos: ic.pos, rot: [INCLINACAO_ICONE, 0, 0], escala: 0.3 * s });
  }

  const some = 1 - prog(frame, fMundo - 4, fMundo + 14, Easing.in(Easing.cubic));
  const p = prog(frame, fMundo, fFim, Easing.in(Easing.cubic));
  const contador = Math.floor(p * 48213);

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <ThreeCanvas width={width} height={height}>
        <Camera {...CAM_MAPA} />
        <Luzes />
        <Mapa />
        {/* as pirâmides da Cena 1 dão lugar aos apps */}
        {some > 0.01
          ? LOCAIS.map((l) => (
              <group key={l.nome} position={l.pos} scale={1.1 * some}>
                <Piramide tipo={l.tipo} />
              </group>
            ))
          : null}
        {PAISES.map((pa, i) => (
          <Anel key={pa.nome} pos={pa.pos} p={(frame - cuesPaises[i]) / 30} cor="#8E9AFF" raio={1.5} />
        ))}
        <IconesMapa itens={itens} />
      </ThreeCanvas>

      {/* três apps "diferentes", mesmo ícone */}
      <div style={{ position: "absolute", left: SEGURO.lado, top: 270, fontFamily }}>
        {APPS.map((a, i) => {
          const f = frame - cue(a.cue);
          if (f < 0) return null;
          const s = spring({ frame: f, fps, config: { damping: 15, stiffness: 180 } });
          return (
            <div
              key={a.nome}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                marginBottom: 26,
                opacity: interpolate(f, [0, 4], [0, 1], clamp),
                transform: `translateX(${(1 - s) * -60}px)`,
              }}
            >
              <IconeApp tamanho={80} />
              <span style={{ fontWeight: 800, fontSize: 44, color: COR.texto, letterSpacing: -1 }}>{a.nome}</span>
            </div>
          );
        })}
      </div>

      {/* contador */}
      {frame >= fMundo ? (
        <div
          style={{
            position: "absolute",
            right: SEGURO.lado,
            top: 290,
            textAlign: "right",
            fontFamily,
            opacity: interpolate(frame, [fMundo, fMundo + 8], [0, 1], clamp),
          }}
        >
          <div
            style={{
              fontWeight: 900,
              fontSize: 96,
              color: COR.texto,
              letterSpacing: -3,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {contador.toLocaleString("pt-BR")}
          </div>
          <div style={{ fontWeight: 700, fontSize: 28, color: COR.textoSuave, letterSpacing: 6, marginTop: 8 }}>
            VERSÕES IGUAIS
          </div>
        </div>
      ) : null}

      {PAISES.map((pa, i) => {
        const f = frame - cuesPaises[i];
        if (f < 0) return null;
        const pt = projetar(CAM_MAPA, [pa.pos[0], 0.9, pa.pos[2]], width, height);
        return (
          <div
            key={pa.nome}
            style={{
              position: "absolute",
              left: pt.x - 120,
              top: pt.y - 54,
              width: 240,
              textAlign: "center",
              fontFamily,
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 5,
              color: COR.texto,
              textShadow: "0 2px 14px #000, 0 0 4px #000",
              opacity: interpolate(f, [0, 6, 40, 55], [0, 1, 1, 0.0], clamp),
            }}
          >
            {pa.nome}
          </div>
        );
      })}
      <Legenda palavras={cena.palavras} />
    </AbsoluteFill>
  );
};
