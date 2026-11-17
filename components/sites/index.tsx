"use client";

import type { ComponentType } from "react";
import Bakery from "./Bakery";
import Barber from "./Barber";
import Bistro from "./Bistro";
import Salon from "./Salon";
import Law from "./Law";
import Realty from "./Realty";
import Garage from "./Garage";
import type { Copy, StyleId } from "./copy";
import Dental from "./Dental";
import Gym from "./Gym";
import { SITE_FONTS } from "./fonts";
import Pet from "./Pet";
import Pizza from "./Pizza";
import Skin from "./Skin";

type SiteComp = ComponentType<{ m: boolean; c?: Copy }>;
export type SiteDef = { id: string; label: string; style: StyleId; Comp: SiteComp };

/** Páginas da vitrine, feitas à mão, cada uma com um brinquedo interativo do nicho. */
export const SITES: SiteDef[] = [
  { id: "pizzaria", label: "Pizzaria", style: "cantina", Comp: Pizza },
  { id: "barbearia", label: "Barbearia", style: "navalha", Comp: Barber },
  { id: "estetica", label: "Estética", style: "atelie", Comp: Skin },
  { id: "odontologia", label: "Odontologia", style: "sorrir", Comp: Dental },
  { id: "petshop", label: "Pet shop", style: "lambeijo", Comp: Pet },
  { id: "academia", label: "Academia", style: "forja", Comp: Gym },
  { id: "confeitaria", label: "Confeitaria", style: "doceria", Comp: Bakery },
  { id: "restaurante", label: "Restaurante", style: "mesa", Comp: Bistro },
  { id: "salao", label: "Salão de beleza", style: "salao", Comp: Salon },
  { id: "advocacia", label: "Advocacia", style: "tribuna", Comp: Law },
  { id: "imobiliaria", label: "Imobiliária", style: "chave", Comp: Realty },
  { id: "oficina", label: "Oficina", style: "garagem", Comp: Garage },
];

export const byStyle = (s: StyleId) => (SITES.find((x) => x.style === s) ?? SITES[3]).Comp;

/** Página inteira em tamanho real (usada em /vitrine/[id] para prints e demonstração). */
export function SitePage({ id, m = false }: { id: string; m?: boolean }) {
  const site = SITES.find((x) => x.id === id) ?? SITES[0];
  return (
    <div className={SITE_FONTS}>
      <site.Comp m={m} />
    </div>
  );
}
