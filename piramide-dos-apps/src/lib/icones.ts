import { PONTOS_TERRA } from "./Mapa";
import { semente } from "./anim";

export const TOTAL_ICONES = 420;
/** Inclinação que deixa o ícone de frente para a câmera do mapa. */
export const INCLINACAO_ICONE = -0.92;

/**
 * Ícones espalhados pelo mapa: sorteio fixo por semente, então a Cena 4 termina
 * e a Cena 5 começa exatamente com os mesmos ícones nos mesmos lugares.
 */
export const ICONES_MAPA: { pos: [number, number, number]; u: number }[] = (() => {
  const r = semente(42);
  const visiveis = PONTOS_TERRA.filter((p) => p[0] > -3.45 && p[0] < 3.85 && p[2] > -2.9 && p[2] < 2.6);
  const copia = [...visiveis];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, TOTAL_ICONES).map((p) => ({
    pos: [p[0] + (r() - 0.5) * 0.03, 0.2, p[2] + (r() - 0.5) * 0.03] as [number, number, number],
    u: r(),
  }));
})();
