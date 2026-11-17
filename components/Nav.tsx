"use client";

import Link from "next/link";
import { NAV } from "@/lib/config";
import Logo from "./Logo";
import { LiquidNav, LiquidIcons, type LiquidItem } from "./liquid-nav";

const ICONS: Record<string, React.ReactNode> = {
  "/#portfolio": LiquidIcons.grid,
  "/cases": LiquidIcons.trophy,
  "/#gerador": LiquidIcons.sparkle,
  "/#processo": LiquidIcons.steps,
  "/#planos": LiquidIcons.tag,
  "/#faq": LiquidIcons.help,
};
const ITEMS: LiquidItem[] = NAV.map((n) => ({ label: n.label, href: n.href, icon: ICONS[n.href] }));
// borda furta-cor puxada pro dourado/vinho da marca
const RIM: [string, string, string] = ["#f3c98b", "#e98aa6", "#9fd8ff"];

/** Logo e botão nas pontas; no meio a barra de vidro líquido (no celular ela desce pro rodapé). */
export default function Nav() {
  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3">
        <div className="flex w-full max-w-[1240px] items-center justify-between gap-3">
          <div
            className="pointer-events-auto rounded-full py-3 pl-5 pr-6 text-sand"
            style={{
              background: "rgba(18,10,14,.55)",
              border: "1px solid rgba(255,255,255,.1)",
              backdropFilter: "blur(18px) saturate(1.7)",
              WebkitBackdropFilter: "blur(18px) saturate(1.7)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.12), 0 12px 32px -14px rgba(0,0,0,.7)",
            }}
          >
            <Logo />
          </div>
          <div className="vt-nav-mid pointer-events-auto">
            <LiquidNav items={ITEMS} tone="dark" rim={RIM} defaultActive={-1} />
          </div>
          <Link href="/#gerador" className="btn btn-gold pointer-events-auto !h-12 !px-5 text-sm">
            Ver minha prévia
          </Link>
        </div>
      </header>
      <style>{`
        @media (max-width: 1023px) {
          .vt-nav-mid { position: fixed; left: 50%; bottom: max(14px, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 50; max-width: calc(100vw - 24px); }
        }
        @media (max-width: 1023px) { [data-wa-float] { bottom: 84px !important; } }
        @media (max-width: 400px) { .vt-nav-mid .lgn-item { padding: 11px 10px; } }
      `}</style>
    </>
  );
}
