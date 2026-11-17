"use client"

/*
 * <LiquidNav> — barra de vidro líquido (código próprio da Vértice).
 * A pasta components/liquid-nav é idêntica em todos os sites: engine.ts (o movimento)
 * + este embrulho React (marcação, estilo e "scroll-spy"). Não depende de Tailwind
 * nem de biblioteca de ícones: o estilo vem embutido e os ícones estão em LiquidIcons.
 */

import { useEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react"
import { createLiquid, type Liquid, type LiquidOptions } from "./engine"

export type LiquidItem = {
  label: string
  /** Sem href vira <button> (use onClick). */
  href?: string
  icon?: ReactNode
  external?: boolean
  onClick?: (e: MouseEvent<HTMLElement>) => void
}

export type LiquidNavProps = {
  items: LiquidItem[]
  /** "light": vidro branco, texto escuro. "dark": vidro escuro, texto claro. */
  tone?: "light" | "dark"
  /** Cores da borda furta-cor da bolha. */
  rim?: LiquidOptions["rim"]
  /** Item ativo quando nenhum outro bate com a rolagem ou com o endereço. */
  defaultActive?: number
  /** Modo controlado: o site decide o item ativo (-1 = nenhum) e a rolagem é ignorada. */
  active?: number
  /** Acompanha a rolagem: o item cuja seção (#id) está na tela fica ativo. */
  spy?: boolean
  /** No celular mostra só os ícones (e o nome apenas do item ativo). */
  compact?: boolean
  className?: string
  /** Sobrescreve as variáveis: --lg-bg, --lg-border, --lg-text, --lg-text-active, --lg-font. */
  style?: CSSProperties
  ariaLabel?: string
  onSelect?: (i: number) => void
}

const CSS = `
.lgn{display:inline-flex;max-width:100%;font-family:var(--lg-font,inherit)}
.lgn-pill{position:relative;display:flex;align-items:center;gap:2px;margin:0;padding:5px;list-style:none;border-radius:999px;
  background:var(--lg-bg);border:1px solid var(--lg-border);
  -webkit-backdrop-filter:blur(18px) saturate(1.7);backdrop-filter:blur(18px) saturate(1.7);
  box-shadow:inset 0 1px 0 var(--lg-hi),inset 0 -1px 1px rgba(0,0,0,.05),0 12px 32px -14px var(--lg-shadow)}
.lgn-pill>li{display:flex}
.lgn-item{appearance:none;background:none;border:0;margin:0;font:inherit;cursor:pointer;display:flex;align-items:center;gap:7px;padding:9px 15px;border-radius:999px;color:var(--lg-text);text-decoration:none;
  font-size:14px;font-weight:500;line-height:1;letter-spacing:.005em;white-space:nowrap;transition:color .3s;-webkit-tap-highlight-color:transparent}
.lgn-item:hover{color:var(--lg-text-active)}
.lgn-item[data-lg-active=true]{color:var(--lg-text-active)}
.lgn-item:focus-visible{outline:2px solid var(--lg-text-active);outline-offset:2px}
.lgn-item svg{width:16px;height:16px;flex:none}
.lgn-light{--lg-bg:rgba(255,255,255,.7);--lg-border:rgba(255,255,255,.85);--lg-hi:rgba(255,255,255,.9);--lg-shadow:rgba(20,30,60,.35);
  --lg-text:rgba(11,19,43,.58);--lg-text-active:#0b132b}
.lgn-dark{--lg-bg:rgba(18,10,14,.55);--lg-border:rgba(255,255,255,.1);--lg-hi:rgba(255,255,255,.12);--lg-shadow:rgba(0,0,0,.7);
  --lg-text:rgba(255,255,255,.62);--lg-text-active:#fff}
@media (max-width:640px){
  .lgn-compact .lgn-item{padding:11px 13px}
  .lgn-compact .lgn-item:not([data-lg-active=true]) .lgn-label{display:none}
}
`

export function LiquidNav({
  items,
  tone = "light",
  rim,
  defaultActive = 0,
  active,
  spy = true,
  compact = true,
  className,
  style,
  ariaLabel = "Navegação principal",
  onSelect,
}: LiquidNavProps) {
  const root = useRef<HTMLUListElement>(null)
  const liquid = useRef<Liquid | null>(null)
  const hold = useRef(0)
  const latest = useRef(items)
  const repick = useRef<() => void>(() => {})
  latest.current = items
  const controlled = active !== undefined
  const activeRef = useRef(active)
  activeRef.current = active
  // chaves estáveis: o efeito só refaz a barra se os itens/cores mudarem de verdade
  const itemsKey = items.map((it) => (it.href ?? "") + "|" + it.label).join("~")
  const rimKey = rim?.join(",") ?? ""

  useEffect(() => {
    if (!root.current) return
    const dark = tone === "dark"
    const lq = createLiquid(root.current, {
      active: controlled ? (activeRef.current as number) : defaultActive,
      rim,
      fill: dark ? 0.12 : 0.55,
      hoverColor: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.45)",
    })
    liquid.current = lq

    // item ativo pelo endereço (/cases) ou pela seção visível (#planos)
    const targets = latest.current.map((it) => {
      if (!it.href) return { path: null as string | null, el: null as HTMLElement | null }
      try {
        const u = new URL(it.href, location.href)
        if (u.origin !== location.origin) return { path: null as string | null, el: null as HTMLElement | null }
        const samePage = u.pathname === location.pathname
        return { path: u.hash ? null : u.pathname, el: samePage && u.hash ? document.getElementById(u.hash.slice(1)) : null }
      } catch {
        return { path: null, el: null }
      }
    })
    // dois itens apontando pra mesma seção: só o primeiro acompanha a rolagem
    targets.forEach((t, i) => {
      if (t.el && targets.slice(0, i).some((o) => o.el === t.el)) t.el = null
    })
    const pick = () => {
      if (activeRef.current !== undefined) return lq.setActive(activeRef.current)
      if (performance.now() < hold.current) return
      let idx = -1
      if (spy) {
        const line = innerHeight * 0.4
        targets.forEach((t, i) => {
          if (t.el && t.el.getBoundingClientRect().top <= line) idx = i
        })
      }
      if (idx < 0) idx = targets.findIndex((t) => t.path && t.path !== "/" && location.pathname.startsWith(t.path))
      lq.setActive(idx < 0 ? defaultActive : idx)
    }
    repick.current = pick
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => ((ticking = false), pick()))
    }
    pick()
    lq.refresh()
    addEventListener("scroll", onScroll, { passive: true })
    return () => {
      removeEventListener("scroll", onScroll)
      lq.destroy()
      liquid.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, tone, rimKey, defaultActive, spy])

  useEffect(() => {
    if (active !== undefined) liquid.current?.setActive(active)
    else repick.current() // voltou ao modo livre: segue a rolagem/endereço de novo
  }, [active])

  const select = (i: number, e: MouseEvent<HTMLElement>) => {
    hold.current = performance.now() + 1100 // deixa a rolagem suave terminar sem a bolha voltar
    if (!controlled) liquid.current?.setActive(i)
    latest.current[i]?.onClick?.(e)
    onSelect?.(i)
  }

  return (
    <nav aria-label={ariaLabel} className={`lgn lgn-${tone}${compact ? " lgn-compact" : ""}${className ? " " + className : ""}`} style={style}>
      <style>{CSS}</style>
      <ul ref={root} className="lgn-pill">
        {items.map((it, i) => {
          const inner = (
            <>
              {it.icon && <span data-lg-icon="">{it.icon}</span>}
              <span className="lgn-label">{it.label}</span>
            </>
          )
          return (
            <li key={(it.href ?? "") + it.label}>
              {it.href ? (
                <a
                  href={it.href}
                  data-lg-item=""
                  className="lgn-item"
                  onClick={(e) => select(i, e)}
                  aria-label={it.label}
                  {...(it.external ? { target: "_blank", rel: "noopener" } : {})}
                >
                  {inner}
                </a>
              ) : (
                <button type="button" data-lg-item="" className="lgn-item" onClick={(e) => select(i, e)} aria-label={it.label}>
                  {inner}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* Ícones de traço (24×24, 1.7px), desenhados para a barra. */
const I = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

export const LiquidIcons = {
  home: I(<><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></>),
  grid: I(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>),
  trophy: I(<><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5a2 2 0 0 0 3 4M16 6h3a2 2 0 0 1-3 4" /><path d="M12 13v4M8.5 20h7M10 17h4" /></>),
  sparkle: I(<path d="M12 3c.6 4.2 1.8 6.4 6 7-4.2.6-5.4 2.8-6 7-.6-4.2-1.8-6.4-6-7 4.2-.6 5.4-2.8 6-7ZM19 15c.3 1.6.8 2.4 2 2.7-1.2.3-1.7 1.1-2 2.7-.3-1.6-.8-2.4-2-2.7 1.2-.3 1.7-1.1 2-2.7Z" />),
  steps: I(<><circle cx="6" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="6" cy="18" r="2" /><path d="M8 6h4a4 4 0 0 1 4 4M16 14a4 4 0 0 1-4 4H8" /></>),
  tag: I(<><path d="M4 4h7l9 9-7 7-9-9V4Z" /><circle cx="8.5" cy="8.5" r="1.5" /></>),
  help: I(<><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.5" /><path d="M12 17h.01" /></>),
  chat: I(<path d="M5 18.5 6 15a7.5 7.5 0 1 1 3 3l-4 .5Z" />),
  cake: I(<><path d="M4 20h16M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" /><path d="M5 15.5c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0" /><path d="M12 12V8M12 5.5c.6-.6.6-1.3 0-2-.6.7-.6 1.4 0 2Z" /></>),
  menu: I(<><path d="M6 4v16M6 4c-1.5 0-2 3-2 5s.8 3 2 3M18 20V4c-2 1-3 4-3 7s1 4 3 4" /></>),
  info: I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>),
  burger: I(<><path d="M4 11a8 6 0 0 1 16 0H4Z" /><path d="M4 14.5h16M5 18h14a1 1 0 0 1-1 2H6a1 1 0 0 1-1-2Z" /></>),
  flame: I(<path d="M12 21a6 6 0 0 0 6-6c0-3.5-2.5-5.5-3.5-8.5-1 2-2 3-3.5 3.5 0-2-1-4.5-3-6 .3 4-3 6-3 11a6 6 0 0 0 7 6Z" />),
  pin: I(<><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>),
  tooth: I(<path d="M7.5 4C5 4 4 6 4 8.5c0 3 1.5 4.5 2 7.5.4 2.5 1 4 2 4s1.5-1.5 2-4c.3-1.2 1-1.5 2-1.5s1.7.3 2 1.5c.5 2.5 1 4 2 4s1.6-1.5 2-4c.5-3 2-4.5 2-7.5C20 6 19 4 16.5 4c-1.8 0-2.7 1-4.5 1S9.3 4 7.5 4Z" />),
  star: I(<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6L12 4Z" />),
  user: I(<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>),
  calendar: I(<><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>),
  phone: I(<><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></>),
  bag: I(<><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>),
  building: I(<><path d="M6 21V5l7-2v18M13 8h5v13M4 21h16" /><path d="M9 8h1M9 11.5h1M9 15h1M16 12h.01M16 15.5h.01" /></>),
  layout: I(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9.5h16M9.5 9.5V20" /></>),
  drop: I(<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z" />),
  coconut: I(<><circle cx="12" cy="13" r="7.5" /><path d="M9 8.5h.01M12 7.5h.01M15 8.5h.01M12 5.5V2.5" /></>),
}
