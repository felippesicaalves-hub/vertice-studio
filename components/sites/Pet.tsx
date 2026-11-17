"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Pet.module.css";
import { clamp, rand, runToy } from "./toy";

type Heart = { x: number; y: number; vy: number; life: number; s: number; rot: number };
const H = { x: 260, y: 240, rx: 150, ry: 132 };

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r * 0.9);
  ctx.fill();
}

/** Brinquedo: faça carinho no cachorro (passe o mouse/dedo na cabeça). Os olhos seguem o cursor. */
function Dog({ onLove }: { onLove: (v: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const report = useRef(onLove);
  useEffect(() => { report.current = onLove; });

  useEffect(() => {
    const hearts: Heart[] = [];
    let love = 0, happy = 0, lookX = 0, lookY = 0, bark = 0, sentAt = 0, last = -1, tilt = 0;

    const stop = runToy(ref.current!, 520, 520, (ctx, dt, p, t) => {
      const onHead = ((p.x - H.x) / H.rx) ** 2 + ((p.y - H.y) / H.ry) ** 2 < 1.1;
      const speed = Math.hypot(p.x - p.px, p.y - p.py) / Math.max(dt, 0.001);
      const petting = p.inside && onHead && speed > 60;
      if (petting) {
        love = Math.min(1, love + dt * 0.22);
        happy = Math.min(1, happy + dt * 3);
        if (Math.random() < dt * 9) hearts.push({ x: p.x + rand(-20, 20), y: p.y - 10, vy: rand(50, 90), life: 1.4, s: rand(9, 16), rot: rand(-0.4, 0.4) });
      } else {
        happy = Math.max(0, happy - dt * 0.9);
      }
      if (p.clicked && !onHead) bark = 1;
      bark = Math.max(0, bark - dt * 1.6);
      // olhos e cabeça seguem o cursor
      const tx = p.inside ? clamp((p.x - H.x) / 160, -1, 1) : Math.sin(t * 0.7) * 0.4;
      const ty = p.inside ? clamp((p.y - (H.y - 20)) / 160, -1, 1) : 0.1;
      lookX += (tx - lookX) * Math.min(1, dt * 8);
      lookY += (ty - lookY) * Math.min(1, dt * 8);
      tilt += ((petting ? Math.sin(t * 6) * 0.06 : lookX * 0.07) - tilt) * Math.min(1, dt * 6);

      ctx.fillStyle = "#a9d8ee";
      ctx.beginPath(); ctx.arc(260, 280, 236, 0, Math.PI * 2); ctx.fill();

      // corpo + bandana
      ctx.fillStyle = "#d9a15b";
      ctx.beginPath(); ctx.ellipse(260, 452, 140, 96, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ff7a3d";
      ctx.beginPath(); ctx.moveTo(150, 352); ctx.quadraticCurveTo(260, 380, 370, 352); ctx.lineTo(260, 470); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff4e0";
      for (const [x, y] of [[200, 372], [240, 392], [290, 386], [320, 368], [262, 430], [228, 410]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }

      ctx.save();
      ctx.translate(H.x, H.y + 60); ctx.rotate(tilt); ctx.translate(-H.x, -(H.y + 60));
      // orelhas (balançam com o carinho)
      for (const sx of [-1, 1]) {
        const w = Math.sin(t * 14 + sx) * 0.12 * happy + (happy * 0.18) * sx * -1;
        ctx.save();
        ctx.translate(H.x + sx * 118, H.y - 70);
        ctx.rotate(sx * 0.35 + w);
        ctx.fillStyle = "#9c5f2b";
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(sx * 60, 20, sx * 70, 130, sx * 30, 170);
        ctx.bezierCurveTo(sx * 0, 180, sx * -20, 120, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      // cabeça
      ctx.fillStyle = "#d9a15b";
      ctx.beginPath(); ctx.ellipse(H.x, H.y, H.rx, H.ry, 0, 0, Math.PI * 2); ctx.fill();
      // listra clara na testa
      ctx.fillStyle = "#f3d9b1";
      ctx.beginPath(); ctx.moveTo(H.x - 14, H.y - 128); ctx.quadraticCurveTo(H.x, H.y - 136, H.x + 14, H.y - 128);
      ctx.quadraticCurveTo(H.x + 30, H.y - 10, H.x, H.y + 20); ctx.quadraticCurveTo(H.x - 30, H.y - 10, H.x - 14, H.y - 128); ctx.fill();
      // focinho
      ctx.fillStyle = "#f3d9b1";
      ctx.beginPath(); ctx.ellipse(H.x, H.y + 62, 84, 58, 0, 0, Math.PI * 2); ctx.fill();
      // olhos
      for (const sx of [-1, 1]) {
        const ex = H.x + sx * 58, ey = H.y - 6;
        if (happy > 0.45) {
          ctx.strokeStyle = "#2a1e1a"; ctx.lineWidth = 6; ctx.lineCap = "round";
          ctx.beginPath(); ctx.arc(ex, ey + 6, 14, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        } else {
          ctx.fillStyle = "#2a1e1a";
          ctx.beginPath(); ctx.arc(ex + lookX * 7, ey + lookY * 6, 15, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(ex + lookX * 7 - 5, ey + lookY * 6 - 5, 4.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      // bochechas
      if (happy > 0.1) {
        ctx.fillStyle = `rgba(255,122,61,${0.35 * happy})`;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(H.x + sx * 92, H.y + 36, 20, 12, 0, 0, Math.PI * 2); ctx.fill(); }
      }
      // nariz e boca
      ctx.fillStyle = "#2a1e1a";
      ctx.beginPath(); ctx.ellipse(H.x + lookX * 4, H.y + 34, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.beginPath(); ctx.ellipse(H.x + lookX * 4 - 8, H.y + 28, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      const open = Math.max(happy, bark);
      if (open > 0.15) {
        ctx.fillStyle = "#7a2e2a";
        ctx.beginPath(); ctx.ellipse(H.x, H.y + 82, 30, 10 + open * 16, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = "#ff8fa0";
        ctx.beginPath(); ctx.ellipse(H.x, H.y + 92 + open * 10, 18, 10 + open * 12, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = "#2a1e1a"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(H.x, H.y + 50); ctx.lineTo(H.x, H.y + 72);
      ctx.moveTo(H.x - 34, H.y + 76); ctx.quadraticCurveTo(H.x - 16, H.y + 90, H.x, H.y + 72);
      ctx.quadraticCurveTo(H.x + 16, H.y + 90, H.x + 34, H.y + 76); ctx.stroke();
      ctx.restore();

      // corações
      for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i];
        h.life -= dt; h.y -= h.vy * dt; h.x += Math.sin(t * 3 + i) * 0.6;
        if (h.life <= 0) { hearts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, h.life);
        ctx.fillStyle = "#ff5a5f";
        heart(ctx, h.x, h.y, h.s * (1.4 - h.life * 0.3));
      }
      ctx.globalAlpha = 1;
      // latido
      if (bark > 0) {
        ctx.globalAlpha = Math.min(1, bark * 2);
        ctx.fillStyle = "#1f2b3d";
        ctx.beginPath(); ctx.roundRect(370, 70, 110, 60, 18); ctx.fill();
        ctx.beginPath(); ctx.moveTo(390, 126); ctx.lineTo(372, 150); ctx.lineTo(412, 128); ctx.fill();
        ctx.fillStyle = "#fff4e0";
        ctx.font = `800 34px ${getComputedStyle(ref.current!).fontFamily}`;
        ctx.fillText("Au!", 396, 112);
        ctx.globalAlpha = 1;
      }

      if (Math.abs(love - last) > 0.01 && t - sentAt > 0.15) { last = love; sentAt = t; report.current(love); }
    });
    return stop;
  }, []);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: faça carinho no cachorro" />;
}

export const PET_COPY: Copy = {
  brand: "lambeijo", links: ["Banho e tosa", "Leva e traz", "Dúvidas"], navCta: "Agendar banho",
  kicker: "Banho e tosa · Jundiaí", h1: "Ele volta cheiroso.", h1em: "E querendo voltar.",
  lead: "Banho sem pressa, secagem no tempo dele e tosa do jeito que você pediu. Se quiser, a gente busca e leva em casa.",
  cta: "Agendar pelo WhatsApp", cta2: "Ver serviços", servicesTitle: "O que tem por aqui",
  services: [
    ["Banho", "Shampoo pro tipo de pelo, ouvidos limpos e unhas cortadas."],
    ["Tosa", "Higiênica, na tesoura ou na máquina. Você escolhe."],
    ["Hidratação", "Pra pelo que embola ou anda sem brilho."],
    ["Leva e traz", "Buscamos e devolvemos com hora combinada."],
  ],
  finalTitle: "Tem horário essa semana.", finalText: "", finalCta: "Agendar banho", toy: true,
};
const CARD_COLORS = ["#ffd36e", "#a9d8ee", "#ffb59a", "#c9e4b4"];

export default function Pet({ m, c = PET_COPY }: { m: boolean; c?: Copy }) {
  const [love, setLove] = useState(0);
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <b className={s.logo}>{c.brand}<span>.</span></b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        <div className={s.copy}>
          <p className={s.kicker}>{c.kicker}</p>
          <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 46 : 88, 38) }}>{c.h1} <span>{c.h1em}</span></h1>
          <p className={s.lead}>{c.lead}</p>
          <div className={s.ctas}>
            <span className={s.btn}>{c.cta}</span>
            <span className={s.link}>{c.cta2}</span>
          </div>
        </div>
        {c.toy ? (
          <div className={s.stage}>
            <Dog onLove={setLove} />
            <div className={s.meter}>
              <span>{love > 0.95 ? "Esse aí já é de casa." : love > 0.05 ? "Continua, ele tá gostando…" : "Passe o mouse na cabeça dele"}</span>
              <span className={s.bar}><i style={{ width: `${Math.round(love * 100)}%` }} /></span>
            </div>
          </div>
        ) : (
          <div className={s.boardWrap} style={{ "--bd-bg": "#1f2b3d", "--bd-ink": "#fff4e0", "--bd-accent": "#ff7a3d", "--bd-head": "var(--f-baloo)", "--bd-body": "var(--f-nunito)" } as React.CSSProperties}><Board c={c} m={m} /></div>
        )}
      </section>

      <section className={s.list}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <div className={s.cards}>
          {c.services.slice(0, 4).map(([a, b], i) => (
            <div key={a} className={s.cardItem} style={{ background: CARD_COLORS[i] }}><b>{a}</b><p>{b}</p></div>
          ))}
        </div>
      </section>

      <section className={s.cta}>
        <h2>{c.finalTitle}</h2>
        <span className={s.btnLight}>{c.finalCta}</span>
      </section>
    </div>
  );
}
