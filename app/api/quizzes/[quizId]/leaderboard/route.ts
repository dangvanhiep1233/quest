import { ok, serverError } from "@/lib/api";
import { getLeaderboard } from "@/lib/quiz-data";

type Context = { params: Promise<{ quizId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { quizId } = await context.params;
    const leaders = await getLeaderboard(quizId);
    return ok({ leaders });
  } catch (error) {
    return serverError(error);
  }
}
