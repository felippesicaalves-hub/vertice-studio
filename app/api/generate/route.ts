import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { findImages, findObject } from "@/lib/engine/images";
import { ALLOWED, DIRECTIONS, FONTS, PALETTES, SIGNATURES, sanitize, type Spec } from "@/lib/engine/spec";
import { clientIp, json, readJson, sameOrigin } from "@/lib/security/request";
import { logGen } from "@/lib/store";

// v13 (objeto que viaja + campos de cor / cinema) DESLIGADO a pedido do Felippe em 2026-11-10: a geração volta às direções do motor anterior.
// Pra religar: V13 = true (o código do Stage continua no projeto; prévias antigas de campos/cinema ainda abrem).
const V13 = false;
const DIRS = Object.entries(DIRECTIONS).filter(([k]) => V13 || (k !== "fields" && k !== "cinema"));

const LIMIT = process.env.NODE_ENV === "development" ? 30 : 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const hits = new Map<string, { n: number; t: number }>();

function take(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > WINDOW_MS) {
    hits.set(ip, { n: 1, t: now });
    return LIMIT - 1;
  }
  if (h.n >= LIMIT) return -1;
  h.n += 1;
  return LIMIT - h.n;
}

const S = Type.STRING;
const str = (description: string) => ({ type: S, description });
const list = (items: object, min: number, max: number, description?: string) => ({ type: Type.ARRAY, items, minItems: String(min), maxItems: String(max), description });
const o = (properties: Record<string, object>) => ({ type: Type.OBJECT, properties, required: Object.keys(properties) });

/** O que a IA devolve: direção de arte (do cardápio) + a página inteira escrita + o que buscar de foto. */
const schema = o({
  brand: str("Nome comercial curto e plausível, 1 a 3 palavras. Se a pessoa deu o nome, use exatamente o dela"),
  what: str("O que é, em palavras simples, com a cidade se foi dita. Ex.: 'Barbearia em Vinhedo'. Máx. 40 caracteres"),
  object: str("O OBJETO protagonista da página, em português: UMA coisa física, fotogênica, que simboliza o negócio e pode ser recortada (ex.: 'picanha no espeto', 'xícara de café', 'navalha de barbeiro', 'calculadora antiga', 'frasco de sérum'). Nunca pessoa, nunca lugar"),
  objectQuery: str("O mesmo objeto EM INGLÊS, 1 ou 2 palavras COMUNS do inglês (nada de nome regional: picanha vira 'steak', coxinha vira 'croquette'), do jeito que um banco de fotos acharia isolado em fundo branco (ex.: 'steak', 'coffee cup', 'razor', 'calculator', 'serum bottle')"),
  direction: { type: S, enum: DIRS.map(([k]) => k) },
  palette: { type: S, enum: Object.keys(PALETTES) },
  fonts: { type: S, enum: Object.keys(FONTS) },
  signature: { type: S, enum: Object.keys(SIGNATURES) },
  nav: o({ links: list({ type: S }, 3, 3, "3 itens de menu, 1-2 palavras"), cta: str("Botão do menu, 1-3 palavras") }),
  hero: o({
    title: str("Título da página: o que é + o que tem de seu. Máx. 32 caracteres, sem ponto de exclamação"),
    sub: str("Uma frase que diz claramente o que é e pra quem, com um detalhe concreto. Máx. 150 caracteres"),
    cta: str("Botão principal, ação concreta. Ex.: 'Reservar mesa', 'Agendar avaliação'"),
    note: str("Uma informação útil curta ao lado do botão: horário, bairro, prazo. Máx. 50 caracteres"),
  }),
  intro: o({
    statement: str("Frase de posicionamento, 15 a 25 palavras, o jeito de trabalhar que diferencia este negócio"),
    facts: list(o({ k: str("Rótulo curto. Ex.: 'Atendimento'"), v: str("Valor curto e concreto. Ex.: 'Só com hora marcada'") }), 3, 3),
  }),
  services: o({
    title: str("Título da seção de serviços/produtos/cardápio, 2-4 palavras"),
    sub: str("Uma frase de apoio, máx. 120 caracteres"),
    items: list(o({
      name: str("Nome real do serviço/produto/prato, 1-4 palavras"),
      desc: str("Descrição concreta (como é feito, o que inclui, quanto tempo leva). Máx. 100 caracteres"),
      price: str("Preço realista em reais no interior de SP, formato 'R$ 45' ou 'a partir de R$ 120'. Vazio se não fizer sentido"),
    }), 4, 6),
  }),
  feature: o({
    title: str("Título da seção da assinatura (ex.: 'Monte seu orçamento', 'Escolha seu horário'), máx. 30 caracteres"),
    text: str("Uma frase explicando o que a pessoa faz ali, máx. 120 caracteres"),
  }),
  gallery: o({ title: str("Título da galeria de fotos, 2-4 palavras"), captions: list(str("Legenda curta e específica de uma foto"), 4, 4) }),
  quotes: list(o({
    text: str("Depoimento de exemplo plausível e específico (cita um detalhe real do serviço), 15-35 palavras, sem exagero"),
    name: str("Nome e inicial do sobrenome. Ex.: 'Marina T.'"),
    detail: str("Contexto curto. Ex.: 'cliente desde a reforma da cozinha'"),
  }), 3, 3),
  faq: list(o({ q: str("Dúvida real de quem vai contratar"), a: str("Resposta direta, 1-2 frases") }), 4, 5),
  final: o({ title: str("Chamada final, máx. 32 caracteres"), text: str("Frase de apoio, máx. 120 caracteres"), cta: str("Botão final") }),
  contact: o({
    address: str("Endereço de exemplo plausível na cidade informada (rua e bairro). Se não houver cidade, só o bairro genérico"),
    hours: str("Horário escrito. Ex.: 'Ter a sáb, 9h às 19h'"),
    days: list({ type: Type.INTEGER }, 1, 7, "Dias abertos, 0=domingo ... 6=sábado"),
    open: str("Abre, HH:MM"),
    close: str("Fecha, HH:MM"),
  }),
  photos: list(str("Consulta de foto EM INGLÊS, 2-5 palavras, visual e concreta"), 3, 3, "1) o lugar/ambiente, 2) o produto ou o trabalho de perto, 3) pessoas sendo atendidas ou o resultado"),
});

