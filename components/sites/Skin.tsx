"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Skin.module.css";
import { coverage, layer, rand, runToy } from "./toy";

const W = 440, HH = 560;
function arch(ctx: CanvasRenderingContext2D, inset = 0) {
  const r = W / 2 - inset;
  ctx.beginPath();
  ctx.moveTo(inset, HH - inset);
  ctx.lineTo(inset, r + inset);
  ctx.arc(W / 2, r + inset, r, Math.PI, 0);
  ctx.lineTo(W - inset, HH - inset);
  ctx.closePath();
}

type Drop = { x: number; y: number; y0: number; t: number; spread: number; done: boolean };

/** Brinquedo: clique pra pingar o sérum; onde a gota cai, a pele fica uniforme e com viço. */
function Serum({ onEven, reset }: { onEven: (v: number) => void; reset: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const report = useRef(onEven);
  useEffect(() => { report.current = onEven; });

  useEffect(() => {
    const K = 2;
    // pele "depois": lisa, com viço
    const after = layer(W * K, HH * K);
    const a = after.ctx; a.scale(K, K);
    const g = a.createLinearGradient(0, 0, W, HH);
    g.addColorStop(0, "#efcdb3"); g.addColorStop(1, "#dcae90");
    a.fillStyle = g; a.fillRect(0, 0, W, HH);
    const sh = a.createRadialGradient(150, 190, 10, 150, 190, 260);
    sh.addColorStop(0, "rgba(255,245,235,.65)"); sh.addColorStop(1, "rgba(255,245,235,0)");
    a.fillStyle = sh; a.fillRect(0, 0, W, HH);
    // pele "antes": manchas, poros e linhas finas
    const before = layer(W * K, HH * K);
    const b = before.ctx; b.scale(K, K);
    b.fillStyle = "#cf9f82"; b.fillRect(0, 0, W, HH);
    for (let i = 0; i < 60; i++) {
      const x = rand(0, W), y = rand(0, HH), r = rand(18, 60);
      const gg = b.createRadialGradient(x, y, 0, x, y, r);
      const red = Math.random() < 0.5;
      gg.addColorStop(0, red ? "rgba(190,100,85,.35)" : "rgba(150,100,70,.35)"); gg.addColorStop(1, "rgba(0,0,0,0)");
      b.fillStyle = gg; b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fill();
    }
    for (let i = 0; i < 900; i++) {
      b.fillStyle = `rgba(110,70,50,${rand(0.12, 0.3)})`;
      b.beginPath(); b.arc(rand(0, W), rand(0, HH), rand(0.6, 1.6), 0, Math.PI * 2); b.fill();
    }
    b.strokeStyle = "rgba(120,80,60,.22)"; b.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      const x = rand(20, W - 60), y = rand(40, HH - 20);
      b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + rand(15, 30), y + rand(-8, 8), x + rand(40, 70), y + rand(-6, 6)); b.stroke();
    }
    for (let i = 0; i < 18; i++) {
      b.fillStyle = `rgba(140,85,60,${rand(0.3, 0.5)})`;
      b.beginPath(); b.arc(rand(20, W - 20), rand(20, HH - 20), rand(2.5, 5), 0, Math.PI * 2); b.fill();
    }
    const c0 = coverage(before);
    b.globalCompositeOperation = "destination-out";
    const drops: Drop[] = [];
    let checkAt = 0, last = -1;

    const stop = runToy(ref.current!, W, HH, (ctx, dt, p, t) => {
      ctx.save();
      arch(ctx); ctx.clip();
      ctx.drawImage(after.c, 0, 0, W, HH);
      ctx.drawImage(before.c, 0, 0, W, HH);
      ctx.restore();

      if (p.clicked && p.y > 20) drops.push({ x: p.x, y: p.y, y0: p.y - 60, t: 0, spread: 0, done: false });
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.t += dt;
        const fall = Math.min(1, d.t / 0.22);
        if (fall < 1) {
          ctx.fillStyle = "rgba(255,248,236,.95)";
          const y = d.y0 + (d.y - d.y0) * fall * fall;
          ctx.beginPath(); ctx.moveTo(d.x, y - 12); ctx.quadraticCurveTo(d.x + 8, y, d.x, y + 6); ctx.quadraticCurveTo(d.x - 8, y, d.x, y - 12); ctx.fill();
          continue;
        }
        const k = Math.min(1, (d.t - 0.22) / 1.1);
        const e = 1 - (1 - k) ** 3;
        const r = 12 + e * 98;
        const gr = b.createRadialGradient(d.x, d.y, r * 0.55, d.x, d.y, r);
        gr.addColorStop(0, "rgba(0,0,0,.22)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        b.fillStyle = gr; b.beginPath(); b.arc(d.x, d.y, r, 0, Math.PI * 2); b.fill();
        ctx.save(); arch(ctx); ctx.clip();
        ctx.strokeStyle = `rgba(255,250,240,${0.7 * (1 - k)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(d.x, d.y, r * 0.62, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        if (k >= 1) drops.splice(i, 1);
      }
      // moldura em arco
      ctx.strokeStyle = "#2e2724"; ctx.lineWidth = 1.5;
      arch(ctx, 0.75); ctx.stroke();

      // conta-gotas
      if (p.inside) {
        ctx.save();
        ctx.translate(p.x, p.y - 26);
        ctx.rotate(0.18);
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.strokeStyle = "#2e2724"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(-7, -70, 14, 66, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#e9c9a0";
        ctx.beginPath(); ctx.roundRect(-6, -40, 12, 34, 6); ctx.fill();
        ctx.fillStyle = "#2e2724";
        ctx.beginPath(); ctx.roundRect(-10, -104, 20, 36, 9); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(0, 10); ctx.lineTo(4, -4); ctx.fill();
        const pulse = (Math.sin(t * 4) + 1) / 2;
        ctx.fillStyle = "rgba(255,248,236,.95)";
        ctx.beginPath(); ctx.arc(0, 13 + pulse * 2, 3 + pulse * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      if (t > checkAt) {
        checkAt = t + 0.3;
        const v = Math.min(1, Math.max(0, 1 - coverage(before) / c0) * 1.08);
        if (Math.abs(v - last) > 0.01) { last = v; report.current(v); }
      }
    });
    return stop;
  }, [reset]);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: pingue o sérum na pele" />;
}

export const SKIN_COPY: Copy = {
  brand: "Ateliê Pele", links: ["Tratamentos", "Avaliação", "Dúvidas"], navCta: "Agendar",
  kicker: "Estética facial — Campinas", h1: "Pele boa de ver", h1em: "de perto.",
  lead: "Tratamentos faciais pensados pra sua pele, depois de uma avaliação sem pressa. Resultado que aparece sem parecer que você fez alguma coisa.",
  cta: "Agendar avaliação", cta2: "Ver tratamentos", servicesTitle: "Tratamentos",
  services: [
    ["Limpeza de pele profunda", "Extração cuidadosa, máscara calmante e protetor no final."],
    ["Peeling", "Renovação gradual pra manchas e textura irregular."],
    ["Microagulhamento", "Estímulo de colágeno pra marcas e poros dilatados."],
    ["Hidratação facial", "Pra pele que repuxa ou perdeu o brilho."],
  ],
  finalTitle: "Comece pela avaliação.", finalText: "Uma conversa e uma análise da sua pele, antes de qualquer procedimento.", finalCta: "Agendar pelo WhatsApp", toy: true,
};
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export default function Skin({ m, c = SKIN_COPY }: { m: boolean; c?: Copy }) {
  const [v, setV] = useState(0);
  const [reset, setReset] = useState(0);
  const [first, ...rest] = c.brand.split(" ");
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <b className={s.logo}>{first} {rest.length > 0 && <em>{rest.join(" ")}</em>}</b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        <div className={s.copy}>
          <p className={s.kicker}>{c.kicker}</p>
          <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 58 : 112, 25) }}>{c.h1} <em>{c.h1em}</em></h1>
          <p className={s.lead}>{c.lead}</p>
          <div className={s.ctas}>
            <span className={s.btn}>{c.cta}</span>
            <span className={s.link}>{c.cta2}</span>
          </div>
        </div>
        {c.toy ? (
          <figure className={s.fig}>
            <Serum onEven={setV} reset={reset} />
            <figcaption className={s.cap}>
              <span>{v > 0.9 ? "Uniforme e com viço." : v > 0.02 ? `Tom uniforme · ${Math.round(v * 100)}%` : "Clique na pele pra pingar o sérum"}</span>
              {v > 0.9 && <button onClick={() => { setV(0); setReset((r) => r + 1); }}>Recomeçar</button>}
            </figcaption>
          </figure>
        ) : (
          <div className={s.boardWrap} style={{ "--bd-bg": "#2e2724", "--bd-ink": "#efe9e1", "--bd-accent": "#b7c2a8", "--bd-head": "var(--f-cormorant)", "--bd-body": "var(--f-jost)" } as React.CSSProperties}><Board c={c} m={m} /></div>
        )}
      </section>

      <section className={s.list}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <ol>
          {c.services.map(([a, b], i) => (
            <li key={a}><span>{ROMAN[i]}</span><b>{a}</b><p>{b}</p></li>
          ))}
        </ol>
      </section>

      <section className={s.cta}>
        <h2>{c.finalTitle}</h2>
        <p>{c.finalText}</p>
        <span className={s.btnDark}>{c.finalCta}</span>
      </section>
    </div>
  );
}
