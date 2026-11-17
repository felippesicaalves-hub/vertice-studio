// Fontes das páginas da vitrine (cada nicho com a sua). Sem preload: só baixam quando a vitrine aparece.
// (o next/font exige as opções escritas literalmente em cada chamada)
import { Barlow, Barlow_Condensed, DM_Serif_Display, Work_Sans, Figtree, Baloo_2, Nunito, Cormorant_Garamond, Jost, Big_Shoulders, Archivo, Fraunces, Manrope, Libre_Caslon_Display, Karla, Bodoni_Moda, DM_Sans, Source_Serif_4, Inter_Tight, Bricolage_Grotesque, Saira_Condensed, Saira } from "next/font/google";

export const barlowCond = Barlow_Condensed({ subsets: ["latin"], preload: false, weight: ["600", "800"], variable: "--f-barlow-cond" });
export const barlow = Barlow({ subsets: ["latin"], preload: false, weight: ["400", "500", "600"], variable: "--f-barlow" });
export const dmSerif = DM_Serif_Display({ subsets: ["latin"], preload: false, weight: "400", style: ["normal", "italic"], variable: "--f-dmserif" });
export const workSans = Work_Sans({ subsets: ["latin"], preload: false, weight: ["400", "500", "600"], variable: "--f-work" });
export const figtree = Figtree({ subsets: ["latin"], preload: false, weight: ["400", "500", "700", "800"], variable: "--f-figtree" });
export const baloo = Baloo_2({ subsets: ["latin"], preload: false, weight: ["600", "800"], variable: "--f-baloo" });
export const nunito = Nunito({ subsets: ["latin"], preload: false, weight: ["400", "600", "700"], variable: "--f-nunito" });
export const cormorant = Cormorant_Garamond({ subsets: ["latin"], preload: false, weight: ["400", "500"], style: ["normal", "italic"], variable: "--f-cormorant" });
export const jost = Jost({ subsets: ["latin"], preload: false, weight: ["400", "500"], variable: "--f-jost" });


// nichos novos (v10)
export const shoulders = Big_Shoulders({ subsets: ["latin"], preload: false, weight: ["800", "900"], variable: "--f-shoulders" });
export const archivo = Archivo({ subsets: ["latin"], preload: false, weight: ["400", "500", "700"], variable: "--f-archivo" });
export const fraunces = Fraunces({ subsets: ["latin"], preload: false, weight: ["500", "700"], variable: "--f-fraunces" });
export const manrope = Manrope({ subsets: ["latin"], preload: false, weight: ["400", "500", "700"], variable: "--f-manrope" });
export const caslon = Libre_Caslon_Display({ subsets: ["latin"], preload: false, weight: "400", variable: "--f-caslon" });
export const karla = Karla({ subsets: ["latin"], preload: false, weight: ["400", "500", "700"], variable: "--f-karla" });
export const bodoni = Bodoni_Moda({ subsets: ["latin"], preload: false, weight: ["500", "700"], variable: "--f-bodoni" });
export const dmSans = DM_Sans({ subsets: ["latin"], preload: false, weight: ["400", "500", "700"], variable: "--f-dmsans" });
export const sourceSerif = Source_Serif_4({ subsets: ["latin"], preload: false, weight: ["400", "600"], variable: "--f-sourceserif" });
export const interTight = Inter_Tight({ subsets: ["latin"], preload: false, weight: ["400", "500", "600"], variable: "--f-intertight" });
export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], preload: false, weight: ["400", "600", "800"], variable: "--f-bricolage" });
export const sairaCond = Saira_Condensed({ subsets: ["latin"], preload: false, weight: ["600", "800"], variable: "--f-sairacond" });
export const saira = Saira({ subsets: ["latin"], preload: false, weight: ["400", "500", "600"], variable: "--f-saira" });

export const SITE_FONTS = [barlowCond, barlow, dmSerif, workSans, figtree, baloo, nunito, cormorant, jost,
  shoulders, archivo, fraunces, manrope, caslon, karla, bodoni, dmSans, sourceSerif, interTight, bricolage, sairaCond, saira].map((f) => f.variable).join(" ");