const combos = Object.entries(ALLOWED).filter(([d]) => V13 || (d !== "fields" && d !== "cinema")).map(([d, a]) => `- ${d}: paletas ${a.palettes.join(", ")} · fontes ${a.fonts.join(", ")}`).join("\n");

const SYSTEM = `Você é diretor de arte e redator de um estúdio de landing pages premiado. A partir de uma ideia de negócio (qualquer uma), você define a direção de arte e escreve a landing page inteira, como se fosse um negócio de verdade.

DIREÇÃO DE ARTE (escolha o que combina com o que o negócio É e com o público dele):
${DIRS.map(([k, v]) => `- ${k}: ${v}`).join("\n")}
Paletas e fontes permitidas em cada direção:
${combos}
Assinatura (o momento interativo da página, escolha o que mais ajuda ESTE cliente a decidir):
${Object.entries(SIGNATURES).map(([k, v]) => `- ${k}: ${v}`).join("\n")}
${V13 ? "PREFIRA fields ou cinema (são as direções principais).\n" : ""}Varie: dois negócios parecidos não precisam receber a mesma combinação.

TEXTO:
- Português do Brasil, direto, concreto, do jeito que um bom dono de negócio fala. Frases curtas.
- Cada frase tem que ser específica DESTE negócio: ingredientes, técnicas, materiais, prazos, como funciona o atendimento.
- PROIBIDO: "transforme", "descubra", "eleve", "próximo nível", "experiência única", "excelência", "qualidade e confiança", "soluções", "inovador", "jornada", "bem-vindo", "venha conhecer", ponto de exclamação, emoji.
- Preços realistas para o interior de São Paulo quando fizer sentido. Depoimentos de exemplo plausíveis e contidos (vão marcados como exemplo).
- Não invente prêmios, avaliações em estrelas, número de clientes nem "anos de mercado".
- Fotos: consultas em inglês, concretas e fotogênicas (ex.: "barber trimming beard closeup", "sourdough bread crust", "dental clinic bright room").`;

