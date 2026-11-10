import { useMemo } from "react";
import * as THREE from "three";
import { COR } from "./tema";

const P1 = "M50 50 L50 24 A26 26 0 1 1 26.5 39 Z";
const P2 = "M46 45 L23.5 33 A26 26 0 0 1 46 19 Z";

/**
 * Ícone genérico de app (desenho próprio, não é logo de ninguém): gráfico de pizza.
 * Sem cor de propósito: é o app commodity. Cor, no vídeo, só para quem sobe na pirâmide.
 */
export const IconeApp: React.FC<{ tamanho: number; style?: React.CSSProperties }> = ({ tamanho, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={style}>
    <rect x="2" y="2" width="96" height="96" rx="23" fill={COR.texto} />
    <Pizza />
  </svg>
);

export const Pizza: React.FC<{ cor?: string }> = ({ cor = COR.fundo }) => (
  <>
    <path d={P1} fill={cor} />
    <path d={P2} fill={cor} opacity={0.45} />
  </>
);

/** Mesma arte, como textura para os ícones 3D do mapa. */
export const useTexturaIcone = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.scale(1.28, 1.28);
    g.fillStyle = COR.texto;
    g.beginPath();
    g.roundRect(2, 2, 96, 96, 23);
    g.fill();
    g.fillStyle = COR.fundo;
    g.fill(new Path2D(P1));
    g.globalAlpha = 0.45;
    g.fill(new Path2D(P2));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
