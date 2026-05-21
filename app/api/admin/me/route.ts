import { getAdminUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/api";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return unauthorized();
  }

  return ok(admin);
}
