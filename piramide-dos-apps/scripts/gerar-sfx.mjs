// Sintetiza trilha e efeitos simples (sem direitos de terceiros) em public/sfx.
// Troque por arquivos de uma biblioteca livre quando quiser: mesmos nomes.
import { mkdirSync, writeFileSync } from "node:fs";

const SR = 44100;
const dir = new URL("../public/sfx/", import.meta.url);
mkdirSync(dir, { recursive: true });

let seed = 1234;
const ruido = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};

const salvar = (nome, dur, fn) => {
  const n = Math.floor(dur * SR);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  const st = {};
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, fn(i / SR, st)));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(new URL(nome, dir), buf);
};

const TAU = Math.PI * 2;

// "tum" seco: seno grave com queda de tom.
salvar("tum.wav", 0.6, (t) => {
  const f = 48 + 70 * Math.exp(-t * 22);
  const fase = TAU * (48 * t + (70 / 22) * (1 - Math.exp(-t * 22)));
  return Math.sin(fase) * Math.exp(-t * 7) * 0.9 * Math.min(1, t * 400) + 0 * f;
});

// impacto: grave longo + ar.
salvar("impacto.wav", 1.6, (t, st) => {
  const fase = TAU * (38 * t + (60 / 12) * (1 - Math.exp(-t * 12)));
  st.lp = (st.lp ?? 0) * 0.9 + ruido() * 0.1;
  return (Math.sin(fase) * Math.exp(-t * 2.6) * 0.85 + st.lp * Math.exp(-t * 9) * 0.6) * Math.min(1, t * 300);
});

// whoosh: ruído filtrado que cresce e some.
salvar("whoosh.wav", 0.7, (t, st) => {
  const env = Math.sin(Math.PI * Math.min(1, t / 0.7)) ** 2;
  const k = 0.02 + 0.25 * env;
  st.lp = (st.lp ?? 0) + k * (ruido() - (st.lp ?? 0));
  return st.lp * env * 1.6;
});

// clique: estalo curto.
salvar("clique.wav", 0.12, (t) => {
  return (Math.sin(TAU * 1900 * t) * 0.5 + Math.sin(TAU * 620 * t) * 0.5) * Math.exp(-t * 90) * 0.8;
});

// trilha: pad grave de 12 s que emenda em loop (todas as frequências fecham ciclos inteiros).
salvar("trilha.wav", 12, (t) => {
  const lfo = 0.75 + 0.25 * Math.sin(TAU * t / 12);
  const lfo2 = 0.6 + 0.4 * Math.sin(TAU * t / 6 + 1);
  return (
    (Math.sin(TAU * 55 * t) * 0.5 +
      Math.sin(TAU * 82.5 * t) * 0.22 * lfo2 +
      Math.sin(TAU * 110.25 * t) * 0.14 * lfo +
      Math.sin(TAU * 165 * t + Math.sin(TAU * 0.25 * t)) * 0.06 * lfo2) *
    0.7
  );
});
console.log("SFX gerados em public/sfx");
