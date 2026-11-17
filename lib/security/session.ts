/**
 * Sessão do admin: cookie httpOnly + Secure + SameSite=Strict, assinado (HMAC), expira em 8 h.
 * Trocar SESSION_SECRET (ou ADMIN_SESSION_VERSION) derruba todas as sessões abertas.
 */
import { cookies } from "next/headers";
import { sign, unsign } from "./crypto";

export const SESSION_COOKIE = "vs_admin";
const TTL = 8 * 60 * 60; // segundos

type Session = { sub: "admin"; exp: number; v: string };
const version = () => process.env.ADMIN_SESSION_VERSION || "1";

export async function startSession() {
  const token = sign({ sub: "admin", exp: Math.floor(Date.now() / 1000) + TTL, v: version() } satisfies Session);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TTL,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAdmin() {
  const s = unsign<Session>((await cookies()).get(SESSION_COOKIE)?.value);
  return !!s && s.sub === "admin" && s.v === version() && s.exp > Date.now() / 1000;
}
