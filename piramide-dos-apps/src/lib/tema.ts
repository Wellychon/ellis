import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Marca Overflow: três famílias, servidas de public/fonts (o render não depende de rede).
/** Display / headlines: Space Grotesk 500–700, tracking negativo. */
export const fontFamily = "Space Grotesk";
/** Editorial: Instrument Serif, somente itálico, para uma palavra de destaque. */
export const fontSerif = "Instrument Serif";
/** Operacional: JetBrains Mono, sempre maiúsculas com tracking positivo. */
export const fontMono = "JetBrains Mono";

loadFont({ family: fontFamily, url: staticFile("fonts/SpaceGrotesk-latin.woff2"), weight: "300 700", format: "woff2" });
loadFont({
  family: fontSerif,
  url: staticFile("fonts/InstrumentSerif-Italic-latin.woff2"),
  weight: "400",
  style: "italic",
  format: "woff2",
});
loadFont({ family: fontMono, url: staticFile("fonts/JetBrainsMono-latin.woff2"), weight: "100 800", format: "woff2" });

export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1920;
/** Respiro depois de cada áudio, em segundos. */
export const RESPIRO_S = 0.3;

/**
 * Paleta Overflow. Neste vídeo: ink e paper como base, blue e acid como destaque
 * (nunca os três destaques juntos; red alert fica de fora).
 * Os cinzas da pedra são só tons entre ink e paper.
 */
export const COR = {
  fundo: "#0A0A0A", // Deep Ink
  texto: "#F4F2EC", // Bone Paper
  azul: "#0000FF", // Overflow Blue: a camada "nicho"
  acid: "#E5FF00", // Acid Signal: a ponta, a palavra atual
  textoSuave: "#8A8A8A", // mute
  pedra: "#8A8A8A",
  pedraClara: "#B4B3AF",
  pedraEscura: "#5C5C5C",
} as const;

/** Estilo de label operacional (mono, maiúsculas, tracking positivo). */
export const MONO: React.CSSProperties = {
  fontFamily: fontMono,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

/** Palavra de destaque editorial (serif itálico). */
export const SERIF: React.CSSProperties = {
  fontFamily: fontSerif,
  fontStyle: "italic",
  fontWeight: 400,
  letterSpacing: "-0.01em",
};

/** Áreas que a interface do Reels/Shorts cobre: nada importante aqui. */
export const SEGURO = { topo: 230, rodape: 400, lado: 70 } as const;
