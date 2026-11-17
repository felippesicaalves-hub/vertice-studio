import Link from "next/link";
import type { Metadata } from "next";
import { Sparkle, WaIcon } from "@/components/icons";
import Motion from "@/components/Motion";
import Nav from "@/components/Nav";
import { Footer, WaFloat } from "@/components/Sections";
import { SITE_FONTS } from "@/components/sites/fonts";
import { BRAND, waLink } from "@/lib/config";

// cases-troféu: sites próprios, fora da Vértice (abrem em outra aba)
const TROPHIES = [
  {
    id: "chapa",
    url: "https://chapa-smash.vercel.app",
    img: "/cases/chapa-smash.jpg",
    alt: "Site da Chapa: smash burger flutuando sobre a chapa com fumaça, título A chapa decide",
    eyebrow: "Smash burger · Cambuí, Campinas",
    name: "Chapa",
    accent: "Smash",
    text: "Hamburgueria contada como um filme: o burger sai da chapa, o cheddar escorre, as camadas se abrem no ar e ele pousa num pedestal. O filme roda sozinho e a rolagem assume quando o visitante quiser.",
    moves: [
      "Filme feito com IA e tocado pela rolagem, quadro a quadro",
      "Cada camada do lanche apontada na cena em que ele se abre",
      "Pedido direto pelo WhatsApp, sem app de delivery",
    ],
    note: "Marca fictícia · imagens geradas com IA",
  },
  {
    id: "glace",
    url: "https://glace-confeitaria.vercel.app",
    img: "/cases/glace-confeitaria.jpg",
    alt: "Site da Glacê Confeitaria: bolo de mirtilo visto de cima na frente da palavra Glacê em vermelho, sobre fundo creme",
    eyebrow: "Confeitaria artesanal · Cambuí, Campinas",
    name: "Glacê",
    accent: "Confeitaria",
    text: "Confeitaria em que o doce é a página: o bolo fura a palavra gigante no topo e, na rolagem, gira e vira o próximo sabor, com a cor do site inteiro mudando junto.",
    moves: [
      "Cinco sabores num carrossel giratório guiado pela rolagem, cada um com a sua cor",
      "Cardápio com tamanhos e preços sem precisar perguntar",
      "Encomenda direto pelo WhatsApp",
    ],
    note: "Confeitaria fictícia · fotos de banco livre",
  },
  {
    id: "lume",
    url: "https://lume-odontologia-ecru.vercel.app",
    img: "/cases/lume-odontologia.jpg",
    alt: "Site da Lume Odontologia: escova recebendo pasta, desfocada, atrás do título Seu sorriso, sem pressa e sem dor",
    eyebrow: "Clínica odontológica · Cambuí, Campinas",
    name: "Lume",
    accent: "Odontologia",
    text: "Clínica que acalma antes de vender: um vídeo claro e desfocado no topo, números da clínica logo abaixo e os tratamentos em blocos com fotos reais, do raio-x ao sorriso pronto.",
    moves: [
      "Implantes, alinhadores, estética e prevenção numa grade só, com foto real em cada bloco",
      "Como chegar e avaliação com raio-x digital já na primeira tela",
      "Agendamento direto pelo WhatsApp",
    ],
    note: "Clínica fictícia · vídeos e fotos de banco livre",
  },
  {
    id: "cocodly",
    url: "https://cocodly-dentista.vercel.app",
    img: "/cases/cocodly.jpg",
    alt: "Site da Cocodly: moldeira de clareamento e seringa de gel na frente da palavra Clarear em serifa gigante, fundo creme",
    eyebrow: "Clínica odontológica",
    name: "Cocodly",
    accent: "Dentista sem susto",
    text: "Dentista com cara de revista: cada tratamento vira uma capa, com o objeto real do tratamento no centro e o nome dele em serifa gigante atrás. A rolagem troca a capa inteira: cor, palavra e objeto.",
    moves: [
      "Rolagem que passa por clareamento, alinhadores e check-up, com o preço de cada um",
      "Primeira consulta explicada em três passos, do sofá ao sorriso",
      "Agendamento direto pelo WhatsApp",
    ],
    note: "Clínica fictícia",
  },
  {
    id: "orbita",
    url: "https://orbita-celulares-one.vercel.app",
    img: "/cases/orbita-celulares.jpg",
    alt: "Site da Órbita Celulares: parede escura com dez celulares em 3D sob fachos de luz",
    eyebrow: "Loja de celulares · Campinas",
    name: "Órbita",
    accent: "Celulares",
    text: "Loja de celulares com cara de museu: o site inteiro é uma parede escura com dez aparelhos em 3D, cada um sob um facho de luz. Toque num celular e ele vem pra frente, com um anel de luz em volta.",
    moves: [
      "Celulares em 3D na escala real, com troca de cor e de memória",
      "Simulador de troca do usado, com o valor e a parcela na hora",
      "Compra e avaliação direto pelo WhatsApp",
    ],
    note: "Loja fictícia · site feito à mão",
  },
  {
    id: "residencial-margem",
    url: "https://residencial-margem.vercel.app",
    img: "/cases/residencial-margem.jpg",
    alt: "Site do Residencial Margem: maquete 3D de um prédio de 24 andares à noite, com as janelas acesas",
    eyebrow: "Lançamento imobiliário · Taquaral, Campinas",
    name: "Residencial",
    accent: "Margem",
    text: "Lançamento de alto padrão mostrado com honestidade: a rolagem sobe o prédio andar por andar numa maquete 3D, até a cobertura com vista para a lagoa.",
    moves: [
      "Plantas interativas com metragem e sol de cada cômodo",
      "Quanto custa de verdade: preço, impostos, condomínio e simulador de parcela",
      "Visita ao decorado agendada pelo WhatsApp, com planta, dia e horário",
    ],
    note: "Empreendimento fictício · site feito à mão",
  },
];

