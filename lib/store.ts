/**
 * Armazenamento do painel (leads, uso do gerador, log de acesso).
 * Dados pessoais (nome, WhatsApp, anotações) ficam CIFRADOS em repouso (AES-256-GCM).
 *
 * Hoje grava num arquivo JSON: `data/store.json` no seu PC; na Vercel o disco é temporário (/tmp),
 * então os dados de lá somem quando a instância recicla. Pra produção de verdade, trocar só
 * as funções `load`/`save` por um banco Postgres (o esquema com RLS está em db/schema.sql).
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { decrypt, encrypt, randomId } from "./security/crypto";

export const PERSISTENT = !process.env.VERCEL;
const FILE = PERSISTENT ? path.join(process.cwd(), "data", "store.json") : path.join(tmpdir(), "vs-store.json");

export type LeadStatus = "novo" | "contatado" | "fechado" | "perdido";
export const STATUSES: LeadStatus[] = ["novo", "contatado", "fechado", "perdido"];

type LeadRow = { id: string; at: string; name: string; whatsapp: string; business: string; plan: string; status: LeadStatus; note: string; consent: boolean };
type GenRow = { at: string; business: string; style: string; own: boolean; ok: boolean };
type AuditRow = { at: string; ip: string; event: "login_ok" | "login_falhou" | "login_bloqueado" | "logout" | "lead_apagado" | "export" };
type Db = { leads: LeadRow[]; gens: GenRow[]; audit: AuditRow[] };

export type Lead = Omit<LeadRow, never>;

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Db> {
  const raw = await readFile(FILE, "utf8").catch(() => "");
  const db = raw ? (JSON.parse(raw) as Partial<Db>) : {};
  return { leads: db.leads ?? [], gens: db.gens ?? [], audit: db.audit ?? [] };
}

async function save(db: Db) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db), { mode: 0o600 });
  await rename(tmp, FILE); // troca atômica: nunca deixa o arquivo pela metade
}

/** Serializa leitura+escrita pra envios simultâneos não se atropelarem. */
function tx<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.catch(() => {}).then(async () => {
    const db = await load();
    const out = await fn(db);
    await save(db);
    return out;
  });
  queue = run;
  return run;
}

/** Mascara o IP (LGPD: guarda só o suficiente pra ver padrão de ataque). */
export const maskIp = (ip: string) => (ip.includes(":") ? ip.split(":").slice(0, 3).join(":") + "::" : ip.replace(/\.\d+$/, ".0"));

// ---------- leads ----------
export function addLead(l: { name: string; whatsapp: string; business: string; plan: string; consent: boolean }) {
  return tx((db) => {
    db.leads.push({
      id: randomId(), at: new Date().toISOString(),
      name: encrypt(l.name), whatsapp: encrypt(l.whatsapp),
      business: l.business, plan: l.plan, status: "novo", note: "", consent: l.consent,
    });
    if (db.leads.length > 5_000) db.leads.splice(0, db.leads.length - 5_000);
  });
}

const open = (v: string) => { try { return v ? decrypt(v) : ""; } catch { return "[ilegível]"; } };

export async function listLeads(): Promise<Lead[]> {
  const db = await load();
  return db.leads
    .map((r) => ({ ...r, name: open(r.name), whatsapp: open(r.whatsapp), note: open(r.note) }))
    .reverse();
}

export function updateLead(id: string, patch: { status?: LeadStatus; note?: string }) {
  return tx((db) => {
    const r = db.leads.find((x) => x.id === id);
    if (!r) return false;
    if (patch.status) r.status = patch.status;
    if (patch.note !== undefined) r.note = patch.note ? encrypt(patch.note) : "";
    return true;
  });
}

/** Apaga de verdade (direito de exclusão da LGPD). */
export function deleteLead(id: string) {
  return tx((db) => {
    const n = db.leads.length;
    db.leads = db.leads.filter((x) => x.id !== id);
    return db.leads.length < n;
  });
}

// ---------- gerador ----------
export function logGen(g: Omit<GenRow, "at">) {
  return tx((db) => {
    db.gens.push({ at: new Date().toISOString(), ...g });
    if (db.gens.length > 10_000) db.gens.splice(0, db.gens.length - 10_000);
  }).catch(() => {});
}

// ---------- auditoria ----------
export function audit(event: AuditRow["event"], ip: string) {
  return tx((db) => {
    db.audit.push({ at: new Date().toISOString(), ip: maskIp(ip), event });
    if (db.audit.length > 2_000) db.audit.splice(0, db.audit.length - 2_000);
  }).catch(() => {});
}

export async function stats() {
  const db = await load();
  const day = 864e5, now = Date.now();
  const since = (rows: { at: string }[], d: number) => rows.filter((r) => now - Date.parse(r.at) < d * day).length;
  const styles: Record<string, number> = {};
  for (const g of db.gens) if (g.ok) styles[g.style] = (styles[g.style] ?? 0) + 1;
  const status: Record<string, number> = {};
  for (const l of db.leads) status[l.status] = (status[l.status] ?? 0) + 1;
  // gerações por dia, últimos 14 dias
  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * day).toISOString().slice(0, 10);
    return { d, gens: db.gens.filter((g) => g.at.startsWith(d)).length, leads: db.leads.filter((l) => l.at.startsWith(d)).length };
  });
  return {
    persistent: PERSISTENT,
    leads: { total: db.leads.length, d7: since(db.leads, 7), status },
    gens: { total: db.gens.length, d7: since(db.gens, 7), failed: db.gens.filter((g) => !g.ok).length, styles, recent: db.gens.slice(-12).reverse() },
    daily,
    audit: db.audit.slice(-15).reverse(),
  };
}
