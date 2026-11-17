"use client";

import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Seg } from "./kit";
import type { Img, Item, Spec } from "@/lib/engine/spec";
import s from "./Page.module.css";

/* eslint-disable @next/next/no-img-element -- fotos de acervos externos, já no tamanho certo */

/** Foto com revelação no scroll. Fotos de acervo aberto ganham duotone na cor da marca (fontes diferentes, mesma cara). */
export function Pic({ img, eager, className = "" }: { img: Img; eager?: boolean; className?: string }) {
  return (
    <div data-pic className={`${s.pic} ${img.duo ? s.duo : ""} ${className}`}>
      <img src={img.src} alt={img.alt} loading={eager ? "eager" : "lazy"} decoding="async" fetchPriority={eager ? "high" : "auto"} referrerPolicy="no-referrer" />
    </div>
  );
}

/** Título em palavras (pra subir uma a uma). Com accent, a segunda metade ganha a cor de destaque. */
export const words = (t: string, accent = false) => {
  const ws = t.split(/\s+/).filter(Boolean);
  const from = Math.ceil(ws.length / 2);
  return ws.map((w, i) => (
    <span key={i} className={`${s.w} ${accent && i >= from ? s.acc : ""}`}><span data-w>{w}</span></span>
  ));
};

/** Na prévia os botões não levam a lugar nenhum de verdade: mostram o que a página final faria. */
export function useToast() {
  const [msg, setMsg] = useState("");
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = (m: string) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(""), 3200); };
  // vai pra raiz da página (fora dos blocos animados, que prenderiam o "fixed")
  const [host, setHost] = useState<HTMLElement | null>(null);
  const probe = <span ref={(el) => { const h = el?.closest<HTMLElement>("[data-engine]") ?? null; if (h !== host) setHost(h); }} hidden />;
  const box = <div role="status" aria-live="polite" className={`${s.toast} ${msg ? s.toastOn : ""}`}>{msg}</div>;
  return { show, node: <>{probe}{host ? createPortal(box, host) : null}</> };
}

