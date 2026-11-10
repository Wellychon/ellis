import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AZUL_ESCURO, Pizza } from "../lib/IconeApp";
import { Legenda } from "../lib/Legenda";
import { clamp, lerp, prog } from "../lib/anim";
import type { PropsCena } from "../lib/cena";
import { COR, fontFamily } from "../lib/tema";

const PALAVRAS = [
  { texto: "BARATO.", cue: "barato" },
  { texto: "RÁPIDO.", cue: "rápido" },
  { texto: "ACESSÍVEL.", cue: "acessível" },
];

/** Cena 3 — A troca: o bloco de pedra vira ícone de app; três palavras batem na tela. */
export const Cena03: React.FC<PropsCena> = ({ cena, cue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fCodigo = cue("código") - 3;
  const fSobe = cue("construir") - 6;

  const m = spring({ frame: frame - fCodigo, fps, config: { damping: 15, stiffness: 110 } });
  const mLin = prog(frame, fCodigo, fCodigo + 14);
  const sobe = spring({ frame: frame - fSobe, fps, config: { damping: 200 }, durationInFrames: 22 });
  const zoom = lerp(0.92, 1.0, prog(frame, 0, fCodigo));
  const pulso = 1 + Math.sin(Math.PI * mLin) * 0.16;
  const tamanho = 430;
  const escala = zoom * pulso * lerp(1, 0.62, sobe);
  const centroY = lerp(790, 520, sobe);
  const giro = Math.sin(Math.PI * mLin) * -10;
  const raio = lerp(5, 24, m);
  const fRotulo = interpolate(frame, [fCodigo - 2, fCodigo + 8], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      {/* brilho atrás do bloco */}
      <div
        style={{
          position: "absolute",
          left: 540 - 520,
          top: centroY - 520,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(95,111,255,${0.3 * m}) 0%, rgba(232,176,75,${0.1 * (1 - m)}) 30%, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - tamanho / 2,
          top: centroY - tamanho / 2,
          width: tamanho,
          height: tamanho,
          transform: `scale(${escala}) rotate(${giro}deg)`,
          borderRadius: `${raio}%`,
          overflow: "hidden",
          boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 ${90 * m}px rgba(95,111,255,${0.5 * m})`,
        }}
      >
        {/* pedra */}
        <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="gPedra" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#B0A696" />
              <stop offset="1" stopColor="#6B645B" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#gPedra)" />
          <path d="M0 0 H100 L88 12 H12 Z" fill="#fff" opacity="0.13" />
          <path d="M0 100 H100 L88 88 H12 Z" fill="#000" opacity="0.22" />
          <path d="M0 0 L12 12 V88 L0 100 Z" fill="#fff" opacity="0.06" />
          <path d="M100 0 L88 12 V88 L100 100 Z" fill="#000" opacity="0.14" />
          <path d="M30 12 L36 34 L28 50 L40 66" stroke="#4A453E" strokeWidth="1.1" fill="none" opacity="0.7" />
          <path d="M72 88 L66 70 L74 58" stroke="#4A453E" strokeWidth="1.1" fill="none" opacity="0.6" />
          <circle cx="62" cy="30" r="2.2" fill="#5E5850" opacity="0.5" />
          <circle cx="24" cy="74" r="1.6" fill="#5E5850" opacity="0.5" />
          <circle cx="78" cy="42" r="1.2" fill="#5E5850" opacity="0.5" />
        </svg>
        {/* app */}
        <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} style={{ position: "absolute", opacity: mLin }}>
          <defs>
            <linearGradient id="gApp3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7C8AFF" />
              <stop offset="1" stopColor={AZUL_ESCURO} />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#gApp3)" />
          <g opacity={m} transform={`translate(50 50) scale(${lerp(0.6, 1, m)}) translate(-50 -50)`}>
            <Pizza />
          </g>
        </svg>
      </div>

      {/* rótulo: pedra → código */}
      <div
        style={{
          position: "absolute",
          top: 1070,
          width: "100%",
          textAlign: "center",
          fontFamily,
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: 14,
          color: COR.textoSuave,
          opacity: 1 - sobe,
        }}
      >
        <span style={{ opacity: 1 - fRotulo, position: "absolute", left: 0, right: 0 }}>PEDRA</span>
        <span style={{ opacity: fRotulo, color: "#8E9AFF" }}>CÓDIGO</span>
      </div>

      {/* BARATO. RÁPIDO. ACESSÍVEL. */}
      {PALAVRAS.map((p, i) => {
        const f = frame - cue(p.cue);
        if (f < 0) return null;
        const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 220, mass: 0.7 } });
        const ativa = i === PALAVRAS.length - 1 || frame < cue(PALAVRAS[i + 1].cue);
        return (
          <div
            key={p.texto}
            style={{
              position: "absolute",
              top: 760 + i * 150,
              width: "100%",
              textAlign: "center",
              fontFamily,
              fontWeight: 900,
              fontSize: 138,
              letterSpacing: -5,
              lineHeight: 1,
              color: ativa ? COR.dourado : COR.texto,
              opacity: interpolate(f, [0, 3], [0, 1], clamp),
              transform: `scale(${lerp(1.9, 1, s)})`,
            }}
          >
            {p.texto}
          </div>
        );
      })}
      <Legenda palavras={cena.palavras} ate={cue("barato") - 2} />
    </AbsoluteFill>
  );
};
