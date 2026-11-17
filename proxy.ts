import { NextResponse, type NextRequest } from "next/server";

/**
 * Checagem otimista: sem cookie de sessão, /admin vai pro login e /api/admin responde 401.
 * A validação de verdade (assinatura, validade) acontece em cada rota com isAdmin().
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const has = req.cookies.has("vs_admin");
  const open = pathname === "/admin/login" || pathname === "/api/admin/login";

  if (!has && !open) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
