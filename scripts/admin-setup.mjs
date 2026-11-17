// Configura o painel admin no .env.local SEM mostrar nenhum segredo na tela:
//   npm run admin:setup          → pergunta a senha (digitação escondida) e gera as chaves que faltam
//   npm run admin:setup -- --rotate-session   → derruba todas as sessões abertas
// Na Vercel: copie as MESMAS variáveis pra Settings → Environment Variables (Production).
// Trocar DATA_KEY depois de ter leads torna os antigos ilegíveis: guarde-a num cofre de senhas.
import { randomBytes, scrypt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";

const FILE = path.join(process.cwd(), ".env.local");
const env = existsSync(FILE) ? readFileSync(FILE, "utf8") : "";
const has = (k) => new RegExp(`^${k}=.+`, "m").test(env);
const set = (src, k, v) => (new RegExp(`^${k}=.*$`, "m").test(src) ? src.replace(new RegExp(`^${k}=.*$`, "m"), `${k}=${v}`) : `${src.replace(/\n?$/, "\n")}${k}=${v}\n`);

function ask(q) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); else rl.output.write("*"); };
    rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); res(a); });
  });
}

const N = 2 ** 15, R = 8, P = 1;
const hash = (pw) => new Promise((res, rej) => {
  const salt = randomBytes(16);
  scrypt(pw.normalize("NFKC"), salt, 64, { N, r: R, p: P, maxmem: 128 * N * R * 2 }, (e, k) =>
    e ? rej(e) : res(`scrypt:${N}:${R}:${P}:${salt.toString("base64")}:${k.toString("base64")}`));
});

let out = env;
if (process.argv.includes("--rotate-session")) {
  out = set(out, "SESSION_SECRET", randomBytes(48).toString("base64url"));
  writeFileSync(FILE, out);
  console.log("Sessões derrubadas (SESSION_SECRET novo). Atualize também na Vercel.");
  process.exit(0);
}

const pw = process.env.ADMIN_PASSWORD ?? (await ask("Nova senha do admin (mín. 12 caracteres): "));
if (pw.length < 12) { console.error("Senha curta demais. Use 12+ caracteres (uma frase funciona bem)."); process.exit(1); }
if (!process.env.ADMIN_PASSWORD) {
  const again = await ask("Repita a senha: ");
  if (again !== pw) { console.error("As senhas não batem."); process.exit(1); }
}

out = set(out, "ADMIN_PASSWORD_HASH", await hash(pw));
if (!has("SESSION_SECRET")) out = set(out, "SESSION_SECRET", randomBytes(48).toString("base64url"));
if (!has("DATA_KEY")) out = set(out, "DATA_KEY", randomBytes(32).toString("base64"));
writeFileSync(FILE, out);
console.log("Pronto: ADMIN_PASSWORD_HASH, SESSION_SECRET e DATA_KEY gravados no .env.local (nada foi exibido).");
console.log("Reinicie o servidor e entre em /admin.");
