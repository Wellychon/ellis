import { useMemo } from "react";
import * as THREE from "three";

export const AZUL = "#5F6FFF";
export const AZUL_ESCURO = "#3F4BD1";

/** Ícone genérico de app (desenho próprio, não é logo de ninguém): gráfico de pizza. */
export const IconeApp: React.FC<{ tamanho: number; style?: React.CSSProperties }> = ({ tamanho, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={style}>
    <defs>
      <linearGradient id="gApp" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7C8AFF" />
        <stop offset="1" stopColor={AZUL_ESCURO} />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="96" height="96" rx="23" fill="url(#gApp)" />
    <Pizza />
  </svg>
);

export const Pizza: React.FC<{ cor?: string }> = ({ cor = "#FFFFFF" }) => (
  <>
    <path d="M50 50 L50 24 A26 26 0 1 1 26.5 39 Z" fill={cor} opacity={0.95} />
    <path d="M46 45 L23.5 33 A26 26 0 0 1 46 19 Z" fill={cor} opacity={0.55} />
  </>
);

/** Mesma arte, como textura para os ícones 3D do mapa. */
export const useTexturaIcone = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.scale(1.28, 1.28);
    const grad = g.createLinearGradient(0, 0, 100, 100);
    grad.addColorStop(0, "#7C8AFF");
    grad.addColorStop(1, AZUL_ESCURO);
    g.fillStyle = grad;
    g.beginPath();
    g.roundRect(2, 2, 96, 96, 23);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.95)";
    g.fill(new Path2D("M50 50 L50 24 A26 26 0 1 1 26.5 39 Z"));
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.fill(new Path2D("M46 45 L23.5 33 A26 26 0 0 1 46 19 Z"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
