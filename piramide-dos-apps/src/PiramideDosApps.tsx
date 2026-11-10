import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Cena01 } from "./cenas/Cena01";
import { Cena02 } from "./cenas/Cena02";
import { Cena03 } from "./cenas/Cena03";
import { Cena04 } from "./cenas/Cena04";
import { Cena05 } from "./cenas/Cena05";
import { Cena06 } from "./cenas/Cena06";
import { Cena07 } from "./cenas/Cena07";
import type { PropsCena } from "./lib/cena";
import { COR, FPS } from "./lib/tema";
import { criarCue, type DadosCena } from "./lib/tempo";

export type PropsVideo = {
  cenas: DadosCena[];
  /** Liga/desliga trilha e efeitos de public/sfx. */
  sfx: boolean;
};

const CENAS: React.FC<PropsCena>[] = [Cena01, Cena02, Cena03, Cena04, Cena05, Cena06, Cena07];

const DUR_DRONE = 12 * FPS;

export const PiramideDosApps: React.FC<PropsVideo> = ({ cenas, sfx }) => {
  const frame = useCurrentFrame();
  const inicios: number[] = [];
  cenas.reduce((acc, c) => {
    inicios.push(acc);
    return acc + c.duracaoFrames;
  }, 0);
  const total = inicios[6] + cenas[6].duracaoFrames;
  const cues = cenas.map((c, i) => criarCue(i, c));
  const em = (i: number, palavra: string, ocorrencia = 0, desloc = 0) =>
    inicios[i] + cues[i](palavra, ocorrencia) + desloc;

  // Efeitos presos às palavras do roteiro (frames globais).
  const efeitos: { f: number; som: string; vol: number }[] = [
    ...["Egito", "Maias", "Peru", "Camboja"].map((p) => ({ f: em(0, p), som: "tum", vol: 0.55 })),
    { f: em(0, "mesma"), som: "impacto", vol: 0.5 },
    { f: em(1, "cair", 0, 4), som: "impacto", vol: 0.6 },
    { f: em(1, "Base", 0, -22), som: "whoosh", vol: 0.35 },
    { f: em(1, "Base"), som: "tum", vol: 0.4 },
    { f: em(1, "ponta"), som: "clique", vol: 0.5 },
    { f: em(2, "código", 0, -4), som: "whoosh", vol: 0.5 },
    ...["barato", "rápido", "acessível"].map((p) => ({ f: em(2, p), som: "clique", vol: 0.7 })),
    { f: em(3, "mundo"), som: "whoosh", vol: 0.4 },
    ...["Gestor", "App", "Lista"].map((p) => ({ f: em(3, p), som: "clique", vol: 0.6 })),
    { f: em(3, "Milhares"), som: "impacto", vol: 0.4 },
    { f: inicios[4] + 4, som: "whoosh", vol: 0.45 },
    { f: em(4, "base"), som: "tum", vol: 0.45 },
    { f: em(4, "ponta"), som: "tum", vol: 0.45 },
    ...["Distribuição", "Dados", "Marca", "Comunidade", "problema"].map((p) => ({
      f: em(5, p, 0, 5),
      som: "tum",
      vol: 0.55,
    })),
    { f: em(6, "Me"), som: "clique", vol: 0.4 },
  ];

  // Trilha: corte seco antes da última frase da Cena 6; volta suave na Cena 7.
  const corte = em(5, "Porque", 0, -6);
  const volTrilha =
    frame < corte
      ? interpolate(frame, [0, 20], [0, 0.22], { extrapolateRight: "clamp" })
      : frame < inicios[6]
        ? 0
        : interpolate(frame, [inicios[6], inicios[6] + 40, total - 24, total - 2], [0, 0.2, 0.2, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      {cenas.map((c, i) => {
        const Cena = CENAS[i];
        return (
          <Sequence key={c.id} from={inicios[i]} durationInFrames={c.duracaoFrames} name={c.id}>
            {c.temAudio ? <Audio src={staticFile(`audio/${c.id}.wav`)} /> : null}
            <Cena cena={c} cue={cues[i]} />
          </Sequence>
        );
      })}

      {sfx ? (
        <>
          {Array.from({ length: Math.ceil(total / DUR_DRONE) }, (_, i) => (
            <Sequence key={i} from={i * DUR_DRONE} durationInFrames={DUR_DRONE} name="trilha" layout="none">
              <Audio src={staticFile("sfx/trilha.wav")} volume={volTrilha} />
            </Sequence>
          ))}
          {efeitos.map((e, i) => (
            <Sequence key={i} from={Math.max(0, e.f)} durationInFrames={60} name={e.som} layout="none">
              <Audio src={staticFile(`sfx/${e.som}.wav`)} volume={e.vol} />
            </Sequence>
          ))}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
