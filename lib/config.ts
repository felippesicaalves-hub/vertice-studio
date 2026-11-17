// Tudo que é "marca" mora aqui. Trocou o nome? Muda só este arquivo + .env.local.
export const BRAND = process.env.NEXT_PUBLIC_BRAND || "Vértice Studio";
// número oficial da Vértice; o valor de exemplo antigo do .env é ignorado
const WA_ENV = process.env.NEXT_PUBLIC_WHATSAPP;
export const WHATSAPP = WA_ENV && WA_ENV !== "5519999999999" ? WA_ENV : "5500000000000";

export const NAV = [
  { href: "/#portfolio", label: "Portfólio" },
  { href: "/cases", label: "Cases" },
  { href: "/#gerador", label: "Gerador IA" },
  { href: "/#processo", label: "Processo" },
  { href: "/#planos", label: "Planos" },
  { href: "/#faq", label: "FAQ" },
];

export const NICHES = [
  "Pizzarias", "Clínicas", "Barbearias", "Salões", "Buffets", "Academias",
  "Pet shops", "Imobiliárias", "Advocacia", "Confeitarias", "Oficinas", "Estúdios",
];

export const PLANS = [
  {
    name: "Essencial",
    price: 497,
    days: 5,
    pitch: "Pra quem precisa sair do zero e ter um endereço profissional.",
    features: [
      "1 página com até 5 seções",
      "Botão de WhatsApp fixo",
      "Layout feito pro celular",
      "1 rodada de ajuste",
    ],
    featured: false,
  },
  {
    name: "Profissional",
    price: 997,
    days: 7,
    pitch: "O mais escolhido: página que vende, com copy e medição.",
    features: [
      "Tudo do Essencial",
      "Copy de conversão escrita por nós",
      "Animações e micro-interações",
      "Pixel Meta + Google Analytics",
      "SEO local (Google Maps)",
      "2 rodadas de ajuste",
    ],
    featured: true,
  },
  {
    name: "Premium",
    price: 1997,
    days: 10,
    pitch: "Pra marcar presença: 3D, motion e IA trabalhando por você.",
    features: [
      "Tudo do Profissional",
      "Cena 3D ou motion exclusivo",
      "Assistente com IA na página",
      "Formulário com captura de leads",
      "Relatório de desempenho em 30 dias",
      "3 rodadas de ajuste",
    ],
    featured: false,
  },
];

export const FAQ = [
  {
    q: "Preciso ter domínio ou hospedagem?",
    a: "Não. Se você ainda não tem, a gente te guia no registro do domínio .com.br (cerca de R$ 40/ano no Registro.br) e publica a página numa hospedagem rápida. Você fica dono de tudo.",
  },
  {
    q: "Quanto tempo leva pra ficar pronta?",
    a: "Você recebe a primeira prévia em até 48 horas depois do briefing. A entrega final sai em 5, 7 ou 10 dias, dependendo do plano.",
  },
  {
    q: "Tem mensalidade?",
    a: "Não. Você paga uma vez pela página. Manutenção e alterações futuras são opcionais e combinadas à parte.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "50% para começar e 50% na entrega, via Pix ou cartão. Parcelamos no cartão.",
  },
  {
    q: "E se eu não gostar?",
    a: "Garantia de prévia: se a primeira prévia não te agradar, você não paga nada e a gente se despede como amigos.",
  },
  {
    q: "Eu mesmo consigo alterar textos depois?",
    a: "Sim. Na entrega você recebe um vídeo curto mostrando como trocar textos, fotos e preços — ou pode pedir pra gente.",
  },
];

export function waLink(text: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}
