"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Salon.module.css";
import { coverage, layer, runToy } from "./toy";

export const POLISH = [
  { name: "Vermelho clássico", c: "#b3263e" },
  { name: "Nude", c: "#cf9a86" },
  { name: "Vinho", c: "#5c1a2b" },
  { name: "Rosa chiclete", c: "#f06c9b" },
  { name: "Azul noite", c: "#22305e" },
  { name: "Branquinho", c: "#f7f2ee" },
];

// dedos: base (x,y), ângulo, comprimento, largura. Mão vista de cima, dedos pra cima.
const FINGERS = [
  { x: 150, y: 400, a: -0.9, L: 120, w: 50 }, // polegar
  { x: 198, y: 330, a: -0.16, L: 190, w: 44 },
  { x: 258, y: 318, a: -0.03, L: 210, w: 46 },
  { x: 318, y: 326, a: 0.1, L: 196, w: 44 },
  { x: 370, y: 350, a: 0.26, L: 158, w: 38 },
];
const nailOf = (f: (typeof FINGERS)[number]) => {
  const tx = f.x + Math.sin(f.a) * f.L, ty = f.y - Math.cos(f.a) * f.L;
  const nw = f.w * 0.72, nh = f.w * 0.98;
  return { cx: tx - Math.sin(f.a) * nh * 0.42, cy: ty + Math.cos(f.a) * nh * 0.42, a: f.a, nw, nh };
};
const NAILS = FINGERS.map(nailOf);

function nailPath(ctx: CanvasRenderingContext2D, n: (typeof NAILS)[number], grow = 0) {
  ctx.save(); ctx.translate(n.cx, n.cy); ctx.rotate(n.a);
  ctx.roundRect(-n.nw / 2 - grow, -n.nh / 2 - grow, n.nw + grow * 2, n.nh + grow * 2, [n.nw / 2 + grow, n.nw / 2 + grow, 8, 8]);
  ctx.restore();
}

/** Brinquedo: escolha o esmalte e passe o pincel nas unhas. */
function Nails({ color, onDone }: { color: string; onDone: (painted: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ color, onDone });
  useEffect(() => { st.current = { color, onDone }; });

  useEffect(() => {
    const paint = layer(520, 560);
    let wasDown = false, shine = -1, lx = 0, ly = 0;

    const measure = () => {
      let done = 0;
      for (const n of NAILS) {
        const r = Math.max(n.nw, n.nh) / 2;
        const v = coverage(paint, (u, v) => {
          const dx = u * 520 - n.cx, dy = v * 560 - n.cy;
          const c = Math.cos(-n.a), sn = Math.sin(-n.a);
          const x = dx * c - dy * sn, y = dx * sn + dy * c;
          return Math.abs(x) < n.nw / 2 - 3 && Math.abs(y) < n.nh / 2 - 3 && r > 0;
        });
        if (v > 0.8) done++;
      }
      st.current.onDone(done);
      if (done === NAILS.length) shine = 0;
    };

    return runToy(ref.current!, 520, 560, (ctx, dt, p) => {
      // fundo: toalhinha da manicure
      ctx.fillStyle = "#e8dad0"; ctx.fillRect(0, 0, 520, 560);
      ctx.fillStyle = "#f4ece6";
      ctx.beginPath(); ctx.roundRect(60, 120, 400, 460, 30); ctx.fill();

      // mão
      ctx.fillStyle = "#d9a385";
      for (const f of FINGERS) {
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a);
        ctx.beginPath(); ctx.roundRect(-f.w / 2, -f.L - 4, f.w, f.L + 60, f.w / 2); ctx.fill();
        ctx.restore();
      }
      ctx.beginPath(); ctx.roundRect(150, 330, 250, 260, [60, 70, 0, 0]); ctx.fill();
      // dobras dos dedos
      ctx.strokeStyle = "rgba(140,80,55,.25)"; ctx.lineWidth = 2; ctx.lineCap = "round";
      for (const f of FINGERS.slice(1)) for (const k of [0.38, 0.68]) {
        const x = f.x + Math.sin(f.a) * f.L * k, y = f.y - Math.cos(f.a) * f.L * k;
        ctx.save(); ctx.translate(x, y); ctx.rotate(f.a);
        ctx.beginPath(); ctx.moveTo(-f.w * 0.22, 0); ctx.quadraticCurveTo(0, 4, f.w * 0.22, 0); ctx.stroke();
        ctx.restore();
      }
      // unhas ao natural
      for (const n of NAILS) { ctx.beginPath(); nailPath(ctx, n); ctx.fillStyle = "#efc4b6"; ctx.fill(); }

      // pincel
      if (p.down && p.inside) {
        const g = paint.ctx;
        g.strokeStyle = st.current.color; g.lineWidth = 18; g.lineCap = "round";
        g.beginPath(); g.moveTo(wasDown ? lx : p.x, wasDown ? ly : p.y); g.lineTo(p.x, p.y); g.stroke();
        lx = p.x; ly = p.y;
      }
      if (wasDown && !p.down) measure();
      wasDown = p.down;

      // esmalte só dentro das unhas
      ctx.save(); ctx.beginPath(); for (const n of NAILS) nailPath(ctx, n); ctx.clip();
      ctx.drawImage(paint.c, 0, 0, 520, 560);
      // brilho do esmalte
      for (const n of NAILS) {
        ctx.save(); ctx.translate(n.cx, n.cy); ctx.rotate(n.a);
        ctx.fillStyle = "rgba(255,255,255,.28)";
        ctx.beginPath(); ctx.roundRect(-n.nw / 2 + 5, -n.nh / 2 + 6, 6, n.nh - 16, 3); ctx.fill();
        ctx.restore();
      }
      if (shine >= 0) {
        shine += dt * 0.8;
        const x = -100 + (shine % 1.6) * 520;
        ctx.fillStyle = "rgba(255,255,255,.45)";
        ctx.save(); ctx.translate(x, 0); ctx.rotate(0.35); ctx.fillRect(0, -100, 34, 800); ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(120,70,50,.35)"; ctx.lineWidth = 1.5;
      for (const n of NAILS) { ctx.beginPath(); nailPath(ctx, n); ctx.stroke(); }

      // pincel do vidrinho seguindo o mouse
      if (p.inside) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-0.5);
        ctx.fillStyle = st.current.color; ctx.beginPath(); ctx.roundRect(-6, -4, 12, 22, 5); ctx.fill();
        ctx.fillStyle = "#1c1415"; ctx.fillRect(-4, 18, 8, 70);
        ctx.restore();
      }
    });
  }, []);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: pinte as unhas" />;
}

