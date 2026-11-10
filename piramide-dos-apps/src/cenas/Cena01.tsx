import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera, projetar } from "../lib/Camera";
import { Legenda } from "../lib/Legenda";
import { Anel, CAM_MAPA, Mapa, geo } from "../lib/Mapa";
import { Luzes, Piramide, type TipoPiramide } from "../lib/Piramides";
import { clamp, prog } from "../lib/anim";
import type { PropsCena } from "../lib/cena";
import { COR, MONO, fontFamily } from "../lib/tema";

export const LOCAIS: { nome: string; palavra: string; tipo: TipoPiramide; pos: [number, number, number] }[] = [
  { nome: "EGITO", palavra: "Egito", tipo: "lisa", pos: geo(31, 28) },
  { nome: "MAIAS", palavra: "Maias", tipo: "degraus", pos: geo(-93, 23) },
  { nome: "PERU", palavra: "Peru", tipo: "adobe", pos: geo(-72, -17) },
  { nome: "CAMBOJA", palavra: "Camboja", tipo: "templo", pos: geo(104, 13) },
];

const ESCALA = 1.1;

/** Cena 1 — O gancho: quatro pontos acendem e viram quatro pirâmides. */
export const Cena01: React.FC<PropsCena> = ({ cena, cue }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const tempos = LOCAIS.map((l) => cue(l.palavra));
  const fMesma = cue("mesma");
  const fNunca = cue("nunca");

  // "a mesma coisa": todas pulsam em dourado.
  const pulso = interpolate(frame, [fMesma, fMesma + 6, fMesma + 30], [0, 0.55, 0.12], clamp);
  const cam = {
    ...CAM_MAPA,
    pos: [CAM_MAPA.pos[0], CAM_MAPA.pos[1], CAM_MAPA.pos[2] - prog(frame, 0, cena.duracaoFrames) * 0.5] as [
      number,
      number,
      number,
    ],
  };
  const atual = tempos.reduce((acc, f, i) => (frame >= f ? i : acc), -1);

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <ThreeCanvas width={width} height={height} linear={false}>
        <Camera {...cam} />
        <Luzes />
        <Mapa />
        {LOCAIS.map((l, i) => {
          const f = frame - tempos[i];
          const s = spring({ frame: f, fps, config: { damping: 11, stiffness: 130, mass: 0.8 } });
          const flash = interpolate(f, [0, 4, 22], [0, 0.9, 0], clamp);
          return (
            <group key={l.nome}>
              <Anel pos={l.pos} p={f / 26} cor={COR.acid} raio={1.3} />
              <Anel pos={l.pos} p={(frame - fMesma - i * 2) / 30} cor={COR.acid} raio={1.1} />
              {f >= 0 ? (
                <>
                  <mesh position={[l.pos[0], 0.012, l.pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.07, 20]} />
                    <meshBasicMaterial color={COR.acid} />
                  </mesh>
                  <group position={l.pos} scale={[ESCALA * s, ESCALA * s, ESCALA * s]}>
                    <Piramide tipo={l.tipo} brilho={flash + pulso} />
                  </group>
                </>
              ) : null}
            </group>
          );
        })}
      </ThreeCanvas>

      {/* Nome do lugar, grande, no ritmo da fala */}
      {LOCAIS.map((l, i) => {
        if (i !== atual || frame >= fNunca - 4) return null;
        const f = frame - tempos[i];
        const e = spring({ frame: f, fps, config: { damping: 200 }, durationInFrames: 10 });
        return (
          <div
            key={l.nome}
            style={{
              position: "absolute",
              top: 330,
              width: "100%",
              textAlign: "center",
              fontFamily,
              fontWeight: 700,
              fontSize: 168,
              letterSpacing: "-0.04em",
              color: COR.texto,
              opacity: e,
              transform: `translateY(${(1 - e) * 30}px)`,
            }}
          >
            {l.nome}
          </div>
        );
      })}

      {/* Etiquetas pequenas presas a cada pirâmide */}
      {LOCAIS.map((l, i) => {
        const f = frame - tempos[i];
        if (f < 6) return null;
        const p = projetar(cam, [l.pos[0], 0, l.pos[2] + 0.75], width, height);
        return (
          <div
            key={l.nome}
            style={{
              position: "absolute",
              left: p.x - 150,
              top: p.y,
              width: 300,
              textAlign: "center",
              ...MONO,
              fontSize: 22,
              color: COR.textoSuave,
              opacity: interpolate(f, [6, 16], [0, 1], clamp),
            }}
          >
            {l.nome}
          </div>
        );
      })}
      <Legenda palavras={cena.palavras} />
    </AbsoluteFill>
  );
};
