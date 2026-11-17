"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Copy } from "./copy";
import { fitSize, h1Text } from "./copy";
import s from "./Garage.module.css";
import { fontOf, runToy } from "./toy";

const CX = 260, CY = 272, NUT_R = 64;
const STAR = [0, 2, 4, 1, 3]; // aperto em estrela
const NUTS = Array.from({ length: 5 }, (_, i) => {
  const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
  return { x: CX + Math.cos(a) * NUT_R, y: CY + Math.sin(a) * NUT_R };
});

/** Brinquedo: pegue um parafuso e gire a chave em volta dele (sentido horário), na ordem em estrela. */
function Wheel({ onState }: { onState: (done: number, order: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef(onState);
  useEffect(() => { st.current = onState; });

  useEffect(() => {
    const F = fontOf(ref.current!);
    const tight = [0, 0, 0, 0, 0];
    let held = -1, lastA = 0, step = 0, inOrder = true, spin = 0, sent = "";

    return runToy(ref.current!, 520, 560, (ctx, dt, p, t) => {
      // pegar o parafuso mais perto
      if (p.clicked) {
        let best = -1, bd = 60;
        NUTS.forEach((n, i) => { const d = Math.hypot(p.x - n.x, p.y - n.y); if (d < bd && tight[i] < 1) { bd = d; best = i; } });
        held = best;
        if (held >= 0) {
          lastA = Math.atan2(p.y - NUTS[held].y, p.x - NUTS[held].x);
          if (STAR[step] !== held && tight[STAR[step]] < 1) inOrder = false;
          tight[held] = Math.min(1, tight[held] + 0.08); // cada toque também aperta um pouco
        }
      }
      if (!p.down) held = -1;
      if (held >= 0) {
        const n = NUTS[held];
        const a = Math.atan2(p.y - n.y, p.x - n.x);
        let d = a - lastA;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        if (d > 0) tight[held] = Math.min(1, tight[held] + d / (Math.PI * 3));
        lastA = a;
      }
      while (step < 5 && tight[STAR[step]] >= 1) step++;
      const done = tight.filter((v) => v >= 1).length;
      const key = `${done}${inOrder}`;
      if (key !== sent) { sent = key; st.current(done, inOrder); }
      if (done === 5) spin += dt * 2.5;

      // fundo: chão da oficina
      ctx.fillStyle = "#18191b"; ctx.fillRect(0, 0, 520, 560);
      ctx.fillStyle = "#222428";
      for (let y = 0; y < 560; y += 70) for (let x = (y / 70) % 2 ? 0 : 35; x < 520; x += 70) ctx.fillRect(x, y, 35, 35);
      // faixa de segurança
      ctx.save(); ctx.beginPath(); ctx.rect(0, 510, 520, 50); ctx.clip();
      for (let x = -60; x < 560; x += 40) { ctx.fillStyle = "#ffb000"; ctx.beginPath(); ctx.moveTo(x, 560); ctx.lineTo(x + 20, 560); ctx.lineTo(x + 50, 510); ctx.lineTo(x + 30, 510); ctx.fill(); }
      ctx.restore();

      ctx.save(); ctx.translate(CX, CY); ctx.rotate(spin); ctx.translate(-CX, -CY);
      // pneu
      ctx.fillStyle = "#0c0c0d"; ctx.beginPath(); ctx.arc(CX, CY, 214, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#1f2023"; ctx.lineWidth = 10;
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(CX + Math.cos(a) * 192, CY + Math.sin(a) * 192); ctx.lineTo(CX + Math.cos(a + 0.05) * 212, CY + Math.sin(a + 0.05) * 212); ctx.stroke();
      }
      ctx.fillStyle = "#2b2c30"; ctx.beginPath(); ctx.arc(CX, CY, 158, 0, Math.PI * 2); ctx.fill();
      // aro com raios
      ctx.fillStyle = "#b9bdc3"; ctx.beginPath(); ctx.arc(CX, CY, 146, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2b2c30";
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + Math.PI / 5 + (i / 5) * Math.PI * 2;
        ctx.save(); ctx.translate(CX, CY); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(84, -12); ctx.quadraticCurveTo(122, -44, 136, -30); ctx.lineTo(136, 30); ctx.quadraticCurveTo(122, 44, 84, 12); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = "#d4d7dc"; ctx.beginPath(); ctx.arc(CX, CY, 94, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#9da2a9"; ctx.beginPath(); ctx.arc(CX, CY, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#18191b"; ctx.font = `800 13px ${F}`; ctx.textAlign = "center"; ctx.fillText("ARO 15", CX, CY + 5);

      // parafusos
      NUTS.forEach((n, i) => {
        const v = tight[i], next = STAR[step] === i && done < 5;
        ctx.save(); ctx.translate(n.x, n.y);
        if (next) { ctx.strokeStyle = `rgba(255,176,0,${0.5 + Math.sin(t * 6) * 0.4})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = "#5f646b"; ctx.beginPath(); ctx.arc(0, 0, 9 + (1 - v) * 4, 0, Math.PI * 2); ctx.fill(); // rosca aparecendo quando está frouxo
        ctx.rotate(v * Math.PI * 4);
        const r = 15 - v * 1.5;
        ctx.fillStyle = v >= 1 ? "#e9ecef" : "#a9aeb5";
        ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      ctx.restore();

      // chave de roda presa no parafuso
      if (held >= 0) {
        const n = NUTS[held];
        const a = Math.atan2(p.y - n.y, p.x - n.x);
        ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(a);
        ctx.fillStyle = "#c62f2f"; ctx.beginPath(); ctx.roundRect(30, -11, 150, 22, 11); ctx.fill();
        ctx.fillStyle = "#cfd3d8"; ctx.fillRect(10, -6, 28, 12);
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#8b9097"; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (p.inside) {
        ctx.fillStyle = "rgba(255,176,0,.85)"; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
      }
      // medidor de torque do parafuso pego
      if (held >= 0) {
        ctx.fillStyle = "#2b2c30"; ctx.fillRect(20, 20, 160, 14);
        ctx.fillStyle = "#ffb000"; ctx.fillRect(20, 20, 160 * tight[held], 14);
        ctx.fillStyle = "#e9ecef"; ctx.textAlign = "left"; ctx.font = `600 14px ${F}`; ctx.fillText("TORQUE", 20, 54);
      }
    });
  }, []);

  return <canvas ref={ref} className={s.toy} aria-label="Brincadeira: aperte os parafusos da roda" />;
}

export const GARAGE_COPY: Copy = {
  brand: "Oficina do Toninho", links: ["Serviços", "Orçamento", "Dúvidas"], navCta: "Pedir orçamento",
  kicker: "Mecânica geral · Valinhos", h1: "Orçamento antes,", h1em: "peça trocada na mão.",
  lead: "A gente olha o carro, manda o orçamento com foto pelo WhatsApp e só mexe depois do seu ok. A peça velha volta com você.",
  cta: "Pedir orçamento", cta2: "Ver serviços", servicesTitle: "Ordem de serviço",
  services: [
    ["Revisão", "óleo, filtros e itens do manual"],
    ["Freios", "pastilha, disco e fluido"],
    ["Suspensão", "amortecedor, bandeja e barulho"],
    ["Alinhamento", "alinhamento e balanceamento"],
    ["Injeção", "diagnóstico com scanner"],
    ["Ar-condicionado", "carga de gás e limpeza"],
  ],
  finalTitle: "Barulho estranho no carro?", finalText: "Grava um vídeo e manda no WhatsApp. A gente te diz se dá pra rodar até a oficina.", finalCta: "Mandar vídeo", toy: true,
};

export default function Garage({ m, c = GARAGE_COPY }: { m: boolean; c?: Copy }) {
  const [done, setDone] = useState(0);
  const [order, setOrder] = useState(true);
  const msg = done === 5 ? (order ? "Roda firme. Aperto em estrela, como manda o manual." : "Roda firme. Dica: o certo é apertar em estrela.") : done ? `${done} de 5 parafusos apertados` : "Pegue o parafuso que pisca e gire a chave";
  return (
    <div className={`${s.site} ${m ? s.m : ""}`}>
      <div className={s.top}>
        <nav className={s.nav}>
          <b className={s.logo}>{c.brand}</b>
          {!m && <span className={s.links}>{c.links.map((l) => <i key={l}>{l}</i>)}</span>}
          <span className={s.navBtn}>{c.navCta}</span>
        </nav>

        <section className={s.hero}>
          <div className={s.copy}>
            <h1 className={s.h1} style={{ fontSize: fitSize(h1Text(c), m ? 56 : 100, m ? 18 : 19) }}>
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
            <div className={s.lift}>
              <Wheel onState={(d, o) => { setDone(d); setOrder(o); }} />
              <p className={s.meter}>{msg}</p>
            </div>
          ) : (
            <div className={s.boardWrap}><Board c={c} m={m} /></div>
          )}
        </section>
      </div>

      <section className={s.order}>
        <div className={s.sheet}>
          <div className={s.sheetHead}>
            <h2 className={s.h2}>{c.servicesTitle}</h2>
            <span>{c.brand}</span>
          </div>
          <ul>
            {c.services.map(([a, b], i) => (
              <li key={a}>
                <i className={i < 2 ? s.checked : ""} aria-hidden />
                <b>{a}</b><span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.cta}>
        <h2 style={{ fontSize: fitSize(c.finalTitle, m ? 46 : 96, 24) }}>{c.finalTitle}</h2>
        <div>
          {c.finalText && <p>{c.finalText}</p>}
          <span className={s.btnDark}>{c.finalCta}</span>
        </div>
      </section>
    </div>
  );
}
