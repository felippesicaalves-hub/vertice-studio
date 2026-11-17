// O "contrato" do motor de páginas: a IA escolhe a direção de arte (de um cardápio curado) e escreve tudo;
// o motor (components/engine) monta a página. Tudo que vem da IA ou do link passa por sanitize().

export const DIRECTIONS = {
  fields: "Campos de cor: um objeto do negócio recortado viaja pela página; cada seção é um campo de cor chapada forte (laranja, magenta, amarelo, azul...) e a letra é enorme e condensada. Comida, bebida, produto, evento, academia, barbearia, loja, festa, delivery, qualquer negócio com energia.",
  cinema: "Cinema: fundo quase preto, luz de estúdio e um brilho colorido; o objeto do negócio recortado flutua iluminado e a serifa fina e gigante fica atrás dele. Estética, joalheria, bar, restaurante de autor, tecnologia, advocacia, imobiliária, carro, perfume, qualquer negócio premium.",
  editorial: "Revista: serifa grande, foto dominante, colunas assimétricas, muito ar. Restaurante de autor, hotel, arquitetura, advocacia, livraria, vinho, fotografia.",
  poster: "Cartaz: letra condensada enorme, campos de cor chapada, energia. Academia, luta, bar, hamburgueria, barbearia, evento, festa, oficina, esporte.",
  soft: "Acolhedor: formas arredondadas, cores quentes e claras, simpatia. Padaria, café, confeitaria, pet, infantil, escola, floricultura, artesanato.",
  clinic: "Clínica: limpo, calmo, confiável, muito legível. Dentista, médico, psicólogo, fisioterapia, nutrição, contabilidade, seguros, laboratório.",
  nocturne: "Noite: fundo escuro rico, serifa de alto contraste, um acento quente. Bar de drinks, restaurante noturno, tatuagem, joalheria, estética premium, música.",
  product: "Produto: grotesca firme, blocos de cor, direto ao ponto. App, software, agência, curso online, startup, serviço digital, tecnologia.",
} as const;
export type Direction = keyof typeof DIRECTIONS;

export type Palette = { ground: string; surface: string; ink: string; muted: string; accent: string; onAccent: string; dark: boolean; seq?: string[]; glow?: string };
const P = (ground: string, surface: string, ink: string, muted: string, accent: string, onAccent: string, dark = false): Palette => ({ ground, surface, ink, muted, accent, onAccent, dark });
/** campos: a página troca de cor a cada seção (seq); a tinta escura funciona em todas */
const F = (seq: string[], ink: string, muted: string, accent: string): Palette => ({ ground: seq[0], surface: seq[1], ink, muted, accent, onAccent: seq[0], dark: false, seq });
/** cinema: quase preto + um brilho */
const C = (ground: string, glow: string, onGlow: string): Palette => ({ ground, surface: "#121418", ink: "#eef0f2", muted: "#8e949c", accent: glow, onAccent: onGlow, dark: true, glow });

