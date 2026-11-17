import { clientIp, json, rateLimit, readJson, sameOrigin } from "@/lib/security/request";
import { addLead } from "@/lib/store";

const clean = (v: unknown, n: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, "") // sem caracteres de controle nem tags
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Origem não permitida." }, 403);

  const ip = clientIp(req);
  const rl = rateLimit(`lead:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return json({ error: "Muitos envios. Tenta de novo mais tarde." }, 429, { "Retry-After": String(rl.retryAfter) });

  const b = await readJson(req);
  if (!b) return json({ error: "Requisição inválida." }, 400);

  // armadilha pra robô: campo invisível que gente de verdade não preenche
  if (clean(b.website, 100)) return json({ ok: true });

  const name = clean(b.name, 80);
  const whatsapp = String(b.whatsapp ?? "").replace(/\D/g, "").slice(0, 13);
  const business = clean(b.business, 120);
  const plan = clean(b.plan, 30);

  if (name.length < 2 || !/^\p{L}[\p{L} .'-]*$/u.test(name)) return json({ error: "Confira seu nome." }, 400);
  if (whatsapp.length < 10 || whatsapp.length > 13) return json({ error: "Confira seu WhatsApp." }, 400);
  if (b.consent !== true) return json({ error: "Precisamos do seu ok pra entrar em contato." }, 400);

  try {
    await addLead({ name, whatsapp, business, plan, consent: true });
  } catch (e) {
    // nunca registrar nome/telefone no log (LGPD): só o erro
    console.error("[lead] falha ao gravar:", (e as Error).message);
    return json({ error: "Não deu pra salvar agora." }, 500);
  }
  return json({ ok: true });
}
