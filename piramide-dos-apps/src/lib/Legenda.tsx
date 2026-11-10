import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useMemo } from "react";
import { COR, FPS, fontFamily } from "./tema";
import type { Palavra } from "./tempo";

type Pagina = { palavras: Palavra[]; inicio: number; fim: number };

/** Agrupa em páginas de 2 a 3 palavras, quebrando em pontuação e pausas. */
const paginar = (palavras: Palavra[]): Pagina[] => {
  const paginas: Pagina[] = [];
  let atual: Palavra[] = [];
  const fechar = () => {
    if (atual.length === 0) return;
    paginas.push({ palavras: atual, inicio: atual[0].start_s, fim: atual.at(-1)!.stop_s });
    atual = [];
  };
  palavras.forEach((p, i) => {
    atual.push(p);
    const prox = palavras[i + 1];
    const pontuacao = /[.?!:]$/.test(p.text);
    const pausa = prox ? prox.start_s - p.stop_s > 0.3 : true;
    const chars = atual.reduce((n, w) => n + w.text.length, 0);
    const virgula = /,$/.test(p.text) && atual.length >= 2;
    if (pontuacao || pausa || virgula || atual.length >= 3 || chars >= 16) fechar();
  });
  fechar();
  // Evita página de uma palavra solta quando dá para juntar com a anterior.
  return paginas;
};

/**
 * Legenda palavra por palavra no terço inferior, palavra atual em dourado.
 * `ate` (frame) esconde a legenda a partir dali (ex.: quando a frase vira arte).
 */
export const Legenda: React.FC<{ palavras: Palavra[]; ate?: number }> = ({ palavras, ate }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const paginas = useMemo(() => paginar(palavras), [palavras]);
  if (ate !== undefined && frame >= ate) return null;

  const idx = paginas.findIndex((p, i) => {
    const prox = paginas[i + 1];
    const fim = Math.min(p.fim + 0.45, prox ? prox.inicio : Infinity);
    return t >= p.inicio - 0.04 && t < fim;
  });
  if (idx === -1) return null;
  const pagina = paginas[idx];
  const entrada = interpolate(t, [pagina.inicio - 0.04, pagina.inicio + 0.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 1330,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "0 20px",
          fontFamily,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.15,
          letterSpacing: -1,
          textAlign: "center",
          opacity: entrada,
          transform: `translateY(${(1 - entrada) * 14}px)`,
          textShadow: "0 4px 22px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)",
        }}
      >
        {pagina.palavras.map((p, i) => {
          const ativa = t >= p.start_s - 0.02 && t < p.stop_s + 0.06;
          const dita = t >= p.stop_s + 0.06;
          return (
            <span
              key={i}
              style={{
                color: ativa ? COR.dourado : COR.texto,
                opacity: ativa || dita ? 1 : 0.55,
                transform: `scale(${ativa ? 1.06 : 1})`,
                display: "inline-block",
              }}
            >
              {p.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
