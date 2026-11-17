"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { BRAND, waLink } from "@/lib/config";
import type { Spec } from "@/lib/engine/spec";
import ScaledFrame from "./sites/ScaledFrame";
import { previewHref } from "@/lib/preview-link";
import { ArrowUp, CheckIcon, SparkIcon } from "./icons";

const SUGGESTIONS = ["Café de torra própria em Campinas", "Estúdio de tatuagem fineline", "Clínica de fisioterapia esportiva", "App de finanças pra casal", "Hamburgueria smash em Vinhedo"];
const STATUS = ["Entendendo a ideia…", "Escolhendo a direção de arte…", "Escrevendo a página…", "Buscando as fotos…", "Montando a página…"];

type State = "idle" | "loading" | "done" | "error";
const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "suapagina";

export default function Generator() {
  const [business, setBusiness] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<Spec | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [lastBusiness, setLastBusiness] = useState("");
  const [nonce, setNonce] = useState(0);
  const reveal = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== "loading") return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STATUS.length - 1)), 1600);
    return () => clearInterval(id);
  }, [state]);

  // a prévia entra "desenrolando" de cima pra baixo
  useEffect(() => {
    if (state !== "done" || !reveal.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = gsap.fromTo(reveal.current, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "power4.inOut" });
    return () => { t.revert(); };
  }, [state, nonce]);

  async function generate(value = business) {
    const v = value.trim();
    if (v.length < 3 || state === "loading") return;
    setBusiness(v);
    setState("loading");
    setStep(0);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business: v }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Algo deu errado.");
      setLastBusiness(v);
      setResult(data.spec);
      setNonce((n) => n + 1);
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  const busy = state === "loading";
  const brandName = result?.brand ?? "";
  const href = result ? previewHref(result) : "";
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(location.origin + href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  return (
    <section id="gerador" className="cinema relative overflow-hidden py-28 md:py-40">
      <div className="container-x relative">
        <div className="mx-auto mb-12 max-w-[820px] text-center">
          <p data-reveal className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-gold">
            <SparkIcon size={13} /> Gerador com IA · grátis
          </p>
          <h2 data-split className="title text-[46px] text-sand md:text-[88px]">
            Descreva. A IA <span className="serif text-gold">escreve.</span>
          </h2>
          <p data-reveal className="mx-auto mt-6 max-w-[52ch] text-[17px] leading-relaxed text-sand/70">
            Escreva qualquer ideia de negócio. A IA faz a direção de arte, escreve a página inteira, busca as fotos e monta uma landing page completa, com animação e uma interação feita pro seu ramo.
          </p>
        </div>

        {/* barra de prompt */}
        <form
          data-reveal
          onSubmit={(e) => {
            e.preventDefault();
            generate();
          }}
          className="group relative mx-auto flex max-w-[720px] items-center gap-3 rounded-full border border-sand/15 bg-wine-2/80 p-2 pl-5 shadow-[0_30px_80px_-30px_rgba(201,161,91,.55)] backdrop-blur transition-colors focus-within:border-gold/60"
        >
          <span className="text-gold"><SparkIcon size={18} /></span>
          <label htmlFor="biz" className="sr-only">Seu negócio</label>
          <input
            id="biz"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="Ex.: café de torra própria em Campinas"
            maxLength={160}
            className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-sand outline-none placeholder:text-sand/40"
          />
          <button
            type="submit"
            aria-label="Gerar prévia"
            disabled={busy || business.trim().length < 3}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-wine-2 shadow-[0_8px_24px_-6px_rgba(201,161,91,.8)] transition-transform duration-300 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-wine-2 border-t-transparent" /> : <ArrowUp />}
          </button>
        </form>

        <div data-reveal className="mx-auto mt-4 flex max-w-[700px] flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => generate(s)}
              className="rounded-full border border-sand/15 px-3.5 py-1.5 text-sm text-sand/70 transition-colors hover:border-gold/60 hover:text-sand"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-8 flex h-6 justify-center">
          {state === "loading" && (
            <p className="eyebrow flex items-center gap-2 text-gold"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" /> {STATUS[step]}</p>
          )}
          {state === "done" && (
            <p className="eyebrow flex items-center gap-2 text-gold"><CheckIcon /> Página pronta · role dentro dela</p>
          )}
        </div>

        <div className="relative mx-auto mt-6 max-w-[1100px]">
          <BrowserFrame domain={brandName ? `${slug(brandName)}.com.br` : "suapagina.com.br"} loading={busy}>
            {state === "loading" && <Skeleton />}
            {state === "done" && result && (
              <div ref={reveal}>
                <ScaledFrame key={nonce} src={href} title={`Prévia da página de ${brandName}`} height="min(720px, 78svh)" />
              </div>
            )}
            {state === "idle" && <Idle />}
            {state === "error" && (
              <div className="grid min-h-[520px] place-items-center p-10 text-center">
                <div>
                  <p className="text-lg text-sand">{error}</p>
                  <a className="btn btn-gold mt-6" href={waLink(`Olá! Quero ver uma prévia da landing page da ${BRAND}.`)} target="_blank" rel="noopener">
                    Falar no WhatsApp
                  </a>
                </div>
              </div>
            )}
          </BrowserFrame>
          {state === "done" && (
            <span className="eyebrow absolute -right-2 -top-4 rotate-6 rounded-full bg-gold px-4 py-2 !text-[11px] font-semibold text-wine-2 shadow-lg md:-right-6">
              Prévia grátis
            </span>
          )}

          {state === "done" && (
            <>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <a className="btn btn-gold" href={href} target="_blank" rel="noopener">Abrir em tela cheia</a>
                <button type="button" onClick={copyLink} className="rounded-full border border-sand/20 px-5 py-2.5 text-sm text-sand/80 transition-colors hover:border-gold/60 hover:text-sand">
                  {copied ? "Link copiado" : "Copiar link da prévia"}
                </button>
              </div>
              <p className="mt-4 text-center text-sm text-sand/60">
                Prévia feita pela IA com o nosso motor de design · a página final ganha suas fotos, sua marca e o acabamento do estúdio
              </p>
              <LeadForm business={lastBusiness} brandName={brandName} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function BrowserFrame({ domain, loading, children }: { domain: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-sand/10 bg-[#1d0a10] shadow-[0_50px_120px_-40px_rgba(0,0,0,.8)]">
      <div className="flex items-center gap-3 border-b border-sand/10 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex h-7 min-w-0 max-w-[340px] flex-1 items-center justify-center gap-2 truncate rounded-full bg-sand/[.07] px-3 font-mono text-xs text-sand/60">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 7V5a4 4 0 1 1 8 0v2h1v8H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z" /></svg>
          {domain}
        </div>
        <div className="w-[52px]" />
      </div>
      <div className="relative min-h-[520px] md:min-h-[560px]">
        {loading && <div className="scanline pointer-events-none absolute inset-x-0 top-0 z-10 h-1/4 bg-gradient-to-b from-transparent via-gold/15 to-transparent" />}
        {children}
      </div>
    </div>
  );
}

function Idle() {
  return (
    <div className="grid min-h-[520px] place-items-center p-10 text-center md:min-h-[560px]">
      <div>
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full border border-gold/40 text-gold">
          <SparkIcon size={20} />
        </div>
        <p className="title text-3xl text-sand">Sua prévia aparece <span className="serif text-gold">aqui.</span></p>
        <p className="mt-2 text-sm text-sand/55">Escolha uma sugestão ou digite o seu negócio acima.</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-6 md:p-10">
      <div className="flex justify-between">
        <div className="skeleton h-5 w-28" />
        <div className="flex gap-3">
          <div className="skeleton h-4 w-12" />
          <div className="skeleton h-4 w-12" />
          <div className="skeleton h-4 w-12" />
        </div>
      </div>
      <div className="mt-16 space-y-3">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-12 w-4/5" />
        <div className="skeleton h-12 w-3/5" />
        <div className="skeleton mt-4 h-4 w-2/3" />
        <div className="skeleton h-11 w-44 !rounded-full" />
      </div>
      <div className="mt-12 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    </div>
  );
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}

function LeadForm({ business, brandName }: { business: string; brandName: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState("");
  const ref = useRef<HTMLFormElement>(null);
  const digits = phone.replace(/\D/g, "");
  const valid = name.trim().length >= 2 && digits.length >= 10 && consent;

  useEffect(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // fromTo + revert: no StrictMode o efeito roda 2x e um "from" simples congelaria o form invisível
    const tween = gsap.fromTo(ref.current, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, delay: 1.4, ease: "power3.out" });
    return () => { tween.revert(); };
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    // registra o lead sem travar a abertura do WhatsApp (senão o navegador bloqueia o pop-up)
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, whatsapp: digits, business, consent, website: trap }),
      keepalive: true,
    }).catch(() => {});
    const msg = `Oi! Sou ${name.trim()}, tenho ${business ? `um negócio: ${business}` : "um negócio"} e gostei da prévia "${brandName}" que a IA da ${BRAND} gerou. Quero a minha página no ar!`;
    window.open(waLink(msg), "_blank", "noopener");
    setSent(true);
  }

  const field = "h-12 w-full min-w-0 rounded-full border border-wine/15 bg-white px-5 text-wine outline-none transition-colors focus:border-gold";

  if (sent) {
    return (
      <div className="mx-auto mt-10 max-w-[680px] rounded-[28px] bg-sand p-8 text-center text-wine">
        <p className="title text-3xl">Prontinho, <span className="serif text-gold">{name.split(" ")[0]}!</span></p>
        <p className="mt-2 text-wine/70">Abrimos o WhatsApp com a sua mensagem. É só enviar que a gente responde rapidinho.</p>
      </div>
    );
  }

  return (
    <form ref={ref} onSubmit={submit} className="mx-auto mt-10 max-w-[780px] rounded-[28px] bg-sand p-6 text-wine md:p-8">
      <p className="title text-3xl md:text-4xl">Gostou? Quer essa página <span className="serif text-gold">no ar?</span></p>
      <p className="mt-2 text-sm text-wine/65">Deixe seu nome e WhatsApp. A gente refina a prévia e te chama, sem compromisso.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="sr-only" htmlFor="lead-name">Seu nome</label>
        <input id="lead-name" required autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className={field} />
        <label className="sr-only" htmlFor="lead-phone">WhatsApp</label>
        <input
          id="lead-phone"
          required
          inputMode="tel"
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => setPhone(maskPhone(e.target.value))}
          placeholder="(19) 99999-9999"
          className={field}
        />
        {/* armadilha pra robô: invisível pra gente, robô preenche */}
        <input tabIndex={-1} autoComplete="off" aria-hidden value={trap} onChange={(e) => setTrap(e.target.value)} name="website" className="absolute -left-[9999px] h-px w-px opacity-0" />
        <button type="submit" disabled={!valid} className="btn btn-wine !h-12 disabled:opacity-50">
          Quero minha página
        </button>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-left text-xs leading-relaxed text-wine/70">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#3A1520]" />
        <span>Autorizo a {BRAND} a guardar meu nome e WhatsApp pra falar sobre a minha página. Os dados ficam criptografados, não são vendidos e eu posso pedir a exclusão a qualquer momento pelo WhatsApp.</span>
      </label>
    </form>
  );
}
