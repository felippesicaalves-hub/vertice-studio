"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Law.module.css";
import { fontOf, runToy } from "./toy";

const PX = 260, PY = 150, ARM = 170, HANG = 150;
type Where = "tray" | "L" | "R";
type Block = { label: string; w: number; where: Where; x: number; y: number; slot: number };

const START: [string, number, Where][] = [
  ["Provas", 3, "L"], ["Contrato", 2, "L"], ["Testemunha", 2, "tray"],
  ["Lei", 3, "tray"], ["Prazo", 1, "tray"], ["Recurso", 1, "tray"],
];

/** Brinquedo: arraste os argumentos pros pratos até a balança ficar em equilíbrio. */
function Scale({ onState }: { onState: (v: "start" | "off" | "ok") => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef(onState);
  useEffect(() => { st.current = onState; });

  useEffect(() => {
    const F = fontOf(ref.current!);
    const blocks: Block[] = START.map(([label, w, where], i) => ({ label, w, where, x: 0, y: 0, slot: i }));
    let ang = 0, va = 0, drag: Block | null = null, dx = 0, dy = 0, last = "";
    const bw = (b: Block) => 96 + b.w * 10, bh = (b: Block) => 22 + b.w * 6;
    const pan = (side: -1 | 1) => ({ x: PX + Math.cos(ang) * ARM * side, y: PY + Math.sin(ang) * ARM * side + HANG });
    const home = (b: Block) => {
      if (b.where === "tray") {
        const tray = blocks.filter((x) => x.where === "tray");
        const i = tray.indexOf(b);
        return { x: 76 + (i % 3) * 152, y: 492 + Math.floor(i / 3) * 44 };
      }
      const side = b.where === "L" ? -1 : 1;
      const on = blocks.filter((x) => x.where === b.where);
      let y = pan(side).y - 6;
      for (const o of on) { if (o === b) break; y -= bh(o) + 2; }
      return { x: pan(side).x, y: y - bh(b) / 2 };
    };
    for (const b of blocks) Object.assign(b, home(b));

    return runToy(ref.current!, 520, 560, (ctx, dt, p) => {
      const wl = blocks.filter((b) => b.where === "L").reduce((a, b) => a + b.w, 0);
      const wr = blocks.filter((b) => b.where === "R").reduce((a, b) => a + b.w, 0);
      const target = Math.max(-0.32, Math.min(0.32, (wr - wl) * 0.07));
      va += ((target - ang) * 40 - va * 5) * dt;
      ang += va * dt;

      // pegar e soltar
      if (p.clicked && !drag) {
        for (let i = blocks.length - 1; i >= 0; i--) {
          const b = blocks[i];
          if (Math.abs(p.x - b.x) < bw(b) / 2 && Math.abs(p.y - b.y) < bh(b) / 2 + 4) {
            drag = b; dx = b.x - p.x; dy = b.y - p.y;
            blocks.splice(i, 1); blocks.push(b); // vai pra frente
            break;
          }
        }
      }
      if (drag && p.down) { drag.x = p.x + dx; drag.y = p.y + dy; }
      if (drag && !p.down) {
        const l = pan(-1), r = pan(1);
        const dL = Math.hypot(drag.x - l.x, drag.y - (l.y - 30)), dR = Math.hypot(drag.x - r.x, drag.y - (r.y - 30));
        drag.where = dL < 110 && dL < dR ? "L" : dR < 110 ? "R" : "tray";
        drag = null;
      }
      for (const b of blocks) if (b !== drag) {
        const h = home(b);
        b.x += (h.x - b.x) * Math.min(1, dt * 14);
        b.y += (h.y - b.y) * Math.min(1, dt * 14);
      }

      const state = wl + wr === 0 ? "start" : Math.abs(ang) < 0.02 && Math.abs(va) < 0.05 && wl && wr ? "ok" : "off";
      if (state !== last) { last = state; st.current(state as "start" | "off" | "ok"); }

      // mesa
      ctx.fillStyle = "#14213d"; ctx.fillRect(0, 0, 520, 560);
      ctx.fillStyle = "#1b2a4a"; ctx.fillRect(0, 430, 520, 130);
      // coluna e base
      ctx.fillStyle = "#b08d57";
      ctx.beginPath(); ctx.moveTo(PX - 70, 420); ctx.lineTo(PX + 70, 420); ctx.lineTo(PX + 50, 400); ctx.lineTo(PX - 50, 400); ctx.closePath(); ctx.fill();
      ctx.fillRect(PX - 7, PY, 14, 252);
      ctx.beginPath(); ctx.arc(PX, PY - 18, 12, 0, Math.PI * 2); ctx.fill();
      // travessão
      ctx.save(); ctx.translate(PX, PY); ctx.rotate(ang);
      ctx.fillStyle = "#c9a66b"; ctx.beginPath(); ctx.roundRect(-ARM - 8, -6, ARM * 2 + 16, 12, 6); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#e6c88f"; ctx.beginPath(); ctx.arc(PX, PY, 11, 0, Math.PI * 2); ctx.fill();
      // ponteiro
      ctx.save(); ctx.translate(PX, PY); ctx.rotate(ang);
      ctx.fillStyle = Math.abs(ang) < 0.02 ? "#e6c88f" : "#8c1c13";
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(0, 70); ctx.closePath(); ctx.fill();
      ctx.restore();

      // correntes e pratos
      for (const side of [-1, 1] as const) {
        const ex = PX + Math.cos(ang) * ARM * side, ey = PY + Math.sin(ang) * ARM * side;
        const pp = pan(side);
        ctx.strokeStyle = "#b08d57"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(pp.x - 64, pp.y); ctx.moveTo(ex, ey); ctx.lineTo(pp.x + 64, pp.y); ctx.stroke();
        ctx.fillStyle = "#c9a66b";
        ctx.beginPath(); ctx.ellipse(pp.x, pp.y, 72, 12, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = "#e6c88f";
        ctx.beginPath(); ctx.ellipse(pp.x, pp.y, 72, 7, 0, 0, Math.PI * 2); ctx.fill();
      }

      // blocos (papéis com peso)
      for (const b of blocks) {
        const w = bw(b), h = bh(b);
        ctx.save(); ctx.translate(b.x, b.y);
        if (b === drag) { ctx.rotate(-0.05); ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h); }
        ctx.fillStyle = "#f2f0eb"; ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = "#8c1c13"; ctx.fillRect(-w / 2, -h / 2, 6, h);
        ctx.fillStyle = "#14213d"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = `600 ${13 + b.w}px ${F}`;
        ctx.fillText(b.label, 3, 0);
        ctx.restore();
      }
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(242,240,235,.55)"; ctx.font = `500 14px ${F}`; ctx.textAlign = "left";
      ctx.fillText("Argumentos na mesa", 20, 452);
    });
  }, []);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: equilibre a balança" />;
}

export const LAW_COPY: Copy = {
  brand: "Moraes Advocacia", links: ["Áreas", "Consulta", "Dúvidas"], navCta: "Agendar consulta",
  kicker: "Advocacia · Campinas", h1: "Seu caso explicado", h1em: "em português.",
  lead: "Antes de qualquer contrato, uma consulta pra entender o que aconteceu, quais são os caminhos e quanto tempo cada um costuma levar.",
  cta: "Agendar consulta", cta2: "Ver áreas", servicesTitle: "Áreas de atuação",
  services: [
    ["Trabalhista", "rescisão, horas extras e acordos"],
    ["Família", "divórcio, guarda e pensão"],
    ["Consumidor", "cobranças indevidas e produtos com defeito"],
    ["Imobiliário", "compra, venda, aluguel e usucapião"],
    ["Previdenciário", "aposentadoria e benefícios do INSS"],
    ["Empresarial", "contratos e abertura de empresa"],
  ],
  finalTitle: "Conte o que aconteceu.", finalText: "A primeira conversa é sigilosa e serve pra você decidir com calma.", finalCta: "Falar no WhatsApp", toy: true,
};

export default function Law({ m, c = LAW_COPY }: { m: boolean; c?: Copy }) {
  const [state, setState] = useState<"start" | "off" | "ok">("off");
  const msg = state === "ok" ? "Equilíbrio. É isso que a gente busca pra você." : "Arraste os argumentos pros pratos";
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <b className={s.logo}>{c.brand}</b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        <div className={s.copy}>
          <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 44 : 70, m ? 22 : 30) }}>
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
          <div className={s.bench}>
            <Scale onState={setState} />
            <p className={`${s.meter} ${state === "ok" ? s.ok : ""}`}>{msg}</p>
          </div>
        ) : (
          <div className={s.boardWrap}><Board c={c} m={m} /></div>
        )}
      </section>

      <section className={s.areas}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <dl>
          {c.services.map(([a, b]) => (
            <div key={a}><dt>{a}</dt><dd>{b}</dd></div>
          ))}
        </dl>
      </section>

      <section className={s.cta}>
        <h2 style={{ fontSize: fitSize(c.finalTitle, m ? 42 : 80, 24) }}>{c.finalTitle}</h2>
        {c.finalText && <p>{c.finalText}</p>}
        <span className={s.btnLight}>{c.finalCta}</span>
      </section>
    </div>
  );
}
