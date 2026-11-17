"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Realty.module.css";
import { fontOf, rand, runToy } from "./toy";

const COLS = 5, ROWS = 6, BX = 96, BY = 96, WW = 50, WH = 48, GX = 18, GY = 16;
const TOTAL = COLS * ROWS;
type Win = { x: number; y: number; on: number; lit: boolean; kind: number; tint: string };

/** Brinquedo: passe o mouse/dedo nas janelas pra acender as luzes; cada uma mostra um morador chegando. */
function Building({ label, onLit }: { label: string; onLit: (n: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ label, onLit });
  useEffect(() => { st.current = { label, onLit }; });

  useEffect(() => {
    const F = fontOf(ref.current!);
    const TINTS = ["#ffd38a", "#ffe2a8", "#ffc56b", "#fff0c9"];
    const wins: Win[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
      wins.push({ x: BX + c * (WW + GX), y: BY + r * (WH + GY), on: 0, lit: false, kind: (Math.random() * 5) | 0, tint: TINTS[(Math.random() * 4) | 0] });
    // algumas já acesas, pra não começar morto
    for (const i of [3, 11, 17, 26]) { wins[i].lit = true; wins[i].on = 1; }
    const stars = Array.from({ length: 40 }, () => ({ x: rand(0, 520), y: rand(0, 300), p: rand(0, 6) }));
    let lit = 4;
    st.current.onLit(lit);

    return runToy(ref.current!, 520, 560, (ctx, dt, p, t) => {
      if (p.inside && (p.down || p.x > 0)) {
        for (const w of wins) {
          if (!w.lit && p.x > w.x - 4 && p.x < w.x + WW + 4 && p.y > w.y - 4 && p.y < w.y + WH + 4) {
            w.lit = true; lit++; st.current.onLit(lit);
          }
        }
      }
      const k = lit / TOTAL; // quanto mais acesas, mais noite
      // céu
      const sky = mix([214, 129, 92], [24, 42, 66], Math.min(1, 0.35 + k * 0.8));
      ctx.fillStyle = `rgb(${sky})`; ctx.fillRect(0, 0, 520, 560);
      ctx.fillStyle = `rgba(255,236,200,${0.9 * k})`;
      for (const s of stars) { const a = 0.5 + Math.sin(t * 2 + s.p) * 0.5; ctx.globalAlpha = a * k; ctx.fillRect(s.x, s.y, 2, 2); }
      ctx.globalAlpha = 1;
      // lua
      ctx.fillStyle = `rgba(250,240,220,${0.3 + k * 0.7})`;
      ctx.beginPath(); ctx.arc(450, 70, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgb(${sky})`; ctx.beginPath(); ctx.arc(460, 62, 20, 0, Math.PI * 2); ctx.fill();
      // prédios ao fundo
      ctx.fillStyle = `rgba(15,42,46,${0.55 + k * 0.3})`;
      ctx.fillRect(0, 230, 70, 330); ctx.fillRect(452, 190, 68, 370); ctx.fillRect(20, 300, 90, 260);
      // fachada
      ctx.fillStyle = "#c9b79c"; ctx.fillRect(BX - 26, BY - 34, COLS * (WW + GX) + 34, ROWS * (WH + GY) + 116);
      ctx.fillStyle = "#b5a284"; ctx.fillRect(BX - 34, BY - 46, COLS * (WW + GX) + 50, 16);
      ctx.fillStyle = `rgba(15,42,46,${0.15 + k * 0.35})`; ctx.fillRect(BX - 26, BY - 34, COLS * (WW + GX) + 34, ROWS * (WH + GY) + 116);

      for (const w of wins) {
        if (w.lit) w.on = Math.min(1, w.on + dt * 3);
        // vidro apagado
        ctx.fillStyle = "#24393f"; ctx.fillRect(w.x, w.y, WW, WH);
        if (w.on > 0) {
          ctx.globalAlpha = w.on;
          ctx.fillStyle = w.tint; ctx.fillRect(w.x, w.y, WW, WH);
          // morador / móvel em silhueta
          ctx.fillStyle = "rgba(60,38,20,.55)";
          const cx = w.x + WW / 2, by = w.y + WH;
          if (w.kind === 0) { ctx.beginPath(); ctx.arc(cx - 6, by - 26, 6, 0, 7); ctx.fill(); ctx.fillRect(cx - 13, by - 19, 14, 19); }
          if (w.kind === 1) { ctx.fillRect(w.x + 8, by - 14, 34, 14); ctx.fillRect(w.x + 8, by - 22, 8, 10); }
          if (w.kind === 2) { ctx.beginPath(); ctx.ellipse(w.x + 14, by - 18, 8, 12, 0, 0, 7); ctx.fill(); ctx.fillRect(w.x + 11, by - 8, 6, 8); }
          if (w.kind === 3) { ctx.fillRect(cx + 6, by - 30, 3, 30); ctx.beginPath(); ctx.moveTo(cx - 2, by - 30); ctx.lineTo(cx + 17, by - 30); ctx.lineTo(cx + 12, by - 40); ctx.lineTo(cx + 3, by - 40); ctx.fill(); }
          if (w.kind === 4) { ctx.beginPath(); ctx.arc(cx + 8, by - 24, 5, 0, 7); ctx.arc(cx - 8, by - 22, 5, 0, 7); ctx.fill(); ctx.fillRect(cx + 3, by - 18, 10, 18); ctx.fillRect(cx - 13, by - 16, 10, 16); }
          ctx.globalAlpha = 1;
          // luz vazando
          ctx.fillStyle = `rgba(255,200,110,${0.12 * w.on})`;
          ctx.fillRect(w.x - 6, w.y + WH, WW + 12, 8);
        }
        // caixilho
        ctx.fillStyle = "#e9dfcf"; ctx.fillRect(w.x + WW / 2 - 1.5, w.y, 3, WH); ctx.fillRect(w.x - 3, w.y + WH, WW + 6, 4);
      }

      // térreo: portaria com o letreiro do negócio
      const gy = BY + ROWS * (WH + GY) + 6;
      ctx.fillStyle = "#0f2a2e"; ctx.fillRect(BX - 26, gy, COLS * (WW + GX) + 34, 52);
      ctx.fillStyle = "#f2a541"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const txt = st.current.label.toUpperCase();
      ctx.font = `800 ${Math.min(22, 300 / Math.max(8, txt.length) * 1.5)}px ${F}`;
      ctx.fillText(txt, BX - 26 + (COLS * (WW + GX) + 34) / 2, gy + 27);
      ctx.textBaseline = "alphabetic";
      // calçada
      ctx.fillStyle = "#3e4f52"; ctx.fillRect(0, gy + 52, 520, 120);
      ctx.fillStyle = "#56686b"; ctx.fillRect(0, gy + 52, 520, 10);
    });
  }, []);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: acenda as janelas do prédio" />;
}

const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",");

export const REALTY_COPY: Copy = {
  brand: "Chave Certa", links: ["Imóveis", "Vender", "Dúvidas"], navCta: "Falar com corretor",
  kicker: "Imobiliária · Jundiaí", h1: "O apartamento certo", h1em: "antes do anúncio.",
  lead: "Diga o bairro, o número de quartos e quanto quer pagar. A gente separa as opções, marca as visitas e cuida da papelada até a chave.",
  cta: "Contar o que procuro", cta2: "Quero vender", servicesTitle: "Como a gente ajuda",
  services: [
    ["Comprar", "seleção de imóveis e visitas no mesmo dia"],
    ["Vender", "avaliação, fotos e anúncio nos portais"],
    ["Alugar", "contrato, vistoria e garantia sem fiador"],
    ["Financiamento", "simulação e acompanhamento no banco"],
    ["Documentação", "certidões, escritura e registro"],
    ["Avaliação", "quanto o seu imóvel vale hoje"],
  ],
  finalTitle: "Qual é o próximo endereço?", finalText: "Manda o bairro e o orçamento no WhatsApp. A primeira lista sai no mesmo dia.", finalCta: "Chamar no WhatsApp", toy: true,
};

export default function Realty({ m, c = REALTY_COPY }: { m: boolean; c?: Copy }) {
  const [lit, setLit] = useState(0);
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <b className={s.logo}>{c.brand}</b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 46 : 100, m ? 20 : 30) }}>
          {c.h1} <span>{c.h1em}</span>
        </h1>
        <div className={s.row}>
          <div className={s.copy}>
            <p className={s.lead}>{c.lead}</p>
            <p className={s.where}>{c.kicker}</p>
            <span className={s.btn}>{c.cta}</span>
            <span className={s.link}>{c.cta2}</span>
          </div>
          {c.toy ? (
            <div className={s.street}>
              <Building label={c.brand} onLit={setLit} />
              <p className={s.meter}>
                {lit >= TOTAL ? "Prédio cheio. Todo mundo achou o seu lugar." : `${lit} de ${TOTAL} janelas acesas · passe o dedo nas apagadas`}
              </p>
            </div>
          ) : (
            <div className={s.boardWrap}><Board c={c} m={m} /></div>
          )}
        </div>
      </section>

      <section className={s.help}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <ul>
          {c.services.map(([a, b]) => (
            <li key={a}><b>{a}</b><span>{b}</span></li>
          ))}
        </ul>
      </section>

      <section className={s.cta}>
        <h2 style={{ fontSize: fitSize(c.finalTitle, m ? 42 : 86, 26) }}>{c.finalTitle}</h2>
        {c.finalText && <p>{c.finalText}</p>}
        <span className={s.btnDark}>{c.finalCta}</span>
      </section>
    </div>
  );
}
