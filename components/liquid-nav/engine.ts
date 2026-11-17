/*
 * Liquid nav — motor da barra de vidro líquido da Vértice (código próprio, sem dependências).
 *
 * Uma bolha de vidro com borda furta-cor marca o item ativo. Ao trocar de item ela
 * escorre até o novo: estica com a velocidade, solta gotinhas que vêm atrás (e uma
 * que corre na frente), as gotas se fundem pelo filtro "gooey" do SVG e, ao chegar,
 * a bolha assenta com uma ondinha. Passar o mouse mostra um menisco claro embaixo do
 * item; o ícone do item novo dá um pulinho.
 *
 * Uso: createLiquid(raiz, { active }) — a raiz precisa ser position:relative e conter
 * os itens marcados com [data-lg-item] (e o ícone, se houver, com [data-lg-icon]).
 * Mesmo arquivo em todos os sites: copie sem mudar e ajuste só as opções.
 */

export type LiquidOptions = {
  /** Item ativo no começo. */
  active?: number
  /** Cores da borda furta-cor, da esquerda para a direita. */
  rim?: [string, string, string]
  /** Opacidade do miolo da bolha (vidro). */
  fill?: number
  /** Cor do miolo da bolha. */
  fillColor?: string
  /** Cor do menisco de hover. */
  hoverColor?: string
  /** Espessura da borda, em px. */
  ring?: number
  /** Folga da bolha em volta do item, em px. */
  inset?: number
}

export type Liquid = {
  setActive: (i: number, animate?: boolean) => void
  refresh: () => void
  destroy: () => void
}

const NS = "http://www.w3.org/2000/svg"
let uid = 0

const CSS = `
.lg-layer{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:0}
.lg-hover{position:absolute;top:0;left:0;border-radius:999px;pointer-events:none;z-index:0;opacity:0;
  transition:transform .35s cubic-bezier(.3,1.4,.5,1),width .35s cubic-bezier(.3,1.4,.5,1),opacity .25s}
.lg-ripple{position:absolute;border-radius:999px;pointer-events:none;z-index:0;border:1.5px solid var(--lg-ripple,rgba(255,255,255,.7));
  animation:lg-ripple .7s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes lg-ripple{from{opacity:.75;transform:scale(1)}to{opacity:0;transform:scale(1.18,1.45)}}
[data-lg-item]{position:relative;z-index:1}
[data-lg-icon]{display:inline-flex;transform-origin:50% 60%}
.lg-pop{animation:lg-pop .6s cubic-bezier(.3,1.6,.4,1)}
@keyframes lg-pop{0%{transform:scale(1)}25%{transform:scale(.72) rotate(-10deg)}55%{transform:scale(1.22) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
`

function injectCss() {
  if (typeof document === "undefined" || document.getElementById("lg-css")) return
  const s = document.createElement("style")
  s.id = "lg-css"
  s.textContent = CSS
  document.head.appendChild(s)
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const n = document.createElementNS(NS, tag)
  for (const k in attrs) n.setAttribute(k, String(attrs[k]))
  parent?.appendChild(n)
  return n
}

type Spring = { x: number; v: number; k: number; c: number }
const step = (s: Spring, target: number, dt: number) => {
  const a = s.k * (target - s.x) - s.c * s.v
  s.v += a * dt
  s.x += s.v * dt
}

