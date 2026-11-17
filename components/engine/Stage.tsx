"use client";

// Motor v13 ("campos" e "cinema"): um objeto do negócio, recortado no navegador, atravessa a página inteira com a rolagem;
// os títulos ficam ATRÁS dele; nenhuma caixa: cada seção é composição (campo de cor, tipografia, fotos sobrepostas).
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type CSSProperties } from "react";
import { FONTS, PALETTES, type Img, type Spec } from "@/lib/engine/spec";
import { useCutout } from "./cutout";
import { ENGINE_FONTS } from "./fonts";
import { Faq, FitTitle, Ticker, useLenis } from "./kit";
import { ImageText, LightRays, TextReveal } from "./magic";
import s from "./Page.module.css";
import { Booking, Estimator, Pic, priceOf, Quotes } from "./parts";

gsap.registerPlugin(ScrollTrigger, useGSAP);
/* eslint-disable @next/next/no-img-element -- recorte gerado no navegador (blob) e fotos externas */

// onde o objeto fica em cada seção: x e y (vw/vh a partir do centro da tela), escala, giro
const WAY = {
  hero: "19,3,.84,-8", // (as demais ficam na margem livre da seção, longe do texto)
  statement: "-36,8,.6,16",
  services: "32,4,.78,-12",
  name: "35,-24,.5,22",
  gallery: "-35,22,.52,-20",
  feature: "37,30,.46,10",
  quotes: "37,4,.56,-14",
  faq: "-35,26,.48,8",
  final: "27,6,.8,4",
};

