"use client";

// Recorte do objeto protagonista, feito no navegador (grátis, sem servidor, sem guardar nada):
// 1) PNG que já vem sem fundo → só apara; 2) foto em fundo claro e liso → "pinta pra fora" a partir das bordas.
// Recusa o que não recorta bem (fundo com textura, objeto cortado pela moldura) e tenta a próxima candidata.
import { useEffect, useState } from "react";
import type { Img } from "@/lib/engine/spec";

export type Cut = { url: string; w: number; h: number; img: Img };

const MAX = 900;

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.referrerPolicy = "no-referrer";
    im.decoding = "async";
    im.onload = () => ok(im);
    im.onerror = () => fail(new Error("load"));
    im.src = src;
  });
}

function cutOne(im: HTMLImageElement): { canvas: HTMLCanvasElement; w: number; h: number; score: number } | null {
  const k = Math.min(1, MAX / Math.max(im.naturalWidth, im.naturalHeight));
  const W = Math.round(im.naturalWidth * k), H = Math.round(im.naturalHeight * k);
  if (W < 160 || H < 160) return null;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(im, 0, 0, W, H);
  let data: ImageData;
  try { data = ctx.getImageData(0, 0, W, H); } catch { return null; } // sem CORS: não dá pra ler
  const px = data.data;
  const N = W * H;
  const at = (x: number, y: number) => (y * W + x) * 4;

  // já transparente? (cantos vazios)
  const corners = [at(1, 1), at(W - 2, 1), at(1, H - 2), at(W - 2, H - 2)];
  const transparent = corners.every((i) => px[i + 3] < 12);

  if (!transparent) {
    // fundo: média e espalhamento das bordas; tem que ser claro e liso
    let r = 0, g = 0, b = 0, n = 0;
    const border: number[] = [];
    for (let x = 0; x < W; x += 2) border.push(at(x, 0), at(x, H - 1));
    for (let y = 0; y < H; y += 2) border.push(at(0, y), at(W - 1, y));
    for (const i of border) { r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; }
    r /= n; g /= n; b /= n;
    let dev = 0;
    for (const i of border) dev += Math.hypot(px[i] - r, px[i + 1] - g, px[i + 2] - b);
    dev /= n;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (lum < 0.62 || dev > 26) return null;

    // inunda a partir de toda a borda com tolerância; o que é "fundo" fica transparente
    const tol = 34 + dev * 0.8;
    const bg = new Uint8Array(N);
    const q = new Int32Array(N);
    let qh = 0, qt = 0;
    const close = (p: number) => Math.hypot(px[p * 4] - r, px[p * 4 + 1] - g, px[p * 4 + 2] - b) < tol;
    const push = (p: number) => { if (!bg[p] && close(p)) { bg[p] = 1; q[qt++] = p; } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (qh < qt) {
      const p = q[qh++], x = p % W;
      if (x > 0) push(p - 1);
      if (x < W - 1) push(p + 1);
      if (p >= W) push(p - W);
      if (p < N - W) push(p + W);
    }
    // segunda passada: cinza neutro grudado no fundo (prato, pires, sombra projetada) também sai
    const neutral = (p: number) => {
      const R = px[p * 4], G = px[p * 4 + 1], B = px[p * 4 + 2];
      const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
      return mx > 70 && (mx - mn) / mx < 0.17;
    };
    qh = 0; qt = 0;
    for (let p = 0; p < N; p++) if (bg[p]) q[qt++] = p;
    const push2 = (p: number) => { if (!bg[p] && neutral(p)) { bg[p] = 1; q[qt++] = p; } };
    while (qh < qt) {
      const p = q[qh++], x = p % W;
      if (x > 0) push2(p - 1);
      if (x < W - 1) push2(p + 1);
      if (p >= W) push2(p - W);
      if (p < N - W) push2(p + W);
    }
    // contorno macio: pixel de objeto encostado no fundo e parecido com ele vira semitransparente
    for (let p = 0; p < N; p++) {
      if (bg[p]) { px[p * 4 + 3] = 0; continue; }
      const x = p % W;
      const edge = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (p >= W && bg[p - W]) || (p < N - W && bg[p + W]);
      if (edge) {
        const d = Math.hypot(px[p * 4] - r, px[p * 4 + 1] - g, px[p * 4 + 2] - b);
        px[p * 4 + 3] = Math.max(40, Math.min(255, Math.round(((d - tol * 0.6) / (tol * 1.2)) * 255)));
      }
    }
  }

  // sobras soltas (pedaço de prato, migalha, reflexo): fica só o pedaço principal e o que for grande perto dele
  {
    const lab = new Int32Array(N);
    const sizes: number[] = [0];
    const st = new Int32Array(N);
    for (let p0 = 0; p0 < N; p0++) {
      if (lab[p0] || px[p0 * 4 + 3] < 40) continue;
      const id = sizes.length;
      let sp = 0, size = 0;
      st[sp++] = p0; lab[p0] = id;
      while (sp) {
        const p = st[--sp], x = p % W;
        size++;
        const nb = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p >= W ? p - W : -1, p < N - W ? p + W : -1];
        for (const n of nb) if (n >= 0 && !lab[n] && px[n * 4 + 3] >= 40) { lab[n] = id; st[sp++] = n; }
      }
      sizes.push(size);
    }
    const big = Math.max(...sizes);
    for (let p = 0; p < N; p++) if (px[p * 4 + 3] && (!lab[p] || sizes[lab[p]] < big * 0.12)) px[p * 4 + 3] = 0;
  }

  // caixa do objeto + validação
  let x0 = W, y0 = H, x1 = 0, y1 = 0, solid = 0, onBorder = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (px[at(x, y) + 3] > 120) {
      solid++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x < 2 || y < 2 || x > W - 3 || y > H - 3) onBorder++;
    }
  }
  const frac = solid / N;
  if (frac < 0.05 || frac > 0.78) return null; // sumiu ou não recortou nada
  if (onBorder > (W + H) * 2 * 0.06) return null; // objeto cortado pela moldura
  // nota do recorte: objeto "cheio" na própria caixa (sem fiapos), contorno pouco cinza (sombra/prato sobrando), PNG pronto ganha bônus
  const compact = solid / Math.max(1, (x1 - x0 + 1) * (y1 - y0 + 1));
  let edgeN = 0, edgeGray = 0;
  for (let p = 0; p < N; p += 3) {
    if (px[p * 4 + 3] < 120) continue;
    const x = p % W;
    if (!((x > 0 && px[(p - 1) * 4 + 3] < 40) || (x < W - 1 && px[(p + 1) * 4 + 3] < 40))) continue;
    edgeN++;
    const R = px[p * 4], G = px[p * 4 + 1], B = px[p * 4 + 2], mx = Math.max(R, G, B);
    if (mx > 40 && (mx - Math.min(R, G, B)) / mx < 0.1) edgeGray++;
  }
  const score = compact * 0.6 + (1 - edgeGray / Math.max(1, edgeN)) * 0.4 + (transparent ? 0.08 : 0) + Math.min(frac, 0.35) * 0.3;

  ctx.putImageData(data, 0, 0);
  const pad = 6;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return { canvas: out, w: out.width, h: out.height, score };
}

