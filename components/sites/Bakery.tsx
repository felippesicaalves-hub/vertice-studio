"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Bakery.module.css";
import { rand, runToy } from "./toy";

export const TOOLS = [
  { id: "morango", label: "Chantilly de morango", c: "#f08aa4" },
  { id: "pistache", label: "Chantilly de pistache", c: "#9cc88a" },
  { id: "choco", label: "Ganache", c: "#5a3222" },
  { id: "granulado", label: "Granulado", c: "#e9b949" },
  { id: "fruta", label: "Morango", c: "#d7263d" },
] as const;
type Tool = (typeof TOOLS)[number]["id"];
type Deco = { tool: Tool; u: number; v: number; r: number; k: number; s: number[] };

const CX = 260, CY = 250, RX = 196, RY = 108, H = 96;
const SPR = ["#f2c14e", "#f08aa4", "#7cc4e6", "#9cc88a", "#ffffff", "#5a3222"];

/** Brinquedo: o bolo gira no prato; arraste pra confeitar com o chantilly, o granulado ou os morangos. */
function Cake({ tool, onCount }: { tool: Tool; onCount: (n: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ tool, onCount });
  useEffect(() => { st.current = { tool, onCount }; });

  useEffect(() => {
    const decos: Deco[] = [];
    let spin = 0, lx = -999, ly = -999, idle = 0;
    const seed = () => Array.from({ length: 6 }, () => Math.random());
    // começa com uma borda de chantilly, pra já parecer bolo de vitrine
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      decos.push({ tool: "morango", u: Math.cos(a) * 0.86, v: Math.sin(a) * 0.86, r: a, k: 1, s: seed() });
    }
    st.current.onCount(0);

    // ponto da tela -> coordenada no topo do bolo (disco unitário, já descontando o giro)
    const toCake = (x: number, y: number) => {
      const dx = (x - CX) / RX, dy = (y - CY) / RY;
      if (dx * dx + dy * dy > 0.92) return null;
      const c = Math.cos(-spin), sn = Math.sin(-spin);
      return { u: dx * c - dy * sn, v: dx * sn + dy * c };
    };
    const toScreen = (u: number, v: number) => {
      const c = Math.cos(spin), sn = Math.sin(spin);
      return { x: CX + (u * c - v * sn) * RX, y: CY + (u * sn + v * c) * RY };
    };

    return runToy(ref.current!, 520, 520, (ctx, dt, p) => {
      idle += dt;
      if (!p.down) spin += dt * (idle > 0.6 ? 0.35 : 0.08);

      // prato com pé
      ctx.fillStyle = "#e9e2d8";
      ctx.beginPath(); ctx.ellipse(CX, CY + H + 70, 120, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d8cfc2"; ctx.fillRect(CX - 26, CY + H + 22, 52, 50);
      ctx.fillStyle = "#cfc5b6";
      ctx.beginPath(); ctx.ellipse(CX, CY + H + 22, RX + 34, RY * 0.36 + 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f4efe8";
      ctx.beginPath(); ctx.ellipse(CX, CY + H + 14, RX + 34, RY * 0.36 + 20, 0, 0, Math.PI * 2); ctx.fill();

      // lateral do bolo (massa + recheio aparecendo numa faixa)
      ctx.fillStyle = "#f7e7d4";
      ctx.beginPath();
      ctx.ellipse(CX, CY + H, RX, RY, 0, 0, Math.PI);
      ctx.lineTo(CX - RX, CY); ctx.ellipse(CX, CY, RX, RY, 0, Math.PI, 0, true);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#efd5bb";
      ctx.beginPath(); ctx.ellipse(CX, CY + H, RX, RY, 0, 0, Math.PI); ctx.lineTo(CX - RX, CY + H - 16);
      ctx.ellipse(CX, CY + H - 16, RX, RY, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
      // calda escorrendo pela borda da frente
      ctx.fillStyle = "#f3a7b8";
      ctx.beginPath(); ctx.ellipse(CX, CY + 10, RX, RY, 0, 0, Math.PI); ctx.lineTo(CX - RX, CY); ctx.ellipse(CX, CY, RX, RY, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
      for (let i = 1; i < 16; i++) {
        const a = Math.PI - (i / 16) * Math.PI;
        const x = CX + Math.cos(a) * RX * 0.97, y = CY + Math.sin(a) * RY;
        const len = 12 + Math.abs(Math.sin(i * 2.3 + 0.7)) * 40;
        ctx.beginPath(); ctx.roundRect(x - 7, y - 4, 14, len, 7); ctx.fill();
      }
      // topo
      ctx.fillStyle = "#fbe3e8";
      ctx.beginPath(); ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2); ctx.fill();

      // confeitar
      const at = p.inside ? toCake(p.x, p.y) : null;
      if (p.down && at) {
        idle = 0;
        const t = st.current.tool;
        const gap = t === "granulado" ? 10 : t === "fruta" ? 60 : 22;
        if (p.clicked || Math.hypot(p.x - lx, p.y - ly) > gap) {
          if (t === "granulado") {
            for (let i = 0; i < 9; i++) decos.push({ tool: t, u: at.u + rand(-0.07, 0.07), v: at.v + rand(-0.07, 0.07), r: rand(0, 6.3), k: 0, s: seed() });
          } else decos.push({ tool: t, u: at.u, v: at.v, r: rand(0, 6.3), k: 0, s: seed() });
          if (decos.length > 700) decos.splice(18, 9);
          lx = p.x; ly = p.y;
          st.current.onCount(decos.length - 18);
        }
      }
      if (!p.down) { lx = ly = -999; }

      // de trás pra frente, pra o que está na frente cobrir o de trás
      const drawn = decos.map((d) => ({ d, ...toScreen(d.u, d.v) })).sort((a, b) => a.y - b.y);
      for (const { d, x, y } of drawn) {
        d.k = Math.min(1, d.k + dt * 7);
        const e = 1 - (1 - d.k) ** 3;
        ctx.save(); ctx.translate(x, y); ctx.scale(e, e * 0.62);
        if (d.tool === "granulado") {
          ctx.rotate(d.r + spin); ctx.fillStyle = SPR[(d.s[0] * SPR.length) | 0];
          ctx.beginPath(); ctx.roundRect(-5, -1.6, 10, 3.2, 1.6); ctx.fill();
        } else if (d.tool === "fruta") {
          ctx.scale(1, 1 / 0.62); ctx.translate(0, -10);
          ctx.fillStyle = "#b81d33";
          ctx.beginPath(); ctx.moveTo(0, 16); ctx.bezierCurveTo(-20, 4, -16, -14, 0, -12); ctx.bezierCurveTo(16, -14, 20, 4, 0, 16); ctx.fill();
          ctx.fillStyle = "#e63950";
          ctx.beginPath(); ctx.moveTo(-2, 12); ctx.bezierCurveTo(-15, 2, -12, -11, 0, -10); ctx.bezierCurveTo(4, -6, 2, 4, -2, 12); ctx.fill();
          ctx.fillStyle = "#ffe08a";
          for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-8 + (i % 3) * 7, -4 + ((i / 3) | 0) * 9, 1.1, 0, 6.3); ctx.fill(); }
          ctx.fillStyle = "#3f8f3a";
          for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(-1.2 + i * 0.8); ctx.beginPath(); ctx.ellipse(0, -14, 3, 8, 0, 0, 6.3); ctx.fill(); ctx.restore(); }
        } else {
          // roseta de chantilly: base + espiral clara por cima
          const col = TOOLS.find((x) => x.id === d.tool)!.c;
          ctx.fillStyle = shade(col, -0.18);
          ctx.beginPath(); ctx.arc(0, 4, 17, 0, 6.3); ctx.fill();
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.3); ctx.fill();
          ctx.strokeStyle = shade(col, 0.35); ctx.lineWidth = 3; ctx.lineCap = "round";
          ctx.beginPath();
          for (let a = 0; a < 12; a += 0.3) { const rr = 14 - a * 1.05; ctx.lineTo(Math.cos(a + d.r) * rr, Math.sin(a + d.r) * rr - a * 0.6); }
          ctx.stroke();
        }
        ctx.restore();
      }

      // bico de confeitar seguindo o mouse
      if (at && !p.down) {
        const col = TOOLS.find((x) => x.id === st.current.tool)!.c;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(0.5);
        ctx.fillStyle = "#f4efe8"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-22, -70); ctx.lineTo(22, -70); ctx.closePath(); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-16, -66); ctx.lineTo(16, -66); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#b9b2a6"; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-7, -14); ctx.lineTo(7, -14); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    });
  }, []);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: confeite o bolo" />;
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export const BAKERY_COPY: Copy = {
  brand: "Dona Glacê", links: ["Bolos", "Encomendas", "Dúvidas"], navCta: "Encomendar",
  kicker: "Confeitaria · Valinhos", h1: "Bolo de festa", h1em: "com cara de casa.",
  lead: "Massa feita no dia, recheio de verdade e chantilly batido aqui. Você escolhe o sabor e a gente entrega pronto pra cantar parabéns.",
  cta: "Encomendar no WhatsApp", cta2: "Ver sabores", servicesTitle: "Na vitrine",
  services: [
    ["Bolo de festa", "do 1 kg ao de três andares"],
    ["Naked cake", "massa à mostra e frutas por cima"],
    ["Brigadeiro gourmet", "cento ou caixa com 12"],
    ["Bem-casado", "embalado pra lembrancinha"],
    ["Torta de limão", "fatia ou inteira, pra retirar"],
    ["Bolo do dia", "sai do forno às 15h"],
  ],
  finalTitle: "Tem festa chegando?", finalText: "Encomende com três dias de antecedência e escolha o sabor com calma.", finalCta: "Encomendar agora", toy: true,
};

