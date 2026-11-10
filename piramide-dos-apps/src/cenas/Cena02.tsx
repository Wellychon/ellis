import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo } from "react";
import { Camera } from "../lib/Camera";
import { Instancias, type Inst } from "../lib/Instancias";
import { Legenda } from "../lib/Legenda";
import { Luzes, Piramide } from "../lib/Piramides";
import { clamp, lerp, prog, semente } from "../lib/anim";
import type { PropsCena } from "../lib/cena";
import { COR } from "../lib/tema";
import * as THREE from "three";

const B = 0.6; // lado do bloco da torre
const N_TORRE = 9;
const P = 0.8; // lado do bloco da pirâmide
const CAMADAS = 4;
const G = 0.014; // gravidade em unidades/frame²

const misturar = (a: string, b: string, t: number) =>
  "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

/** Cena 2 — Por que pirâmide: a torre reta cai; a base larga fica de pé. */
export const Cena02: React.FC<PropsCena> = ({ cena, cue }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const fEmpilhar = cue("empilhar");
  const fQueda = cue("sem") - 4;
  const fCorte = cue("cair", 0, true) + 8;
  const fBase = cue("Base");
  const fPonta = cue("ponta");
  const fTodo = cue("todo");

  // ---------- Fase A: torre ----------
  const torre: Inst[] = [];
  if (frame < fCorte) {
    const tq = Math.max(0, frame - fQueda);
    const T_QUEBRA = 18;
    const anguloEm = (t: number) => 0.5 * (t / T_QUEBRA) ** 2.6;
    const balanco =
      Math.sin(frame * 0.35) * 0.012 * prog(frame, fEmpilhar, fQueda, Easing.in(Easing.quad));
    const teta = tq <= T_QUEBRA ? anguloEm(tq) + balanco : anguloEm(T_QUEBRA);
    const omega = (0.5 * 2.6) / T_QUEBRA; // rad/frame no instante da quebra
    const r = semente(7);
    for (let i = 0; i < N_TORRE; i++) {
      const aparece = 4 + (i / N_TORRE) * (fEmpilhar - 4);
      if (frame < aparece) break;
      const h = (i + 0.5) * B;
      const entra = spring({ frame: frame - aparece, fps, config: { damping: 14, stiffness: 160 } });
      let x = h * Math.sin(teta);
      let y = h * Math.cos(teta) + (1 - entra) * 1.6;
      let rot = -teta;
      const giro = 0.05 + r() * 0.09;
      const espalha = (r() - 0.5) * 1.2;
      if (tq > T_QUEBRA) {
        const tau = tq - T_QUEBRA;
        const vx = omega * h * Math.cos(teta) * 0.75;
        const vy = -omega * h * Math.sin(teta);
        const y0 = h * Math.cos(teta);
        // instante em que toca o chão: y0 + vy·τ − ½g·τ² = B/2
        const tauChao = (vy + Math.sqrt(vy * vy + 2 * G * (y0 - B / 2))) / G;
        const tt = Math.min(tau, tauChao);
        x = h * Math.sin(teta) + vx * tt;
        y = y0 + vy * tt - 0.5 * G * tt * tt;
        rot = -teta - giro * tt;
        if (tau > tauChao) {
          const d = tau - tauChao;
          y = B / 2 + Math.abs(Math.sin(d * 0.5)) * 0.35 * Math.exp(-d * 0.22);
          x += vx * 5 * (1 - Math.exp(-d / 5));
          const alvo = Math.round(rot / (Math.PI / 2)) * (Math.PI / 2);
          rot = lerp(rot, alvo, prog(d, 0, 8));
        }
      }
      torre.push({
        pos: [x - 0.6, y, espalha * prog(tq, T_QUEBRA, T_QUEBRA + 20)],
        rot: [0, 0, rot],
        escala: B * 0.96 * entra,
        cor: i % 2 ? "#8C8377" : "#9A9082",
      });
    }
  }

  // ---------- Fase B: pirâmide ----------
  const alvos = useMemo(() => {
    const r = semente(11);
    const lista: { alvo: [number, number, number]; ini: [number, number, number]; rot: number; camada: number; u: number }[] = [];
    for (let c = 0; c < CAMADAS; c++) {
      const n = CAMADAS - c;
      for (let ix = 0; ix < n; ix++)
        for (let iz = 0; iz < n; iz++)
          lista.push({
            alvo: [(ix - (n - 1) / 2) * P, (c + 0.5) * P, (iz - (n - 1) / 2) * P],
            ini: [(r() - 0.5) * 6.5, P / 2, (r() - 0.5) * 4],
            rot: (r() - 0.5) * 3,
            camada: c,
            u: r(),
          });
    }
    return lista;
  }, []);

  const tb = frame - fCorte;
  const janela = Math.max(20, fBase - 8 - fCorte);
  const brilhoBase = interpolate(frame, [fBase - 2, fBase + 6, fPonta - 2, fPonta + 8], [0, 1, 1, 0.15], clamp);
  const brilhoPonta = interpolate(frame, [fPonta - 2, fPonta + 6], [0, 1], clamp);
  const piramide: Inst[] =
    tb < 0
      ? []
      : alvos.map((b) => {
          const inicio = (b.camada / CAMADAS) * janela * 0.55 + b.u * janela * 0.15;
          const p = prog(tb, inicio, inicio + janela * 0.4);
          const arco = Math.sin(Math.PI * p) * 1.4;
          let cor = b.camada % 2 ? "#8C8377" : "#978D80";
          if (b.camada === 0) cor = misturar(cor, COR.douradoClaro, brilhoBase * 0.85);
          if (b.camada === CAMADAS - 1) cor = misturar(cor, COR.dourado, brilhoPonta);
          return {
            pos: [lerp(b.ini[0], b.alvo[0], p), lerp(b.ini[1], b.alvo[1], p) + arco, lerp(b.ini[2], b.alvo[2], p)],
            rot: [0, b.rot * (1 - p), b.rot * 0.4 * (1 - p)],
            escala: P * 0.95,
            cor,
          };
        });

  // ---------- Câmera ----------
  const tremor =
    frame > fQueda + 24 && frame < fCorte
      ? Math.sin(frame * 2.3) * 0.06 * Math.exp(-(frame - fQueda - 24) * 0.18)
      : 0;
  const orbita = lerp(-0.5, 0.25, prog(frame, fCorte, cena.duracaoFrames, Easing.out(Easing.quad)));
  const recuo = prog(frame, fTodo - 10, fTodo + 30);
  const dist = 12 + recuo * 3.5;
  const cam =
    frame < fCorte
      ? { pos: [0.3, 2.4 + tremor, 15] as [number, number, number], alvo: [0.3, 1.76, 0] as [number, number, number], fov: 40 }
      : {
          pos: [Math.sin(orbita) * dist, 3.4 + recuo * 0.8, Math.cos(orbita) * dist] as [number, number, number],
          alvo: [0, 0.7 + recuo * 0.5, 0] as [number, number, number],
          fov: 40,
        };

  const vizinhas: { tipo: "lisa" | "degraus" | "templo"; pos: [number, number, number] }[] = [
    { tipo: "degraus", pos: [-4.4, 0, -4.5] },
    { tipo: "templo", pos: [4.3, 0, -3.6] },
    { tipo: "lisa", pos: [0.6, 0, -8.5] },
  ];
  const flashCorte = interpolate(frame, [fCorte - 3, fCorte, fCorte + 5], [0, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <ThreeCanvas width={width} height={height}>
        <Camera {...cam} />
        <Luzes />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <circleGeometry args={[14, 48]} />
          <meshStandardMaterial color="#15151B" roughness={1} />
        </mesh>
        <Instancias itens={frame < fCorte ? torre : piramide} max={40}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={1} flatShading />
        </Instancias>
        {vizinhas.map((v, i) => {
          const s = spring({ frame: frame - fTodo - i * 7, fps, config: { damping: 13, stiffness: 120 } });
          return s > 0.001 ? (
            <group key={i} position={v.pos} scale={2.6 * s}>
              <Piramide tipo={v.tipo} />
            </group>
          ) : null;
        })}
      </ThreeCanvas>
      <AbsoluteFill style={{ backgroundColor: COR.fundo, opacity: flashCorte }} />
      <Legenda palavras={cena.palavras} />
    </AbsoluteFill>
  );
};