export function createLiquid(root: HTMLElement, opts: LiquidOptions = {}): Liquid {
  injectCss()
  const id = "lg" + ++uid
  const rim = opts.rim ?? ["#ff9ad5", "#b9a6ff", "#7fe3ff"]
  const ring = opts.ring ?? 2.2
  const inset = opts.inset ?? 0

  // camada SVG com a bolha e as gotas
  const svg = el("svg", { class: "lg-layer", "aria-hidden": "true" })
  const defs = el("defs", {}, svg)
  const grad = el("linearGradient", { id: id + "g", x1: 0, y1: 0, x2: 1, y2: 1 }, defs)
  rim.forEach((c, i) => el("stop", { offset: i / (rim.length - 1), "stop-color": c }, grad))
  const f = el("filter", { id: id + "f", x: "-20%", y: "-60%", width: "140%", height: "220%", "color-interpolation-filters": "sRGB" }, defs)
  el("feGaussianBlur", { in: "SourceGraphic", stdDeviation: 5, result: "b" }, f)
  el("feColorMatrix", { in: "b", mode: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10", result: "goo" }, f)
  el("feMorphology", { in: "goo", operator: "erode", radius: ring, result: "inner" }, f)
  el("feComposite", { in: "goo", in2: "inner", operator: "out", result: "rim" }, f)
  el("feGaussianBlur", { in: "rim", stdDeviation: 0.35, result: "rimS" }, f)
  el("feFlood", { "flood-color": opts.fillColor ?? "#ffffff", "flood-opacity": opts.fill ?? 0.55, result: "fc" }, f)
  el("feComposite", { in: "fc", in2: "inner", operator: "in", result: "fill" }, f)
  const merge = el("feMerge", {}, f)
  el("feMergeNode", { in: "fill" }, merge)
  el("feMergeNode", { in: "rimS" }, merge)

  const g = el("g", { filter: `url(#${id}f)` }, svg)
  const blob = el("rect", { fill: `url(#${id}g)` }, g)
  const drops = [0, 1, 2].map(() => el("circle", { fill: `url(#${id}g)` }, g))
  // brilho no alto da bolha (fora do filtro, para ficar nítido)
  const glint = el("rect", { fill: "#fff", opacity: 0.38 }, svg)
  root.prepend(svg)

  const hover = document.createElement("span")
  hover.className = "lg-hover"
  hover.style.background = opts.hoverColor ?? "rgba(255,255,255,.35)"
  root.prepend(hover)

  const items = () => Array.from(root.querySelectorAll<HTMLElement>("[data-lg-item]"))
  let rects: { x: number; w: number; h: number; y: number }[] = []
  const measure = () => {
    const r = root.getBoundingClientRect()
    rects = items().map((it) => {
      const b = it.getBoundingClientRect()
      return { x: b.left - r.left - inset, w: b.width + inset * 2, y: b.top - r.top - inset, h: b.height + inset * 2 }
    })
  }

  // molas: centro e largura da bolha; gotas atrás (mais moles) e uma na frente (mais dura)
  const main: Spring = { x: 0, v: 0, k: 230, c: 21 }
  const width: Spring = { x: 0, v: 0, k: 260, c: 24 }
  const ds: Spring[] = [
    { x: 0, v: 0, k: 560, c: 34 },
    { x: 0, v: 0, k: 120, c: 15 },
    { x: 0, v: 0, k: 70, c: 12 },
  ]
  // -1 = nenhum item ativo (bolha some)
  let active = opts.active ?? 0
  const show = (on: boolean) => (svg.style.opacity = on ? "1" : "0")
  svg.style.transition = "opacity .35s"
  show(active >= 0)
  let raf = 0
  let last = 0
  let travelling = false

  const draw = () => {
    const t = rects[active]
    if (!t) return
    const h = t.h
    const speed = Math.abs(main.v)
    const stretch = Math.min(speed * 0.05, t.w * 0.45)
    const squash = Math.min(speed * 0.012, h * 0.2)
    const w = Math.max(h, width.x + stretch)
    const bh = h - squash
    const x = main.x - w / 2
    const y = t.y + squash / 2
    blob.setAttribute("x", String(x))
    blob.setAttribute("y", String(y))
    blob.setAttribute("width", String(w))
    blob.setAttribute("height", String(bh))
    blob.setAttribute("rx", String(bh / 2))
    glint.setAttribute("x", String(x + bh * 0.45))
    glint.setAttribute("y", String(y + 3))
    glint.setAttribute("width", String(Math.max(0, w - bh * 0.9)))
    glint.setAttribute("height", String(Math.max(1, bh * 0.07)))
    glint.setAttribute("rx", String(bh * 0.05))
    const cy = t.y + h / 2
    ds.forEach((d, i) => {
      const gap = Math.abs(d.x - main.x)
      // a gota só aparece quando se descola da bolha; encolhe ao se afastar demais
      const r = gap < 6 ? 0 : Math.max(0, Math.min(h * (i ? 0.2 : 0.13), gap * 0.18) - Math.max(0, gap - h * 2.2) * 0.05)
      drops[i].setAttribute("cx", String(d.x))
      drops[i].setAttribute("cy", String(cy + (i === 2 ? h * 0.06 : 0)))
      drops[i].setAttribute("r", String(r))
    })
  }

  const ripple = () => {
    const t = rects[active]
    if (!t) return
    const r = document.createElement("span")
    r.className = "lg-ripple"
    r.style.cssText = `left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px`
    r.style.setProperty("--lg-ripple", rim[1])
    root.appendChild(r)
    r.addEventListener("animationend", () => r.remove())
  }

  const tick = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016)
    last = now
    const t = rects[active]
    if (!t) return
    const cx = t.x + t.w / 2
    step(main, cx, dt)
    step(width, t.w, dt)
    ds.forEach((d) => step(d, cx, dt))
    draw()
    const calm = Math.abs(main.x - cx) < 0.3 && Math.abs(main.v) < 4 && ds.every((d) => Math.abs(d.x - cx) < 0.5 && Math.abs(d.v) < 4)
    if (travelling && Math.abs(main.x - cx) < 2 && Math.abs(main.v) < 60) {
      travelling = false
      ripple()
    }
    if (calm) {
      main.x = cx
      main.v = 0
      width.x = t.w
      width.v = 0
      ds.forEach((d) => ((d.x = cx), (d.v = 0)))
      draw()
      raf = 0
      return
    }
    raf = requestAnimationFrame(tick)
  }

  const run = () => {
    if (raf) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  const mark = () =>
    items().forEach((it, i) => {
      if (i === active) it.setAttribute("aria-current", "true")
      else it.removeAttribute("aria-current")
      it.dataset.lgActive = String(i === active)
    })

  const snap = () => {
    measure()
    const t = rects[active]
    if (!t) return
    main.x = t.x + t.w / 2
    width.x = t.w
    main.v = width.v = 0
    ds.forEach((d) => ((d.x = main.x), (d.v = 0)))
    draw()
  }

  const setActive = (i: number, animate = true) => {
    const n = items().length
    if (!n) return
    const next = i < 0 ? -1 : Math.min(n - 1, i)
    if (next === active && (main.x || next < 0)) return
    const prev = active
    active = next
    mark()
    show(next >= 0)
    if (next < 0) return
    measure()
    if (!animate || !main.x || prev < 0) return snap()
    travelling = true
    const icon = items()[next]?.querySelector<HTMLElement>("[data-lg-icon]")
    if (icon && prev !== next) {
      icon.classList.remove("lg-pop")
      void icon.offsetWidth
      icon.classList.add("lg-pop")
    }
    run()
  }

  // menisco de hover
  const onOver = (e: PointerEvent) => {
    const it = (e.target as HTMLElement).closest<HTMLElement>("[data-lg-item]")
    if (!it || !root.contains(it)) return
    const i = items().indexOf(it)
    measure()
    const t = rects[i]
    if (!t || i === active) {
      hover.style.opacity = "0"
      return
    }
    hover.style.width = t.w + "px"
    hover.style.height = t.h + "px"
    hover.style.transform = `translate(${t.x}px,${t.y}px)`
    hover.style.opacity = "1"
  }
  const onLeave = () => (hover.style.opacity = "0")
  root.addEventListener("pointerover", onOver)
  root.addEventListener("pointerleave", onLeave)

  const ro = new ResizeObserver(() => snap())
  ro.observe(root)
  mark()
  snap()
  // fontes carregando mudam a largura dos itens
  document.fonts?.ready.then(snap).catch(() => {})

  return {
    setActive,
    refresh: snap,
    destroy: () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      root.removeEventListener("pointerover", onOver)
      root.removeEventListener("pointerleave", onLeave)
      svg.remove()
      hover.remove()
      root.querySelectorAll(".lg-ripple").forEach((r) => r.remove())
    },
  }
}