export default function Bakery({ m, c = BAKERY_COPY }: { m: boolean; c?: Copy }) {
  const [tool, setTool] = useState<Tool>("pistache");
  const [n, setN] = useState(0);
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <b className={s.logo}>{c.brand}</b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        <div className={s.copy}>
          <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 50 : 92, m ? 18 : 24) }}>
            {c.h1} <span>{c.h1em}</span>
          </h1>
          <p className={s.where}>{c.kicker}</p>
          <p className={s.lead}>{c.lead}</p>
          <span className={s.btn}>{c.cta}</span>
          <span className={s.link}>{c.cta2}</span>
        </div>
        {c.toy ? (
          <div className={s.stand}>
            <Cake tool={tool} onCount={setN} />
            <div className={s.tools} role="radiogroup" aria-label="Confeitar com">
              {TOOLS.map((t) => (
                <button key={t.id} role="radio" aria-checked={tool === t.id} className={s.tool} onClick={() => setTool(t.id)}>
                  <i style={{ background: t.c }} /> {t.label}
                </button>
              ))}
            </div>
            <p className={s.count}>{n ? `${n} enfeites no bolo` : "Arraste em cima do bolo pra confeitar"}</p>
          </div>
        ) : (
          <div className={s.boardWrap}><Board c={c} m={m} /></div>
        )}
      </section>

      <section className={s.case}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <ul>
          {c.services.map(([a, b], i) => (
            <li key={a} style={{ rotate: `${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg` }}>
              <b>{a}</b><span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.cta}>
        <h2 style={{ fontSize: fitSize(c.finalTitle, m ? 48 : 92, 22) }}>{c.finalTitle}</h2>
        {c.finalText && <p>{c.finalText}</p>}
        <span className={s.btnLight}>{c.finalCta}</span>
      </section>
    </div>
  );
}
