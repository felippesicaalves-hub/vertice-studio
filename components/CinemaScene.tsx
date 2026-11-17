"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { BrowserCard, GOLD, useInView } from "./three-kit";

/** Progresso do scroll do hero (0 → 1) e nicho atual: escritos pelo HeroCinema, lidos a cada quadro. */
export const cinema = { p: 0, niche: 0 };
export const setCinemaNiche = (n: number) => { cinema.niche = n; };

const N = 5; // páginas feitas à mão (components/sites), na ordem de SITES
const damp = THREE.MathUtils.damp;
const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function tex() {
  const t = new THREE.Texture();
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Texturas num singleton de módulo (o React Compiler não deixa mutar valor de hook).
 * Tela principal: print da página inteira (public/showcase/long-k.jpg), mostrando 16:10 por vez
 * pra dar pra "rolar" dentro dela. Laterais: o topo de outras páginas.
 */
let T: ReturnType<typeof build> | null = null;
function build() {
  const main = tex(), l = tex(), r = tex();
  const imgs: (HTMLImageElement | null)[] = Array(N).fill(null);
  const tops: (HTMLImageElement | null)[] = Array(N).fill(null);
  let cur = 0;
  const load = (src: string, cb: (im: HTMLImageElement) => void) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => cb(im);
    im.src = src;
  };
  const apply = (t: THREE.Texture, im: HTMLImageElement | null, long: boolean) => {
    if (!im) return;
    t.image = im;
    if (long) {
      const ry = Math.min(1, (im.naturalWidth * 0.625) / im.naturalHeight);
      t.repeat.set(1, ry);
      t.offset.set(0, 1 - ry);
    }
    t.needsUpdate = true;
  };
  const show = (n: number) => {
    cur = n;
    apply(main, imgs[n], true);
    apply(l, tops[(n + 1) % N], false);
    apply(r, tops[(n + 2) % N], false);
  };
  for (let k = 0; k < N; k++) {
    load(`/showcase/long-${k}.jpg`, (im) => { imgs[k] = im; if (k === cur) apply(main, im, true); });
    load(`/showcase/${k * 2}.jpg`, (im) => {
      tops[k] = im;
      if (k === (cur + 1) % N) apply(l, im, false);
      if (k === (cur + 2) % N) apply(r, im, false);
    });
  }
  return { main, l, r, show };
}
const getTex = () => (T ??= build());

function Scene() {
  const main = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const smoothP = useRef(0);
  const shown = useRef(0);
  const flip = useRef(1); // 1 = parado; < 1 = girando pra trocar de página

  useFrame((state, dt) => {
    const t = getTex();
    smoothP.current = damp(smoothP.current, cinema.p, 6, dt);
    const p = smoothP.current;
    const { pointer, camera, size } = state;

    // troca de nicho: a janela gira, e no meio do giro a página muda
    if (cinema.niche !== shown.current && flip.current >= 1) flip.current = 0;
    if (flip.current < 1) {
      const before = flip.current;
      flip.current = Math.min(1, flip.current + dt * 2.6);
      if (before < 0.5 && flip.current >= 0.5) { shown.current = cinema.niche; t.show(cinema.niche); }
    }
    const f = Math.sin(flip.current * Math.PI);

    // câmera: começa longe, mergulha na tela (e enquadra a janela em telas estreitas)
    const dive = smooth(0.15, 0.85, p);
    const fitX = Math.tan(THREE.MathUtils.degToRad(16)) * (size.width / size.height);
    camera.position.z = THREE.MathUtils.lerp(Math.max(9.2, 2.7 / fitX), Math.max(5.25, 2.3 / fitX), dive);
    camera.position.y = THREE.MathUtils.lerp(0.35, -0.1, dive);
    camera.lookAt(0, THREE.MathUtils.lerp(0.55, -0.12, dive), 0);

    // navegador principal: inclinado → de frente; mouse inclina um pouco
    if (main.current) {
      const g = main.current;
      g.rotation.x = damp(g.rotation.x, THREE.MathUtils.lerp(0.32, 0, smooth(0, 0.5, p)) - pointer.y * 0.06 * (1 - dive), 5, dt);
      g.rotation.y = damp(g.rotation.y, THREE.MathUtils.lerp(-0.22, 0, smooth(0, 0.5, p)) + pointer.x * 0.1 * (1 - dive), 5, dt);
      g.children[0].rotation.y = f * 0.9;
      g.scale.setScalar(1 - f * 0.06);
    }
    // a página rola dentro da tela
    const H = 1 - t.main.repeat.y;
    t.main.offset.y = H - smooth(0.35, 0.95, p) * H;

    // janelas laterais se afastam enquanto a câmera entra
    const out = smooth(0.1, 0.6, p);
    if (left.current) { left.current.position.x = -3.9 - out * 3; left.current.rotation.y = 0.55 + out * 0.4; }
    if (right.current) { right.current.position.x = 3.9 + out * 3; right.current.rotation.y = -0.55 - out * 0.4; }
  });

  const t = getTex();
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 6]} intensity={1.4} />
      <pointLight position={[0, -2.6, 1.5]} intensity={18} color={GOLD} distance={9} />
      <group ref={main} position={[0, -0.3, 0]}>
        <BrowserCard texture={t.main} w={4.6} />
      </group>
      <group ref={left} position={[-3.9, -0.15, -2.4]} rotation={[0.2, 0.55, 0]}>
        <BrowserCard texture={t.l} w={3.4} />
      </group>
      <group ref={right} position={[3.9, -0.15, -2.4]} rotation={[0.2, -0.55, 0]}>
        <BrowserCard texture={t.r} w={3.4} />
      </group>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2.5} color={GOLD} position={[0, -4, 2]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[5, 3, 1]} />
      </Environment>
    </>
  );
}

export default function CinemaScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap);
  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={inView ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.35, 9.2], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
        eventSource={document.body}
        eventPrefix="client"
      >
        <Scene />
      </Canvas>
    </div>
  );
}
