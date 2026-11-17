"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SHOTS } from "@/lib/showcase";
import { openLive } from "./LiveSite";
import { BrowserCard, GOLD, imageTexture, useInView } from "./three-kit";

/** Estado do carrossel: `p` = progresso do scroll (RingSection), `drag`/`vel` = arrasto do usuário. */
export const ring = { p: 0, drag: 0, vel: 0, dragging: false, tap: null as null | { x: number; y: number } };
const ray = new THREE.Raycaster();

const N = SHOTS.length;
const R = 4.4;
const damp = THREE.MathUtils.damp;

function Card({ i, tex }: { i: number; tex: THREE.Texture }) {
  const g = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const a = (i / N) * Math.PI * 2;
  useFrame((_, dt) => {
    if (!g.current) return;
    const s = damp(g.current.scale.x, hover ? 1.08 : 1, 8, dt);
    g.current.scale.setScalar(s);
    g.current.position.y = damp(g.current.position.y, hover ? 0.18 : 0, 8, dt);
  });
  return (
    <group position={[Math.sin(a) * R, 0, Math.cos(a) * R]} rotation={[0, a, 0]} userData={{ card: i }}>
      <group
        ref={g}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
      >
        <BrowserCard texture={tex} w={2.5} back />
      </group>
    </group>
  );
}

function Scene() {
  const group = useRef<THREE.Group>(null);
  const textures = useMemo(() => SHOTS.map((x) => imageTexture(x.src)), []);

  useFrame((state, dt) => {
    // inércia: solto o dedo, o carrossel continua girando e desacelera
    if (!ring.dragging) {
      ring.drag += ring.vel * dt;
      ring.vel = damp(ring.vel, 0, 2.2, dt);
    }
    // tela em pé (celular): afasta a câmera pra caber o cartão da frente inteiro
    const aspect = state.size.width / state.size.height;
    state.camera.position.z = aspect < 1 ? 12.5 + (1 - aspect) * 15 : 12.5;
    state.camera.lookAt(0, -0.4, 0);
    // toque sem arrastar: descobre qual cartão foi tocado e abre a página ao vivo
    if (ring.tap && group.current) {
      ray.setFromCamera(new THREE.Vector2(ring.tap.x, ring.tap.y), state.camera);
      ring.tap = null;
      let o: THREE.Object3D | null = ray.intersectObject(group.current, true)[0]?.object ?? null;
      while (o && o.userData.card === undefined) o = o.parent;
      if (o) openLive(Math.floor(o.userData.card / 2) % 5);
    }
    const target = ring.drag + ring.p * Math.PI * 1.4 + state.clock.elapsedTime * 0.04;
    if (group.current) {
      group.current.rotation.y = damp(group.current.rotation.y, -target, 7, dt);
      group.current.rotation.x = damp(group.current.rotation.x, 0.06 + state.pointer.y * 0.05, 4, dt);
      group.current.rotation.z = damp(group.current.rotation.z, -state.pointer.x * 0.03, 4, dt);
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 8]} intensity={1.2} />
      <pointLight position={[0, -3, 6]} intensity={14} color={GOLD} distance={14} />
      <group ref={group} position={[0, -0.1, 0]}>
        {textures.map((t, i) => <Card key={i} i={i} tex={t} />)}
      </group>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[0, 4, 6]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} color={GOLD} position={[0, -4, 4]} scale={[10, 2, 1]} />
      </Environment>
    </>
  );
}

export default function RingScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap);

  // arrastar com mouse ou dedo (horizontal); o scroll vertical continua livre no celular
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let lastX = 0, lastT = 0, sx = 0, sy = 0, moved = 0;
    const down = (e: PointerEvent) => {
      ring.dragging = true; ring.vel = 0;
      lastX = sx = e.clientX; sy = e.clientY; moved = 0; lastT = performance.now();
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!ring.dragging) return;
      const now = performance.now();
      moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy));
      const dx = (e.clientX - lastX) / el.clientWidth;
      const d = -dx * Math.PI * 1.6;
      ring.drag += d;
      ring.vel = d / Math.max(0.008, (now - lastT) / 1000);
      lastX = e.clientX; lastT = now;
    };
    const up = (e: PointerEvent) => {
      if (ring.dragging && moved < 8 && e.type === "pointerup") {
        const r = el.getBoundingClientRect();
        ring.tap = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
      }
      ring.dragging = false;
      ring.vel = THREE.MathUtils.clamp(ring.vel, -6, 6);
      el.style.cursor = "grab";
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0 cursor-grab touch-pan-y select-none">
      <Canvas
        frameloop={inView ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 2.4, 12.5], fov: 30 }}
        onCreated={({ camera }) => camera.lookAt(0, -0.4, 0)}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
