// Cases da aba /cases. São os 5 projetos-conceito da vitrine (negócios fictícios, feitos à mão).
// Regra: nada de depoimento ou número inventado. Quando entrar cliente real com autorização,
// adicione aqui com `real: true` e os resultados medidos.

export type Case = {
  id: string; // mesmo id de components/sites (abre /vitrine/[id])
  live: number; // índice em SITES (abre a janela ao vivo)
  niche: string;
  brand: string;
  city: string;
  brief: string; // o problema típico do nicho
  idea: string; // a decisão central da página
  moves: string[]; // o que tem na página
  toy: string; // a brincadeira interativa
  head: { name: string; v: string; italic?: boolean };
  body: { name: string; v: string };
  colors: [string, string][]; // nome, hex
};

export const CASES: Case[] = [
  {
    id: "pizzaria",
    live: 0,
    niche: "Pizzaria",
    brand: "Cantina da Lucia",
    city: "Vinhedo",
    brief: "Pizzaria de bairro que vive de pedido pelo WhatsApp e briga com app de delivery cobrando 27% de taxa.",
    idea: "Cara de cardápio de cantina, não de app: papel creme, serifa de letreiro e o vermelho do tomate só onde tem botão.",
    moves: ["Cardápio na própria página, sem PDF pra baixar", "Pedido direto no WhatsApp da casa, sem taxa de app", "Título que fala da massa e do forno, não de promoção"],
    toy: "O visitante monta a própria pizza: escolhe o ingrediente e espalha em cima da massa.",
    head: { name: "DM Serif Display", v: "--f-dmserif", italic: true },
    body: { name: "Work Sans", v: "--f-work" },
    colors: [["Creme", "#f5ecda"], ["Tomate", "#c9362b"], ["Manjericão", "#2f6a3b"], ["Forno", "#2a1a12"]],
  },
  {
    id: "barbearia",
    live: 1,
    niche: "Barbearia",
    brand: "Navalha & Filho",
    city: "Campinas",
    brief: "Barbearia cheia no sábado e vazia na terça, com agenda anotada no caderno e cliente desistindo da fila.",
    idea: "Letreiro de barbearia antiga: condensada em caixa alta, vermelho e azul do poste e nada de dourado brilhante.",
    moves: ["Serviços descritos do jeito que o cliente pede: degradê, pezinho, corte + barba", "Horário marcado pelo WhatsApp: chega e senta", "Chamada pra encaixe no mesmo dia, pra encher a terça"],
    toy: "Passe a máquina na cabeça do cliente e o cabelo vai caindo até ficar na régua.",
    head: { name: "Barlow Condensed", v: "--f-barlow-cond" },
    body: { name: "Barlow", v: "--f-barlow" },
    colors: [["Osso", "#ece5d6"], ["Poste", "#a3301e"], ["Marinho", "#22304a"], ["Graxa", "#1c1b19"]],
  },
  {
    id: "estetica",
    live: 2,
    niche: "Estética",
    brand: "Ateliê Pele",
    city: "Campinas",
    brief: "Clínica de estética que depende de indicação e perde cliente pra quem só mostra antes-e-depois no Instagram.",
    idea: "Calma de revista: serifa fina, muito respiro, verde-sálvia e textos que explicam o tratamento antes de vender.",
    moves: ["Cada tratamento explicado em uma frase, sem jargão", "A avaliação como primeiro passo, não o pacote", "Promessa de resultado discreto, que não parece procedimento"],
    toy: "Clique pra pingar o sérum: onde a gota cai, a pele fica uniforme e com viço.",
    head: { name: "Cormorant Garamond", v: "--f-cormorant", italic: true },
    body: { name: "Jost", v: "--f-jost" },
    colors: [["Linho", "#efe9e1"], ["Sálvia", "#7f8b74"], ["Argila", "#cfc5b8"], ["Café", "#2e2724"]],
  },
  {
    id: "odontologia",
    live: 3,
    niche: "Odontologia",
    brand: "Sorrir",
    city: "Valinhos",
    brief: "Consultório de família com agenda furada: paciente adia a consulta por medo e some depois da limpeza.",
    idea: "Tirar o branco-hospital: verde-água, um coral quente nos botões e uma sans redonda que parece conversa.",
    moves: ["Seção própria pra primeira consulta, explicando o que acontece", "Do check-up ao implante, crianças e avós na mesma agenda", "Chamada sem sermão pra quem sumiu faz tempo"],
    toy: "Escove o dente até ele brilhar.",
    head: { name: "Figtree", v: "--f-figtree" },
    body: { name: "Figtree", v: "--f-figtree" },
    colors: [["Papel", "#f7f7f2"], ["Menta", "#d8efe6"], ["Petróleo", "#0e4d4a"], ["Coral", "#ff7759"]],
  },
  {
    id: "petshop",
    live: 4,
    niche: "Pet shop",
    brand: "lambeijo",
    city: "Jundiaí",
    brief: "Banho e tosa disputando com rede grande, com dono inseguro de deixar o bicho com gente que não conhece.",
    idea: "Alegre sem ser infantil: laranja vivo, letra gordinha no título e a o bicho como personagem principal.",
    moves: ["Banho, tosa e hidratação explicados como o dono pergunta", "Leva e traz com hora combinada, em destaque no menu", "Título que fala do bicho, não do preço"],
    toy: "Faça carinho no cachorro: os olhos seguem o cursor e ele abana o rabo.",
    head: { name: "Baloo 2", v: "--f-baloo" },
    body: { name: "Nunito", v: "--f-nunito" },
    colors: [["Biscoito", "#fff4e0"], ["Laranja", "#ff7a3d"], ["Céu", "#a9d8ee"], ["Noite", "#1f2b3d"]],
  },
];
