"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Bistro.module.css";
import { clamp, fontOf, runToy } from "./toy";

const GX = 330, RIM = 250, BOT = 410;
const LINE = 0.38, BAND = 0.08; // a "taça certa" fica em 38% da altura do bojo

type Drop = { x: number; y: number; vx: number; vy: number };

function bowl(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(GX - 78, RIM);
  ctx.bezierCurveTo(GX - 92, 330, GX - 66, BOT, GX, BOT);
  ctx.bezierCurveTo(GX + 66, BOT, GX + 92, 330, GX + 78, RIM);
}

/** Brinquedo: segure pra inclinar a garrafa e servir; pare na linha da taça certa. */
function Pour({ label, onLevel, reset }: { label: string; onLevel: (v: number) => void; reset: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ label, onLevel });
  useEffect(() => { st.current = { label, onLevel }; });

  useEffect(() => {
    const F = fontOf(ref.current!);
    let ang = -1.15, level = 0, wave = 0, stain = 0, sent = -1, pouring = 0;
    const drops: Drop[] = [];

    return runToy(ref.current!, 520, 560, (ctx, dt, p, t) => {
      const want = p.down ? 0.42 : -1.15;
      ang += (want - ang) * Math.min(1, dt * (p.down ? 3 : 6));
      pouring = ang > 0.05 ? Math.min(1, (ang - 0.05) / 0.3) : 0;
      if (pouring) { level += dt * 0.16 * pouring; wave = Math.min(1, wave + dt * 3 * pouring); }
      wave = Math.max(0, wave - dt * 0.7);
      const overflow = level > 1;
      if (overflow) { stain = Math.min(1, stain + dt * 0.5); level = 1; }

      // toalha
      ctx.fillStyle = "#ece4d4"; ctx.fillRect(0, 0, 520, 560);
      ctx.fillStyle = "#e2d8c4";
      for (let x = 0; x < 520; x += 64) ctx.fillRect(x, 0, 32, 560);
      ctx.fillStyle = "rgba(200,85,61,.10)";
      for (let y = 0; y < 560; y += 64) ctx.fillRect(0, y, 520, 32);
      if (stain) {
        ctx.fillStyle = `rgba(109,21,39,${0.55 * stain})`;
        ctx.beginPath(); ctx.ellipse(GX + 20, 506, 60 + stain * 90, 14 + stain * 16, 0, 0, Math.PI * 2); ctx.fill();
      }

      // taça: sombra, pé, haste
      ctx.fillStyle = "rgba(29,36,32,.14)";
      ctx.beginPath(); ctx.ellipse(GX, 512, 70, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.strokeStyle = "rgba(29,36,32,.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(GX, 506, 62, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(GX - 4, BOT); ctx.lineTo(GX - 4, 500); ctx.moveTo(GX + 4, BOT); ctx.lineTo(GX + 4, 500); ctx.stroke();

      // vinho dentro do bojo
      const surf = BOT - level * (BOT - RIM);
      ctx.save(); bowl(ctx); ctx.closePath(); ctx.clip();
      ctx.fillStyle = "#6d1527";
      ctx.beginPath(); ctx.moveTo(GX - 120, BOT + 10);
      for (let x = GX - 120; x <= GX + 120; x += 6) ctx.lineTo(x, surf + Math.sin(x * 0.06 + t * 9) * 4 * wave);
      ctx.lineTo(GX + 120, BOT + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.10)";
      ctx.fillRect(GX - 120, surf - 2, 240, 5);
      ctx.restore();
      // vidro (contorno + brilho)
      bowl(ctx); ctx.strokeStyle = "rgba(29,36,32,.45)"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(GX - 62, 270); ctx.bezierCurveTo(GX - 70, 320, GX - 56, 370, GX - 36, 392); ctx.stroke();
      ctx.strokeStyle = "rgba(29,36,32,.45)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(GX, RIM, 78, 9, 0, 0, Math.PI * 2); ctx.stroke();

      // linha da taça certa
      const ly = BOT - LINE * (BOT - RIM);
      ctx.setLineDash([6, 6]); ctx.strokeStyle = "#c8553d"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(GX + 96, ly); ctx.lineTo(GX + 150, ly); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#c8553d"; ctx.font = `700 15px ${F}`; ctx.textAlign = "left";
      ctx.fillText("taça certa", GX + 104, ly - 10);

      // fio de vinho e respingos
      ctx.save();
      const mouth = { x: 150 + Math.cos(ang) * 0, y: 150 };
      ctx.translate(mouth.x, mouth.y); ctx.rotate(ang);
      // garrafa: boca na origem, corpo pra trás
      ctx.fillStyle = "#24372b";
      ctx.beginPath(); ctx.roundRect(-250, -46, 170, 92, 18); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-84, -40); ctx.quadraticCurveTo(-50, -16, -46, -13); ctx.lineTo(0, -12); ctx.lineTo(0, 12); ctx.lineTo(-46, 13); ctx.quadraticCurveTo(-50, 16, -84, 40); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#6d1527"; ctx.fillRect(-26, -13, 26, 26);
      ctx.fillStyle = "#ece4d4"; ctx.fillRect(-224, -36, 112, 72);
      ctx.fillStyle = "#1d2420"; ctx.textAlign = "center";
      ctx.font = `400 ${Math.min(22, 220 / Math.max(6, st.current.label.length))}px ${F}`;
      ctx.fillText(st.current.label, -168, 4);
      ctx.font = `700 9px ${F}`; ctx.fillText("VINHO DA CASA", -168, 22);
      ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fillRect(-244, -36, 160, 8);
      ctx.restore();

      if (pouring) {
        const mx = mouth.x + Math.cos(ang) * 2, my = mouth.y + Math.sin(ang) * 2 + 4;
        ctx.strokeStyle = "#6d1527"; ctx.lineWidth = 4 + pouring * 4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(mx, my);
        ctx.bezierCurveTo(mx + 60 * pouring, my + 10, GX - 30, surf - 90, GX - 22, surf);
        ctx.stroke();
        if (overflow && Math.random() < 0.6) drops.push({ x: GX + (Math.random() > 0.5 ? 78 : -78), y: RIM, vx: (Math.random() - 0.5) * 60, vy: 0 });
      }
      ctx.fillStyle = "#6d1527";
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.y > 505) { drops.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(d.x, d.y, 3.5, 0, Math.PI * 2); ctx.fill();
      }

      const v = Math.round(clamp(level + stain * 0.2, 0, 1.2) * 100) / 100;
      if (v !== sent && Math.abs(v - sent) >= 0.01) { sent = v; st.current.onLevel(v); }
    });
  }, [reset]);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: segure pra servir o vinho" />;
}

