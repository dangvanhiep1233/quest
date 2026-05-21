import { clearAdminSession } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function POST() {
  await clearAdminSession();
  return ok({ ok: true });
}
