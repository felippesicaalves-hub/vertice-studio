import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { BRAND } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["italic", "normal"] });

export const metadata: Metadata = {
  title: `${BRAND} — Landing pages que viram clientes no WhatsApp`,
  description:
    "Landing pages rápidas, bonitas e feitas pra vender, para negócios locais. Veja uma prévia da sua página gerada por IA em segundos.",
  openGraph: {
    title: `${BRAND} — Landing pages para negócios locais`,
    description: "Veja a prévia da sua página gerada por IA em segundos. Não gostou, não paga.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#2a0e16" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
