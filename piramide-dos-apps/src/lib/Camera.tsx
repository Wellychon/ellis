import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";

export type Cam = {
  pos: [number, number, number];
  alvo: [number, number, number];
  fov: number;
};

/** Câmera 100% controlada por props (que vêm do frame). */
export const Camera: React.FC<Cam> = ({ pos, alvo, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 200;
    camera.lookAt(...alvo);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
};

const camAux = new THREE.PerspectiveCamera();
const vAux = new THREE.Vector3();

/** Projeta um ponto 3D para pixels da tela, usando a mesma câmera da cena. */
export const projetar = (
  cam: Cam,
  ponto: [number, number, number],
  largura: number,
  altura: number,
) => {
  camAux.fov = cam.fov;
  camAux.aspect = largura / altura;
  camAux.near = 0.1;
  camAux.far = 200;
  camAux.position.set(...cam.pos);
  camAux.lookAt(...cam.alvo);
  camAux.updateProjectionMatrix();
  camAux.updateMatrixWorld();
  vAux.set(...ponto).project(camAux);
  return { x: (vAux.x * 0.5 + 0.5) * largura, y: (-vAux.y * 0.5 + 0.5) * altura };
};

export const misturarCam = (a: Cam, b: Cam, t: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * t) as Cam["pos"],
  alvo: a.alvo.map((v, i) => v + (b.alvo[i] - v) * t) as Cam["alvo"],
  fov: a.fov + (b.fov - a.fov) * t,
});
