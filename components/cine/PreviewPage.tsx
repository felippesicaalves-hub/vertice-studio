"use client";

import { useEffect, useState } from "react";
import { DEMO } from "@/lib/engine/demo";
import type { Spec } from "@/lib/engine/spec";
import { readPreview } from "@/lib/preview-link";
import EnginePage from "../engine/Page";
import Stage from "../engine/Stage";

/** Lê a página do "#" do link e entrega pro motor. Sem link, mostra o exemplo. */
export default function PreviewPage() {
  const [p, setP] = useState<{ spec: Spec; key: string } | null>(null);
  useEffect(() => {
    const read = () => setP({ spec: readPreview(location.hash) ?? DEMO, key: location.hash.slice(-24) });
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  if (!p) return <div style={{ minHeight: "100svh", background: "#f4f1ea" }} />;
  // campos e cinema usam o motor v13 (objeto que viaja); as outras direções, o motor anterior
  if (p.spec.direction === "fields" || p.spec.direction === "cinema") return <Stage key={p.key} spec={p.spec} />;
  return <EnginePage key={p.key} spec={p.spec} />;
}
