import { Easing, interpolate } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 entre dois frames, com easing opcional. */
export const prog = (
  frame: number,
  de: number,
  ate: number,
  easing: (n: number) => number = Easing.inOut(Easing.cubic),
) => interpolate(frame, [de, Math.max(ate, de + 1)], [0, 1], { ...clamp, easing });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** PRNG determinístico (mulberry32): mesma semente, mesmos números em todo frame. */
export const semente = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const saltar = Easing.out(Easing.back(1.6));
