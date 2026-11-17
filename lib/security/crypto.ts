/**
 * Criptografia do servidor (nunca importar em componente "use client").
 * - Senha do admin: scrypt com sal aleatório (formato `scrypt:N:r:p:sal:hash`, sem "$" porque o .env tentaria expandir).
 * - Dados pessoais dos leads: AES-256-GCM com chave DATA_KEY (32 bytes em base64).
 * - Sessão: token assinado com HMAC-SHA256 (SESSION_SECRET).
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

function secret(name: "DATA_KEY" | "SESSION_SECRET") {
  const v = process.env[name];
  if (!v || v.length < 32) throw new Error(`${name} ausente ou curto demais (rode npm run admin:setup)`);
  return v;
}

// ---------- senha ----------
const N = 2 ** 15, R = 8, P = 1, LEN = 64;
const scryptAsync = (pw: string, salt: Buffer, n: number, r: number, p: number) =>
  new Promise<Buffer>((res, rej) =>
    scrypt(pw.normalize("NFKC"), salt, LEN, { N: n, r, p, maxmem: 128 * n * r * 2 }, (e, k) => (e ? rej(e) : res(k))),
  );

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const k = await scryptAsync(pw, salt, N, R, P);
  return `scrypt:${N}:${R}:${P}:${salt.toString("base64")}:${k.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string | undefined) {
  // sem hash configurado ainda gasta o mesmo tempo (não revela se o admin existe)
  const parts = (stored ?? "").split(":");
  const ok = parts.length === 6 && parts[0] === "scrypt";
  const [n, r, p] = ok ? parts.slice(1, 4).map(Number) : [N, R, P];
  const salt = ok ? Buffer.from(parts[4], "base64") : randomBytes(16);
  const want = ok ? Buffer.from(parts[5], "base64") : randomBytes(LEN);
  const got = await scryptAsync(pw, salt, n, r, p);
  return ok && got.length === want.length && timingSafeEqual(got, want);
}

// ---------- dados pessoais ----------
const key = () => {
  const k = Buffer.from(secret("DATA_KEY"), "base64");
  if (k.length !== 32) throw new Error("DATA_KEY precisa ter 32 bytes em base64");
  return k;
};

/** Cifra um texto: `v1.iv.tag.dados` (base64url). Cada valor tem IV próprio. */
export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function decrypt(box: string) {
  const [v, iv, tag, data] = box.split(".");
  if (v !== "v1") throw new Error("formato de cifra desconhecido");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
}

// ---------- tokens assinados ----------
export function sign(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret("SESSION_SECRET")).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function unsign<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const want = createHmac("sha256", secret("SESSION_SECRET")).update(body).digest();
  const got = Buffer.from(mac, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T; } catch { return null; }
}

export const randomId = () => randomBytes(12).toString("base64url");
