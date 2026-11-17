"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { SITES } from "./sites";
import ScaledSite from "./sites/ScaledSite";

/** Abre a página da vitrine funcionando (de qualquer lugar: hero, carrossel…). */
export function openLive(i: number) {
  window.dispatchEvent(new CustomEvent("live-site", { detail: i }));
}

/** Janela em tela cheia com a página ao vivo: dá pra cortar o cabelo, montar a pizza, escovar o dente… */
export default function LiveSiteModal() {
  const [i, setI] = useState<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = (e: Event) => setI((e as CustomEvent<number>).detail);
    window.addEventListener("live-site", on);
    return () => window.removeEventListener("live-site", on);
  }, []);

  const open = i !== null;
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setI(null); };
    window.addEventListener("keydown", key);
    closeBtn.current?.focus();
    if (panel.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      gsap.fromTo(panel.current, { y: 40, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.5, ease: "power3.out" });
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  if (i === null) return null;
  const site = SITES[i];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Página de ${site.label} ao vivo`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a070d]/85 p-2 backdrop-blur-md sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) setI(null); }}
    >
      <div ref={panel} className="flex w-full max-w-[1200px] flex-col overflow-hidden rounded-[16px] border border-sand/15 bg-[#1d0a10] shadow-[0_60px_140px_-40px_rgba(0,0,0,.9)]">
        <div className="flex items-center gap-2 border-b border-sand/10 px-3 py-2">
          <div className="hidden gap-1.5 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
            {SITES.map((s, k) => (
              <button
                key={s.id}
                onClick={() => setI(k)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-[13px] transition-colors ${k === i ? "bg-gold text-wine-2" : "text-sand/65 hover:text-sand"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            ref={closeBtn}
            onClick={() => setI(null)}
            aria-label="Fechar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sand/70 transition-colors hover:bg-sand/10 hover:text-sand"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <ScaledSite key={site.id} Comp={site.Comp} height="calc(100svh - 110px)" />
      </div>
      <p className="pointer-events-none absolute bottom-1 left-0 right-0 hidden text-center font-mono text-[11px] uppercase tracking-wider text-sand/45 sm:block">
        página de verdade · brinque com ela · esc pra fechar
      </p>
    </div>
  );
}
