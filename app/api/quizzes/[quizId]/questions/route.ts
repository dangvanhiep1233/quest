import { requireAdminApi } from "@/lib/auth";
import { notFound, ok, serverError, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";

type Context = { params: Promise<{ quizId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { quizId } = await context.params;
    const questions = await prisma.question.findMany({
      where: { quizId },
      orderBy: { order: "asc" }
    });

    return ok({ questions });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request, context: Context) {
  const admin = await requireAdminApi();
  if (!admin) {
    return unauthorized();
  }

  try {
    const { quizId } = await context.params;
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return notFound("Quiz not found");
    }

    const body = questionSchema.parse(await request.json());
    const question = await prisma.question.create({
      data: {
        ...body,
        quizId,
        imageUrl: body.imageUrl || null,
        explanation: body.explanation || null
      }
    });

    return ok({ question }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
