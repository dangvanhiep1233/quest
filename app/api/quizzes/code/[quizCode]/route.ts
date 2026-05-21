import { notFound, ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { normalizeQuizCode } from "@/lib/utils";

type Context = { params: Promise<{ quizCode: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { quizCode } = await context.params;
    const quiz = await prisma.quiz.findUnique({
      where: { code: normalizeQuizCode(quizCode) },
      include: {
        session: true,
        _count: {
          select: {
            questions: true,
            participants: true
          }
        }
      }
    });

    if (!quiz) {
      return notFound("Quiz not found");
    }

    return ok({ quiz });
  } catch (error) {
    return serverError(error);
  }
}