/** Paletas com intenção: um neutro com temperatura + um acento usado pouco. Sem roxo, sem neon no preto, sem gradiente. */
export const PALETTES = {
  papel: P("#f4f1ea", "#e8e3d7", "#1b1a17", "#57534a", "#1f4d3a", "#f4f1ea"),
  tinta: P("#eef0ec", "#e0e4dd", "#121514", "#4d5550", "#b3261e", "#ffffff"),
  marinho: P("#f2f0eb", "#e4e0d6", "#0f1b2d", "#4b5563", "#0f4c81", "#ffffff"),
  laranja: P("#111111", "#1d1d1d", "#f1eee6", "#aaa69d", "#ff5a1f", "#140a05", true),
  amarelo: P("#f3e51b", "#e6d80f", "#111111", "#3b3a22", "#111111", "#f3e51b"),
  vermelho: P("#ebe6dc", "#ddd6c9", "#141414", "#4d4943", "#e10600", "#ffffff"),
  pessego: P("#fbf0e7", "#f3e0d0", "#2a1d17", "#6a574d", "#2f6b4f", "#ffffff"),
  menta: P("#edf5ef", "#d9eade", "#13261b", "#4a6153", "#e8553a", "#ffffff"),
  ceu: P("#edf3f8", "#d9e5ef", "#10202f", "#4b5d6e", "#ffb000", "#1f1600"),
  branco: P("#f7f8f6", "#e9eeec", "#0f1a1c", "#4d5b5d", "#0e7c66", "#ffffff"),
  nevoa: P("#f3f5f8", "#e3e8ef", "#0d1726", "#4a5568", "#1f5fd1", "#ffffff"),
  areia: P("#f5f2ee", "#e8e2da", "#1d1b19", "#5a544d", "#2d2a26", "#f5f2ee"),
  vinho: P("#170d10", "#24151b", "#f3e9e2", "#b8a59b", "#d4a24c", "#1a1206", true),
  musgo: P("#0f1411", "#19211c", "#ecefe6", "#a1aa9e", "#f0a35e", "#1b0f05", true),
  carvao: P("#121212", "#1e1e1e", "#f2f0eb", "#a6a29a", "#e5322d", "#ffffff", true),
  giz: P("#f4f4f0", "#e6e6df", "#111111", "#55554e", "#0055ff", "#ffffff"),
  lima: P("#f1f2ec", "#e3e5da", "#101210", "#51544c", "#c4f031", "#101210"),
  grafite: P("#1a1d1b", "#252927", "#eef0ec", "#a3aaa5", "#7fd1ae", "#0d1a14", true),
  brasa: F(["#d9531e", "#e8177c", "#f4c020"], "#240b05", "#4a1a0c", "#f4c020"),
  cereja: F(["#ec4a32", "#f7c6cf", "#ffe15a"], "#1e0a08", "#4a1d17", "#1e0a08"),
  oceano: F(["#2a50ff", "#ff7a55", "#f3ead9"], "#0a0e26", "#26305e", "#0a0e26"),
  pomar: F(["#3b8a50", "#f2a93b", "#f6e7c8"], "#0e1a0f", "#2c3d2c", "#0e1a0f"),
  uva: F(["#7a2bd9", "#ffb2d6", "#c8f560"], "#14061f", "#3a1d55", "#14061f"),
  agua: F(["#dcefe9", "#d3e6fb", "#f6ece3"], "#0c262a", "#3b5759", "#0e7c66"),
  petala: F(["#ffd6c4", "#cfeccf", "#fff0a3"], "#2a1810", "#5a4438", "#d8462c"),
  aurora: C("#06080a", "#7cff6b", "#06120a"),
  ciano: C("#05080b", "#39e6d4", "#03110f"),
  azul: C("#04060d", "#3d6bff", "#ffffff"),
  ambar: C("#0a0705", "#ffb04a", "#170c02"),
  rubi: C("#0b0507", "#ff4d5e", "#ffffff"),
} satisfies Record<string, Palette>;
export type PaletteId = keyof typeof PALETTES;

/** Pares tipográficos (display + texto). Nada de Inter, Roboto, Poppins, Montserrat. */
export const FONTS = {
  fraunces: { display: "--f-fraunces", text: "--f-manrope", upper: false, weight: 500, track: -0.035, k: 0.56 },
  instrument: { display: "--f-instrument-serif", text: "--f-instrument-sans", upper: false, weight: 400, track: -0.025, k: 0.47 },
  caslon: { display: "--f-caslon", text: "--f-karla", upper: false, weight: 400, track: -0.03, k: 0.5 },
  bodoni: { display: "--f-bodoni", text: "--f-dmsans", upper: false, weight: 500, track: -0.035, k: 0.55 },
  shoulders: { display: "--f-shoulders", text: "--f-archivo", upper: true, weight: 900, track: -0.005, k: 0.43 },
  saira: { display: "--f-sairacond", text: "--f-saira", upper: true, weight: 800, track: -0.01, k: 0.45 },
  bricolage: { display: "--f-bricolage", text: "--f-figtree", upper: false, weight: 800, track: -0.045, k: 0.6 },
  familjen: { display: "--f-familjen", text: "--f-figtree", upper: false, weight: 600, track: -0.04, k: 0.52 },
  schibsted: { display: "--f-schibsted", text: "--f-schibsted", upper: false, weight: 700, track: -0.045, k: 0.6 },
  baloo: { display: "--f-baloo", text: "--f-nunito", upper: false, weight: 800, track: -0.02, k: 0.56 },
  dmserif: { display: "--f-dmserif", text: "--f-work", upper: false, weight: 400, track: -0.02, k: 0.5 },
  cormorant: { display: "--f-cormorant", text: "--f-jost", upper: false, weight: 500, track: -0.02, k: 0.44 },
  anton: { display: "--f-anton", text: "--f-archivo", upper: true, weight: 400, track: 0, k: 0.42 },
  archivox: { display: "--f-archivox", text: "--f-archivo", upper: true, weight: 900, track: -0.02, k: 0.78 },
  bodonix: { display: "--f-bodoni", text: "--f-instrument-sans", upper: false, weight: 400, track: -0.045, k: 0.5 },
  instrumentx: { display: "--f-instrument-serif", text: "--f-instrument-sans", upper: false, weight: 400, track: -0.04, k: 0.45 },
} as const;
export type FontId = keyof typeof FONTS;

