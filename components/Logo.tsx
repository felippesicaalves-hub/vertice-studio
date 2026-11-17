import Link from "next/link";
import { BRAND } from "@/lib/config";

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M16 2 29 10v12L16 30 3 22V10L16 2Z" fill="var(--gold)" />
      <path d="M16 2v28M3 10l26 12M29 10 3 22" stroke="var(--wine-2)" strokeOpacity=".35" strokeWidth="1" />
      <circle cx="16" cy="16" r="3.6" fill="var(--wine-2)" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  const [a, ...rest] = BRAND.split(" ");
  return (
    <Link href="/#top" className={`flex items-center gap-2.5 font-semibold tracking-tight ${className}`} aria-label={`${BRAND} — início`}>
      <LogoMark />
      <span className="whitespace-nowrap text-[17px]">
        {a}
        {rest.length > 0 && <span className="serif text-[19px] font-normal text-gold"> {rest.join(" ")}</span>}
      </span>
    </Link>
  );
}
