import { notFound, ok, serverError } from "@/lib/api";
import { getLeaderboard } from "@/lib/quiz-data";
import { prisma } from "@/lib/prisma";
import { normalizeQuizCode } from "@/lib/utils";

type Context = { params: Promise<{ quizCode: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { quizCode } = await context.params;
    const quiz = await prisma.quiz.findUnique({
      where: { code: normalizeQuizCode(quizCode) },
      select: { id: true }
    });

    if (!quiz) {
      return notFound("Quiz not found");
    }

    const leaders = await getLeaderboard(quiz.id);
    return ok({ leaders });
  } catch (error) {
    return serverError(error);
  }
}
