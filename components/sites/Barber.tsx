"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Barber.module.css";
import { rand, runToy } from "./toy";

type Strand = { x: number; y: number; a: number; L: number; l: number; bend: number; tone: number };
type Bit = { x: number; y: number; vx: number; vy: number; a: number; va: number; len: number; tone: number };

const TONES = ["#20150f", "#33231a", "#47301f"];
const HEAD = { x: 260, y: 250, rx: 128, ry: 150 };

function makeHair(): Strand[] {
  const out: Strand[] = [];
  while (out.length < 1700) {
    const x = rand(HEAD.x - HEAD.rx, HEAD.x + HEAD.rx);
    const y = rand(HEAD.y - HEAD.ry, HEAD.y + HEAD.ry);
    const e = ((x - HEAD.x) / HEAD.rx) ** 2 + ((y - HEAD.y) / HEAD.ry) ** 2;
    if (e > 1) continue;
    const side = Math.abs(x - HEAD.x);
    // linha da nuca (curva) e costeletas mais curtas perto das orelhas
    if (y > 372 - (side / HEAD.rx) ** 2 * 70) continue;
    const dx = x - HEAD.x, dy = y - (HEAD.y - 110);
    const d = Math.hypot(dx, dy) || 1;
    const a = Math.atan2(dy / d * 0.55 + 0.75, dx / d * 0.55);
    const L = rand(20, 32) * (1 - (side / HEAD.rx) * 0.25);
    out.push({ x, y, a, L, l: L, bend: rand(-0.35, 0.35), tone: (Math.random() * 3) | 0 });
  }
  return out.sort((p, q) => q.y - p.y); // de baixo pra cima: os fios de cima caem por cima
}

