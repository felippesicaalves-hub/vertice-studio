import { clientIp, json, sameOrigin } from "@/lib/security/request";
import { endSession, isAdmin } from "@/lib/security/session";
import { audit } from "@/lib/store";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Origem não permitida." }, 403);
  if (await isAdmin()) await audit("logout", clientIp(req));
  await endSession();
  return json({ ok: true });
}
