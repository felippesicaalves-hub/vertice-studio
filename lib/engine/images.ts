import "server-only";
import type { Img } from "./spec";

// Fotos reais pra prévia. Com UNSPLASH_ACCESS_KEY (grátis em unsplash.com/developers) ou PEXELS_API_KEY vêm fotos profissionais;
// sem a chave, usa o Openverse (acervos abertos, só licenças que permitem uso comercial, com crédito).

async function pexels(q: string, n: number, key: string): Promise<Img[]> {
  const u = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${n}&orientation=landscape&size=large`;
  const res = await fetch(u, { headers: { Authorization: key }, signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!res.ok) return [];
  const j = (await res.json()) as { photos?: { src: { large2x: string }; alt?: string; photographer?: string; url?: string }[] };
  return (j.photos ?? []).map((p) => ({ src: p.src.large2x, alt: p.alt || q, credit: p.photographer ? `${p.photographer} / Pexels` : "Pexels", link: p.url }));
}

// Unsplash: a API pede que a foto seja carregada direto deles (hotlink) e que o fotógrafo seja creditado com link
async function unsplash(q: string, n: number, key: string): Promise<Img[]> {
  const u = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=${n}&orientation=landscape&content_filter=high`;
  const res = await fetch(u, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }, signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!res.ok) return [];
  const j = (await res.json()) as { results?: { urls: { raw: string }; alt_description?: string; user?: { name?: string; links?: { html?: string } } }[] };
  const utm = "utm_source=vertice_studio&utm_medium=referral";
  return (j.results ?? []).map((p) => ({
    src: `${p.urls.raw}&w=1800&q=80&fm=jpg&fit=crop`,
    alt: p.alt_description || q,
    credit: `${p.user?.name || "Unsplash"} / Unsplash`,
    link: p.user?.links?.html ? `${p.user.links.html}?${utm}` : `https://unsplash.com/?${utm}`,
  }));
}

// o acervo aberto acha pouco com frase longa: tenta a frase, depois só as duas primeiras palavras
async function openverse(q: string, n: number): Promise<Img[]> {
  const first = await openverseOnce(q, n);
  if (first.length >= 2 || q.split(" ").length <= 2) return first;
  return first.concat(await openverseOnce(q.split(" ").slice(0, 2).join(" "), n)).slice(0, n);
}

