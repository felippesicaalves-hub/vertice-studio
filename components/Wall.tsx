"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { SHOTS } from "@/lib/showcase";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const COLS = 5;
const PER = 5;
const SPEED = [-14, 10, -20, 8, -12]; // % de deslocamento de cada coluna durante o scroll

/** Print de uma das páginas da vitrine (public/showcase). */
function Thumb({ i }: { i: number }) {
  const s = SHOTS[(i * 3) % SHOTS.length]; // embaralha pra não repetir em fila
  return (
    <div data-tilt className="overflow-hidden rounded-xl bg-wine-2 shadow-[0_30px_60px_-25px_rgba(42,14,22,.6)] ring-1 ring-wine/10 [transform-style:preserve-3d]">
      <div className="flex h-4 items-center gap-1 bg-[#1d0a10] px-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f57]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#febc2e]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={s.src}
        alt={`Página de ${s.niche.toLowerCase()}`}
        loading="lazy"
        decoding="async"
        width={960}
        height={600}
        className="block aspect-[16/10] w-full object-cover object-top"
        style={{ background: s.bg }}
      />
    </div>
  );
}

export default function Wall() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.utils.toArray<HTMLElement>("[data-col]").forEach((col, i) => {
        gsap.fromTo(col, { yPercent: -SPEED[i] / 2 }, {
          yPercent: SPEED[i] / 2,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.4 },
        });
      });
      // a parede "deita" um pouco mais conforme rola (centralização em % pra sobreviver a resize)
      gsap.set("[data-plane]", { xPercent: -50, yPercent: -50, x: 0, y: 0, rotateZ: -14 });
      gsap.fromTo("[data-plane]", { rotateX: 38, scale: 1.1 }, {
        rotateX: 24, scale: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: 0.5 },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[110svh] min-h-[720px] overflow-hidden bg-sand-2">
      <div className="absolute inset-0 [perspective:1400px]">
        <div
          data-plane
          className="absolute left-1/2 top-1/2 grid w-[180vw] max-w-[2400px] gap-4 md:w-[130vw] md:gap-6"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, transform: "translate(-50%,-50%) rotateX(28deg) rotateZ(-14deg)", transformStyle: "preserve-3d" }}
        >
          {Array.from({ length: COLS }, (_, c) => (
            <div key={c} data-col className="flex flex-col gap-4 md:gap-6" style={{ transformStyle: "preserve-3d" }}>
              {Array.from({ length: PER }, (_, r) => <Thumb key={r} i={c * 3 + r * 7} />)}
            </div>
          ))}
        </div>
      </div>

      {/* véu pra dar leitura ao título */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_50%,rgba(239,232,221,.96),rgba(239,232,221,.55)_60%,transparent)]" />

      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
        <p data-reveal className="eyebrow mb-5 text-wine/60">Um estilo pra cada negócio</p>
        <h2 data-split className="title max-w-[14ch] text-[48px] text-wine md:text-[96px]">
          Nada de template. <span className="serif text-gold">Tudo sob medida.</span>
        </h2>
        <p data-reveal className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-wine/70">
          Pizzaria, clínica, barbearia, pet shop. Cada página nasce com a cara, as cores e o tom de voz do seu cliente.
        </p>
      </div>
    </section>
  );
}
