// Copia as chaves de segurança do .env.local pra Vercel (Production) SEM mostrar os valores.
//   node scripts/push-env.mjs            → DATA_KEY, SESSION_SECRET, ADMIN_SESSION_VERSION
//   node scripts/push-env.mjs --admin    → também ADMIN_PASSWORD_HASH (rode depois do npm run admin:setup)
//   node scripts/push-env.mjs --fotos    → só UNSPLASH_ACCESS_KEY (fotos das prévias)
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, "m"))?.[1].trim();
const keys = process.argv.includes("--fotos")
  ? ["UNSPLASH_ACCESS_KEY"]
  : ["DATA_KEY", "SESSION_SECRET", "ADMIN_SESSION_VERSION", ...(process.argv.includes("--admin") ? ["ADMIN_PASSWORD_HASH"] : [])];

for (const k of keys) {
  const v = k === "ADMIN_SESSION_VERSION" ? get(k) ?? "1" : get(k);
  if (!v) { console.log(`✗ ${k} não está no .env.local (rode npm run admin:setup ou cole a chave)`); continue; }
  spawnSync("npx", ["vercel", "env", "rm", k, "production", "--yes"], { stdio: "ignore", shell: true });
  const r = spawnSync("npx", ["vercel", "env", "add", k, "production"], { input: v, stdio: ["pipe", "ignore", "ignore"], shell: true });
  console.log(r.status === 0 ? `✓ ${k} gravada na Vercel` : `✗ ${k} falhou (rode npx vercel login?)`);
}
