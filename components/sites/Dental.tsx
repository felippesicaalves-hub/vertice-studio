"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Dental.module.css";
import { coverage, layer, rand, runToy } from "./toy";

function tooth(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(142, 205);
  ctx.bezierCurveTo(128, 140, 160, 104, 200, 108);
  ctx.bezierCurveTo(222, 110, 230, 128, 240, 128);
  ctx.bezierCurveTo(250, 128, 258, 110, 280, 108);
  ctx.bezierCurveTo(320, 104, 352, 140, 338, 205);
  ctx.bezierCurveTo(332, 240, 330, 270, 328, 300);
  ctx.bezierCurveTo(326, 360, 318, 420, 296, 452);
  ctx.bezierCurveTo(286, 466, 270, 460, 268, 440);
  ctx.bezierCurveTo(264, 400, 262, 350, 240, 340);
  ctx.bezierCurveTo(218, 350, 216, 400, 212, 440);
  ctx.bezierCurveTo(210, 460, 194, 466, 184, 452);
  ctx.bezierCurveTo(162, 420, 154, 360, 152, 300);
  ctx.bezierCurveTo(150, 270, 148, 240, 142, 205);
  ctx.closePath();
}

type Bubble = { x: number; y: number; r: number; life: number; vx: number };

/** Brinquedo: escove o dente até ele brilhar. */
function Brush({ onClean, reset }: { onClean: (v: number) => void; reset: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const report = useRef(onClean);
  useEffect(() => { report.current = onClean; });

  useEffect(() => {
    const K = 2;
    const stain = layer(480 * K, 520 * K);
    const sc = stain.ctx;
    sc.scale(K, K);
    sc.save();
    tooth(sc); sc.clip();
    for (let i = 0; i < 26; i++) {
      const x = rand(150, 330), y = rand(115, 330);
      const g = sc.createRadialGradient(x, y, 0, x, y, rand(25, 55));
      g.addColorStop(0, "rgba(186,150,72,.85)"); g.addColorStop(1, "rgba(186,150,72,0)");
      sc.fillStyle = g; sc.beginPath(); sc.arc(x, y, 60, 0, Math.PI * 2); sc.fill();
    }
    for (let i = 0; i < 70; i++) {
      sc.fillStyle = `rgba(120,90,40,${rand(0.3, 0.6)})`;
      sc.beginPath(); sc.arc(rand(150, 330), rand(115, 300), rand(1.5, 4), 0, Math.PI * 2); sc.fill();
    }
    sc.restore();
    const c0 = coverage(stain);
    const bubbles: Bubble[] = [];
    let clean = 0, checkAt = 0, sparkle = 0, lastSent = -1;
    sc.globalCompositeOperation = "destination-out";

    const stop = runToy(ref.current!, 480, 520, (ctx, dt, p, t) => {
      ctx.fillStyle = "#d8efe6";
      ctx.beginPath(); ctx.arc(240, 270, 230, 0, Math.PI * 2); ctx.fill();
      // dente
      ctx.save();
      ctx.shadowColor = "rgba(14,77,74,.18)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
      tooth(ctx); ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.restore();
      ctx.save();
      tooth(ctx); ctx.clip();
      const g = ctx.createLinearGradient(140, 0, 340, 0);
      g.addColorStop(0, "rgba(14,77,74,.14)"); g.addColorStop(0.3, "rgba(14,77,74,0)"); g.addColorStop(0.75, "rgba(14,77,74,0)"); g.addColorStop(1, "rgba(14,77,74,.16)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 520);
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath(); ctx.ellipse(196, 170, 16, 34, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.drawImage(stain.c, 0, 0, 480, 520);

      const scrub = p.down && p.inside;
      if (scrub) {
        const steps = Math.max(1, Math.ceil(Math.hypot(p.x - p.px, p.y - p.py) / 6));
        for (let i = 0; i <= steps; i++) {
          const x = p.px + ((p.x - p.px) * i) / steps, y = p.py + ((p.y - p.py) * i) / steps;
          const gr = sc.createRadialGradient(x, y, 0, x, y, 30);
          gr.addColorStop(0, "rgba(0,0,0,.5)"); gr.addColorStop(1, "rgba(0,0,0,0)");
          sc.fillStyle = gr; sc.beginPath(); sc.arc(x, y, 30, 0, Math.PI * 2); sc.fill();
        }
        if (Math.hypot(p.x - p.px, p.y - p.py) > 2 && bubbles.length < 140)
          for (let i = 0; i < 2; i++) bubbles.push({ x: p.x + rand(-22, 22), y: p.y + rand(-14, 14), r: rand(3, 11), life: rand(0.8, 1.6), vx: rand(-10, 10) });
      }
      if (t > checkAt) {
        checkAt = t + 0.25;
        clean = Math.min(1, Math.max(0, 1 - coverage(stain) / c0) * 1.06);
        if (Math.abs(clean - lastSent) > 0.01) { lastSent = clean; report.current(clean); }
      }
      // espuma
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.life -= dt; b.y -= 18 * dt; b.x += b.vx * dt;
        if (b.life <= 0) { bubbles.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, b.life * 2);
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.strokeStyle = "rgba(14,77,74,.25)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // brilho quando fica limpo
      if (clean > 0.95) sparkle = Math.min(1, sparkle + dt * 2);
      if (sparkle > 0) {
        for (const [x, y, k] of [[352, 120, 1], [120, 170, 0.7], [330, 330, 0.55], [262, 92, 0.6]]) {
          const r = (10 + Math.sin(t * 5 + x) * 4) * k * sparkle * 2;
          ctx.fillStyle = "#ff7759";
          ctx.beginPath();
          ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
          ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
        }
      }
      // escova
      if (p.inside || p.down) {
        const j = scrub ? Math.sin(t * 40) * 3 : 0;
        ctx.save();
        ctx.translate(p.x + j, p.y);
        ctx.rotate(0.55);
        ctx.fillStyle = "#ff7759";
        ctx.beginPath(); ctx.roundRect(-9, 26, 18, 150, 9); ctx.fill();
        ctx.fillStyle = "#0e4d4a";
        ctx.beginPath(); ctx.roundRect(-12, -6, 24, 40, 6); ctx.fill();
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 4; i++) ctx.fillRect(-10 + i * 5.6, -22, 3.6, 18);
        ctx.restore();
      }
    });
    return stop;
  }, [reset]);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: escove o dente" />;
}

export const DENTAL_COPY: Copy = {
  brand: "Sorrir", links: ["Tratamentos", "Primeira consulta", "Dúvidas"], navCta: "Agendar",
  kicker: "Odontologia de família · Valinhos", h1: "Dentista sem susto,", h1em: "do check-up ao clareamento.",
  lead: "A gente explica cada passo antes de começar e você sai sabendo exatamente o que foi feito. Crianças, adultos e avós na mesma agenda.",
  cta: "Agendar avaliação", cta2: "Tratamentos", servicesTitle: "Tratamentos",
  services: [
    ["Limpeza e prevenção", "Raspagem, polimento e orientação de escovação."],
    ["Clareamento", "No consultório ou com moldeira pra usar em casa."],
    ["Ortodontia", "Aparelho fixo e alinhadores transparentes."],
    ["Implantes", "Planejamento com exame de imagem antes de tudo."],
    ["Odontopediatria", "Primeira consulta com calma, no tempo da criança."],
    ["Canal", "Tratamento com anestesia e acompanhamento."],
  ],
  finalTitle: "Faz tempo que você não vai ao dentista?", finalText: "Sem sermão. Marca uma avaliação e a gente começa do começo.", finalCta: "Marcar pelo WhatsApp", toy: true,
};

export default function Dental({ m, c = DENTAL_COPY }: { m: boolean; c?: Copy }) {
  const [v, setV] = useState(0);
  const [reset, setReset] = useState(0);
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <b className={s.logo}><i />{c.brand}</b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        <div className={s.copy}>
          <p className={s.kicker}>{c.kicker}</p>
          <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 40 : 76, 47) }}>{c.h1} <em>{c.h1em}</em></h1>
          <p className={s.lead}>{c.lead}</p>
          <div className={s.ctas}>
            <span className={s.btn}>{c.cta}</span>
            <span className={s.link}>{c.cta2}</span>
          </div>
        </div>
        {c.toy ? (
          <div className={s.card}>
            <Brush onClean={setV} reset={reset} />
            <div className={s.status}>
              <b>{v > 0.95 ? "Brilhando." : `${Math.round(v * 100)}% limpo`}</b>
              <span>{v > 0.95 ? "É assim que você sai daqui." : "Clique e esfregue com a escova"}</span>
              {v > 0.95 && <button onClick={() => { setV(0); setReset((r) => r + 1); }}>De novo</button>}
            </div>
          </div>
        ) : (
          <div className={s.boardWrap} style={{ "--bd-bg": "#0e4d4a", "--bd-ink": "#f7f7f2", "--bd-accent": "#ff9a80", "--bd-head": "var(--f-figtree)", "--bd-body": "var(--f-figtree)" } as React.CSSProperties}><Board c={c} m={m} /></div>
        )}
      </section>

      <section className={s.list}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <div className={s.grid}>
          {c.services.map(([a, b], i) => (
            <div key={a} className={s.item}><span>{String(i + 1).padStart(2, "0")}</span><b>{a}</b><p>{b}</p></div>
          ))}
        </div>
      </section>

      <section className={s.cta}>
        <h2>{c.finalTitle}</h2>
        <p>{c.finalText}</p>
        <span className={s.btnLight}>{c.finalCta}</span>
      </section>
    </div>
  );
}
