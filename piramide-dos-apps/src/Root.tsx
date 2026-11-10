import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { PiramideDosApps, type PropsVideo } from "./PiramideDosApps";
import { ALTURA, FPS, LARGURA } from "./lib/tema";
import { cenasEstimadas, duracaoDe, type DadosCena, type Palavra } from "./lib/tempo";

const existe = async (url: string) => {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok && !(r.headers.get("content-type") ?? "").includes("text/html");
  } catch {
    return false;
  }
};

/**
 * Para cada cena: se existir public/audio/cena-XX.wav, a cena dura o áudio + respiro
 * e usa os timestamps de public/captions/cena-XX.json. Sem áudio, cai na estimativa
 * do roteiro, para o vídeo já poder ser animado e revisado antes da voz.
 */
const calculateMetadata: CalculateMetadataFunction<PropsVideo> = async ({ props }) => {
  const cenas: DadosCena[] = await Promise.all(
    cenasEstimadas().map(async (estimada) => {
      const wav = staticFile(`audio/${estimada.id}.wav`);
      const json = staticFile(`captions/${estimada.id}.json`);
      if (!(await existe(wav))) return estimada;
      const audioS = await getAudioDurationInSeconds(wav);
      let palavras: Palavra[] = estimada.palavras;
      if (await existe(json)) {
        palavras = (await (await fetch(json)).json()) as Palavra[];
      } else {
        // Áudio sem timestamps: estica a estimativa para caber no áudio.
        const k = audioS / (estimada.palavras.at(-1)!.stop_s + 0.15);
        palavras = estimada.palavras.map((p) => ({ ...p, start_s: p.start_s * k, stop_s: p.stop_s * k }));
      }
      return { id: estimada.id, palavras, duracaoFrames: duracaoDe(palavras, audioS), temAudio: true };
    }),
  );
  return {
    durationInFrames: cenas.reduce((n, c) => n + c.duracaoFrames, 0),
    props: { ...props, cenas },
  };
};

export const RemotionRoot: React.FC = () => {
  const cenas = cenasEstimadas();
  return (
    <Composition
      id="PiramideDosApps"
      component={PiramideDosApps}
      width={LARGURA}
      height={ALTURA}
      fps={FPS}
      durationInFrames={cenas.reduce((n, c) => n + c.duracaoFrames, 0)}
      defaultProps={{ cenas, sfx: true }}
      calculateMetadata={calculateMetadata}
    />
  );
};