export const metadata: Metadata = {
  title: `Cases | ${BRAND}`,
  description: "Landing pages desenhadas à mão pela Vértice Studio: hamburgueria, confeitaria, odontologia, celulares e imóveis. Abra e teste cada uma.",
};

export default function Cases() {
  return (
    <>
      <Motion />
      <Nav />
      <main className={SITE_FONTS}>
        {/* abertura */}
        <section className="cinema relative overflow-hidden pb-24 pt-40 text-sand md:pb-32 md:pt-52">
          <div className="container-x relative">
            <p data-reveal className="eyebrow mb-6 inline-flex items-center gap-3 text-gold">
              <Sparkle className="w-3" /> Cases
            </p>
            <h1 data-split className="title max-w-[14ch] text-[52px] md:text-[104px]">
              Seis negócios, <span className="serif text-gold">seis páginas diferentes.</span>
            </h1>
            <div data-reveal className="mt-10 grid gap-8 border-t border-sand/15 pt-8 md:grid-cols-[1.3fr_1fr]">
              <p className="max-w-[52ch] text-[17px] leading-relaxed text-sand/75 md:text-lg">
                Cada página começa pelo problema do dono, não por um modelo pronto. Fonte, cor e texto mudam de um nicho pro outro,
                e cada uma tem uma brincadeira que o visitante pode testar.
              </p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2 self-end text-sm text-sand/60">
                {TROPHIES.map((t, i) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="flex gap-3 transition-colors hover:text-gold">
                      <span className="font-mono text-gold/80">{String(i + 1).padStart(2, "0")}</span> {t.name} {t.accent}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* cases-troféu: sites próprios, fora da Vértice (abrem em outra aba) */}
        {TROPHIES.map((t, i) => (
          <section key={t.id} id={t.id} className="scroll-mt-24 border-t border-sand/10 bg-[#09090b] py-24 text-sand md:py-32">
            <div className={`container-x grid items-center gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-20 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <a data-reveal href={t.url} target="_blank" rel="noopener" className="group block overflow-hidden rounded-2xl ring-1 ring-sand/15 transition-transform duration-500 hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt={t.alt} width={1440} height={900} loading="lazy" className="block h-auto w-full transition-transform duration-700 group-hover:scale-[1.02]" />
              </a>

              <div>
                <p data-reveal className="eyebrow flex items-center gap-3 text-gold">
                  <Sparkle className="w-3" /> Case em destaque · {t.eyebrow}
                </p>
                <h2 data-split className="title mt-4 text-[44px] md:text-[64px]">
                  {t.name} <span className="serif text-gold">{t.accent}</span>
                </h2>
                <p data-reveal className="mt-6 max-w-[48ch] text-[16px] leading-relaxed text-sand/75">{t.text}</p>
                <ul data-stagger className="mt-8 divide-y divide-sand/10 border-y border-sand/10">
                  {t.moves.map((m) => (
                    <li key={m} className="flex gap-3 py-3.5 text-[15px] text-sand/80">
                      <Sparkle className="mt-1.5 w-2.5 shrink-0 text-gold" /> {m}
                    </li>
                  ))}
                </ul>
                <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href={t.url} target="_blank" rel="noopener" className="btn btn-gold" data-magnetic>
                    Abrir o site <span className="arrow">↗</span>
                  </a>
                  <span className="px-2 text-sm text-sand/50">{t.note}</span>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* sobre os cases */}
        <div className="bg-sand">
          {/* transparência */}
          <section className="container-x py-20">
            <div className="mx-auto max-w-[760px] rounded-[26px] border border-dashed border-wine/25 p-8 text-center text-wine md:p-10">
              <p className="eyebrow text-wine/50">Sobre estes cases</p>
              <p className="mt-3 text-[16px] leading-relaxed text-wine/75">
                São projetos-conceito: os negócios e as cidades são fictícios, as páginas são reais e funcionam.
                Fizemos cada uma pra mostrar como a gente pensa um nicho do zero. Os cases de clientes, com números de verdade,
                entram aqui assim que forem autorizados.
              </p>
            </div>
          </section>
        </div>

        {/* chamada */}
        <section className="cinema relative overflow-hidden py-28 md:py-40">
          <div className="container-x relative text-center">
            <p data-reveal className="eyebrow mb-6 text-gold">O próximo case</p>
            <h2 data-split className="title mx-auto max-w-[14ch] text-[48px] text-sand md:text-[96px]">
              Pode ser <span className="serif text-gold">o seu negócio.</span>
            </h2>
            <p data-reveal className="mx-auto mt-6 max-w-[44ch] text-lg text-sand/70">
              Escreva o nome do seu negócio e veja em segundos uma prévia no estilo dele. Grátis.
            </p>
            <div data-reveal className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/#gerador" className="btn btn-gold pulse-ring !h-16 !px-10 text-base" data-magnetic>Gerar minha prévia <span className="arrow">→</span></Link>
              <a href={waLink(`Olá! Vi os cases da ${BRAND} e quero uma página pro meu negócio.`)} target="_blank" rel="noopener" className="btn btn-ghost-light" data-magnetic>
                <WaIcon size={16} /> Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WaFloat />
    </>
  );
}