async function openverseOnce(q: string, n: number): Promise<Img[]> {
  const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&aspect_ratio=wide&mature=false&page_size=${n * 3}`;
  const res = await fetch(u, { signal: AbortSignal.timeout(6000), cache: "no-store", headers: { "User-Agent": "vertice-studio-preview" } });
  if (!res.ok) return [];
  const j = (await res.json()) as { results?: { url: string; title?: string; creator?: string; license?: string; foreign_landing_url?: string; width?: number }[] };
  return (j.results ?? [])
    .filter((r) => r.url?.startsWith("https://") && (r.width ?? 0) >= 1200 && !/\.(svg|gif|tiff?)$/i.test(r.url))
    .slice(0, n)
    .map((r) => ({ src: r.url, alt: r.title || q, duo: true, credit: `${r.creator || "autor desconhecido"} · ${String(r.license || "").toUpperCase()}`, link: r.foreign_landing_url }));
}

const STOP = new Set(["with", "from", "this", "that", "close", "view", "modern", "interior", "inside", "people", "person", "photo", "image", "detail", "details", "professional", "beautiful", "small", "local", "brazilian", "brazil"]);

// a busca às vezes devolve coisa nada a ver (pediu "clínica clean", veio cozinha branca):
// só fica a foto cuja descrição divide pelo menos uma palavra (raiz de 5 letras) com a consulta
function relevant(q: string, list: Img[]): Img[] {
  const keys = q.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !STOP.has(w)).map((w) => w.slice(0, 5));
  if (!keys.length) return list;
  return list.filter((p) => { const a = p.alt.toLowerCase(); return keys.some((k) => a.includes(k)); });
}

const lightHex = (hex = "") => {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return false;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 > 0.6;
};

/**
 * Candidatas pro objeto protagonista (recortado no navegador): fotos do objeto em fundo claro (Unsplash, que diz a cor
 * dominante) e PNGs do acervo aberto (muitos já vêm sem fundo). O recorte e a escolha final acontecem na página.
 */
export async function findObject(query: string, n = 6): Promise<Img[]> {
  const q = query.trim().toLowerCase().replace(/[^a-z ]/g, "").slice(0, 50);
  if (!q) return [];
  const first = q.split(" ")[0];
  const uk = process.env.UNSPLASH_ACCESS_KEY;
  const utm = "utm_source=vertice_studio&utm_medium=referral";
  const BAD = /(logo|diagram|chart|map|graph|plot|flag|coat of arms|icon|text|poster|label|seal|emblem|screenshot)/i;

  const unsplashOnce = async (x: string): Promise<Img[]> => {
    if (!uk) return [];
    const u = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(`${x} white background`)}&per_page=20&content_filter=high`;
    const res = await fetch(u, { headers: { Authorization: `Client-ID ${uk}`, "Accept-Version": "v1" }, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!res.ok) return [];
    const j = (await res.json()) as { results?: { color?: string; urls: { raw: string }; alt_description?: string; user?: { name?: string; links?: { html?: string } } }[] };
    const all = (j.results ?? []).filter((p) => lightHex(p.color)).map((p) => ({
      src: `${p.urls.raw}&w=1100&q=85&fm=jpg`,
      alt: p.alt_description || x,
      credit: `${p.user?.name || "Unsplash"} / Unsplash`,
      link: p.user?.links?.html ? `${p.user.links.html}?${utm}` : `https://unsplash.com/?${utm}`,
    }));
    return relevant(x, all);
  };
  // PNG do acervo aberto: muitos já vêm sem fundo (recortes prontos)
  const openverseOnce = async (x: string): Promise<Img[]> => {
    const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(`${x} png`)}&license_type=commercial&extension=png&mature=false&page_size=14`;
    const res = await fetch(u, { signal: AbortSignal.timeout(6000), cache: "no-store", headers: { "User-Agent": "vertice-studio-preview" } });
    if (!res.ok) return [];
    const j = (await res.json()) as { results?: { url: string; title?: string; creator?: string; license?: string; foreign_landing_url?: string; width?: number }[] };
    const all = (j.results ?? [])
      .filter((r) => r.url?.startsWith("https://") && (r.width ?? 0) >= 500 && !BAD.test(r.title || ""))
      .map((r) => ({ src: r.url, alt: r.title || x, credit: `${r.creator || "autor desconhecido"} · ${String(r.license || "").toUpperCase()}`, link: r.foreign_landing_url }));
    return relevant(x, all);
  };
  const withFallback = async (fn: (x: string) => Promise<Img[]>) => {
    let r = await fn(q).catch(() => [] as Img[]);
    if (r.length < 2 && first !== q) r = r.concat(await fn(first).catch(() => [] as Img[]));
    const last = q.split(" ").pop()!;
    if (r.length < 2 && last !== first) r = r.concat(await fn(last).catch(() => [] as Img[]));
    return r;
  };
  const [png, photo] = await Promise.all([withFallback(openverseOnce), withFallback(unsplashOnce)]);
  const out: Img[] = [];
  const seen = new Set<string>();
  // intercala: PNG pronto, foto de estúdio, PNG, foto...
  for (let i = 0; out.length < n && (i < png.length || i < photo.length); i++) {
    for (const c of [png[i], photo[i]]) if (c && !seen.has(c.src) && out.length < n) { seen.add(c.src); out.push(c); }
  }
  return out;
}

/** Busca várias consultas em paralelo e devolve fotos sem repetir. Nunca derruba a geração: sem foto, a página se vira com tipografia e cor. */
export async function findImages(queries: string[], per = 4): Promise<Img[]> {
  const uk = process.env.UNSPLASH_ACCESS_KEY, pk = process.env.PEXELS_API_KEY;
  const one = async (q: string) => {
    // banco profissional primeiro; se ele não achar nada (ou estourar o limite), cai pro acervo aberto
    const search = async (x: string) => relevant(x, await (uk ? unsplash(x, per * 2, uk) : pk ? pexels(x, per * 2, pk) : Promise.resolve([] as Img[])));
    let pro = await search(q);
    const short = q.split(" ").slice(0, 2).join(" ");
    if (pro.length < 2 && short !== q) pro = pro.concat(await search(short));
    pro = pro.slice(0, per);
    return pro.length ? pro : openverse(q, per);
  };
  const lists = await Promise.all(queries.filter(Boolean).slice(0, 3).map((q) => one(q).catch(() => [] as Img[])));
  const seen = new Set<string>();
  const out: Img[] = [];
  // intercala as consultas: foto do lugar, do detalhe, das pessoas...
  for (let i = 0; i < per; i++) for (const l of lists) if (l[i] && !seen.has(l[i].src)) { seen.add(l[i].src); out.push(l[i]); }
  // a primeira vira a foto do topo: foto com letreiro/texto briga com o título, então vai pro fim da fila
  const wordy = (p: Img) => /\b(text|sign|signage|logo|reading|letter|lettering|poster|menu|word|words|banner|neon)\b/i.test(p.alt);
  return [...out.filter((p) => !wordy(p)), ...out.filter(wordy)];
}
