import { clientIp, json, readJson, sameOrigin } from "@/lib/security/request";
import { isAdmin } from "@/lib/security/session";
import { audit, deleteLead, listLeads, STATUSES, updateLead, type LeadStatus } from "@/lib/store";

// Toda rota do admin confere a sessão AQUI (o proxy só redireciona; não é a barreira de verdade).
const deny = () => json({ error: "Não autorizado." }, 401);
const validId = (v: unknown): v is string => typeof v === "string" && /^[\w-]{8,40}$/.test(v);

export async function GET() {
  if (!(await isAdmin())) return deny();
  return json({ leads: await listLeads() });
}

export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Origem não permitida." }, 403);
  if (!(await isAdmin())) return deny();
  const b = await readJson(req, 4_096);
  if (!b || !validId(b.id)) return json({ error: "Requisição inválida." }, 400);
  const status = STATUSES.includes(b.status as LeadStatus) ? (b.status as LeadStatus) : undefined;
  const note = typeof b.note === "string" ? b.note.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").slice(0, 1_000) : undefined;
  if (!status && note === undefined) return json({ error: "Nada pra mudar." }, 400);
  return (await updateLead(b.id, { status, note })) ? json({ ok: true }) : json({ error: "Lead não encontrado." }, 404);
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Origem não permitida." }, 403);
  if (!(await isAdmin())) return deny();
  const b = await readJson(req, 512);
  if (!b || !validId(b.id)) return json({ error: "Requisição inválida." }, 400);
  if (!(await deleteLead(b.id))) return json({ error: "Lead não encontrado." }, 404);
  await audit("lead_apagado", clientIp(req));
  return json({ ok: true });
}
