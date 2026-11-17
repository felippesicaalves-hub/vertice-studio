import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel · Vértice Studio",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-[#F4EFE7] text-wine">{children}</div>;
}
