import { requireAdminApi } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api";
import { runControlAction } from "@/lib/control-actions";

type Context = { params: Promise<{ quizId: string }> };

export async function POST(_request: Request, context: Context) {
  if (!(await requireAdminApi())) return unauthorized();
  try {
    const { quizId } = await context.params;
    return ok(await runControlAction(quizId, "next-question"));
  } catch (error) {
    return serverError(error);
  }
}
