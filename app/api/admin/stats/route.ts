import { json } from "@/lib/security/request";
import { isAdmin } from "@/lib/security/session";
import { stats } from "@/lib/store";
import { WHATSAPP } from "@/lib/config";

export async function GET() {
  if (!(await isAdmin())) return json({ error: "Não autorizado." }, 401);
  return json({
    ...(await stats()),
    config: {
      gemini: !!process.env.GEMINI_API_KEY,
      whatsapp: WHATSAPP !== "5519999999999",
    },
  });
}
