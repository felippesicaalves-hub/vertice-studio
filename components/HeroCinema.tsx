"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { cinema, setCinemaNiche } from "./CinemaScene";
import { openLive } from "./LiveSite";
import { SITES } from "./sites";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CinemaScene = dynamic(() => import("./CinemaScene"), { ssr: false });

/**
 * Abertura 3D: navegadores inclinados com as páginas feitas à mão. A seção tem 320vh e o palco fica grudado:
 * 0–15%  título · 15–85% a câmera mergulha na tela · 35–95% a página rola dentro dela · 70%+ chamada final.
 * Trocar o nicho gira a janela; "Experimentar ao vivo" abre a página funcionando.
 */
export default function HeroCinema() {
  const root = useRef<HTMLElement>(null);
  const [idx, setIdx] = useState(0);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (st) => { cinema.p = st.progress; },
      });
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { gsap.set("[data-c]", { autoAlpha: 1 }); return; }

      gsap.from("[data-a] [data-w]", { y: 30, autoAlpha: 0, filter: "blur(14px)", stagger: 0.07, duration: 1.1, ease: "power3.out", delay: 0.2, clearProps: "filter" });
      gsap.from("[data-hint], [data-chips]", { autoAlpha: 0, y: 12, delay: 1.1, duration: 0.8, stagger: 0.1 });

      gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      })
        // o título sai inteiro (não palavra por palavra, que ainda podem estar entrando)
        .to("[data-a]", { y: -40, autoAlpha: 0, filter: "blur(12px)", duration: 0.12 }, 0)
        .to("[data-hint]", { autoAlpha: 0, duration: 0.1 }, 0)
        .to("[data-chips]", { y: 30, autoAlpha: 0, duration: 0.08 }, 0.66)
        .fromTo("[data-c]", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14 }, 0.7)
        .to({}, { duration: 0.16 });
    },
    { scope: root },
  );

  const pick = (i: number) => {
    setIdx(i);
    setCinemaNiche(i);
  };

  const words = (t: string, gold?: string) => (
    <>
      {t.split(" ").map((x, i) => (
        <span key={i} data-w className="inline-block">{x}&nbsp;</span>
      ))}
      {gold && <span data-w className="serif inline-block text-gold">{gold}</span>}
    </>
  );

  return (
    <section ref={root} id="top" className="cinema relative h-[320vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <CinemaScene />

        <div className="pointer-events-none relative z-10 pt-[100px] text-center md:pt-[110px]">
          <h1 data-a className="title mx-auto max-w-[16ch] px-4 text-[40px] text-sand sm:text-[60px] md:text-[80px]">
            {words("Landing pages que fazem você", "vender.")}
          </h1>
          <p data-hint className="eyebrow mt-4 text-sand/55">role pra entrar na página ↓</p>
        </div>

        {/* troca de nicho + ao vivo */}
        <div data-chips className="absolute inset-x-0 bottom-[3%] z-20 flex flex-col items-center gap-2.5 px-3">
          <button
            onClick={() => openLive(idx)}
            className="group flex items-center gap-2 rounded-full border border-gold/50 bg-wine-2/80 px-4 py-2 text-sm font-medium text-sand backdrop-blur-md transition-colors hover:border-gold hover:bg-wine-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            Experimentar ao vivo: {SITES[idx].label}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-sand/15 bg-wine-2/85 p-1 backdrop-blur-md">
            {SITES.map((st, i) => (
              <button
                key={st.id}
                onClick={() => pick(i)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-300 sm:px-4 sm:py-2 sm:text-sm ${
                  idx === i ? "bg-gold text-wine-2" : "text-sand/75 hover:text-sand"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* fim da timeline: proposta + CTA (compacta pra não tampar a página no celular) */}
        <div data-c className="invisible absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-wine-2 via-wine-2/90 to-transparent pb-6 pt-16 text-center md:pb-10 md:pt-28">
          <h2 className="title mx-auto max-w-[20ch] px-4 text-[24px] text-sand sm:text-[36px] md:text-[48px]">
            A sua empresa merece uma página <span className="serif text-gold">assim.</span>
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2 px-4 md:mt-6 md:gap-3">
            <a href="#gerador" className="btn btn-gold" data-magnetic>Gerar minha prévia <span className="arrow">→</span></a>
            <button onClick={() => openLive(idx)} className="btn btn-ghost-light">Brincar com esta página</button>
          </div>
        </div>
      </div>
    </section>
  );
}