export const SIGNATURES = {
  zoom: "a foto de abertura começa num quadro e se abre até a tela inteira enquanto a pessoa rola (pede foto forte do lugar ou do produto)",
  particles: "o nome do negócio formado por milhares de partículas que fogem do cursor e voltam (bom pra marca forte, tecnologia, eventos, noite)",
  estimator: "simulador de orçamento: a pessoa marca os serviços e vê o total na hora (SÓ quando os itens se somam num pedido, com preço avulso: nunca planos ou assinaturas)",
  booking: "agenda: a pessoa escolhe o dia e o horário e já manda a reserva pelo WhatsApp (bom pra clínica, salão, aula, mesa de restaurante)",
  hoverlist: "lista de serviços/pratos em letras grandes; ao passar o mouse, a foto de cada item segue o cursor (bom pra cardápio, portfólio, catálogo)",
} as const;
export type Signature = keyof typeof SIGNATURES;

/** O que combina com o quê (a IA escolhe dentro disso; o resto é corrigido). */
export const ALLOWED: Record<Direction, { palettes: PaletteId[]; fonts: FontId[] }> = {
  fields: { palettes: ["brasa", "cereja", "oceano", "pomar", "uva", "agua", "petala"], fonts: ["anton", "archivox", "shoulders", "saira", "instrumentx", "bodonix"] },
  cinema: { palettes: ["aurora", "ciano", "azul", "ambar", "rubi"], fonts: ["instrumentx", "bodonix", "cormorant"] },
  editorial: { palettes: ["papel", "tinta", "marinho", "areia"], fonts: ["instrument", "fraunces", "caslon", "dmserif"] },
  poster: { palettes: ["laranja", "amarelo", "vermelho", "carvao"], fonts: ["shoulders", "saira", "anton"] },
  soft: { palettes: ["pessego", "menta", "ceu"], fonts: ["fraunces", "baloo"] },
  clinic: { palettes: ["branco", "nevoa", "areia", "menta"], fonts: ["dmserif", "instrument", "fraunces"] },
  nocturne: { palettes: ["vinho", "musgo", "carvao"], fonts: ["bodoni", "cormorant", "instrument", "caslon"] },
  product: { palettes: ["giz", "lima", "grafite"], fonts: ["archivox", "instrument", "anton"] },
};

export type Img = { src: string; alt: string; credit?: string; link?: string; duo?: boolean };
export type Item = { name: string; desc: string; price: string };

export type Spec = {
  brand: string;
  object: string; // o objeto protagonista, em português ("picanha no espeto")
  what: string; // o que é, em palavras simples ("Barbearia em Vinhedo")
  direction: Direction;
  palette: PaletteId;
  fonts: FontId;
  signature: Signature;
  nav: { links: [string, string, string]; cta: string };
  hero: { title: string; sub: string; cta: string; note: string };
  intro: { statement: string; facts: { k: string; v: string }[] };
  services: { title: string; sub: string; items: Item[] };
  feature: { title: string; text: string }; // título/linha da seção da assinatura (orçamento, agenda...)
  gallery: { title: string; captions: string[] };
  quotes: { text: string; name: string; detail: string }[];
  faq: { q: string; a: string }[];
  final: { title: string; text: string; cta: string };
  contact: { address: string; hours: string; days: number[]; open: string; close: string };
  images: { hero?: Img; pics: Img[]; object: Img[] }; // object: candidatas pro recorte (a primeira que recortar bem vence)
};

const str = (v: unknown, n: number, fb = "") => {
  const s = typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").replace(/!+/g, ".").trim() : "";
  return (s || fb).slice(0, n);
};
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const pick = <T extends string>(v: unknown, list: readonly T[], fb: T): T => (list.includes(v as T) ? (v as T) : fb);
const hhmm = (v: unknown, fb: string) => (typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : fb);

