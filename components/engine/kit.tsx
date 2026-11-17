"use client";

// Peças de acabamento do motor:
// - Lenis (rolagem suave, sincronizada com o ScrollTrigger do GSAP)
// - Motion (FAQ que abre com altura animada, números que contam)
// - componentes no estilo Magic UI, feitos pro motor: faixa de fotos, grade bento, celular com o app
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { AnimatePresence, animate, motion, useInView } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Img, Spec } from "@/lib/engine/spec";
import s from "./Page.module.css";
import { Pic, words } from "./parts";

/* eslint-disable @next/next/no-img-element -- fotos externas, já no tamanho certo */

const EASE = [0.2, 0.75, 0.2, 1] as const;

/** Rolagem suave em toda a página (menos pra quem pediu menos movimento). */
export function useLenis() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -80 }, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
}

/**
 * Título que cabe de verdade: mede as linhas na tela e acha o maior tamanho que fica em no máximo `lines` linhas,
 * sem palavra estourando e sem passar de `max` px (nem de `maxVh` da altura da tela).
 */
export function FitTitle({ text, lines = 2, max = 190, min = 34, maxVh = 1, accent = false, className, as = "h1" }: {
  text: string; lines?: number; max?: number; min?: number; maxVh?: number; accent?: boolean; className: string; as?: "h1" | "h2";
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!;
    let alive = true;
    const fit = () => {
      if (!alive || !el.clientWidth) return;
      const spans = Array.from(el.querySelectorAll<HTMLElement>(`.${s.w}`));
      const ok = (px: number) => {
        el.style.fontSize = `${px}px`;
        if (el.scrollWidth > el.clientWidth + 1) return false;
        return new Set(spans.map((x) => x.offsetTop)).size <= lines;
      };
      let lo = min, hi = Math.min(max, innerHeight * maxVh);
      if (!ok(lo)) { el.style.fontSize = `${lo}px`; return; }
      for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
      el.style.fontSize = `${Math.floor(lo)}px`;
      ScrollTrigger.refresh();
    };
    fit();
    document.fonts.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    return () => { alive = false; ro.disconnect(); };
  }, [text, lines, max, min, maxVh]);
  const Tag = as;
  return <Tag ref={ref} data-h1={as === "h1" ? "" : undefined} data-end={as === "h2" ? "" : undefined} className={className}>{words(text, accent)}</Tag>;
}

/** Faixa de fotos correndo (estilo Magic UI Marquee), para no hover. */
export function PhotoMarquee({ pics, captions }: { pics: Img[]; captions: string[] }) {
  const row = [...pics, ...pics];
  return (
    <div className={s.pmarquee} aria-label="Fotos">
      <div className={s.pmTrack}>
        {row.map((p, i) => (
          <figure key={i} className={s.pmItem} aria-hidden={i >= pics.length}>
            <div className={`${s.pic} ${p.duo ? s.duo : ""}`}><img src={p.src} alt={i < pics.length ? p.alt : ""} loading="lazy" referrerPolicy="no-referrer" /></div>
            {captions[i % pics.length] && <figcaption>{captions[i % pics.length]}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Serviços em grade bento: células de tamanhos diferentes, as grandes com foto. */
export function Bento({ spec, pics }: { spec: Spec; pics: Img[] }) {
  const items = spec.services.items;
  return (
    <div className={s.bento} data-rise>
      {items.map((it, i) => {
        const pic = i === 0 || i === 3 ? pics[i === 0 ? 0 : 1] : undefined;
        return (
          <article key={it.name} className={`${s.cell} ${s[`cell${i}`] ?? ""} ${pic ? s.cellPic : ""}`}>
            {pic && <Pic img={pic} className={s.cellImg} />}
            <div className={s.cellBody}>
              <h3>{it.name}</h3>
              <p>{it.desc}</p>
              {it.price && <span className={s.price}><Ticker text={it.price} /></span>}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Celular com a "tela do app" montada com os dados da página (estilo Magic UI iPhone). */
export function Phone({ spec }: { spec: Spec }) {
  const items = spec.services.items.slice(0, 4);
  return (
    <div className={s.phone} aria-label={`Tela do app ${spec.brand}`}>
      <div className={s.phoneScreen}>
        <div className={s.notch} />
        <p className={s.appBrand}>{spec.brand}</p>
        <p className={s.appBig}>{items[0]?.price || items[0]?.name}</p>
        <p className={s.appSub}>{items[0]?.name}</p>
        <ul className={s.appList}>
          {items.map((it, i) => (
            <motion.li key={it.name} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.12, duration: 0.5, ease: EASE }}>
              <span>{it.name}</span><b>{it.price}</b>
            </motion.li>
          ))}
        </ul>
        <span className={s.appBtn}>{spec.hero.cta}</span>
      </div>
    </div>
  );
}

/** Números dentro de um texto contam do zero quando aparecem ("R$ 120" → conta até 120). */
export function Ticker({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const m = text.match(/^(.*?)(\d[\d.]*)(.*)$/);
  const target = m ? Number(m[2].replace(/\./g, "")) : NaN;
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    if (!inView || Number.isNaN(target) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = animate(0, target, { duration: 1.2, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, target]);
  if (!m || Number.isNaN(target)) return <span ref={ref}>{text}</span>;
  const shown = n === null ? m[2] : n.toLocaleString("pt-BR");
  return <span ref={ref}>{m[1]}<span style={{ fontVariantNumeric: "tabular-nums" }}>{shown}</span>{m[3]}</span>;
}

/** Perguntas: abre com altura animada (Motion), uma de cada vez. */
export function Faq({ faq }: { faq: Spec["faq"] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className={s.faqList} data-rise>
      {faq.map((x, i) => {
        const on = open === i;
        return (
          <div key={x.q} className={`${s.qa} ${on ? s.qaOn : ""}`}>
            <h3 className={s.qaH}>
              <button type="button" aria-expanded={on} onClick={() => setOpen(on ? -1 : i)}>
                {x.q}<span aria-hidden className={s.plus} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} style={{ overflow: "hidden" }}>
                  <p>{x.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/** Grupo de botões com o destaque deslizando até o escolhido (layoutId do Motion). */
export function Seg<T extends string | number>({ items, value, onChange, label, render, className, itemClass, id }: {
  items: T[]; value: T; onChange: (v: T) => void; label: string; render: (v: T) => ReactNode; className: string; itemClass: string; id: string;
}) {
  return (
    <div className={className} role="group" aria-label={label}>
      {items.map((v) => (
        <button key={String(v)} type="button" aria-pressed={v === value} className={`${itemClass} ${v === value ? s.segOn : ""}`} onClick={() => onChange(v)}>
          {v === value && <motion.span layoutId={id} className={s.segPill} transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
          <span className={s.segLabel}>{render(v)}</span>
        </button>
      ))}
    </div>
  );
}
