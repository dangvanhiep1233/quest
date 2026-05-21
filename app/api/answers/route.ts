import { badRequest, ok, serverError } from "@/lib/api";
import { answerCurrentQuestion, getAnsweredCount, getLeaderboard } from "@/lib/quiz-data";
import { prisma } from "@/lib/prisma";
import { publishRealtimeEvent } from "@/lib/realtime";
import { submitAnswerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = submitAnswerSchema.parse(await request.json());
    const { answer, participant, quiz, session } = await answerCurrentQuestion(body);
    const [{ answeredCount, totalParticipants }, leaders] = await Promise.all([
      getAnsweredCount(quiz.id, session.currentQuestionOrder),
      getLeaderboard(quiz.id)
    ]);

    await publishRealtimeEvent(quiz.code, "player:answer", {
      quizCode: quiz.code,
      quizId: quiz.id,
      questionId: answer.questionId,
      quizParticipantId: participant.id,
      questionOrder: session.currentQuestionOrder,
      selectedAnswer: answer.selectedAnswer ?? body.selectedAnswer
    });

    await publishRealtimeEvent(quiz.code, "answers:count-update", {
      quizId: quiz.id,
      quizCode: quiz.code,
      currentQuestionOrder: session.currentQuestionOrder,
      answeredCount,
      totalParticipants
    });

    await publishRealtimeEvent(quiz.code, "leaderboard:update", {
      quizId: quiz.id,
      quizCode: quiz.code,
      leaders
    });

    return ok({
      answer: {
        id: answer.id,
        selectedAnswer: answer.selectedAnswer,
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
