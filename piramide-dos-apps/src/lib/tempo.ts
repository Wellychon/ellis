import { FPS, RESPIRO_S } from "./tema";
import roteiroJson from "../../roteiro/roteiro.json";

/** Formato dos timestamps do Gradium (text, start_s, stop_s). */
export type Palavra = { text: string; start_s: number; stop_s: number };

export type DadosCena = {
  id: string;
  palavras: Palavra[];
  duracaoFrames: number;
  /** true quando existe public/audio/<id>.wav */
  temAudio: boolean;
};

export const ROTEIRO: { id: string; titulo: string; narracao: string }[] = roteiroJson;

export const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

/**
 * Estima os timestamps de cada palavra a partir do texto, respeitando as tags
 * <break time="0.4s" />. Usado enquanto os áudios do Gradium não existem, e
 * como plano B quando uma palavra-chave não aparece nos timestamps reais.
 */
export const estimarPalavras = (narracao: string): Palavra[] => {
  const tokens = narracao.match(/<break[^>]*\/>|[^\s<]+/g) ?? [];
  const palavras: Palavra[] = [];
  let t = 0.15;
  for (const tok of tokens) {
    const pausa = tok.match(/<break\s+time="([\d.]+)s"/);
    if (pausa) {
      t += Number(pausa[1]);
      continue;
    }
    const letras = normalizar(tok).length;
    const dur = 0.06 + 0.046 * letras;
    palavras.push({ text: tok, start_s: t, stop_s: t + dur });
    t += dur + 0.02;
    if (/[.?!:]$/.test(tok)) t += 0.3;
    else if (/,$/.test(tok)) t += 0.14;
  }
  return palavras;
};

export const duracaoDe = (palavras: Palavra[], audioS?: number) => {
  const fim = audioS ?? (palavras.at(-1)?.stop_s ?? 1) + 0.15;
  return Math.ceil((fim + RESPIRO_S) * FPS);
};

export const cenasEstimadas = (): DadosCena[] =>
  ROTEIRO.map((c) => {
    const palavras = estimarPalavras(c.narracao);
    return { id: c.id, palavras, duracaoFrames: duracaoDe(palavras), temAudio: false };
  });

/**
 * Devolve o frame (relativo à cena) em que uma palavra começa a ser falada.
 * `ocorrencia` escolhe a n-ésima aparição (0 = primeira).
 * Se a palavra não existir nos timestamps reais, usa a estimativa do roteiro
 * escalada para a duração real da cena.
 */
export const criarCue = (indice: number, cena: DadosCena) => {
  const estimadas = estimarPalavras(ROTEIRO[indice].narracao);
  const fimEstimado = estimadas.at(-1)?.stop_s ?? 1;
  const fimReal = cena.palavras.at(-1)?.stop_s ?? fimEstimado;

  const achar = (lista: Palavra[], alvo: string, ocorrencia: number) => {
    let n = 0;
    for (const p of lista) {
      if (normalizar(p.text) === alvo) {
        if (n === ocorrencia) return p;
        n++;
      }
    }
    return null;
  };

  return (palavra: string, ocorrencia = 0, fim = false): number => {
    const alvo = normalizar(palavra);
    const real = achar(cena.palavras, alvo, ocorrencia);
    if (real) return Math.round((fim ? real.stop_s : real.start_s) * FPS);
    const est = achar(estimadas, alvo, ocorrencia);
    if (!est) throw new Error(`Palavra "${palavra}" não existe no roteiro da ${cena.id}`);
    const s = ((fim ? est.stop_s : est.start_s) / fimEstimado) * fimReal;
    return Math.round(s * FPS);
  };
};

export type Cue = ReturnType<typeof criarCue>;
