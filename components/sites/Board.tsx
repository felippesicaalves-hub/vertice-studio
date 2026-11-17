"use client";

import { useEffect, useState } from "react";
import type { Copy } from "./copy";
import { fitSize } from "./copy";
import s from "./Board.module.css";

/**
 * Painel do hero quando o negócio não tem brincadeira própria (ex.: contabilidade no modelo da advocacia).
 * Mostra os serviços reais escritos pra ele, um de cada vez e em letra grande; o visitante troca clicando.
 * Cada modelo pinta o painel com as próprias variáveis: --bd-bg, --bd-ink, --bd-accent, --bd-head, --bd-body.
 */
export default function Board({ c, m }: { c: Copy; m: boolean }) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const list = c.services.slice(0, 6);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % list.length), 3200);
    return () => clearInterval(id);
  }, [auto, list.length]);

  const [name, desc] = list[i] ?? ["", ""];
  return (
    <div className={`${s.board} ${m ? s.m : ""}`}>
      <p className={s.brand}>{c.brand}</p>
      <div className={s.stage} aria-live="polite">
        <p key={name} className={s.name} style={{ fontSize: fitSize(name, m ? 64 : 96, 9) }}>{name}</p>
        <p key={desc} className={s.desc}>{desc}</p>
      </div>
      <div className={s.picks} role="tablist" aria-label="Serviços">
        {list.map(([a], k) => (
          <button
            key={a}
            role="tab"
            aria-selected={k === i}
            className={s.pick}
            onClick={() => { setI(k); setAuto(false); }}
          >
            {a}
            {k === i && auto && <i className={s.timer} />}
          </button>
        ))}
      </div>
    </div>
  );
}