const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error("timeout")), ms))]);

/** Recorta todas as candidatas e fica com a de melhor nota (ou null: a página usa a foto de abertura). */
export function useCutout(cands: Img[]): { cut: Cut | null; done: boolean } {
  const [state, setState] = useState<{ cut: Cut | null; done: boolean }>({ cut: null, done: !cands.length });
  const key = cands.map((c) => c.src).join("|");
  useEffect(() => {
    if (!cands.length) return;
    let alive = true;
    let made = "";
    (async () => {
      const loaded = await Promise.allSettled(cands.map((c) => withTimeout(load(c.src), 7000)));
      if (!alive) return;
      let best: { r: NonNullable<ReturnType<typeof cutOne>>; img: Img } | null = null;
      loaded.forEach((res, i) => {
        if (res.status !== "fulfilled") return;
        const r = cutOne(res.value);
        if (r && (!best || r.score > best.r.score)) best = { r, img: cands[i] };
      });
      const pick = best as { r: NonNullable<ReturnType<typeof cutOne>>; img: Img } | null;
      if (!pick) { setState({ cut: null, done: true }); return; }
      const blob = await new Promise<Blob | null>((ok) => pick.r.canvas.toBlob(ok, "image/png"));
      if (!blob || !alive) { if (alive) setState({ cut: null, done: true }); return; }
      made = URL.createObjectURL(blob);
      setState({ cut: { url: made, w: pick.r.w, h: pick.r.h, img: pick.img }, done: true });
    })();
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a lista muda junto com a chave
  }, [key]);
  return state;
}
