// Link da prévia: /previa#<dados>. A página inteira (direção de arte + textos + fotos) vai no "#",
// que o navegador não manda pro servidor: o link abre em tela cheia e pode ser mandado pro sócio sem guardar nada do visitante.
import { sanitize, type Spec } from "./engine/spec";

const b64url = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export function previewHref(spec: Spec) {
  return `/previa#${b64url(new TextEncoder().encode(JSON.stringify(spec)))}`;
}

/** Lê e confere o que veio no link (pode ter sido editado à mão: tudo passa pelo sanitize). */
export function readPreview(hash: string): Spec | null {
  const h = hash.replace(/^#/, "");
  if (!h || h.length > 40_000) return null;
  try {
    return sanitize(JSON.parse(new TextDecoder().decode(unb64url(h))));
  } catch {
    return null;
  }
}