/* ---------- Serviços em linhas grandes: a foto do item segue o cursor ---------- */
export function HoverRows({ items, pics }: { items: Item[]; pics: Img[] }) {
  const box = useRef<HTMLDivElement>(null);
  const fig = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(-1);
  useEffect(() => {
    if (!pics.length || !fig.current || matchMedia("(hover: none)").matches) return;
    const el = fig.current, root = box.current!;
    const qx = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3" }), qy = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3" });
    const move = (e: PointerEvent) => { const r = root.getBoundingClientRect(); qx(e.clientX - r.left); qy(e.clientY - r.top); };
    root.addEventListener("pointermove", move);
    return () => root.removeEventListener("pointermove", move);
  }, [pics.length]);
  return (
    <div ref={box} className={s.rows} onPointerLeave={() => setOn(-1)}>
      <ul>
        {items.map((it, i) => (
          <li key={it.name} className={`${s.row} ${on === i ? s.rowOn : ""}`} onPointerEnter={() => setOn(i)}>
            <h3 className={s.rowName}>{it.name}</h3>
            <p className={s.rowDesc}>{it.desc}</p>
            {it.price && <span className={s.price}>{it.price}</span>}
          </li>
        ))}
      </ul>
      {pics.length > 0 && (
        <div ref={fig} className={`${s.follow} ${on >= 0 ? s.followOn : ""}`} aria-hidden>
          {pics.map((p, i) => (
            <img key={p.src} src={p.src} alt="" loading="lazy" referrerPolicy="no-referrer" className={`${p.duo ? s.duoImg : ""} ${on >= 0 && i === on % pics.length ? s.followPic : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Simulador de orçamento ---------- */
const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const priceOf = (p: string) => {
  const m = p.replace(/\./g, "").match(/(\d+(?:,\d+)?)/);
  return m ? Number(m[1].replace(",", ".")) : NaN;
};

export function Estimator({ spec }: { spec: Spec }) {
  const items = useMemo(() => spec.services.items.filter((x) => !Number.isNaN(priceOf(x.price))), [spec.services.items]);
  const [sel, setSel] = useState<number[]>(() => (items.length ? [0] : []));
  const total = sel.reduce((a, i) => a + priceOf(items[i].price), 0);
  const out = useRef<HTMLSpanElement>(null);
  const shown = useRef(total);
  const toast = useToast();
  useEffect(() => {
    const o = { v: shown.current };
    const t = gsap.to(o, { v: total, duration: 0.6, ease: "power3.out", onUpdate: () => { shown.current = o.v; if (out.current) out.current.textContent = money(Math.round(o.v)); } });
    return () => { t.kill(); };
  }, [total]);
  const from = items.some((x) => /partir/i.test(x.price));
  return (
    <div className={s.feature}>
      <div className={s.featureHead}>
        <h2 className={s.h2}>{spec.feature.title}</h2>
        {spec.feature.text && <p className={s.lead}>{spec.feature.text}</p>}
        <p className={s.total}><span ref={out}>{money(total)}</span>{from && <small>valor inicial estimado</small>}</p>
        <button type="button" className={s.btn} data-mag disabled={!sel.length}
          onClick={() => toast.show(`Na página de verdade, isso abre o WhatsApp da ${spec.brand} com o orçamento já escrito.`)}>
          Enviar orçamento
        </button>
      </div>
      <ul className={s.picks}>
        {items.map((it, i) => {
          const on = sel.includes(i);
          return (
            <li key={it.name}>
              <button type="button" aria-pressed={on} className={`${s.pick} ${on ? s.pickOn : ""}`}
                onClick={() => setSel((v) => (on ? v.filter((x) => x !== i) : [...v, i]))}>
                <span className={s.check} aria-hidden />
                <span className={s.pickName}>{it.name}</span>
                <span className={s.pickPrice}>{it.price}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {toast.node}
    </div>
  );
}

/* ---------- Agenda ---------- */
const DAY = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export function Booking({ spec }: { spec: Spec }) {
  const { days: open, open: o, close: c } = spec.contact;
  const [base] = useState(() => new Date());
  const dates = useMemo(() => {
    const ok = open.length ? open : [1, 2, 3, 4, 5, 6];
    const out: Date[] = [];
    for (let i = 1; out.length < 6 && i < 21; i++) { const d = new Date(base); d.setDate(base.getDate() + i); if (ok.includes(d.getDay())) out.push(d); }
    return out;
  }, [open, base]);
  const slots = useMemo(() => {
    const [h1] = o.split(":").map(Number), [h2] = c.split(":").map(Number);
    const out: string[] = [];
    for (let h = h1; h < (h2 > h1 ? h2 : h1 + 9) && out.length < 10; h++) out.push(`${String(h).padStart(2, "0")}:00`);
    return out;
  }, [o, c]);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState(-1);
  const [svc, setSvc] = useState(0);
  const toast = useToast();
  const d = dates[day];
  return (
    <div className={s.feature}>
      <div className={s.featureHead}>
        <h2 className={s.h2}>{spec.feature.title}</h2>
        {spec.feature.text && <p className={s.lead}>{spec.feature.text}</p>}
        <p className={s.summary}>
          {spec.services.items[svc]?.name}<br />
          {d && `${DAY[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`}{slot >= 0 ? ` às ${slots[slot]}` : ", escolha o horário"}
        </p>
        <button type="button" className={s.btn} data-mag disabled={slot < 0}
          onClick={() => toast.show(`Na página de verdade, isso manda a reserva pro WhatsApp da ${spec.brand}.`)}>
          Reservar horário
        </button>
      </div>
      <div className={s.agenda}>
        <Seg id="svc" label="Serviço" className={s.chips} itemClass={s.chip} items={spec.services.items.slice(0, 4).map((_, i) => i)}
          value={svc} onChange={setSvc} render={(i) => spec.services.items[i].name} />
        <Seg id="day" label="Dia" className={s.days} itemClass={s.day} items={dates.map((_, i) => i)}
          value={day} onChange={(i) => { setDay(i); setSlot(-1); }} render={(i) => <><span>{DAY[dates[i].getDay()]}</span><b>{dates[i].getDate()}</b></>} />
        <Seg id="slot" label="Horário" className={s.slots} itemClass={s.slot} items={slots.map((_, i) => i)}
          value={slot} onChange={setSlot} render={(i) => slots[i]} />
      </div>
      {toast.node}
    </div>
  );
}

/* ---------- Depoimentos: um de cada vez, grande ---------- */
export function Quotes({ quotes }: { quotes: Spec["quotes"] }) {
  const [i, setI] = useState(0);
  const q = quotes[i];
  if (!q) return null;
  return (
    <div className={s.quotes}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.blockquote key={i} className={s.quote}
          initial={{ opacity: 0, y: 22, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
          transition={{ duration: 0.42, ease: [0.2, 0.75, 0.2, 1] }}>
          <p>“{q.text}”</p>
          <footer><b>{q.name}</b>{q.detail && <span>{q.detail}</span>}</footer>
        </motion.blockquote>
      </AnimatePresence>
      <Seg id="quote" label="Depoimentos" className={s.qnav} itemClass={s.qbtn} items={quotes.map((_, k) => k)} value={i} onChange={setI} render={(k) => quotes[k].name} />
      <p className={s.fine}>Depoimentos de exemplo, escritos para esta prévia.</p>
    </div>
  );
}

/* ---------- Nome em partículas que fogem do cursor ---------- */
export function Particles({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, W = 0, H = 0, dpr = 1, gap = 3;
    let pts: { x: number; y: number; hx: number; hy: number; vx: number; vy: number; a: boolean }[] = [];
    const mouse = { x: -9999, y: -9999 };
    const cs = getComputedStyle(cv);
    const ink = cs.getPropertyValue("--ink").trim() || "#111", ac = cs.getPropertyValue("--ac").trim() || "#f50";

    const build = async () => {
      const fam = cs.fontFamily, weight = cs.fontWeight || "700";
      try { await document.fonts.load(`${weight} 120px ${fam}`); } catch {}
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const o = off.getContext("2d")!;
      const label = cs.textTransform === "uppercase" ? text.toUpperCase() : text;
      let size = H * 0.5;
      o.font = `${weight} ${size}px ${fam}`;
      const w = o.measureText(label).width;
      size = Math.min(size, (size * W * 0.9) / w);
      o.font = `${weight} ${size}px ${fam}`;
      o.textAlign = "center"; o.textBaseline = "middle"; o.fillStyle = "#000";
      o.fillText(label, W / 2, H * 0.46);
      const data = o.getImageData(0, 0, W, H).data;
      const step = (gap = Math.max(2, Math.round(Math.sqrt((W * H) / (W < 700 ? 9000 : 16000)) * 0.62)));
      const next: typeof pts = [];
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) next.push({ x: reduce ? x : Math.random() * W, y: reduce ? y : Math.random() * H, hx: x, hy: y, vx: 0, vy: 0, a: Math.random() < 0.12 });
      }
      pts = next;
    };
    const frame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const r = Math.min(W, H) * 0.16;
      for (const p of pts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < r * r) { const f = (1 - Math.sqrt(d2) / r) * 2.4; p.vx += (dx / (Math.sqrt(d2) + 0.1)) * f; p.vy += (dy / (Math.sqrt(d2) + 0.1)) * f; }
        p.vx += (p.hx - p.x) * 0.05; p.vy += (p.hy - p.y) * 0.05;
        p.vx *= 0.82; p.vy *= 0.82;
        p.x += p.vx; p.y += p.vy;
      }
      const sz = Math.max(1.5, gap * 0.62);
      ctx.fillStyle = ink;
      for (const p of pts) if (!p.a) ctx.fillRect(p.x, p.y, sz, sz);
      ctx.fillStyle = ac;
      for (const p of pts) if (p.a) ctx.fillRect(p.x, p.y, sz, sz);
      raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top; };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    let alive = true;
    build().then(() => { if (alive) frame(); });
    const ro = new ResizeObserver(() => { build(); });
    ro.observe(cv);
    window.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); };
  }, [text]);
  return <canvas ref={ref} className={s.particles} aria-hidden />;
}
