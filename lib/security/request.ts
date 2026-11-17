/** Ajudantes pra rotas de API: IP, mesma origem (anti-CSRF), corpo JSON com limite de tamanho, limite de requisições. */

export function clientIp(req: Request) {
  // Na Vercel o x-forwarded-for é reescrito pela plataforma: o primeiro IP é o do visitante.
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** Bloqueia POST vindo de outro site (CSRF). Aceita só se Origin/Sec-Fetch-Site batem com o próprio host. */
export function sameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = req.headers.get("origin");
  if (!origin) return site === "same-origin";
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") || req.headers.get("host"));
  } catch {
    return false;
  }
}

/** Lê JSON com teto de tamanho (padrão 8 KB) e só aceita application/json. */
export async function readJson(req: Request, max = 8_192): Promise<Record<string, unknown> | null> {
  if (!req.headers.get("content-type")?.includes("application/json")) return null;
  const len = Number(req.headers.get("content-length") || 0);
  if (len > max) return null;
  const text = await req.text().catch(() => "");
  if (!text || text.length > max) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Limite de requisições em janela deslizante, em memória.
 * Vale por instância do servidor (na Vercel cada instância conta a sua): é a primeira barreira;
 * com banco provisionado, os contadores podem ir pra lá.
 */
const buckets = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5_000) for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  return { ok: true, retryAfter: 0, left: max - hits.length };
}
/** Conta sem registrar (pra ver se já estourou). */
export function rateCount(key: string, windowMs: number) {
  const now = Date.now();
  return (buckets.get(key) ?? []).filter((t) => now - t < windowMs).length;
}
export function rateReset(key: string) {
  buckets.delete(key);
}

export const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
