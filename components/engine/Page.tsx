"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { FONTS, PALETTES, type Img, type Spec } from "@/lib/engine/spec";
import { ENGINE_FONTS } from "./fonts";
import s from "./Page.module.css";
import { Bento, Faq, FitTitle, Phone, PhotoMarquee, Ticker, useLenis } from "./kit";
import { Booking, Estimator, HoverRows, Particles, Pic, priceOf, Quotes } from "./parts";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

type Hero = "split" | "poster" | "cover" | "zoom" | "particles" | "product";

/**
 * O motor: recebe a direção de arte + os textos (Spec) e monta a landing page inteira.
 * A composição muda com a direção (hero, serviços) e com a assinatura (zoom, partículas, orçamento, agenda, lista com foto).
 */
export default function EnginePage({ spec }: { spec: Spec }) {
  const pal = PALETTES[spec.palette], f = FONTS[spec.fonts];
  const hero = spec.images.hero;
  const pics = spec.images.pics;
  const allPics = [hero, ...pics].filter((x): x is Img => !!x);
  // só dá pra somar o que é cobrado do mesmo jeito (nada de somar plano mensal com anual)
  const recurring = spec.services.items.some((x) => /m[eê]s|mensa|anua|\/ano|por ano/i.test(x.price));
  const priced = !recurring && spec.services.items.filter((x) => !Number.isNaN(priceOf(x.price))).length >= 2;

  // regra: a primeira tela SEMPRE mostra o negócio (foto grande ou o app no celular); partículas só quando não há foto
  const heroKind: Hero =
    spec.direction === "product" ? "product"
    : !hero ? "particles"
    : spec.signature === "zoom" ? "zoom"
    : spec.direction === "poster" ? "poster"
    : spec.direction === "nocturne" ? "cover"
    : "split";
  const footParticles = spec.signature === "particles" && heroKind !== "particles";
  const rows = spec.signature === "hoverlist" || ["editorial", "poster", "nocturne"].includes(spec.direction);
  const feature = spec.signature === "estimator" ? (priced ? "estimator" : null) : spec.signature === "booking" ? "booking" : null;
  const rest = hero ? pics : allPics;
  const bento = !rows && rest.length >= 2 && spec.services.items.length >= 3 && ["soft", "clinic", "product"].includes(spec.direction);
  const marquee = rest.length >= 5 && ["soft", "editorial", "clinic"].includes(spec.direction);
  const gallery = rest.length >= 3 && !marquee ? rest : [];
  const credits = allPics.filter((p) => p.credit);

  const vars = {
    "--bg": pal.ground, "--sf": pal.surface, "--ink": pal.ink, "--mut": pal.muted, "--ac": pal.accent, "--on": pal.onAccent,
    "--duo": lum(pal.accent) > 0.08 && lum(pal.accent) < 0.85 ? pal.accent : pal.surface,
    "--fd": `var(${f.display})`, "--ft": `var(${f.text})`, "--dw": f.weight, "--tr": `${f.track}em`, "--up": f.upper ? "uppercase" : "none", "--k": f.k,
  } as CSSProperties;

  const root = useRef<HTMLDivElement>(null);
  useLenis();
  useMotion(root, heroKind);
  const title = (props: { max?: number; maxVh?: number; accent?: boolean; lines?: number } = {}) => <FitTitle text={spec.hero.title} className={s.h1} {...props} />;

  return (
    <div ref={root} data-engine className={`${ENGINE_FONTS} ${s.page}`} style={vars} data-dir={spec.direction} data-dark={pal.dark || undefined}>
      <p className={s.ribbon}>Prévia feita pela Vértice Studio · textos, preços e fotos de exemplo</p>

      <nav className={s.nav}>
        <a className={s.logo} href="#topo">{spec.brand}</a>
        <span className={s.links}>
          <a href="#servicos">{spec.nav.links[0]}</a>
          <a href="#sobre">{spec.nav.links[1]}</a>
          <a href="#contato">{spec.nav.links[2]}</a>
        </span>
        <a className={s.navBtn} href="#contato" data-mag>{spec.nav.cta}</a>
      </nav>

      <main id="topo">
        {heroKind === "split" && hero && (
          <header className={s.heroSplit}>
            <div className={s.heroText}>
              {title({ maxVh: 0.34, lines: 3, max: 170 })}
              <div><HeroCopy spec={spec} /></div>
            </div>
            <div className={s.heroMedia}>
              <Pic img={hero} eager />
              <p className={s.caption}>{spec.what}</p>
            </div>
          </header>
        )}

        {heroKind === "poster" && hero && (
          <header className={s.heroPoster}>
            {title({ maxVh: 0.19, max: 230, accent: true })}
            <div className={s.posterRow}>
              <div className={s.posterCopy}><HeroCopy spec={spec} /></div>
              <Pic img={hero} eager className={s.posterPic} />
            </div>
          </header>
        )}

        {heroKind === "product" && (
          <header className={s.heroProduct}>
            <div className={s.heroText}>
              {title({ maxVh: 0.22, max: 150 })}
              <HeroCopy spec={spec} />
            </div>
            <div className={s.productStage}>
              {hero && <Pic img={hero} eager className={s.productPic} />}
              <Phone spec={spec} />
            </div>
          </header>
        )}

        {heroKind === "cover" && hero && (
          <header className={s.heroCover}>
            <div data-par className={s.coverPic}><Pic img={hero} eager /></div>
            <div className={s.coverText}>
              {title({ maxVh: 0.22 })}
              <HeroCopy spec={spec} />
            </div>
          </header>
        )}

        {heroKind === "particles" && (
          <header className={s.heroParticles}>
            <Particles text={spec.brand} />
            <div className={s.particlesText}>
              {title({ max: 120, maxVh: 0.2 })}
              <HeroCopy spec={spec} />
            </div>
          </header>
        )}

        {heroKind === "zoom" && hero && (
          <header data-zoom className={s.heroZoom}>
            <div className={s.zoomStage}>
              <div data-zoom-text className={s.zoomText}>
                {title({ max: 130, maxVh: 0.22 })}
                <HeroCopy spec={spec} />
              </div>
              <div data-zoom-pic className={s.zoomPic}><Pic img={hero} eager /></div>
              <p data-zoom-cap className={s.zoomCap}>{spec.what}</p>
            </div>
          </header>
        )}

        <section id="sobre" className={s.intro} data-rise>
          <h2 className={s.kicker}>{spec.what}</h2>
          <p className={s.statement}>{spec.intro.statement}</p>
          {spec.intro.facts.length > 0 && (
            <dl className={s.facts}>
              {spec.intro.facts.map((x) => <div key={x.k}><dt>{x.k}</dt><dd><Ticker text={x.v} /></dd></div>)}
            </dl>
          )}
        </section>

        {marquee ? (
          <PhotoMarquee pics={rest} captions={spec.gallery.captions} />
        ) : (
          <div className={s.band} aria-hidden>
            <div data-band className={s.bandTrack}>
              {[0, 1].map((k) => <span key={k}>{spec.services.items.map((x) => x.name).join("  ·  ")}  ·  </span>)}
            </div>
          </div>
        )}

        <section id="servicos" className={rows || bento ? s.services : s.servicesSplit}>
          {bento || rows ? (
            <>
              <div className={s.sectionHead} data-rise>
                <h2 className={s.h2}>{spec.services.title}</h2>
                {spec.services.sub && <p className={s.lead}>{spec.services.sub}</p>}
              </div>
              {bento ? <Bento spec={spec} pics={rest} /> : <HoverRows items={spec.services.items} pics={allPics} />}
            </>
          ) : (
            <>
              <div className={s.splitAside}>
                <h2 className={s.h2}>{spec.services.title}</h2>
                {spec.services.sub && <p className={s.lead}>{spec.services.sub}</p>}
                {rest[0] && <Pic img={rest[0]} className={s.asidePic} />}
              </div>
              <ul className={s.list} data-rise>
                {spec.services.items.map((it) => (
                  <li key={it.name}>
                    <div className={s.listTop}><h3>{it.name}</h3>{it.price && <span className={s.price}><Ticker text={it.price} /></span>}</div>
                    <p>{it.desc}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {feature && (
          <section className={s.featureWrap} data-rise>
            {feature === "estimator" ? <Estimator spec={spec} /> : <Booking spec={spec} />}
          </section>
        )}

        {gallery.length >= 3 && (
          <section data-gallery className={s.gallery}>
            <div className={s.galleryInner}>
              <h2 className={s.h2}>{spec.gallery.title}</h2>
              <div data-gtrack className={s.gtrack}>
                {gallery.map((p, i) => (
                  <figure key={p.src} className={s.gitem}>
                    <Pic img={p} />
                    {spec.gallery.captions[i] && <figcaption>{spec.gallery.captions[i]}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {spec.quotes.length > 0 && (
          <section className={s.quoteWrap} data-rise>
            <h2 className={s.h2}>Quem já passou por aqui</h2>
            <Quotes quotes={spec.quotes} />
          </section>
        )}

        {spec.faq.length > 0 && (
          <section className={s.faq}>
            <h2 className={s.h2}>Perguntas frequentes</h2>
            <Faq faq={spec.faq} />
          </section>
        )}

        <section id="contato" className={s.final}>
          <FitTitle as="h2" text={spec.final.title} className={s.endTitle} max={210} maxVh={0.3} />
          <div className={s.finalRow} data-rise>
            <div>
              {spec.final.text && <p className={s.finalText}>{spec.final.text}</p>}
              <a className={s.btnInv} href="#contato" data-mag>{spec.final.cta}</a>
            </div>
            <dl className={s.contact}>
              {spec.contact.address && <div><dt>Endereço</dt><dd>{spec.contact.address}</dd></div>}
              {spec.contact.hours && <div><dt>Horário</dt><dd>{spec.contact.hours}</dd></div>}
              <div><dt>Contato</dt><dd>WhatsApp (19) 9 0000-0000</dd></div>
            </dl>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        {footParticles ? <div className={s.footParticles}><Particles text={spec.brand} /></div> : <FitLine className={s.giant} text={spec.brand} />}
        <div className={s.footRow}>
          <span>© {spec.brand}</span>
          <a href="https://vertice-studio-rose.vercel.app/" target="_top">Prévia feita pela Vértice Studio</a>
        </div>
        {credits.length > 0 && (
          <p className={s.credits}>
            Fotos: {credits.map((p, i) => (
              <span key={p.src}>{i > 0 && ", "}{p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer">{p.credit}</a> : p.credit}</span>
            ))}
          </p>
        )}
      </footer>
    </div>
  );
}

/** Uma linha que ocupa exatamente a largura disponível (medida depois que a fonte carrega). */
function FitLine({ text, className }: { text: string; className: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const fit = () => {
      el.style.fontSize = "100px";
      const w = el.parentElement!.clientWidth;
      el.style.fontSize = `${Math.min(100 * (w / el.scrollWidth), 0.42 * w)}px`;
    };
    document.fonts.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    return () => ro.disconnect();
  }, [text]);
  return <p ref={ref} className={className} style={{ "--L": text.length + 1 } as CSSProperties} aria-hidden>{text}</p>;
}

function HeroCopy({ spec }: { spec: Spec }) {
  return (
    <>
      {spec.hero.sub && <p data-in className={s.sub}>{spec.hero.sub}</p>}
      <div data-in className={s.actions}>
        <a className={s.btn} href="#contato" data-mag>{spec.hero.cta}</a>
        {spec.hero.note && <span className={s.note}>{spec.hero.note}</span>}
      </div>
    </>
  );
}


function useMotion(root: RefObject<HTMLDivElement | null>, hero: Hero) {
  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();
    mm.add({ ok: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 900px)" }, (ctx) => {
      const { ok, wide } = ctx.conditions as { ok: boolean; wide: boolean };
      if (!ok) return;
      const E = "expo.out";

      // abertura: o título sobe palavra por palavra, depois o resto
      gsap.from(q("[data-h1] [data-w]"), { yPercent: 108, duration: 1.25, stagger: 0.055, ease: E, delay: 0.1 });
      gsap.from(q("[data-in]"), { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", delay: 0.45 });

      // cada seção: as partes entram em sequência quando aparecem
      q("[data-rise]").forEach((sec: Element) => {
        gsap.from(sec.children, { y: 28, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: sec, start: "top 82%", once: true } });
      });
      // fotos: abrem de baixo pra cima e assentam
      q("[data-pic]").forEach((p: Element) => {
        const img = p.querySelector("img");
        const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: "top 88%", once: true } });
        tl.from(p, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut" });
        if (img) tl.from(img, { scale: 1.18, duration: 1.6, ease: E }, 0);
      });
      q("[data-par]").forEach((p: Element) => gsap.to(p, { yPercent: 14, ease: "none", scrollTrigger: { trigger: p, start: "top top", end: "bottom top", scrub: true } }));
      gsap.from(q("[data-end] [data-w]"), { yPercent: 108, duration: 1.1, stagger: 0.05, ease: E, scrollTrigger: { trigger: q("[data-end]")[0], start: "top 80%", once: true } });

      // faixa de serviços: anda sozinha e acelera/inclina com a velocidade do scroll
      const band = q("[data-band]")[0];
      if (band) {
        const loop = gsap.to(band, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
        const skew = gsap.quickTo(band, "skewX", { duration: 0.4, ease: "power3" });
        ScrollTrigger.create({
          trigger: band, start: "top bottom", end: "bottom top",
          onUpdate: (st) => {
            const v = st.getVelocity();
            gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(v) / 260, 6), duration: 0.2, overwrite: true });
            skew(gsap.utils.clamp(-12, 12, v / -180));
          },
        });
      }

      // zoom: a foto sai do quadro e toma a tela
      if (hero === "zoom") {
        const tl = gsap.timeline({ scrollTrigger: { trigger: q("[data-zoom]")[0], start: "top top", end: "bottom bottom", scrub: 0.7 } });
        tl.to(q("[data-zoom-text]"), { y: -80, autoAlpha: 0, duration: 0.3, ease: "none" }, 0)
          .to(q("[data-zoom-pic]"), { top: 0, right: 0, width: "100%", height: "100%", duration: 0.7, ease: "power2.inOut" }, 0.05)
          .fromTo(q("[data-zoom-cap]"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.7);
      }

      // galeria: anda de lado enquanto a seção fica parada (só em tela larga; no celular é arrastar)
      const track = q("[data-gtrack]")[0] as HTMLElement | undefined;
      if (track && wide) {
        gsap.to(track, {
          x: () => -(track.scrollWidth - track.clientWidth),
          ease: "none",
          scrollTrigger: { trigger: q("[data-gallery]")[0], start: "top top", end: () => `+=${track.scrollWidth - track.clientWidth}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
      }

      // botões magnéticos
      q("[data-mag]").forEach((b: HTMLElement) => {
        const qx = gsap.quickTo(b, "x", { duration: 0.35, ease: "power3" }), qy = gsap.quickTo(b, "y", { duration: 0.35, ease: "power3" });
        const mv = (e: PointerEvent) => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.25); qy((e.clientY - r.top - r.height / 2) * 0.35); };
        const lv = () => { qx(0); qy(0); };
        b.addEventListener("pointermove", mv);
        b.addEventListener("pointerleave", lv);
        return () => { b.removeEventListener("pointermove", mv); b.removeEventListener("pointerleave", lv); };
      });
    });
    return () => mm.revert();
  }, { dependencies: [hero], scope: root });
}
