import { notFound, ok, serverError } from "@/lib/api";
import { ensureQuizSession, sessionPayload } from "@/lib/quiz-data";
import { prisma } from "@/lib/prisma";
import { normalizeQuizCode } from "@/lib/utils";

type Context = { params: Promise<{ quizCode: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { quizCode } = await context.params;
    const quiz = await prisma.quiz.findUnique({
      where: { code: normalizeQuizCode(quizCode) },
      include: { session: true }
    });

    if (!quiz) {
      return notFound("Quiz not found");
    }

    const session = quiz.session ?? (await ensureQuizSession(quiz));
    return ok({ session: sessionPayload(quiz, session), quizStatus: quiz.status });
  } catch (error) {
    return serverError(error);
  }
}
