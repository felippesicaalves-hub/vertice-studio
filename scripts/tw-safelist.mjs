// Por que este script existe:
// O Controle Inteligente de Aplicativos do Windows bloqueia o binário nativo do Tailwind
// (@tailwindcss/oxide), então o scanner automático de classes não roda nesta máquina.
// Aqui fazemos o papel dele: extraímos os candidatos a classe do código e compilamos
// styles/tailwind.src.css → app/globals.css com a API Node do Tailwind (que não usa o binário).
// Edite sempre styles/tailwind.src.css. Funciona igual em qualquer máquina e na Vercel.
import { compile } from "@tailwindcss/node";
import { readdirSync, readFileSync, writeFileSync, watch, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIRS = ["app", "components", "lib"];
const SRC = path.join(ROOT, "styles", "tailwind.src.css");
const OUT = path.join(ROOT, "app", "globals.css");

function files(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (/\.(tsx?|jsx?|mdx?)$/.test(name)) out.push(p);
  }
  return out;
}

function candidates() {
  const set = new Set();
  for (const d of DIRS) {
    for (const f of files(path.join(ROOT, d))) {
      for (const t of readFileSync(f, "utf8").split(/[\s"'`{}<>;]+/)) {
        if (t.length > 1 && t.length < 120) set.add(t);
      }
    }
  }
  return [...set];
}

export async function build() {
  const compiler = await compile(readFileSync(SRC, "utf8"), {
    base: path.dirname(SRC),
    onDependency() {},
  });
  const css =
    "/* GERADO por scripts/tw-safelist.mjs a partir de styles/tailwind.src.css — não edite aqui */\n" +
    compiler.build(candidates());
  let prev = "";
  try { prev = readFileSync(OUT, "utf8"); } catch {}
  if (prev !== css) {
    writeFileSync(OUT, css);
    console.log(`[tailwind] app/globals.css (${(css.length / 1024).toFixed(1)} KB)`);
  }
}

await build();

if (process.argv.includes("--watch")) {
  let t;
  const queue = () => {
    clearTimeout(t);
    t = setTimeout(() => build().catch((e) => console.error("[tailwind]", e.message)), 120);
  };
  for (const d of [...DIRS, "styles"]) {
    watch(path.join(ROOT, d), { recursive: true }, (_e, f) => {
      if (f && !f.endsWith("globals.css")) queue();
    });
  }
  console.log("[tailwind] observando alterações…");
}
