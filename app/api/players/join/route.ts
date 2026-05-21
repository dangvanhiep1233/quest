import { badRequest, notFound, ok, serverError } from "@/lib/api";
import { assignQuestionsForParticipant } from "@/lib/quiz-data";
import { prisma } from "@/lib/prisma";
import { normalizeQuizCode } from "@/lib/utils";
import { joinPlayerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = joinPlayerSchema.parse(await request.json());
    const quiz = await prisma.quiz.findUnique({
      where: { code: normalizeQuizCode(body.quizCode) },
      include: { _count: { select: { questions: true } } }
    });

    if (!quiz) {
      return notFound("Quiz not found");
    }

    if (quiz.status === "FINISHED") {
      return badRequest("Quiz has finished");
    }

    if (quiz._count.questions < quiz.questionsPerSession) {
      return badRequest(`Quiz needs at least ${quiz.questionsPerSession} questions`);
    }

    const existingPlayer = body.playerId
      ? await prisma.player.findUnique({ where: { id: body.playerId } })
      : null;

    const player = existingPlayer
      ? await prisma.player.update({
          where: { id: existingPlayer.id },
          data: {
            name: body.name,
            phone: body.phone || null,
            email: body.email || null,
            organization: body.organization || null
          }
        })
      : await prisma.player.create({
          data: {
            name: body.name,
            phone: body.phone || null,
            email: body.email || null,
            organization: body.organization || null
          }
        });

    const participant = await prisma.quizParticipant.create({
      data: {
        quizId: quiz.id,
        playerId: player.id,
        isOnline: true,
        status: "QUESTION_ACTIVE",
        currentQuestionOrder: 1,
        totalQuestions: quiz.questionsPerSession,
        startedAt: new Date(),
        questionStartedAt: new Date()
      }
    });

    await assignQuestionsForParticipant(quiz, participant);

    return ok({
      playerId: player.id,
      quizParticipantId: participant.id,
      quizId: quiz.id,
      quizCode: quiz.code,
      quizStatus: quiz.status,
      questionsPerSession: quiz.questionsPerSession
    });
  } catch (error) {
    return serverError(error);
  }
}