const okImg = (v: unknown): Img | undefined => {
  const o = obj(v);
  const src = typeof o.src === "string" ? o.src : "";
  try {
    const u = new URL(src);
    if (u.protocol !== "https:") return undefined;
  } catch {
    return undefined;
  }
  return { src: src.slice(0, 600), alt: str(o.alt, 120), credit: str(o.credit, 120) || undefined, link: typeof o.link === "string" && o.link.startsWith("https://") ? o.link.slice(0, 300) : undefined, duo: o.duo === true || undefined };
};

/** Confere tudo (veio da IA ou de um link editado à mão: nada é confiado). */
export function sanitize(raw: unknown): Spec {
  const r = obj(raw);
  const direction = pick(r.direction, Object.keys(DIRECTIONS) as Direction[], "editorial");
  const allowed = ALLOWED[direction];
  const nav = obj(r.nav), hero = obj(r.hero), intro = obj(r.intro), services = obj(r.services), feature = obj(r.feature);
  const gallery = obj(r.gallery), final = obj(r.final), contact = obj(r.contact), images = obj(r.images);
  const links = arr(nav.links).map((x) => str(x, 18)).filter(Boolean);
  const items = arr(services.items).map((x) => {
    const o = obj(x);
    return { name: str(o.name, 34), desc: str(o.desc, 120), price: str(o.price, 24) };
  }).filter((x) => x.name).slice(0, 6);
  const brand = str(r.brand, 28, "Seu Negócio");
  return {
    brand,
    what: str(r.what, 60, brand),
    object: str(r.object, 40),
    direction,
    palette: pick(r.palette, allowed.palettes, allowed.palettes[0]),
    fonts: pick(r.fonts, allowed.fonts, allowed.fonts[0]),
    signature: pick(r.signature, Object.keys(SIGNATURES) as Signature[], "hoverlist"),
    nav: { links: [links[0] || "Serviços", links[1] || "Sobre", links[2] || "Contato"], cta: str(nav.cta, 20, "Chamar no WhatsApp") },
    hero: { title: str(hero.title, 44, brand), sub: str(hero.sub, 170), cta: str(hero.cta, 28, "Chamar no WhatsApp"), note: str(hero.note, 60) },
    intro: {
      statement: str(intro.statement, 200),
      facts: arr(intro.facts).map((x) => ({ k: str(obj(x).k, 24), v: str(obj(x).v, 28) })).filter((f) => f.k && f.v).slice(0, 3),
    },
    services: {
      title: str(services.title, 36, "O que a gente faz"),
      sub: str(services.sub, 140),
      items: items.length >= 3 ? items : [
        { name: "Atendimento", desc: "Do primeiro contato até a entrega, com a mesma pessoa.", price: "" },
        { name: "Orçamento", desc: "Rápido e sem compromisso, pelo WhatsApp.", price: "" },
        { name: "Agenda", desc: "Horários combinados com você.", price: "" },
      ],
    },
    feature: { title: str(feature.title, 40, "Monte o seu"), text: str(feature.text, 140) },
    gallery: { title: str(gallery.title, 40, "Por dentro"), captions: arr(gallery.captions).map((x) => str(x, 60)).slice(0, 6) },
    quotes: arr(r.quotes).map((x) => ({ text: str(obj(x).text, 220), name: str(obj(x).name, 32), detail: str(obj(x).detail, 40) })).filter((q) => q.text && q.name).slice(0, 3),
    faq: arr(r.faq).map((x) => ({ q: str(obj(x).q, 100), a: str(obj(x).a, 300) })).filter((f) => f.q && f.a).slice(0, 5),
    final: { title: str(final.title, 48, "Vamos conversar?"), text: str(final.text, 160), cta: str(final.cta, 28, "Chamar no WhatsApp") },
    contact: {
      address: str(contact.address, 80),
      hours: str(contact.hours, 60),
      days: arr(contact.days).filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6).slice(0, 7),
      open: hhmm(contact.open, "09:00"),
      close: hhmm(contact.close, "18:00"),
    },
    images: {
      hero: okImg(images.hero),
      pics: arr(images.pics).map(okImg).filter((x): x is Img => !!x).slice(0, 10),
      object: arr(images.object).map(okImg).filter((x): x is Img => !!x).slice(0, 6),
    },
  };
}