// campos e cinema são as direções principais; suave/clínica só pra quem pede calma de verdade (os modelos reserva ignoram a preferência do prompt)
const CALM_SOFT = /infantil|criança|escola|creche|berçário|pet|cachorro|gato|flor|floricultura|artesanato|brinquedo/i;
const CALM_CLINIC = /cl[ií]nica|dent|odonto|m[eé]dic|psic|fisio|nutri|sa[uú]de|terapia|laborat|hospital|veterin/i;
const TO: Record<string, "fields" | "cinema"> = { poster: "fields", soft: "fields", product: "cinema", editorial: "cinema", nocturne: "cinema", clinic: "fields" };
// tudo vai pro motor novo; negócio calmo (saúde, infantil, pet) ganha campos de cor claros e serifa fina
const LOUD = { palettes: ["brasa", "cereja", "oceano", "pomar", "uva"], fonts: ["anton", "archivox", "shoulders", "saira"] } as const;
const QUIET = { palettes: ["agua", "petala"], fonts: ["instrumentx", "bodonix"] } as const;
function steer(spec: Spec, business: string): Spec {
  const d = spec.direction;
  const h = [...business].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const calm = CALM_CLINIC.test(business) || CALM_SOFT.test(business);
  if (d === "cinema") return spec;
  if (d === "fields" && !calm) return spec;
  const direction = calm ? "fields" : (TO[d] ?? "fields");
  if (direction === "cinema") { const a = ALLOWED.cinema; return { ...spec, direction, palette: a.palettes[h % a.palettes.length], fonts: a.fonts[(h >>> 4) % a.fonts.length] }; }
  const set = calm ? QUIET : LOUD;
  const palette = calm ? (CALM_SOFT.test(business) ? "petala" : "agua") : set.palettes[h % set.palettes.length];
  return { ...spec, direction, palette, fonts: set.fonts[(h >>> 4) % set.fonts.length] };
}

const MODELS = [process.env.GEMINI_MODEL_PAGE || "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const THINKING: Record<string, ThinkingLevel> = {
  "gemini-3.5-flash": ThinkingLevel.LOW,
  "gemini-3.5-flash-lite": ThinkingLevel.MINIMAL,
};

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Origem não permitida." }, 403);
  const body = await readJson(req, 2_048);
  const business = typeof body?.business === "string" ? body.business.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 160) : "";
  if (business.length < 3) {
    return Response.json({ error: "Conte um pouco mais sobre o seu negócio." }, { status: 400 });
  }

  const ip = clientIp(req);
  const remaining = take(ip);
  if (remaining < 0) {
    return Response.json(
      { error: "Você já usou suas prévias grátis de hoje. Fale com a gente e fazemos a sua ao vivo!" },
      { status: 429 },
    );
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Gerador indisponível no momento. Fale com a gente pelo WhatsApp." }, { status: 503 });

  const ai = new GoogleGenAI({ apiKey: key });
  for (const model of [...new Set(MODELS)]) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: `Ideia de negócio: ${business}`,
        config: {
          systemInstruction: SYSTEM,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 1,
          thinkingConfig: THINKING[model] ? { thinkingLevel: THINKING[model] } : undefined,
          abortSignal: AbortSignal.timeout(25_000),
        },
      });
      const raw = JSON.parse(res.text ?? "{}") as Record<string, unknown>;
      const queries = Array.isArray(raw.photos) ? raw.photos.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 60)) : [];
      const oq = typeof raw.objectQuery === "string" ? raw.objectQuery : "";
      const [pics, object] = await Promise.all([findImages(queries), V13 ? findObject(oq).catch(() => []) : Promise.resolve([])]);
      const clean = sanitize({ ...raw, images: { hero: pics[0], pics: pics.slice(1), object } });
      const spec = V13 ? steer(clean, business) : clean;
      logGen({ business, style: spec.direction, own: false, ok: true });
      return json({ spec, model, remaining });
    } catch (err) {
      console.error(`[generate] ${model} falhou:`, (err as Error).message.slice(0, 160));
    }
  }
  logGen({ business, style: "-", own: false, ok: false });
  return Response.json({ error: "A IA está sobrecarregada agora. Tenta de novo em alguns segundos?" }, { status: 503 });
}
