import { verifyPassword } from "@/lib/security/crypto";
import { clientIp, json, rateCount, rateLimit, rateReset, readJson, sameOrigin } from "@/lib/security/request";
import { startSession } from "@/lib/security/session";
import { audit } from "@/lib/store";

const WINDOW = 15 * 60 * 1000;
const PER_IP = 5; // tentativas erradas por IP a cada 15 min
const GLOBAL = 30; // erradas no total a cada 15 min (ataque espalhado em vários IPs)

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Origem não permitida." }, 403);
  const ip = clientIp(req);

  if (rateCount(`login:${ip}`, WINDOW) >= PER_IP || rateCount("login:all", WINDOW) >= GLOBAL) {
    await audit("login_bloqueado", ip);
    return json({ error: "Muitas tentativas. Espere 15 minutos." }, 429, { "Retry-After": "900" });
  }

  const b = await readJson(req, 1_024);
  const password = typeof b?.password === "string" ? b.password.slice(0, 200) : "";
  const hash = process.env.ADMIN_PASSWORD_HASH;

  const ok = password.length > 0 && (await verifyPassword(password, hash));
  if (!ok) {
    rateLimit(`login:${ip}`, Infinity, WINDOW);
    rateLimit("login:all", Infinity, WINDOW);
    await audit("login_falhou", ip);
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400)); // atrasa força bruta
    return json({ error: hash ? "Senha incorreta." : "Admin ainda não configurado (npm run admin:setup)." }, 401);
  }

  rateReset(`login:${ip}`);
  await startSession();
  await audit("login_ok", ip);
  return json({ ok: true });
}
