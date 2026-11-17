"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Pizza.module.css";
import { layer, rand, runToy } from "./toy";

const ING = [
  { id: "mussarela", label: "Mussarela" },
  { id: "tomate", label: "Tomate" },
  { id: "manjericao", label: "Manjericão" },
  { id: "calabresa", label: "Calabresa" },
  { id: "azeitona", label: "Azeitona" },
] as const;
type Ing = (typeof ING)[number]["id"];
type Item = { type: Ing; x: number; y: number; r: number; age: number; seed: number[] };

const C = 260, R = 222, SAUCE = 188;

function drawBase() {
  const K = 2;
  const { c, ctx } = layer(520 * K, 520 * K);
  ctx.scale(K, K);
  // borda
  const g = ctx.createRadialGradient(C, C, SAUCE - 10, C, C, R);
  g.addColorStop(0, "#e9b56c"); g.addColorStop(0.55, "#d9984e"); g.addColorStop(1, "#b9732f");
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2, rr = R + Math.sin(i * 1.7) * 3 + Math.sin(i * 0.6) * 4;
    ctx.lineTo(C + Math.cos(a) * rr, C + Math.sin(a) * rr);
  }
  ctx.fill();
  // pontos tostados da lenha
  for (let i = 0; i < 70; i++) {
    const a = rand(0, Math.PI * 2), rr = rand(SAUCE + 6, R - 4);
    ctx.fillStyle = `rgba(${rand(40, 70)},${rand(22, 35)},12,${rand(0.25, 0.7)})`;
    ctx.beginPath(); ctx.ellipse(C + Math.cos(a) * rr, C + Math.sin(a) * rr, rand(2, 7), rand(1.5, 4), a, 0, Math.PI * 2); ctx.fill();
  }
  // molho
  ctx.fillStyle = "#c33a26";
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2, rr = SAUCE + Math.sin(i * 2.3) * 4;
    ctx.lineTo(C + Math.cos(a) * rr, C + Math.sin(a) * rr);
  }
  ctx.fill();
  for (let i = 0; i < 260; i++) {
    const a = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random()) * SAUCE;
    ctx.fillStyle = Math.random() < 0.5 ? "rgba(150,30,18,.35)" : "rgba(230,90,60,.25)";
    ctx.beginPath(); ctx.arc(C + Math.cos(a) * rr, C + Math.sin(a) * rr, rand(1, 4), 0, Math.PI * 2); ctx.fill();
  }
  // orégano
  for (let i = 0; i < 90; i++) {
    const a = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random()) * SAUCE;
    ctx.fillStyle = "rgba(70,80,30,.8)";
    ctx.fillRect(C + Math.cos(a) * rr, C + Math.sin(a) * rr, 2, 1.4);
  }
  return c;
}

function blob(ctx: CanvasRenderingContext2D, r: number, seed: number[]) {
  ctx.beginPath();
  seed.forEach((q, i) => {
    const a = (i / seed.length) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * r * q, Math.sin(a) * r * q);
  });
  ctx.closePath();
}

function drawItem(ctx: CanvasRenderingContext2D, it: Item) {
  const t = Math.min(1, it.age / 0.28);
  const sc = 1 + (1 - t) * (1 - t) * 0.9;
  const lift = (1 - t) * 18;
  ctx.save();
  ctx.translate(it.x, it.y);
  if (lift > 0.5) {
    ctx.fillStyle = `rgba(0,0,0,${0.18 * (1 - t)})`;
    ctx.beginPath(); ctx.ellipse(4, 6, 16 * sc, 12 * sc, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.translate(0, -lift);
  ctx.rotate(it.r);
  ctx.scale(sc, sc);
  switch (it.type) {
    case "mussarela":
      blob(ctx, 22, it.seed); ctx.fillStyle = "#fbf3df"; ctx.fill();
      blob(ctx, 15, it.seed); ctx.fillStyle = "#fffaf0"; ctx.fill();
      ctx.fillStyle = "rgba(205,140,60,.45)";
      ctx.beginPath(); ctx.arc(6, -4, 3, 0, Math.PI * 2); ctx.fill();
      break;
    case "tomate":
      ctx.fillStyle = "#d8442f"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ec6a4f"; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f6d6a8";
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 6, Math.sin(a) * 6, 2.2, 1.2, a, 0, Math.PI * 2); ctx.fill(); }
      break;
    case "manjericao":
      ctx.fillStyle = "#2f7a3e";
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(0, -14, 18, 0); ctx.quadraticCurveTo(0, 14, -18, 0); ctx.fill();
      ctx.strokeStyle = "#5fa86b"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke();
      break;
    case "calabresa":
      ctx.fillStyle = "#a8322a"; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#7c211b"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#f2d7c2";
      it.seed.slice(0, 5).forEach((q, i) => { ctx.beginPath(); ctx.arc(Math.cos(i * 2.4) * 8 * q, Math.sin(i * 2.4) * 8 * q, 1.8, 0, Math.PI * 2); ctx.fill(); });
      break;
    case "azeitona":
      ctx.strokeStyle = "#2a2520"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(-1, -2, 7, 3.6, 4.6); ctx.stroke();
      break;
  }
  ctx.restore();
}

