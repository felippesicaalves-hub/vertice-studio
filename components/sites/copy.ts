// Textos de uma página da vitrine. Os 5 modelos (feitos à mão) recebem isso por props:
// a vitrine usa os textos padrão de cada um; o gerador de prévias usa os textos que a IA escreve
// pro negócio do visitante. Assim o visual é sempre o desenhado à mão, nunca o da IA.

export type Copy = {
  brand: string;
  links: [string, string, string];
  navCta: string;
  kicker: string;
  h1: string; // parte normal do título
  h1em: string; // parte destacada (cor/itálico do modelo)
  lead: string;
  cta: string;
  cta2: string;
  servicesTitle: string;
  services: [string, string][]; // 4 a 6 itens: nome, descrição curta
  finalTitle: string;
  finalText: string;
  finalCta: string;
  toy: boolean; // mostra a brincadeira do nicho (só quando o negócio é daquele nicho)
};

export type StyleId =
  | "cantina" | "navalha" | "atelie" | "sorrir" | "lambeijo"
  | "forja" | "doceria" | "mesa" | "salao" | "tribuna" | "chave" | "garagem";

/**
 * Tamanho do título que cabe: o desenho foi feito pra um título de `fit` caracteres;
 * se a IA escrever mais, a letra diminui na mesma proporção (até `min`).
 */
export function fitSize(text: string, max: number, fit: number, min = max * 0.45) {
  const n = Math.max(1, text.trim().length);
  return Math.round(Math.max(min, Math.min(max, (max * fit) / n)));
}
export const h1Text = (c: Copy) => `${c.h1} ${c.h1em}`;
