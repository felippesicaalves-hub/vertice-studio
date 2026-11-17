"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LogoMark } from "@/components/Logo";

type Status = "novo" | "contatado" | "fechado" | "perdido";
type Lead = { id: string; at: string; name: string; whatsapp: string; business: string; plan: string; status: Status; note: string };
type Stats = {
  persistent: boolean;
  leads: { total: number; d7: number; status: Record<string, number> };
  gens: { total: number; d7: number; failed: number; styles: Record<string, number>; recent: { at: string; business: string; style: string; ok: boolean }[] };
  daily: { d: string; gens: number; leads: number }[];
  audit: { at: string; ip: string; event: string }[];
  config: { gemini: boolean; whatsapp: boolean };
};

const STATUS: { id: Status; label: string; cls: string }[] = [
  { id: "novo", label: "Novo", cls: "bg-[#F6E7C8] text-[#6b4a12]" },
  { id: "contatado", label: "Contatado", cls: "bg-[#E4ECF6] text-[#1f3d63]" },
  { id: "fechado", label: "Fechado", cls: "bg-[#DDEFE2] text-[#1d5a33]" },
  { id: "perdido", label: "Perdido", cls: "bg-[#EEE7E3] text-[#6b5a54]" },
];
const STYLE_LABEL: Record<string, string> = { cantina: "Cantina (comida)", navalha: "Navalha (barbearia)", atelie: "Ateliê (estética)", sorrir: "Sorrir (saúde)", lambeijo: "Lambeijo (pet)" };
const EVENT_LABEL: Record<string, string> = { login_ok: "Entrou", login_falhou: "Senha errada", login_bloqueado: "Bloqueado", logout: "Saiu", lead_apagado: "Lead apagado", export: "Exportou CSV" };
const C_GEN = "#B8862F", C_LEAD = "#8A3346"; // validados (contraste e daltonismo) no fundo claro

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const phone = (d: string) => (d.length >= 10 ? `(${d.slice(-11, -9) || d.slice(0, 2)}) ${d.slice(-9, -4)}-${d.slice(-4)}` : d);

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (res.status === 401) { window.location.replace("/admin/login"); throw new Error("sessão expirada"); }
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || "Erro");
  return d as T;
}

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Status | "todos">("todos");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([api<Stats>("/api/admin/stats"), api<{ leads: Lead[] }>("/api/admin/leads")]);
      setStats(s);
      setLeads(l.leads);
      setErr("");
    } catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  async function patch(id: string, body: Partial<Pick<Lead, "status" | "note">>) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...body } : l)));
    await api("/api/admin/leads", { method: "PATCH", body: JSON.stringify({ id, ...body }) }).catch((e) => { setErr(e.message); load(); });
  }
  async function remove(l: Lead) {
    if (!window.confirm(`Apagar de vez o lead de ${l.name}? Não dá pra desfazer.`)) return;
    setLeads((ls) => ls.filter((x) => x.id !== l.id));
    await api("/api/admin/leads", { method: "DELETE", body: JSON.stringify({ id: l.id }) }).catch((e) => { setErr(e.message); load(); });
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", headers: { "Content-Type": "application/json" } }).catch(() => {});
    window.location.replace("/admin/login");
  }

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return leads.filter((l) => (filter === "todos" || l.status === filter) && (!s || `${l.name} ${l.business} ${l.whatsapp} ${l.note}`.toLowerCase().includes(s)));
  }, [leads, q, filter]);

  const conv = stats && stats.gens.total ? Math.round((stats.leads.total / stats.gens.total) * 100) : 0;
  const max = Math.max(1, ...(stats?.daily.flatMap((d) => [d.gens, d.leads]) ?? [1]));

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-20 pt-6 md:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <b className="text-[17px] tracking-tight">Painel</b>
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-wine/45 sm:inline">· leads e gerador</span>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export" className="rounded-full border border-wine/15 bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-wine/40">Exportar CSV</a>
          <button onClick={logout} className="rounded-full px-4 py-2 text-sm text-wine/70 transition-colors hover:bg-wine/5 hover:text-wine">Sair</button>
        </div>
      </header>

      {err && <p role="alert" className="mb-4 rounded-xl bg-[#FBE9EA] px-4 py-3 text-sm text-[#8a1f2b]">{err}</p>}
      {stats && !stats.persistent && (
        <Notice>Armazenamento temporário: na Vercel os leads ficam em disco que some quando o servidor reinicia. Falta ligar o banco de dados.</Notice>
      )}
      {stats && !stats.config.whatsapp && <Notice>O número de WhatsApp do site ainda é o de exemplo (NEXT_PUBLIC_WHATSAPP).</Notice>}
      {stats && !stats.config.gemini && <Notice>Gerador sem chave do Gemini: os visitantes vão ver erro.</Notice>}

      {/* números */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Leads" value={stats?.leads.total} sub={stats ? `${stats.leads.d7} nos últimos 7 dias` : ""} />
        <Tile label="Prévias geradas" value={stats?.gens.total} sub={stats ? `${stats.gens.d7} nos últimos 7 dias` : ""} />
        <Tile label="Viraram lead" value={stats ? `${conv}%` : undefined} sub="leads ÷ prévias" />
        <Tile label="Fechados" value={stats?.leads.status.fechado ?? (stats ? 0 : undefined)} sub={stats ? `${stats.leads.status.novo ?? 0} esperando contato` : ""} />
      </section>

      {/* últimos 14 dias */}
      <section className="mt-3 rounded-[18px] border border-wine/10 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Últimos 14 dias</h2>
          <div className="flex gap-4 text-xs text-wine/70">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: C_GEN }} />Prévias</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: C_LEAD }} />Leads</span>
          </div>
        </div>
        <div className="flex h-40 items-end gap-1.5 border-b border-wine/15 sm:gap-2.5" role="img" aria-label="Prévias e leads por dia nos últimos 14 dias">
          {stats?.daily.map((d) => (
            <div key={d.d} className="group relative flex h-full flex-1 items-end justify-center gap-[2px]">
              <span className="w-full max-w-[14px] rounded-t-[4px]" style={{ height: `${(d.gens / max) * 100}%`, minHeight: d.gens ? 3 : 0, background: C_GEN }} />
              <span className="w-full max-w-[14px] rounded-t-[4px]" style={{ height: `${(d.leads / max) * 100}%`, minHeight: d.leads ? 3 : 0, background: C_LEAD }} />
              <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-wine px-2.5 py-1.5 text-[11px] text-sand shadow-lg group-hover:block">
                {d.d.slice(8)}/{d.d.slice(5, 7)} · {d.gens} prévias · {d.leads} leads
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-wine/45">
          <span>{stats?.daily[0]?.d.slice(8)}/{stats?.daily[0]?.d.slice(5, 7)}</span><span>hoje</span>
        </div>
      </section>

      {/* leads */}
      <section className="mt-3 rounded-[18px] border border-wine/10 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-wine/10 p-4">
          <h2 className="mr-auto font-semibold">Leads <span className="font-normal text-wine/45">({shown.length})</span></h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nome, negócio, telefone…" aria-label="Buscar leads" className="h-9 w-full rounded-full border border-wine/15 px-4 text-sm outline-none focus:border-gold sm:w-64" />
          <div className="flex gap-1 overflow-x-auto">
            {(["todos", ...STATUS.map((s) => s.id)] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs capitalize transition-colors ${filter === s ? "bg-wine text-sand" : "text-wine/65 hover:bg-wine/5"}`}>
                {s}{s !== "todos" && stats ? ` ${stats.leads.status[s] ?? 0}` : ""}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="p-10 text-center text-sm text-wine/50">{leads.length ? "Nenhum lead com esse filtro." : "Nenhum lead ainda. Eles aparecem aqui quando alguém preenche o formulário depois de gerar a prévia."}</p>
        ) : (
          <ul className="divide-y divide-wine/10">
            {shown.map((l) => <LeadRow key={l.id} l={l} onPatch={patch} onDelete={remove} />)}
          </ul>
        )}
      </section>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <section className="rounded-[18px] border border-wine/10 bg-white p-5">
          <h2 className="mb-3 font-semibold">Últimas prévias geradas</h2>
          <ul className="space-y-2 text-sm">
            {stats?.gens.recent.length ? stats.gens.recent.map((g, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">{g.business}</span>
                <span className="shrink-0 font-mono text-[11px] text-wine/50">{g.ok ? STYLE_LABEL[g.style]?.split(" ")[0] ?? g.style : "falhou"} · {fmt(g.at)}</span>
              </li>
            )) : <li className="text-wine/50">Nada ainda.</li>}
          </ul>
          {stats && Object.keys(stats.gens.styles).length > 0 && (
            <div className="mt-4 border-t border-wine/10 pt-3">
              <p className="mb-2 text-xs text-wine/55">Modelo usado</p>
              {Object.entries(stats.gens.styles).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
                <div key={s} className="mb-1.5 flex items-center gap-2 text-xs">
                  <span className="w-36 shrink-0 text-wine/75">{STYLE_LABEL[s] ?? s}</span>
                  <span className="h-2 rounded-r-[4px]" style={{ width: `${(n / Math.max(...Object.values(stats.gens.styles))) * 60}%`, background: C_GEN }} />
                  <span className="text-wine/60">{n}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-[18px] border border-wine/10 bg-white p-5">
          <h2 className="mb-3 font-semibold">Acessos ao painel</h2>
          <ul className="space-y-2 text-sm">
            {stats?.audit.length ? stats.audit.map((a, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className={a.event === "login_ok" || a.event === "logout" ? "" : "font-medium text-[#8a1f2b]"}>{EVENT_LABEL[a.event] ?? a.event}</span>
                <span className="font-mono text-[11px] text-wine/50">{a.ip} · {fmt(a.at)}</span>
              </li>
            )) : <li className="text-wine/50">Nada ainda.</li>}
          </ul>
          <p className="mt-4 border-t border-wine/10 pt-3 text-xs leading-relaxed text-wine/55">
            IPs guardados mascarados. Nome, WhatsApp e anotações ficam criptografados no armazenamento.
          </p>
        </section>
      </div>
    </main>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 rounded-xl border border-[#E8C98B] bg-[#FBF1DC] px-4 py-3 text-sm text-[#5e430f]">⚠ {children}</p>;
}

function Tile({ label, value, sub }: { label: string; value?: number | string; sub: string }) {
  return (
    <div className="rounded-[18px] border border-wine/10 bg-white p-5">
      <p className="text-xs text-wine/55">{label}</p>
      <p className="title mt-1 text-[34px] leading-none tabular-nums">{value ?? "–"}</p>
      <p className="mt-2 text-xs text-wine/50">{sub}</p>
    </div>
  );
}

function LeadRow({ l, onPatch, onDelete }: { l: Lead; onPatch: (id: string, b: Partial<Pick<Lead, "status" | "note">>) => void; onDelete: (l: Lead) => void }) {
  const [note, setNote] = useState(l.note);
  const st = STATUS.find((s) => s.id === l.status) ?? STATUS[0];
  const wa = `https://wa.me/${l.whatsapp.length <= 11 ? "55" + l.whatsapp : l.whatsapp}?text=${encodeURIComponent(`Oi, ${l.name.split(" ")[0]}! Aqui é da Vértice Studio, sobre a prévia da sua página.`)}`;
  return (
    <li className="grid gap-3 p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate font-medium">{l.name}</p>
        <p className="font-mono text-xs text-wine/55">{phone(l.whatsapp)} · {fmt(l.at)}</p>
      </div>
      <p className="min-w-0 truncate text-sm text-wine/75" title={l.business}>{l.business || "—"}{l.plan && <span className="text-wine/45"> · {l.plan}</span>}</p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== l.note && onPatch(l.id, { note })}
        placeholder="Anotação…"
        aria-label={`Anotação sobre ${l.name}`}
        maxLength={1000}
        className="h-9 min-w-0 rounded-lg border border-transparent bg-[#F7F3ED] px-3 text-sm outline-none focus:border-gold"
      />
      <div className="flex items-center gap-1.5">
        <select
          value={l.status}
          onChange={(e) => onPatch(l.id, { status: e.target.value as Status })}
          aria-label={`Status de ${l.name}`}
          className={`h-8 rounded-full px-3 text-xs font-medium outline-none ${st.cls}`}
        >
          {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white">WhatsApp</a>
        <button onClick={() => onDelete(l)} aria-label={`Apagar lead de ${l.name}`} className="grid h-8 w-8 place-items-center rounded-full text-wine/40 transition-colors hover:bg-[#FBE9EA] hover:text-[#8a1f2b]">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </li>
  );
}