/** Brinquedo: escolha o ingrediente e clique/arraste em cima da pizza. */
function PizzaToy({ pick, onCount, cmd }: { pick: Ing; onCount: (n: number) => void; cmd: { n: number; type: "slice" | "clear" | null } }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ pick, onCount });
  useEffect(() => { st.current = { pick, onCount }; });
  const api = useRef<{ slice: () => void; clear: () => void } | null>(null);

  useEffect(() => {
    if (cmd.type === "slice") api.current?.slice();
    if (cmd.type === "clear") api.current?.clear();
  }, [cmd]);

  useEffect(() => {
    const base = drawBase();
    const items: Item[] = [];
    let lx = -999, ly = -999, slice = -1;
    // começa com uma margherita meio montada, pra já ter cara de pizza
    const seed = () => Array.from({ length: 9 }, () => rand(0.8, 1.15));
    const add = (type: Ing, x: number, y: number, age = 1) => items.push({ type, x, y, r: rand(0, Math.PI * 2), age, seed: seed() });
    for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.3, r = 40 + (i % 3) * 52; add("mussarela", C + Math.cos(a) * r, C + Math.sin(a) * r); }
    api.current = {
      slice: () => { slice = 0; },
      clear: () => { items.length = 0; slice = -1; st.current.onCount(0); },
    };
    st.current.onCount(items.length);

    const stop = runToy(ref.current!, 520, 520, (ctx, dt, p, t) => {
      // tábua
      ctx.save();
      ctx.fillStyle = "#b97e48";
      ctx.beginPath(); ctx.arc(C, C, 252, 0, Math.PI * 2); ctx.fill(); ctx.clip();
      ctx.strokeStyle = "rgba(90,50,20,.18)"; ctx.lineWidth = 2;
      for (let y = 20; y < 520; y += 14) { ctx.beginPath(); ctx.moveTo(C - 250, y + Math.sin(y) * 3); ctx.bezierCurveTo(C - 80, y + 6, C + 80, y - 6, C + 250, y); ctx.stroke(); }
      ctx.restore();
      ctx.drawImage(base, 0, 0, 520, 520);

      const inPizza = (x: number, y: number) => (x - C) ** 2 + (y - C) ** 2 < (SAUCE - 12) ** 2;
      if (p.down && inPizza(p.x, p.y) && (p.clicked || Math.hypot(p.x - lx, p.y - ly) > 26) && items.length < 160) {
        add(st.current.pick, p.x, p.y, 0);
        lx = p.x; ly = p.y;
        st.current.onCount(items.length);
      }
      if (!p.down) { lx = ly = -999; }
      for (const it of items) { it.age += dt; drawItem(ctx, it); }

      // fatias
      if (slice >= 0) {
        slice = Math.min(1, slice + dt * 1.6);
        ctx.strokeStyle = "rgba(60,30,10,.55)"; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI + 0.4, e = Math.min(1, Math.max(0, slice * 4 - i));
          if (!e) continue;
          ctx.beginPath();
          ctx.moveTo(C - Math.cos(a) * R * e, C - Math.sin(a) * R * e);
          ctx.lineTo(C + Math.cos(a) * R * e, C + Math.sin(a) * R * e);
          ctx.stroke();
        }
      }
      // vapor
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i++) {
        const x0 = C - 70 + i * 70, ph = t * 0.6 + i * 1.3, f = (ph % 1);
        ctx.strokeStyle = `rgba(255,255,255,${0.32 * Math.sin(f * Math.PI)})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let k = 0; k <= 12; k++) {
          const y = C - 20 - f * 90 - k * 7;
          ctx.lineTo(x0 + Math.sin(k * 0.7 + t * 2 + i) * 7, y);
        }
        ctx.stroke();
      }
      // cursor: o ingrediente escolhido segue o mouse
      if (p.inside && inPizza(p.x, p.y) && !p.down) {
        ctx.globalAlpha = 0.55;
        drawItem(ctx, { type: st.current.pick, x: p.x, y: p.y, r: 0.4, age: 1, seed: [1, 1.05, 0.95, 1.1, 1, 0.92, 1.08, 1, 0.97] });
        ctx.globalAlpha = 1;
      }
    });
    return stop;
  }, []);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: monte a sua pizza" />;
}

export const PIZZA_COPY: Copy = {
  brand: "Cantina da Lucia", links: ["Cardápio", "Delivery", "Perguntas"], navCta: "Pedir",
  kicker: "Pizzaria de forno a lenha · Vinhedo", h1: "Massa que descansa,", h1em: "forno que não apaga.",
  lead: "Longa fermentação, molho de tomate pelado e mussarela que puxa. Sai do forno e vai direto pra sua mesa.",
  cta: "Pedir no WhatsApp", cta2: "Ver o cardápio", servicesTitle: "Do forno, hoje",
  services: [
    ["Margherita", "tomate pelado, mussarela, manjericão e azeite"],
    ["Calabresa da casa", "calabresa fatiada fina, cebola roxa e azeitona"],
    ["Quatro queijos", "mussarela, gorgonzola, parmesão e provolone"],
    ["Portuguesa", "presunto, ovo, cebola, ervilha e azeitona"],
    ["Abobrinha", "abobrinha grelhada, ricota e hortelã"],
    ["Nutella com morango", "pra fechar a noite"],
  ],
  finalTitle: "Bateu a fome? A gente leva.", finalText: "", finalCta: "Pedir agora", toy: true,
};

export default function Pizza({ m, c = PIZZA_COPY }: { m: boolean; c?: Copy }) {
  const [pick, setPick] = useState<Ing>("tomate");
  const [count, setCount] = useState(0);
  const [cmd, setCmd] = useState<{ n: number; type: "slice" | "clear" | null }>({ n: 0, type: null });
  const words = c.brand.split(" ");
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <b className={s.logo}>{words.length === 3 ? <>{words[0]} <em>{words[1]}</em> {words[2]}</> : c.brand}</b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>
      <div className={s.check} />

      <section className={s.hero}>
        <div className={s.copy}>
          <p className={s.kicker}>{c.kicker}</p>
          <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 46 : 92, 40) }}>{c.h1} <em>{c.h1em}</em></h1>
          <p className={s.lead}>{c.lead}</p>
          <div className={s.ctas}>
            <span className={s.btn}>{c.cta}</span>
            <span className={s.link}>{c.cta2}</span>
          </div>
        </div>

        {c.toy ? (
          <div className={s.board}>
            <div className={s.tray}>
              {ING.map((x) => (
                <button key={x.id} className={pick === x.id ? s.on : ""} onClick={() => setPick(x.id)}>{x.label}</button>
              ))}
            </div>
            <PizzaToy pick={pick} onCount={setCount} cmd={cmd} />
            <div className={s.foot}>
              <span>{count > 9 ? `Sua pizza: ${count} ingredientes` : "Escolha e clique na pizza"}</span>
              <button onClick={() => setCmd((x) => ({ n: x.n + 1, type: "slice" }))}>Fatiar</button>
              <button onClick={() => setCmd((x) => ({ n: x.n + 1, type: "clear" }))}>Limpar</button>
            </div>
          </div>
        ) : (
          <div className={s.boardWrap} style={{ "--bd-bg": "#2a1a12", "--bd-ink": "#f5ecda", "--bd-accent": "#f2c46d", "--bd-head": "var(--f-dmserif)", "--bd-body": "var(--f-work)" } as React.CSSProperties}><Board c={c} m={m} /></div>
        )}
      </section>

      <section className={s.menu}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <div className={s.cols}>
          {c.services.map(([a, b]) => (
            <div key={a} className={s.dish}><b>{a}</b><span>{b}</span></div>
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
