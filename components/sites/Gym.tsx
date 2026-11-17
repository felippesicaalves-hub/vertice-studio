"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Gym.module.css";
import { fontOf, rand, runToy } from "./toy";

const PLATES = [
  { kg: 20, c: "#2f62c9", r: 96 },
  { kg: 15, c: "#e8b713", r: 96 },
  { kg: 10, c: "#3a9a52", r: 96 },
  { kg: 5, c: "#f1efe8", r: 64 },
];
const FLOOR = 486, TOP = 150;

type Dust = { x: number; y: number; vx: number; vy: number; life: number; r: number };

/** Brinquedo: segure a barra e levante até a linha; solte e ela cai no chão. Cada subida conta uma repetição. */
function Barbell({ plates, onRep }: { plates: number[]; onRep: (n: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ plates, onRep });
  useEffect(() => { st.current = { plates, onRep }; });

  useEffect(() => {
    let y = 0, vy = 0, grab = false, armed = true, reps = 0, shake = 0;
    const dust: Dust[] = [];
    const rest = () => {
      const big = st.current.plates.some((i) => PLATES[i].r > 70);
      return FLOOR - (big ? 96 : 64);
    };
    y = rest();
    const F = fontOf(ref.current!);

    return runToy(ref.current!, 520, 560, (ctx, dt, p, t) => {
      const kg = 20 + st.current.plates.reduce((a, i) => a + PLATES[i].kg * 2, 0);
      const floorY = rest();

      if (p.down && !grab && Math.abs(p.y - y) < 80 && p.x > 40 && p.x < 480) grab = true;
      if (!p.down) grab = false;
      if (grab) {
        // quanto mais peso, mais a barra demora a seguir a mão
        const target = Math.max(TOP - 30, Math.min(floorY, p.y));
        const k = Math.min(1, dt * 16 * (60 / kg));
        vy = (target - y) / Math.max(dt, 1e-3) * k;
        y += (target - y) * k;
      } else {
        vy += 2200 * dt;
        y += vy * dt;
      }
      if (y >= floorY) {
        if (vy > 500) {
          shake = Math.min(1, vy / 1800);
          for (let i = 0; i < 26; i++) {
            const side = i % 2 ? 1 : -1;
            dust.push({ x: 260 + side * rand(150, 210), y: FLOOR - 4, vx: side * rand(20, 140), vy: rand(-140, -20), life: 1, r: rand(3, 9) });
          }
          vy *= -0.18;
        } else vy = 0;
        y = floorY;
        armed = true;
      }
      if (armed && y <= TOP) { armed = false; reps++; st.current.onRep(reps); }
      shake = Math.max(0, shake - dt * 4);

      ctx.save();
      ctx.translate(Math.sin(t * 90) * shake * 4, 0);

      // parede e plataforma
      ctx.fillStyle = "#1f1f1f"; ctx.fillRect(0, 0, 520, FLOOR);
      ctx.fillStyle = "#262626";
      for (let x = 0; x < 520; x += 104) ctx.fillRect(x + 2, 0, 100, FLOOR);
      ctx.fillStyle = "#0d0d0d"; ctx.fillRect(0, FLOOR, 520, 74);
      ctx.fillStyle = "#6b4a2b"; ctx.fillRect(130, FLOOR, 260, 74);
      ctx.fillStyle = "rgba(255,255,255,.05)";
      for (let x = 140; x < 390; x += 26) ctx.fillRect(x, FLOOR, 2, 74);

      // linha do topo
      ctx.setLineDash([10, 10]); ctx.strokeStyle = armed ? "rgba(255,90,31,.85)" : "rgba(239,236,228,.25)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(20, TOP); ctx.lineTo(500, TOP); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = armed ? "#ff5a1f" : "rgba(239,236,228,.35)";
      ctx.font = `800 22px ${F}`; ctx.textAlign = "center";
      ctx.fillText(armed ? "SOBE ATÉ AQUI" : "AGORA SOLTA", 260, TOP - 14);

      // sombra no chão (diminui quando a barra sobe)
      const lift = (floorY - y) / (floorY - TOP);
      ctx.fillStyle = `rgba(0,0,0,${0.55 - lift * 0.35})`;
      ctx.beginPath(); ctx.ellipse(260, FLOOR + 8, 230 - lift * 50, 12 - lift * 5, 0, 0, Math.PI * 2); ctx.fill();

      // barra (enverga um pouco com o peso quando está sendo puxada)
      const sag = grab ? Math.min(14, kg / 14) : 0;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#8d9196"; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(18, y + sag * 0.3); ctx.quadraticCurveTo(260, y - sag, 502, y + sag * 0.3); ctx.stroke();
      ctx.strokeStyle = "#c6cacf"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(18, y - 3 + sag * 0.3); ctx.quadraticCurveTo(260, y - 3 - sag, 502, y - 3 + sag * 0.3); ctx.stroke();
      // recartilhado onde a mão pega
      ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1;
      for (const cx of [190, 330]) for (let x = cx - 30; x < cx + 30; x += 4) { ctx.beginPath(); ctx.moveTo(x, y - 6 - sag * 0.8); ctx.lineTo(x + 3, y + 6 - sag * 0.8); ctx.stroke(); }

      // anilhas: discos vistos de lado, um pouco em perspectiva
      for (const side of [-1, 1]) {
        let x = 260 + side * 150;
        ctx.fillStyle = "#5d6166"; ctx.fillRect(x - 6, y - 16, 12, 32); // trava
        x += side * 14;
        for (const i of st.current.plates) {
          const pl = PLATES[i];
          const w = pl.kg >= 10 ? 20 : 12;
          const cx = x + side * w / 2;
          ctx.fillStyle = shade(pl.c, -0.35);
          ctx.beginPath(); ctx.ellipse(cx + side * w / 2, y, 14, pl.r, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = shade(pl.c, -0.15);
          ctx.fillRect(cx - w / 2, y - pl.r, w, pl.r * 2);
          ctx.fillStyle = pl.c;
          ctx.beginPath(); ctx.ellipse(cx - side * w / 2, y, 14, pl.r, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,.25)";
          ctx.beginPath(); ctx.ellipse(cx - side * w / 2, y, 5, 14, 0, 0, Math.PI * 2); ctx.fill();
          x += side * w;
        }
      }

      // pó de magnésio
      for (let i = dust.length - 1; i >= 0; i--) {
        const d = dust[i];
        d.life -= dt * 1.4; if (d.life <= 0) { dust.splice(i, 1); continue; }
        d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 80 * dt; d.r += dt * 14;
        ctx.fillStyle = `rgba(240,238,232,${d.life * 0.35})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      }

      // mão de giz onde o cursor está
      if (p.inside) {
        ctx.fillStyle = grab ? "rgba(255,90,31,.9)" : "rgba(239,236,228,.6)";
        ctx.beginPath(); ctx.arc(p.x, grab ? y : p.y, grab ? 14 : 10, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = "#efece4"; ctx.textAlign = "left";
      ctx.font = `900 46px ${F}`;
      ctx.fillText(`${kg}`, 22, 542);
      const kw = ctx.measureText(`${kg}`).width;
      ctx.font = `800 22px ${F}`;
      ctx.fillText("KG", 22 + kw + 6, 542);
    });
  }, []);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: segure a barra e levante" />;
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export const GYM_COPY: Copy = {
  brand: "Box Pesado", links: ["Aulas", "Horários", "Primeira aula"], navCta: "Aula experimental",
  kicker: "Box de crossfit · Campinas", h1: "Treino duro,", h1em: "coach do seu lado.",
  lead: "Aula em grupo de uma hora, com aquecimento, técnica e o treino do dia. O coach corrige seu movimento antes de você colocar peso.",
  cta: "Marcar aula experimental", cta2: "Ver horários", servicesTitle: "As aulas",
  services: [
    ["Crossfit", "treino do dia em grupo, adaptado ao seu nível"],
    ["Levantamento olímpico", "arranco e arremesso com técnica"],
    ["Ginástica", "barra, argola e parada de mão, do básico"],
    ["Condicionamento", "fôlego e resistência, sem carga pesada"],
    ["Iniciantes", "quatro aulas pra aprender os movimentos"],
    ["Open box", "horário livre pra treinar sozinho"],
  ],
  finalTitle: "A primeira aula é por nossa conta.", finalText: "Chega dez minutos antes, de tênis e com uma garrafa d'água.", finalCta: "Marcar no WhatsApp", toy: true,
};

export default function Gym({ m, c = GYM_COPY }: { m: boolean; c?: Copy }) {
  const [plates, setPlates] = useState<number[]>([0]);
  const [reps, setReps] = useState(0);
  const size = fitSize(h1Text(c), m ? 60 : 124, m ? 16 : 16);
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <nav className={s.nav}>
        <span className={s.brandBox}>
          <b className={s.logo}>{c.brand}</b>
          {!m && <span className={s.where}>{c.kicker}</span>}
        </span>
        {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
        <span className={s.navBtn}>{c.navCta}</span>
      </nav>

      <section className={s.hero}>
        <div className={s.copy}>
          <h1 className={s.h1} style={{ fontSize: size }}>
            <span>{c.h1}</span> <span>{c.h1em}</span>
          </h1>
          <p className={s.lead}>{c.lead}</p>
          <div className={s.ctas}>
            <span className={s.btn}>{c.cta}</span>
            <span className={s.link}>{c.cta2}</span>
          </div>
        </div>
        {c.toy ? (
          <div className={s.rack}>
            <Barbell plates={plates} onRep={setReps} />
            <div className={s.controls}>
              <button className={s.ctl} onClick={() => setPlates((p) => p.slice(0, -1))} disabled={!plates.length} aria-label="Tirar anilha">− anilha</button>
              <button className={s.ctl} onClick={() => setPlates((p) => (p.length < 4 ? [...p, Math.min(3, p.length)] : p))} disabled={plates.length >= 4} aria-label="Pôr anilha">+ anilha</button>
              <span className={s.reps}>{reps ? `${reps} ${reps > 1 ? "repetições" : "repetição"}` : "Segure a barra e suba"}</span>
            </div>
          </div>
        ) : (
          <div className={s.boardWrap}><Board c={c} m={m} /></div>
        )}
      </section>

      <section className={s.classes}>
        <h2 className={s.h2}>{c.servicesTitle}</h2>
        <ul>
          {c.services.map(([a, b]) => (
            <li key={a}><b>{a}</b><span>{b}</span></li>
          ))}
        </ul>
      </section>

      <section className={s.cta}>
        <h2 style={{ fontSize: fitSize(c.finalTitle, m ? 52 : 104, 20) }}>{c.finalTitle}</h2>
        <div>
          {c.finalText && <p>{c.finalText}</p>}
          <span className={s.btnDark}>{c.finalCta}</span>
        </div>
      </section>
    </div>
  );
}