export const SALON_COPY: Copy = {
  brand: "Studio Lacca", links: ["Serviços", "Agenda", "Dúvidas"], navCta: "Agendar",
  kicker: "Salão de beleza · Vinhedo", h1: "Unha feita,", h1em: "cabelo no lugar.",
  lead: "Manicure, cabelo e sobrancelha no mesmo horário, com material esterilizado e café enquanto o esmalte seca.",
  cta: "Agendar pelo WhatsApp", cta2: "Ver serviços", servicesTitle: "Serviços",
  services: [
    ["Manicure e pedicure", "esmalte comum ou em gel"],
    ["Alongamento de unha", "fibra ou gel, com manutenção"],
    ["Corte e escova", "lavagem, corte e finalização"],
    ["Coloração", "raiz, mechas ou cor inteira"],
    ["Sobrancelha", "design com pinça ou linha"],
    ["Dia de noiva", "cabelo, maquiagem e unhas"],
  ],
  finalTitle: "Tem horário amanhã.", finalText: "Manda uma mensagem e escolhe o seu, sem fila na recepção.", finalCta: "Agendar agora", toy: true,
};

export default function Salon({ m, c = SALON_COPY }: { m: boolean; c?: Copy }) {
  const [pick, setPick] = useState(0);
  const [done, setDone] = useState(0);
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <b className={s.logo}>{c.brand}</b>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        {c.toy ? (
          <div className={s.desk}>
            <Nails color={POLISH[pick].c} onDone={setDone} />
            <div className={s.polish} role="radiogroup" aria-label="Esmalte">
              {POLISH.map((x, i) => (
                <button key={x.name} role="radio" aria-checked={pick === i} aria-label={x.name} title={x.name} className={s.bottle} onClick={() => setPick(i)}>
                  <i style={{ background: x.c }} />
                </button>
              ))}
              <span className={s.status}>{done === 5 ? "Pronta. Agora é só secar." : done ? `${done} de 5 unhas` : POLISH[pick].name}</span>
            </div>
          </div>
        ) : (
          <div className={s.boardWrap}><Board c={c} m={m} /></div>
        )}
        <div className={s.copy}>
          <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 50 : 88, m ? 20 : 24) }}>
            {c.h1} <span>{c.h1em}</span>
          </h1>
          <p className={s.lead}>{c.lead}</p>
          <p className={s.where}>{c.kicker}</p>
          <span className={s.btn}>{c.cta}</span>
        </div>
      </section>

      <section className={s.list}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <ul>
          {c.services.map(([a, b]) => (
            <li key={a}><b>{a}</b><span>{b}</span></li>
          ))}
        </ul>
      </section>

      <section className={s.cta}>
        <h2 style={{ fontSize: fitSize(c.finalTitle, m ? 46 : 96, 20) }}>{c.finalTitle}</h2>
        <div>
          {c.finalText && <p>{c.finalText}</p>}
          <span className={s.btnRed}>{c.finalCta}</span>
        </div>
      </section>
    </div>
  );
}