export const BISTRO_COPY: Copy = {
  brand: "Casa Alecrim", links: ["Cardápio", "Reservas", "Como chegar"], navCta: "Reservar mesa",
  kicker: "Cozinha de bistrô · Campinas", h1: "Comida feita devagar,", h1em: "mesa sem pressa.",
  lead: "Cardápio curto que muda com a feira da semana, massa feita aqui e vinho em taça. Abrimos de terça a domingo, almoço e jantar.",
  cta: "Reservar pelo WhatsApp", cta2: "Ver o cardápio", servicesTitle: "Da cozinha, hoje",
  services: [
    ["Risoto de cogumelos", "arbóreo, cogumelos frescos e parmesão"],
    ["Ravioli de abóbora", "massa da casa, manteiga e sálvia"],
    ["Bife ancho", "na brasa, com batata rústica"],
    ["Peixe do dia", "grelhado, com legumes da feira"],
    ["Pudim de doce de leite", "receita da avó do chef"],
    ["Vinho em taça", "tinto, branco ou rosé da semana"],
  ],
  finalTitle: "Sua mesa está guardada.", finalText: "Reserve pelo WhatsApp e diga se é aniversário: a gente prepara a sobremesa.", finalCta: "Reservar agora", toy: true,
};

export default function Bistro({ m, c = BISTRO_COPY }: { m: boolean; c?: Copy }) {
  const [lv, setLv] = useState(0);
  const [reset, setReset] = useState(0);
  const ok = Math.abs(lv - LINE) <= BAND;
  const msg = lv === 0 ? "Segure em cima da mesa pra servir" : lv > 1 ? "Transbordou. Fica pra toalha." : ok ? "Taça certa. Saúde." : lv > LINE ? "Passou um pouco" : "Mais um pouco…";
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <b className={s.logo}>{c.brand}</b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        <div className={s.copy}>
          <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 46 : 92, m ? 22 : 34) }}>
            {c.h1} <span>{c.h1em}</span>
          </h1>
          <p className={s.lead}>{c.lead}</p>
          <p className={s.where}>{c.kicker}</p>
          <div className={s.ctas}>
            <span className={s.btn}>{c.cta}</span>
            <span className={s.link}>{c.cta2}</span>
          </div>
        </div>
        {c.toy ? (
          <div className={s.table}>
            <Pour label={c.brand} onLevel={setLv} reset={reset} />
            <div className={s.meter}>
              <span>{msg}</span>
              {lv > 0 && <button className={s.again} onClick={() => { setLv(0); setReset((r) => r + 1); }}>Outra taça</button>}
            </div>
          </div>
        ) : (
          <div className={s.boardWrap}><Board c={c} m={m} /></div>
        )}
      </section>

      <section className={s.menu}>
        <div className={s.card}>
          <h2 className={s.h2}>{c.servicesTitle}</h2>
          <ul>
            {c.services.map(([a, b]) => (
              <li key={a}><b>{a}</b><span>{b}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.cta}>
        <h2 style={{ fontSize: fitSize(c.finalTitle, m ? 44 : 84, 24) }}>{c.finalTitle}</h2>
        {c.finalText && <p>{c.finalText}</p>}
        <span className={s.btnDark}>{c.finalCta}</span>
      </section>
    </div>
  );
}
