// Fontes que só o motor de páginas usa (as outras vêm de components/sites/fonts). Sem preload: só baixa a que a página usar.
import { Anton, Archivo, Familjen_Grotesk, Instrument_Sans, Instrument_Serif, Schibsted_Grotesk } from "next/font/google";
import { SITE_FONTS } from "../sites/fonts";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], preload: false, weight: "400", style: ["normal", "italic"], variable: "--f-instrument-serif" });
const instrumentSans = Instrument_Sans({ subsets: ["latin"], preload: false, weight: ["400", "500", "600"], variable: "--f-instrument-sans" });
const familjen = Familjen_Grotesk({ subsets: ["latin"], preload: false, weight: ["400", "500", "600", "700"], variable: "--f-familjen" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], preload: false, weight: ["400", "500", "700", "800"], variable: "--f-schibsted" });
// cartaz: condensada pesada (Anton) e larga expandida (Archivo com eixo de largura, usada a 125%)
const anton = Anton({ subsets: ["latin"], preload: false, weight: "400", variable: "--f-anton" });
const archivoX = Archivo({ subsets: ["latin"], preload: false, axes: ["wdth"], variable: "--f-archivox" });

export const ENGINE_FONTS = `${SITE_FONTS} ${[instrumentSerif, instrumentSans, familjen, schibsted, anton, archivoX].map((f) => f.variable).join(" ")}`;
