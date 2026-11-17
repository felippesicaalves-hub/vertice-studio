import type { Metadata } from "next";
import { Suspense } from "react";
import { SitePage } from "@/components/sites";
import { SITE_IDS } from "@/components/sites/ids";

export const metadata: Metadata = { robots: { index: false } };

export function generateStaticParams() {
  return SITE_IDS.map((id) => ({ id }));
}

/** Demonstração isolada de uma página da vitrine (também usada pra tirar os prints do carrossel). */
export default function Vitrine({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense><Inner params={params} /></Suspense>;
}

async function Inner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SitePage id={id} />;
}
