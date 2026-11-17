import { clientIp, json } from "@/lib/security/request";
import { isAdmin } from "@/lib/security/session";
import { audit, listLeads } from "@/lib/store";

// CSV seguro: aspas escapadas e sem fórmula do Excel (=, +, -, @ no começo viram texto)
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return json({ error: "Não autorizado." }, 401);
  const leads = await listLeads();
  const rows = [["data", "nome", "whatsapp", "negocio", "plano", "status", "anotacao"], ...leads.map((l) => [l.at, l.name, l.whatsapp, l.business, l.plan, l.status, l.note])];
  await audit("export", clientIp(req));
  return new Response("﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
