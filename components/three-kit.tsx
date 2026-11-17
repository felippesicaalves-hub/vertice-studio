"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

export const GOLD = "#C9A15B";
export const WINE = "#3A1520";
export const SAND = "#EFE8DD";

/** Pausa o render loop quando a cena não está visível (economiza bateria/GPU). */
export function useInView<T extends Element>(ref: React.RefObject<T | null>, margin = "200px") {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return inView;
}

export function canvasTexture(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Print de uma página real da vitrine (public/showcase). Volta na hora e se atualiza ao carregar. */
const loader = typeof window !== "undefined" ? new THREE.TextureLoader() : null;
export function imageTexture(url: string, mip = true) {
  const t = loader!.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (!mip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}

/** Quando as fontes da página carregam, redesenha as texturas (senão o canvas usa fonte padrão). */
export function onFontsReady(fn: () => void) {
  if (typeof document !== "undefined" && document.fonts) document.fonts.ready.then(fn);
}

/**
 * Janela de navegador com espessura real: corpo com verniz, barra com 3 bolinhas e a tela.
 * Proporção da tela 16:10. `w` é a largura total.
 */
export function BrowserCard({ texture, w = 3.2, body = "#1d0a10", back = false, ...props }: { texture: THREE.Texture; w?: number; body?: string; back?: boolean } & React.ComponentProps<"group">) {
  const bar = w * 0.045;
  const sw = w * 0.96;
  const sh = sw / 1.6;
  const h = sh + bar + w * 0.04;
  const dots = useMemo(() => [-0.46, -0.43, -0.4].map((k) => k * w), [w]);
  return (
    <group {...props}>
      <RoundedBox args={[w, h, w * 0.035]} radius={w * 0.02} smoothness={4} castShadow>
        <meshPhysicalMaterial color={body} roughness={0.35} metalness={0.2} clearcoat={1} clearcoatRoughness={0.15} />
      </RoundedBox>
      {dots.map((x, i) => (
        <mesh key={i} position={[x, h / 2 - bar * 0.75, w * 0.018]}>
          <circleGeometry args={[w * 0.008, 16]} />
          <meshBasicMaterial color={["#ff5f57", "#febc2e", "#28c840"][i]} />
        </mesh>
      ))}
      <mesh position={[0, h / 2 - bar * 0.75, w * 0.018]}>
        <planeGeometry args={[w * 0.32, bar * 0.6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </mesh>
      <mesh position={[0, -bar / 2 + w * 0.005, w * 0.0181]}>
        <planeGeometry args={[sw, sh]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {back && (
        <mesh position={[0, -bar / 2 + w * 0.005, -w * 0.0181]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[sw, sh]} />
          <meshBasicMaterial map={texture} toneMapped={false} color="#b9a9a0" />
        </mesh>
      )}
    </group>
  );
}
