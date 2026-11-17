"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A prévia de verdade (/previa) num iframe: desenhada a 1280px (420px no celular) e reduzida pra caber.
 * Dentro do iframe a rolagem, o 3D e o scroll cinematográfico funcionam como na página em tela cheia.
 */
export default function ScaledFrame({ src, height, title }: { src: string; height: number | string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 640 });
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const DW = size.w < 640 ? 420 : 1280;
  const s = Math.max(size.w, 1) / DW;
  return (
    <div ref={box} className="relative overflow-hidden" style={{ height }}>
      <iframe
        src={src}
        title={title}
        className="absolute left-0 top-0 origin-top-left border-0"
        style={{ width: DW, height: size.h / s, transform: `scale(${s})` }}
      />
    </div>
  );
}
