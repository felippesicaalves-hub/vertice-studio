import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

/**
 * Cabeçalhos de segurança em todas as páginas.
 * CSP: só carrega coisas do próprio site (scripts inline do Next e estilos inline do GSAP liberados).
 */
const csp = (frame: string, remoteImg = false) => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${remoteImg ? " https:" : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  `frame-ancestors ${frame}`,
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// a prévia (/previa) pode aparecer num iframe do próprio site (o gerador); o resto não pode ser emoldurado por ninguém
const security = (embed: boolean) => [
  { key: "Content-Security-Policy", value: csp(embed ? "'self'" : "'none'", embed) },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: embed ? "SAMEORIGIN" : "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/((?!previa).*)", headers: security(false) },
      { source: "/previa", headers: security(true) },
    ];
  },
};

export default nextConfig;
