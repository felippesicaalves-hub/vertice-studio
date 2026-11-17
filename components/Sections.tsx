import { BRAND, FAQ, PLANS, waLink } from "@/lib/config";
import { CheckIcon, Sparkle, WaIcon } from "./icons";
import { LogoMark } from "./Logo";

function Head({ eyebrow, title, sub, center = false, light = false }: { eyebrow: string; title: React.ReactNode; sub?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={`mb-14 max-w-[860px] md:mb-20 ${center ? "mx-auto text-center" : ""}`}>
      <p data-reveal className={`eyebrow mb-5 inline-flex items-center gap-3 ${light ? "text-gold" : "text-wine/60"}`}>
        <Sparkle className="w-3 text-gold" /> {eyebrow}
      </p>
      <h2 data-split className={`title text-[44px] md:text-[80px] ${light ? "text-sand" : "text-wine"}`}>{title}</h2>
      {sub && (
        <p data-reveal className={`mt-6 max-w-[580px] text-[17px] leading-relaxed md:text-lg ${center ? "mx-auto" : ""} ${light ? "text-sand/70" : "text-wine/70"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ───────────── processo ───────────── */
const STEPS = [
  { n: "01", t: "Briefing de 15 min", d: "Uma conversa rápida no WhatsApp pra entender seu negócio, seu cliente e sua oferta." },
  { n: "02", t: "Prévia em 48h", d: "Você recebe o visual e os textos da sua página. Não curtiu? Não paga." },
  { n: "03", t: "Ajustes", d: "Até 3 rodadas de ajuste, conforme o plano, até ficar do jeito que você imaginou." },
  { n: "04", t: "No ar", d: "Publicamos no seu domínio, ligamos WhatsApp, Pixel e Google e te ensinamos a editar." },
];

export function Process() {
  return (
    <section id="processo" className="bg-wine py-28 text-sand md:py-40">
      <div className="container-x">
        <Head light eyebrow="Processo" title={<>Do briefing ao ar, <span className="serif text-gold">sem dor de cabeça.</span></>} />
        <ol data-stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              data-tilt
              className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-[26px] border border-sand/10 bg-wine-2/60 p-8 transition-colors duration-500 hover:border-gold/50"
            >
              <span className="serif text-[88px] leading-none text-gold/90">{s.n}</span>
              <h3 className="title mt-auto pt-6 text-[28px]">{s.t}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-sand/65">{s.d}</p>
              <span className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-gold/0 blur-3xl transition-colors duration-700 group-hover:bg-gold/30" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────── planos ───────────── */
export function Plans() {
  return (
    <section id="planos" className="relative bg-sand py-28 md:py-40">
      <div className="container-x">
        <Head center eyebrow="Planos" title={<>Preço justo, <span className="serif text-gold">pago uma vez.</span></>} sub="Sem mensalidade. 50% pra começar, 50% na entrega. Parcelamos no cartão." />
        <div data-stagger className="grid items-stretch gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <article
              key={p.name}
              data-tilt
              className={`relative flex flex-col rounded-[28px] p-8 ${
                p.featured ? "bg-wine text-sand shadow-[0_40px_90px_-40px_rgba(58,21,32,.8)] lg:-my-5 lg:py-12" : "border border-wine/12 bg-white/55 text-wine"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="title text-3xl">{p.name}</h3>
                {p.featured && <span className="eyebrow rounded-full bg-gold px-3 py-1 !text-[10px] font-semibold text-wine-2">Mais escolhido</span>}
              </div>
              <p className={`mt-2 min-h-[48px] text-sm ${p.featured ? "text-sand/70" : "text-wine/65"}`}>{p.pitch}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-lg font-semibold">R$</span>
                <span className="title text-[80px] leading-none">{p.price.toLocaleString("pt-BR")}</span>
              </p>
              <p className={`mt-2 text-sm ${p.featured ? "text-sand/60" : "text-wine/55"}`}>
                ou 10× de R$ {(p.price / 10).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · entrega em {p.days} dias
              </p>
              <ul className={`my-8 space-y-3 border-t pt-7 text-[15px] ${p.featured ? "border-sand/15" : "border-wine/10"}`}>
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3"><CheckIcon className="mt-1 text-gold" /> {f}</li>
                ))}
              </ul>
              <a
                href={waLink(`Olá! Quero saber mais sobre o plano ${p.name} (R$ ${p.price}) da ${BRAND}.`)}
                target="_blank"
                rel="noopener"
                className={`btn mt-auto w-full ${p.featured ? "btn-gold" : "btn-wine"}`}
              >
                Quero o {p.name} <span className="arrow">→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── garantia ───────────── */
export function Guarantee() {
  return (
    <section className="bg-sand-2 py-24 md:py-32">
      <div className="container-x grid items-center gap-10 md:grid-cols-[auto_1fr]">
        <div className="relative mx-auto h-44 w-44">
          <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 text-wine">
            <defs><path id="circ" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" /></defs>
            <text fill="currentColor" fontSize="14" fontWeight="600" letterSpacing="4" fontFamily="var(--font-geist-mono)">
              <textPath href="#circ">GARANTIA DE PRÉVIA • SEM RISCO • GARANTIA DE PRÉVIA • SEM RISCO •</textPath>
            </text>
          </svg>
          <div className="absolute inset-0 grid place-items-center"><Sparkle className="w-12 text-gold" /></div>
        </div>
        <div className="text-center md:text-left">
          <h2 data-split className="title text-5xl text-wine md:text-7xl">Não gostou da prévia? <span className="serif text-gold">Não paga.</span></h2>
          <p data-reveal className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-wine/70">
            A gente só começa a cobrar quando você aprova a direção. Se a primeira prévia não te convencer, devolvemos sua entrada inteira.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────── FAQ ───────────── */
export function Faq() {
  return (
    <section id="faq" className="container-x grid gap-12 py-28 md:grid-cols-[1fr_1.4fr] md:py-40">
      <div>
        <p className="eyebrow mb-5 inline-flex items-center gap-3 text-wine/60"><Sparkle className="w-3 text-gold" /> FAQ</p>
        <h2 data-split className="title text-[44px] text-wine md:text-[72px]">Perguntas <span className="serif text-gold">frequentes.</span></h2>
        <p data-reveal className="mt-5 text-wine/70">
          Ficou alguma dúvida?{" "}
          <a className="font-semibold text-wine underline decoration-gold underline-offset-4" href={waLink(`Olá! Tenho uma dúvida sobre as landing pages da ${BRAND}.`)} target="_blank" rel="noopener">Chama no WhatsApp</a>.
        </p>
      </div>
      <div data-stagger className="divide-y divide-wine/10 border-y border-wine/10">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-6">
            <summary className="flex items-center justify-between gap-6 text-lg font-semibold text-wine">
              {f.q}
              <span className="faq-plus grid h-9 w-9 shrink-0 place-items-center rounded-full border border-wine/20 text-xl text-gold transition-transform duration-300 group-open:border-gold">+</span>
            </summary>
            <p className="mt-4 max-w-[60ch] leading-relaxed text-wine/70">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ───────────── CTA final (botão com anel pulsando, como o "Saiba mais" do post) ───────────── */
export function FinalCta() {
  return (
    <section className="cinema relative overflow-hidden py-32 md:py-48">
      <div className="container-x relative text-center">
        <p data-reveal className="eyebrow mb-6 text-gold">Sua vez</p>
        <h2 data-split className="title mx-auto max-w-[13ch] text-[56px] text-sand md:text-[116px]">
          Seu próximo cliente está <span className="serif text-gold">procurando você.</span>
        </h2>
        <p data-reveal className="mx-auto mt-7 max-w-[46ch] text-lg text-sand/70">Veja agora, de graça, como ficaria a sua página. Leva 10 segundos.</p>
        <div data-reveal className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#gerador" className="btn btn-gold pulse-ring !h-16 !px-10 text-base" data-magnetic>Gerar minha prévia <span className="arrow">→</span></a>
          <a href={waLink(`Olá! Quero uma landing page da ${BRAND}.`)} target="_blank" rel="noopener" className="btn btn-ghost-light" data-magnetic>
            <WaIcon size={16} /> Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-sand/10 bg-wine-2 py-10 text-sand">
      <div className="container-x flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
        <div className="flex items-center gap-2.5 font-semibold"><LogoMark size={22} /> {BRAND}</div>
        <p className="text-sand/55">© 2026 {BRAND}. Landing pages para negócios locais.</p>
      </div>
    </footer>
  );
}

export function WaFloat() {
  return (
    <a
      href={waLink(`Olá! Vim pelo site da ${BRAND} e quero uma landing page.`)}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      data-wa-float=""
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,.45)] transition-transform duration-300 hover:-translate-y-1"
    >
      <WaIcon size={26} />
    </a>
  );
}
