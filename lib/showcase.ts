// Prints das páginas da vitrine (feitas à mão, em components/sites), usados no carrossel 3D e na parede.
// Cada página tem dois prints: o topo (índice par) e a seção de baixo (ímpar).
const SITES = [
  { niche: "Pizzaria", bg: "#f5ecda" },
  { niche: "Barbearia", bg: "#ece5d6" },
  { niche: "Estética", bg: "#efe9e1" },
  { niche: "Odontologia", bg: "#f7f7f2" },
  { niche: "Pet shop", bg: "#fff4e0" },
];

export const SHOTS = Array.from({ length: SITES.length * 2 }, (_, i) => ({
  src: `/showcase/${i}.jpg`,
  ...SITES[i >> 1],
}));
