import { requireAdminApi } from "@/lib/auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { normalizeQuizCode } from "@/lib/utils";
import { quizSchema } from "@/lib/validations";

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            questions: true,
            participants: true
          }
        },
        session: true
      }
    });

    return ok({ quizzes });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return unauthorized();
  }

  try {
    const body = quizSchema.parse(await request.json());
    const code = normalizeQuizCode(body.code);

    const quiz = await prisma.quiz.create({
      data: {
        ...body,
        code,
        description: body.description || null,
        session: {
          create: {
            currentQuestionOrder: 1,
            totalQuestions: body.questionsPerSession,
            status: "WAITING"
          }
        }
      },
      include: { session: true }
    });

    return ok({ quiz }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return badRequest("Quiz code already exists");
    }
    return serverError(error);
  }
}
