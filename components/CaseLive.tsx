"use client";

import { openLive } from "./LiveSite";

/** Botão que abre a página do case funcionando, na janela ao vivo. */
export default function CaseLive({ i, label }: { i: number; label: string }) {
  return (
    <button type="button" onClick={() => openLive(i)} className="btn btn-wine" data-magnetic>
      Testar a {label.toLowerCase()} ao vivo <span className="arrow">→</span>
    </button>
  );
}

/** O próprio print também abre a página ao vivo. */
export function CaseShot({ i, src, alt, bg }: { i: number; src: string; alt: string; bg: string }) {
  return (
    <button
      type="button"
      onClick={() => openLive(i)}
      aria-label={`Abrir ${alt} ao vivo`}
      className="group block w-full overflow-hidden rounded-[22px] bg-wine-2 text-left shadow-[0_50px_90px_-45px_rgba(42,14,22,.75)] ring-1 ring-wine/10"
    >
      <span className="flex h-7 items-center gap-1.5 bg-[#1d0a10] px-3.5">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={960}
        height={1336}
        style={{ background: bg }}
        className="block aspect-[4/3.4] w-full object-cover object-[50%_0%] transition-[object-position] duration-[5s] ease-in-out group-hover:object-[50%_100%] group-focus-visible:object-[50%_100%] motion-reduce:transition-none"
      />
    </button>
  );
}
