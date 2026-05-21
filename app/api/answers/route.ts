import { badRequest, ok, serverError } from "@/lib/api";
import { answerCurrentQuestion } from "@/lib/quiz-data";
import { prisma } from "@/lib/prisma";
import { submitAnswerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = submitAnswerSchema.parse(await request.json());
    const { answer } = await answerCurrentQuestion(body);

    return ok({
      answer: {
        id: answer.id,
        selectedAnswer: answer.selectedAnswer,
        selectionVersion: answer.selectionVersion,
        isCorrect: answer.isCorrect,
        isFinalized: answer.isFinalized,
        responseTimeMs: answer.responseTimeMs,
        score: answer.score
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message);
    }
    return serverError(error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      return badRequest("quizId is required");
    }

    const answers = await prisma.playerAnswer.findMany({
      where: { quizId },
      include: {
        player: true,
        question: true
      },
      orderBy: [{ questionOrder: "asc" }, { submittedAt: "asc" }]
    });

    return ok({ answers });
  } catch (error) {
    return serverError(error);
  }
}
