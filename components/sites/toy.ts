// Motorzinho dos brinquedos interativos das páginas da vitrine (canvas 2D).
// Cada brinquedo desenha num espaço lógico fixo (LW×LH) que é encaixado no canvas;
// o ponteiro já chega convertido pra esse espaço. Usa offsetX/Y, que continuam certos
// mesmo com o navegador da vitrine escalado/inclinado por CSS.

export type Ptr = { x: number; y: number; px: number; py: number; down: boolean; inside: boolean; clicked: boolean };
export type Step = (ctx: CanvasRenderingContext2D, dt: number, p: Ptr, t: number) => void;

export function runToy(c: HTMLCanvasElement, LW: number, LH: number, step: Step) {
  const ctx = c.getContext("2d")!;
  let k = 1, ox = 0, oy = 0, raf = 0, visible = true, last = performance.now(), upPending = false;
  const p: Ptr = { x: -999, y: -999, px: -999, py: -999, down: false, inside: false, clicked: false };

  const size = () => {
    const d = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth, h = c.clientHeight;
    c.width = Math.max(1, Math.round(w * d));
    c.height = Math.max(1, Math.round(h * d));
    k = Math.min(w / LW, h / LH);
    ox = (w - LW * k) / 2;
    oy = (h - LH * k) / 2;
    ctx.setTransform(d * k, 0, 0, d * k, d * ox, d * oy);
  };
  const pos = (e: PointerEvent) => { p.x = (e.offsetX - ox) / k; p.y = (e.offsetY - oy) / k; };
  const move = (e: PointerEvent) => { pos(e); p.inside = true; };
  const down = (e: PointerEvent) => {
    e.preventDefault(); // não seleciona texto ao arrastar
    pos(e); p.px = p.x; p.py = p.y; p.down = true; p.inside = true; p.clicked = true;
    c.setPointerCapture(e.pointerId);
  };
  // um toque rápido pode soltar antes do próximo quadro: segura o "down" até o brinquedo ver o clique
  const up = () => { if (p.clicked) upPending = true; else p.down = false; };
  const leave = () => { p.inside = false; if (!p.down) { p.x = p.px = -999; } };

  const loop = () => {
    cancelAnimationFrame(raf);
    if (!visible) return;
    raf = requestAnimationFrame((now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.restore();
      step(ctx, dt, p, now / 1000);
      p.px = p.x; p.py = p.y; p.clicked = false;
      if (upPending) { p.down = false; upPending = false; }
      loop();
    });
  };

  size();
  const ro = new ResizeObserver(size);
  ro.observe(c);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { last = performance.now(); loop(); }
  });
  io.observe(c);
  c.addEventListener("pointermove", move);
  c.addEventListener("pointerdown", down);
  c.addEventListener("pointerup", up);
  c.addEventListener("pointercancel", up);
  c.addEventListener("pointerleave", leave);
  loop();
  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    c.removeEventListener("pointermove", move);
    c.removeEventListener("pointerdown", down);
    c.removeEventListener("pointerup", up);
    c.removeEventListener("pointercancel", up);
    c.removeEventListener("pointerleave", leave);
  };
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Folha de canvas fora da tela (camadas que vão sendo "apagadas", como mancha ou pele). */
export function layer(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

/** Fração (0–1) de pixels ainda visíveis numa camada, amostrando uma grade. */
export function coverage(l: { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D }, mask?: (x: number, y: number) => boolean) {
  const { width: w, height: h } = l.c;
  const data = l.ctx.getImageData(0, 0, w, h).data;
  let on = 0, all = 0;
  for (let y = 2; y < h; y += 6) for (let x = 2; x < w; x += 6) {
    if (mask && !mask(x / w, y / h)) continue;
    all++;
    if (data[(y * w + x) * 4 + 3] > 40) on++;
  }
  return all ? on / all : 0;
}

/** Nome real da fonte do canvas (o ctx.font não entende var(--f-...)); vem do font-family do CSS do canvas. */
export const fontOf = (c: HTMLCanvasElement) => getComputedStyle(c).fontFamily || "sans-serif";
