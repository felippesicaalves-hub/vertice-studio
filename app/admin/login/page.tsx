"use client";

import { useState } from "react";
import { LogoMark } from "@/components/Logo";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    }).catch(() => null);
    setPw("");
    if (res?.ok) {
      window.location.replace("/admin");
      return;
    }
    const d = await res?.json().catch(() => null);
    setErr(d?.error || "Não deu pra entrar.");
    setBusy(false);
  }

  return (
    <main className="grid min-h-svh place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-[380px] rounded-[22px] border border-wine/10 bg-white p-7 shadow-[0_30px_80px_-40px_rgba(58,21,32,.45)]">
        <div className="mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2.5 font-semibold"><LogoMark /> Vértice Studio</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-wine/45">painel</span>
        </div>
        <label htmlFor="pw" className="mb-2 block text-sm font-medium">Senha do admin</label>
        <input
          id="pw"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="h-12 w-full rounded-xl border border-wine/15 px-4 outline-none transition-colors focus:border-gold"
        />
        {err && <p role="alert" className="mt-3 text-sm text-[#a3242f]">{err}</p>}
        <button disabled={busy || !pw} className="btn btn-wine mt-5 !h-12 w-full disabled:opacity-50">
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <p className="mt-5 text-center text-xs text-wine/45">5 tentativas erradas bloqueiam por 15 minutos.</p>
      </form>
    </main>
  );
}
