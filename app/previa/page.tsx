import type { Metadata } from "next";
import { Suspense } from "react";
import PreviewPage from "@/components/cine/PreviewPage";

export const metadata: Metadata = { title: "Prévia da sua página", robots: { index: false, follow: false } };

/** Prévia em tela cheia do gerador. Os textos vêm no "#" do link, nada fica guardado no servidor. */
export default function Previa() {
  return <Suspense><PreviewPage /></Suspense>;
}
