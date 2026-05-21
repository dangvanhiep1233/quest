import { requireAdminApi } from "@/lib/auth";
import { notFound, ok, serverError, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { normalizeQuizCode } from "@/lib/utils";
import { quizSchema } from "@/lib/validations";

type Context = { params: Promise<{ quizId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { quizId } = await context.params;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { session: true, _count: { select: { questions: true, participants: true } } }
    });

    if (!quiz) {
      return notFound("Quiz not found");
    }

    return ok({ quiz });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  const admin = await requireAdminApi();
  if (!admin) {
    return unauthorized();
  }

  try {
    const { quizId } = await context.params;
    const body = quizSchema.partial().parse(await request.json());
    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...body,
        code: body.code ? normalizeQuizCode(body.code) : undefined,
        description: body.description === undefined ? undefined : body.description || null,
        session: body.questionsPerSession
          ? {
              upsert: {
                update: { totalQuestions: body.questionsPerSession },
                create: {
                  currentQuestionOrder: 1,
                  totalQuestions: body.questionsPerSession,
                  status: "WAITING"
                }
              }
            }
          : undefined
      },
      include: { session: true }
    });

    return ok({ quiz });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const admin = await requireAdminApi();
  if (!admin) {
    return unauthorized();
  }

  try {
    const { quizId } = await context.params;
    await prisma.quiz.delete({ where: { id: quizId } });
    return ok({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
