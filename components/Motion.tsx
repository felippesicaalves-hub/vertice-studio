"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * Coreografia da página guiada por atributos:
 *  data-split          → título palavra a palavra, do desfoque pro nítido
 *  data-reveal         → entrada (desfoque → nítido, leve deslize)
 *  data-stagger        → filhos entram em cascata
 *  data-magnetic       → botão puxado pelo cursor
 *  data-tilt           → cartão inclina em 3D na direção do cursor, com brilho que acompanha
 */
export default function Motion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        SplitText.create(el, {
          type: "words",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, {
              y: 28,
              autoAlpha: 0,
              filter: "blur(14px)",
              duration: 1.1,
              ease: "power3.out",
              stagger: 0.05,
              clearProps: "filter",
              scrollTrigger: { trigger: el, start: "top 85%", once: true },
            }),
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 30,
          autoAlpha: 0,
          filter: "blur(10px)",
          duration: 1,
          ease: "power3.out",
          clearProps: "filter",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((wrap) => {
        gsap.from(wrap.children, {
          y: 50,
          autoAlpha: 0,
          filter: "blur(8px)",
          duration: 1,
          ease: "power3.out",
          stagger: 0.1,
          clearProps: "filter",
          scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
        });
      });
    });

    /* interações de mouse (só em telas com ponteiro fino) */
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const cleanups: (() => void)[] = [];
      const on = (el: HTMLElement, move: (e: PointerEvent) => void, leave: () => void) => {
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      };

      gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
        const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
        const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
        on(el, (e) => {
          const r = el.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * 0.25);
          y((e.clientY - r.top - r.height / 2) * 0.35);
        }, () => { x(0); y(0); });
      });

      gsap.utils.toArray<HTMLElement>("[data-tilt]").forEach((el) => {
        gsap.set(el, { transformPerspective: 900 });
        const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
        const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
        const z = gsap.quickTo(el, "z", { duration: 0.6, ease: "power3.out" });
        // brilho dourado que segue o cursor
        const glare = document.createElement("span");
        glare.setAttribute("aria-hidden", "");
        Object.assign(glare.style, {
          position: "absolute", inset: "0", borderRadius: "inherit", pointerEvents: "none", opacity: "0",
          transition: "opacity .4s", mixBlendMode: "soft-light", zIndex: "2",
        });
        if (getComputedStyle(el).position === "static") el.style.position = "relative";
        el.appendChild(glare);
        on(el, (e) => {
          const r = el.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          ry(nx * 14); rx(-ny * 12); z(30);
          glare.style.opacity = "1";
          glare.style.background = `radial-gradient(420px circle at ${(nx + 0.5) * 100}% ${(ny + 0.5) * 100}%, rgba(226,196,138,.55), transparent 60%)`;
        }, () => { rx(0); ry(0); z(0); glare.style.opacity = "0"; });
        cleanups.push(() => glare.remove());
      });

      return () => cleanups.forEach((c) => c());
    });
  });

  return null;
}
