"use client";

import { useEffect, useRef, useState } from "react";
import type { Copy } from "./copy";
import { SITE_FONTS } from "./fonts";
import type { SiteDef } from "./index";

/**
 * Mostra uma página da vitrine dentro de uma caixa, reduzida pra caber na largura
 * (desenhada a 1200px no desktop, 420px no celular) e com rolagem própria.
 */
export default function ScaledSite({ Comp, c, height }: { Comp: SiteDef["Comp"]; c?: Copy; height: number | string }) {
  const box = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1000);
  const [ph, setPh] = useState(0);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (box.current) setW(box.current.clientWidth);
      if (page.current) setPh(page.current.offsetHeight);
    });
    if (box.current) ro.observe(box.current);
    if (page.current) ro.observe(page.current);
    return () => ro.disconnect();
  }, []);
  const m = w < 640;
  const DW = m ? 420 : 1200;
  const s = w / DW;
  return (
    <div ref={box} className="relative overflow-y-auto overflow-x-hidden overscroll-contain" style={{ height }}>
      <div style={{ height: ph * s }}>
        <div ref={page} className={`origin-top-left ${SITE_FONTS}`} style={{ width: DW, transform: `scale(${s})` }}>
          <Comp m={m} c={c} />
        </div>
      </div>
    </div>
  );
}