export default function Stage({ spec }: { spec: Spec }) {
  const pal = PALETTES[spec.palette], f = FONTS[spec.fonts];
  const cinema = spec.direction === "cinema";
  const seq = pal.seq ?? [pal.ground, pal.ground, pal.ground];
  const hero = spec.images.hero;
  const pics = spec.images.pics;
  const allPics = [hero, ...pics].filter((x): x is Img => !!x);
  const { cut, done } = useCutout(spec.images.object);
  const recurring = spec.services.items.some((x) => /m[eê]s|mensa|anua|\/ano|por ano/i.test(x.price));
  const priced = !recurring && spec.services.items.filter((x) => !Number.isNaN(priceOf(x.price))).length >= 2;
  const feature = spec.signature === "estimator" ? (priced ? "estimator" : null) : spec.signature === "booking" ? "booking" : null;
  const credits = [...allPics, ...(cut ? [cut.img] : [])].filter((p) => p.credit);
  const nameSrc = pics[1]?.src || hero?.src;
  const bg = (i: number) => (cinema ? pal.ground : seq[i % seq.length]);

  const vars = {
    "--bg": pal.ground, "--sf": pal.surface, "--ink": pal.ink, "--mut": pal.muted, "--ac": pal.accent, "--on": pal.onAccent, "--glow": pal.glow ?? pal.accent,
    "--fd": `var(${f.display})`, "--ft": `var(${f.text})`, "--dw": f.weight, "--tr": `${f.track}em`, "--up": f.upper ? "uppercase" : "none", "--k": f.k,
    "--wd": spec.fonts === "archivox" ? "125%" : "100%", "--duo": pal.accent, backgroundColor: bg(0),
  } as CSSProperties;

  const root = useRef<HTMLDivElement>(null);
  const obj = useRef<HTMLDivElement>(null);
  useLenis();
  useStageMotion(root, obj, cinema ? [] : seq, !!cut, done);

  return (
    <div ref={root} data-engine className={`${ENGINE_FONTS} ${s.page} ${s.stage}`} style={vars} data-dir={spec.direction} data-dark={pal.dark || undefined}>
      <p className={s.ribbon}>Prévia feita pela Vértice Studio · textos, preços e fotos de exemplo</p>

      {/* o objeto: uma camada fixa que a rolagem leva de seção em seção */}
      <div ref={obj} className={s.obj} aria-hidden data-ready={done || undefined}>
        <div className={s.objFloat} data-float>
          {cinema && <div className={s.objGlow} />}
          <div className={s.objBob}>
            {cut && <img src={cut.url} alt="" className={s.objImg} style={{ aspectRatio: `${cut.w} / ${cut.h}` }} />}
          </div>
        </div>
      </div>

      <nav className={s.stNav}>
        <a className={s.logo} href="#topo">{spec.brand}</a>
        <span className={s.links}>
          <a href="#servicos">{spec.nav.links[0]}</a>
          <a href="#sobre">{spec.nav.links[1]}</a>
          <a href="#contato">{spec.nav.links[2]}</a>
        </span>
        <a className={s.stBtn} href="#contato" data-mag>{spec.nav.cta}</a>
      </nav>

      <main id="topo">
        <header className={s.stHero} data-obj={WAY.hero} data-bg={0}>
          {cinema && <LightRays color={`color-mix(in srgb, ${pal.glow} 30%, transparent)`} />}
          {/* sem recorte bom: a foto do negócio entra parada, em arco, atrás do título */}
          {done && !cut && hero && <figure className={s.stArch} data-in><img src={hero.src} alt={hero.alt} referrerPolicy="no-referrer" /></figure>}
          <p className={s.stKicker} data-in>{spec.what}</p>
          <FitTitle text={spec.hero.title} className={s.stTitle} lines={2} max={cinema ? 300 : 380} maxVh={0.44} accent={!cinema} />
          <div className={s.stHeroFoot}>
            {spec.hero.sub && <p data-in className={`${s.stSub} ${s.front}`}>{spec.hero.sub}</p>}
            <div data-in className={`${s.stActions} ${s.front}`}>
              <a className={s.stBtnBig} href="#contato" data-mag>{spec.hero.cta}</a>
              {spec.hero.note && <span className={s.stNote}>{spec.hero.note}</span>}
            </div>
          </div>
        </header>

        <div className={s.stBand} aria-hidden>
          <div data-band className={s.stBandTrack}>
            {[0, 1].map((k) => (
              <span key={k}>{spec.services.items.map((x, i) => <em key={i} className={i % 2 ? s.outline : ""}>{x.name}</em>)}</span>
            ))}
          </div>
        </div>

        <section id="sobre" className={s.stStatement} data-obj={WAY.statement} data-bg={1}>
          <TextReveal text={spec.intro.statement || spec.hero.sub} />
          {spec.intro.facts.length > 0 && (
            <dl className={s.stFacts} data-rise>
              {spec.intro.facts.map((x) => <div key={x.k}><dt>{x.k}</dt><dd><Ticker text={x.v} /></dd></div>)}
            </dl>
          )}
        </section>

        <section id="servicos" className={s.stServices} data-obj={WAY.services} data-bg={2}>
          <div className={s.stHead} data-rise>
            <h2 className={s.stH2}>{spec.services.title}</h2>
            {spec.services.sub && <p className={s.stLead}>{spec.services.sub}</p>}
          </div>
          <ol className={s.stList}>
            {spec.services.items.map((it, i) => (
              <li key={it.name} data-row>
                <span className={s.stNum}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className={s.stName}>{it.name}</h3>
                <p className={s.stDesc}>{it.desc}</p>
                {it.price && <b className={s.stPrice}><Ticker text={it.price} /></b>}
              </li>
            ))}
          </ol>
        </section>

        {nameSrc && (
          <section className={s.stName2} data-obj={WAY.name} data-bg={0}>
            <ImageText text={spec.brand} src={nameSrc} size={`min(21vw, ${(86 / (Math.max(spec.brand.length, 4) * f.k * (spec.fonts === "archivox" ? 1.25 : 1))).toFixed(2)}vw)`} />
            <p className={s.stCaption}>{spec.what}</p>
          </section>
        )}

        {pics.length >= 3 && (
          <section className={s.stGallery} data-obj={WAY.gallery} data-bg={1}>
            <h2 className={`${s.stH2} ${s.front}`}>{spec.gallery.title}</h2>
            <div className={s.collage}>
              {pics.slice(0, 5).map((p, i) => (
                <figure key={p.src} className={`${s.cl} ${s[`cl${i}`] ?? ""}`} data-speed={[0.12, -0.18, 0.22, -0.1, 0.16][i]}>
                  <Pic img={p} />
                  {spec.gallery.captions[i] && <figcaption>{spec.gallery.captions[i]}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {feature && (
          <section className={s.stFeature} data-obj={WAY.feature} data-bg={2}>
            {feature === "estimator" ? <Estimator spec={spec} /> : <Booking spec={spec} />}
          </section>
        )}

        {spec.quotes.length > 0 && (
          <section className={s.stQuotes} data-obj={WAY.quotes} data-bg={0}>
            <h2 className={s.stEyebrow}>Quem já passou por aqui</h2>
            <Quotes quotes={spec.quotes} />
          </section>
        )}

        {spec.faq.length > 0 && (
          <section className={s.stFaq} data-obj={WAY.faq} data-bg={1}>
            <h2 className={s.stH2}>Perguntas</h2>
            <Faq faq={spec.faq} />
          </section>
        )}

        <section id="contato" className={s.stFinal} data-obj={WAY.final} data-bg={2}>
          <FitTitle as="h2" text={spec.final.title} className={s.stTitle} lines={2} max={cinema ? 260 : 320} maxVh={0.4} />
          <div className={`${s.stFinalRow} ${s.front}`} data-rise>
            <div>
              {spec.final.text && <p className={s.stSub}>{spec.final.text}</p>}
              <a className={s.stBtnBig} href="#contato" data-mag>{spec.final.cta}</a>
            </div>
            <dl className={s.stContact}>
              {spec.contact.address && <div><dt>Endereço</dt><dd>{spec.contact.address}</dd></div>}
              {spec.contact.hours && <div><dt>Horário</dt><dd>{spec.contact.hours}</dd></div>}
              <div><dt>Contato</dt><dd>WhatsApp (19) 9 0000-0000</dd></div>
            </dl>
          </div>
        </section>
      </main>

      <footer className={s.stFoot}>
        <p className={s.stGiant} aria-hidden style={{ fontSize: `min(19vw, ${(90 / (Math.max(spec.brand.length, 4) * f.k * (spec.fonts === "archivox" ? 1.25 : 1))).toFixed(2)}vw)` }}>{spec.brand}</p>
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

function useStageMotion(root: React.RefObject<HTMLDivElement | null>, obj: React.RefObject<HTMLDivElement | null>, seq: string[], hasObj: boolean, ready: boolean) {
  useGSAP(() => {
    const el = root.current, o = obj.current;
    if (!el || !o || !ready) return;
    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();
    mm.add({ ok: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 900px)" }, (ctx) => {
      const { ok, wide } = ctx.conditions as { ok: boolean; wide: boolean };
      const secs = q("[data-obj]") as HTMLElement[];
      const pt = (raw: string) => {
        const [x, y, sc, r] = raw.split(",").map(Number);
        // no celular o objeto fica mais perto do centro e menor (a tela é estreita)
        return { x: () => (wide ? x : x * 0.42) * innerWidth / 100, y: () => (wide ? y : y * 0.6) * innerHeight / 100, scale: wide ? sc : sc * 0.72, rotation: r };
      };
      if (!hasObj) return;
      if (!ok) { gsap.set(o, { ...pt(secs[0].dataset.obj!), autoAlpha: 1 }); return; }

      // entrada: o objeto cai girando no lugar
      gsap.fromTo(o, { autoAlpha: 0, scale: 0.4, rotation: -40, y: () => -innerHeight * 0.3 }, { ...pt(secs[0].dataset.obj!), autoAlpha: 1, duration: 1.6, ease: "expo.out", delay: 0.25 });
      // viagem: de uma seção pra próxima, enquanto a seção entra na tela
      secs.forEach((sec, i) => {
        if (!i) return;
        gsap.fromTo(o, pt(secs[i - 1].dataset.obj!), {
          ...pt(sec.dataset.obj!), ease: "power1.inOut", immediateRender: false,
          scrollTrigger: { trigger: sec, start: "top 95%", end: "top 25%", scrub: 1.1, invalidateOnRefresh: true },
        });
      });
      // giro extra com a velocidade da rolagem (o objeto "reage")
      const spin = gsap.quickTo(q("[data-float]")[0], "rotation", { duration: 0.6, ease: "power3" });
      ScrollTrigger.create({ start: 0, end: "max", onUpdate: (st) => spin(gsap.utils.clamp(-25, 25, st.getVelocity() / -90)) });

      // campos de cor: a página inteira troca de cor quando a seção chega
      if (seq.length) {
        q("[data-bg]").forEach((sec: HTMLElement) => {
          const c = seq[Number(sec.dataset.bg) % seq.length];
          ScrollTrigger.create({
            trigger: sec, start: "top 55%", end: "bottom 55%",
            onToggle: (st) => st.isActive && gsap.to(el, { backgroundColor: c, duration: 0.7, ease: "power2.out", overwrite: "auto" }),
          });
        });
      }

      gsap.from(q("[data-h1] [data-w]"), { yPercent: 110, duration: 1.3, stagger: 0.06, ease: "expo.out", delay: 0.05 });
      gsap.from(q("[data-in]"), { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", delay: 0.5 });
      q("[data-rise]").forEach((sec: Element) => gsap.from(sec.children, { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: sec, start: "top 82%", once: true } }));
      q("[data-row]").forEach((row: Element) => gsap.from(row, { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: row, start: "top 90%", once: true } }));
      gsap.from(q("[data-end] [data-w]"), { yPercent: 110, duration: 1.1, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: q("[data-end]")[0], start: "top 80%", once: true } });
      q("[data-speed]").forEach((fig: HTMLElement) => gsap.to(fig, { yPercent: Number(fig.dataset.speed) * -100, ease: "none", scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true } }));
      q("[data-pic]").forEach((p: Element) => {
        const img = p.querySelector("img");
        const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: "top 88%", once: true } });
        tl.from(p, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut" });
        if (img) tl.from(img, { scale: 1.2, duration: 1.6, ease: "expo.out" }, 0);
      });

      // faixa: anda sozinha e acelera com a rolagem
      const band = q("[data-band]")[0];
      if (band) {
        const loop = gsap.to(band, { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
        ScrollTrigger.create({ trigger: band, start: "top bottom", end: "bottom top", onUpdate: (st) => gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(st.getVelocity()) / 240, 6), duration: 0.2, overwrite: true }) });
      }

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
  }, { dependencies: [ready, hasObj, seq.join()], scope: root });
}
