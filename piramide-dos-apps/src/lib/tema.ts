import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Inter variável (OFL) servida de public/fonts: o render não depende de rede.
export const fontFamily = "Inter";
loadFont({
  family: fontFamily,
  url: staticFile("fonts/Inter-latin.woff2"),
  weight: "100 900",
  format: "woff2",
});

export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1920;
/** Respiro depois de cada áudio, em segundos. */
export const RESPIRO_S = 0.3;

export const COR = {
  fundo: "#0B0B0F",
  pedra: "#8C8377",
  pedraClara: "#B5AA9A",
  pedraEscura: "#5E5850",
  dourado: "#E8B04B",
  douradoClaro: "#F6D28A",
  texto: "#F4F1EA",
  textoSuave: "#9A958C",
  bronze: "#A8875A",
} as const;

/** Áreas que a interface do Reels/Shorts cobre: nada importante aqui. */
export const SEGURO = { topo: 230, rodape: 400, lado: 70 } as const;
