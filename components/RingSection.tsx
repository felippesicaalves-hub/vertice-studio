"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { ring } from "./RingScene";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const RingScene = dynamic(() => import("./RingScene"), { ssr: false });
const WORDS = ["imersivas.", "interativas.", "animadas.", "que vendem."];

/** "Páginas imersivas / interativas / animadas / que vendem." + carrossel 3D arrastável. */
export default function RingSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (st) => { ring.p = st.progress; },
      });
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // palavra que troca: sai pra cima desfocando, a próxima entra de baixo nítida
      const words = gsap.utils.toArray<HTMLElement>("[data-word]");
      gsap.set(words, { yPercent: 60, autoAlpha: 0, filter: "blur(10px)" });
      gsap.set(words[0], { yPercent: 0, autoAlpha: 1, filter: "blur(0px)" });
      const tl = gsap.timeline({ repeat: -1, paused: true });
      words.forEach((w, i) => {
        const next = words[(i + 1) % words.length];
        tl.to(w, { yPercent: -60, autoAlpha: 0, filter: "blur(10px)", duration: 0.55, ease: "power3.in" }, "+=1.6")
          .fromTo(next, { yPercent: 60, autoAlpha: 0, filter: "blur(10px)" }, { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" }, "-=0.2");
      });
      ScrollTrigger.create({ trigger: root.current, start: "top 80%", end: "bottom top", onToggle: (st) => (st.isActive ? tl.play() : tl.pause()) });

      gsap.from("[data-ring-head] > *", {
        y: 30, autoAlpha: 0, filter: "blur(12px)", stagger: 0.1, duration: 1, ease: "power3.out", clearProps: "filter",
        scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="portfolio" className="relative overflow-hidden bg-sand pb-10 pt-28 md:pt-36">
      <div data-ring-head className="container-x relative z-10 text-center">
        <p className="eyebrow mb-5 text-wine/60">Portfólio de conceitos</p>
        <h2 className="title text-[44px] text-wine sm:text-[64px] md:text-[92px]">
          Páginas{" "}
          <span className="relative inline-grid align-baseline">
            {WORDS.map((w, i) => (
              <span key={w} data-word className={`serif col-start-1 row-start-1 whitespace-nowrap text-gold ${i ? "invisible" : ""}`}>
                {w}
              </span>
            ))}
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-[48ch] text-[17px] leading-relaxed text-wine/70">
          Cada nicho com identidade própria. <strong className="font-semibold text-wine">Arraste</strong> pra girar e <strong className="font-semibold text-wine">clique</strong> num cartão pra brincar com a página.
        </p>
      </div>

      <div className="relative -mt-[6svh] h-[62svh] min-h-[420px] md:-mt-[10svh] md:h-[80svh]">
        <RingScene />
        {/* sombra no chão pra "assentar" o carrossel */}
        <div className="pointer-events-none absolute inset-x-[10%] bottom-[6%] h-16 rounded-[50%] bg-wine/25 blur-3xl" />
      </div>

      <p className="eyebrow pointer-events-none text-center text-wine/50">← arraste →</p>
    </section>
  );
}
