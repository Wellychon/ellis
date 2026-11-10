// Uso: node scripts/stills.mjs 30 110 400 ...   (frames globais) → out/stills/f0030.png
// Opcional: BROWSER=/caminho/do/chrome-headless-shell  ESCALA=0.5  GL=swangle (máquina sem GPU)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const frames = process.argv.slice(2).map(Number);
const browserExecutable = process.env.BROWSER || undefined;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({
  serveUrl,
  id: "PiramideDosApps",
  browserExecutable,
  chromiumOptions: { gl: process.env.GL ?? "angle" },
});
console.log(`duração: ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);
let ini = 0;
for (const c of composition.props.cenas) {
  console.log(`${c.id}: começa no frame ${ini}, dura ${c.duracaoFrames}${c.temAudio ? " (áudio)" : " (estimado)"}`);
  ini += c.duracaoFrames;
}
mkdirSync("out/stills", { recursive: true });
for (const frame of frames) {
  const output = `out/stills/f${String(frame).padStart(4, "0")}.png`;
  await renderStill({
    composition,
    serveUrl,
    output,
    frame,
    scale: Number(process.env.ESCALA ?? 0.5),
    browserExecutable,
    chromiumOptions: { gl: process.env.GL ?? "angle" },
  });
  console.log(output);
}