/** Brinquedo: passe a máquina na cabeça do cliente e o cabelo cai. */
function Haircut({ onProgress, reset }: { onProgress: (v: number) => void; reset: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const report = useRef(onProgress);
  useEffect(() => { report.current = onProgress; });

  useEffect(() => {
    const c = ref.current!;
    const hair = makeHair();
    const bits: Bit[] = [];
    let cut = 0, lastSent = -1, sentAt = 0, buzz = 0;
    const regrow = reset > 0;
    if (regrow) for (const h of hair) h.l = 3;

    const stop = runToy(c, 520, 560, (ctx, dt, p, t) => {
      // capa do barbeiro + pescoço + orelhas
      ctx.fillStyle = "#c58c69";
      ctx.fillRect(208, 330, 104, 150);
      ctx.fillStyle = "#b67b59";
      ctx.fillRect(208, 400, 104, 18);
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(HEAD.x + sx * 124, 262, 17, 30, sx * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = "#cf946f"; ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(HEAD.x, HEAD.y, HEAD.rx, HEAD.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#d9a27e"; ctx.fill();
      // sombra da barba por fazer (aparece quando o cabelo é cortado)
      ctx.save();
      ctx.clip();
      const g = ctx.createRadialGradient(HEAD.x, HEAD.y - 40, 20, HEAD.x, HEAD.y, 170);
      g.addColorStop(0, "rgba(60,38,26,.55)"); g.addColorStop(1, "rgba(60,38,26,.25)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(HEAD.x - HEAD.rx, 300);
      ctx.quadraticCurveTo(HEAD.x, 420, HEAD.x + HEAD.rx, 300);
      ctx.lineTo(HEAD.x + HEAD.rx, 80); ctx.lineTo(HEAD.x - HEAD.rx, 80);
      ctx.fill();
      ctx.restore();
      // capa
      ctx.beginPath();
      ctx.moveTo(30, 560); ctx.quadraticCurveTo(60, 470, 150, 452);
      ctx.quadraticCurveTo(200, 440, 214, 440); ctx.lineTo(306, 440);
      ctx.quadraticCurveTo(320, 440, 370, 452); ctx.quadraticCurveTo(460, 470, 490, 560);
      ctx.closePath();
      ctx.fillStyle = "#22304a"; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = "rgba(236,229,214,.09)"; ctx.lineWidth = 2;
      for (let x = -200; x < 600; x += 18) { ctx.beginPath(); ctx.moveTo(x, 440); ctx.lineTo(x + 120, 560); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = "#f3efe6";
      ctx.fillRect(206, 430, 108, 16);

      // corte
      const cutting = p.down && p.inside;
      buzz = cutting ? Math.min(1, buzz + dt * 8) : Math.max(0, buzz - dt * 6);
      if (cutting) {
        const steps = Math.max(1, Math.ceil(Math.hypot(p.x - p.px, p.y - p.py) / 10));
        for (let i = 0; i <= steps; i++) {
          const bx = p.px + ((p.x - p.px) * i) / steps, by = p.py + ((p.y - p.py) * i) / steps;
          for (const h of hair) {
            if (h.l <= 4) continue;
            const tx = h.x + Math.cos(h.a) * h.l * 0.6, ty = h.y + Math.sin(h.a) * h.l * 0.6;
            if ((tx - bx) ** 2 + (ty - by + 6) ** 2 > 34 * 34) continue;
            const off = h.l - 3.5;
            if (bits.length < 900) bits.push({
              x: h.x + Math.cos(h.a) * (3.5 + off / 2), y: h.y + Math.sin(h.a) * (3.5 + off / 2),
              vx: rand(-60, 60), vy: rand(-80, 10), a: h.a, va: rand(-8, 8), len: off, tone: h.tone,
            });
            h.l = 3.5; cut++;
          }
        }
      }
      // cabelo voltando (próximo cliente)
      if (regrow) for (const h of hair) if (h.l < h.L && cut === 0) h.l = Math.min(h.L, h.l + dt * 30);

      // fios
      ctx.lineCap = "round";
      ctx.lineWidth = 2.6;
      for (let tone = 0; tone < 3; tone++) {
        ctx.beginPath();
        for (const h of hair) {
          if (h.tone !== tone) continue;
          const ex = h.x + Math.cos(h.a) * h.l, ey = h.y + Math.sin(h.a) * h.l;
          const mx = h.x + Math.cos(h.a + h.bend) * h.l * 0.55, my = h.y + Math.sin(h.a + h.bend) * h.l * 0.55;
          ctx.moveTo(h.x, h.y); ctx.quadraticCurveTo(mx, my, ex, ey);
        }
        ctx.strokeStyle = TONES[tone]; ctx.stroke();
      }
      // fios caindo
      ctx.lineWidth = 2.2;
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.vy += 900 * dt; b.vx *= 0.98;
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
        if (b.y > 600) { bits.splice(i, 1); continue; }
        ctx.strokeStyle = TONES[b.tone];
        ctx.beginPath();
        ctx.moveTo(b.x - Math.cos(b.a) * b.len / 2, b.y - Math.sin(b.a) * b.len / 2);
        ctx.lineTo(b.x + Math.cos(b.a) * b.len / 2, b.y + Math.sin(b.a) * b.len / 2);
        ctx.stroke();
      }

      // máquina
      if (p.inside || p.down) {
        const j = buzz * Math.sin(t * 110) * 1.3;
        ctx.save();
        ctx.translate(p.x + j, p.y + 4);
        ctx.rotate(-0.35);
        ctx.fillStyle = "rgba(0,0,0,.18)";
        ctx.beginPath(); ctx.roundRect(-20, 12, 50, 128, 20); ctx.fill();
        ctx.fillStyle = "#1d1c1a";
        ctx.beginPath(); ctx.roundRect(-25, 4, 50, 128, 20); ctx.fill();
        ctx.fillStyle = "#a3301e";
        ctx.fillRect(-25, 60, 50, 7);
        ctx.fillStyle = "#c9ccd1";
        ctx.beginPath(); ctx.roundRect(-30, -8, 60, 18, 3); ctx.fill();
        ctx.strokeStyle = "#7d8187"; ctx.lineWidth = 1.5;
        for (let x = -26; x <= 26; x += 4.5) { ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x, -1); ctx.stroke(); }
        ctx.restore();
      }

      const v = cut / hair.length;
      if ((Math.abs(v - lastSent) > 0.01 && t - sentAt > 0.15) || (v === 0 && lastSent !== 0)) {
        lastSent = v; sentAt = t; report.current(v);
      }
    });
    return stop;
  }, [reset]);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: passe a máquina e corte o cabelo" />;
}

export const BARBER_COPY: Copy = {
  brand: "NAVALHA & FILHO", links: ["Serviços", "Como agendar", "Perguntas"], navCta: "Marcar horário",
  kicker: "Barbearia de bairro · Campinas", h1: "Corte na régua,", h1em: "sem fila.",
  lead: "Você marca o horário pelo WhatsApp, chega e senta. Máquina, tesoura e navalha com acabamento de quem faz isso todo dia.",
  cta: "Marcar no WhatsApp", cta2: "Ver serviços", servicesTitle: "O que a gente faz",
  services: [
    ["Corte social", "na tesoura, com acabamento à navalha"],
    ["Degradê", "do zero ao topo, sem marca de máquina"],
    ["Barba", "toalha quente, navalha e óleo"],
    ["Corte + barba", "o combo de sexta-feira"],
    ["Pezinho", "entre um corte e outro"],
    ["Sobrancelha", "na navalha, discreta"],
  ],
  finalTitle: "Cadeira livre hoje?", finalText: "Manda um oi no WhatsApp que a gente te encaixa.", finalCta: "Chamar agora", toy: true,
};

export default function Barber({ m, c = BARBER_COPY }: { m: boolean; c?: Copy }) {
  const [v, setV] = useState(0);
  const [reset, setReset] = useState(0);
  const done = v > 0.86;
  const [b1, ...bRest] = c.brand.split(" & ");
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <div className={s.pole} />
      <nav className={s.nav}>
        <b className={s.logo}>{bRest.length ? <>{b1} <span>&amp;</span> {bRest.join(" & ")}</> : c.brand}</b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        <div className={s.copy}>
          <p className={s.kicker}>{c.kicker}</p>
          <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 68 : 132, 25) }}>{c.h1} <em>{c.h1em}</em></h1>
          <p className={s.lead}>{c.lead}</p>
          <div className={s.ctas}>
            <span className={s.btn}>{c.cta}</span>
            <span className={s.link}>{c.cta2}</span>
          </div>
        </div>
        {c.toy ? (
          <div className={s.mirror}>
            <Haircut onProgress={setV} reset={reset} />
            <div className={s.meter}>
              <span>{done ? "Ficou na régua ✓" : v > 0.02 ? "Continua passando…" : "Clique e arraste a máquina"}</span>
              <span className={s.bar}><i style={{ width: `${Math.round(v * 100)}%` }} /></span>
              {done && <button className={s.again} onClick={() => { setV(0); setReset((r) => r + 1); }}>Próximo cliente</button>}
            </div>
          </div>
        ) : (
          <div className={s.boardWrap} style={{ "--bd-bg": "#1c1b19", "--bd-ink": "#ece5d6", "--bd-accent": "#d9553f", "--bd-head": "var(--f-barlow-cond)", "--bd-body": "var(--f-barlow)" } as React.CSSProperties}><Board c={c} m={m} /></div>
        )}
      </section>

      <section className={s.menu}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <ul>
          {c.services.map(([a, b]) => (
            <li key={a}><b>{a}</b><span className={s.dots} /><span>{b}</span></li>
          ))}
        </ul>
      </section>

      <section className={s.cta}>
        <h2>{c.finalTitle}</h2>
        <p>{c.finalText}</p>
        <span className={s.btnLight}>{c.finalCta}</span>
      </section>
    </div>
  );
}
