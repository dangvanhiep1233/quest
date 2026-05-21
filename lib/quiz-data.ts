import type { AnswerKey, Prisma, Question, Quiz, QuizParticipant, QuizSession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateResponseTimeMs, calculateScore } from "@/lib/scoring";
import type { LeaderboardRow } from "@/lib/realtime-events";

function responseFieldForAnswer(answer: AnswerKey) {
  return {
    A: "answerAResponseTimeMs",
    B: "answerBResponseTimeMs",
    C: "answerCResponseTimeMs",
    D: "answerDResponseTimeMs"
  }[answer] as
    | "answerAResponseTimeMs"
    | "answerBResponseTimeMs"
    | "answerCResponseTimeMs"
    | "answerDResponseTimeMs";
}

function getFirstResponseTimeForAnswer(
  answer: AnswerKey | null,
  times: {
    answerAResponseTimeMs: number | null;
    answerBResponseTimeMs: number | null;
    answerCResponseTimeMs: number | null;
    answerDResponseTimeMs: number | null;
    responseTimeMs: number;
  }
) {
  if (!answer) {
    return times.responseTimeMs;
  }

  return times[responseFieldForAnswer(answer)] ?? times.responseTimeMs;
}

export type PublicQuestionPayload = {
  id: string;
  text: string;
  imageUrl: string | null;
  options: Array<{ key: AnswerKey; text: string }>;
  correctAnswer?: AnswerKey;
  explanation?: string | null;
  timeLimit: number;
  currentQuestion: number;
  totalQuestions: number;
  existingAnswer?: {
    selectedAnswer: AnswerKey | null;
    isCorrect: boolean;
    isFinalized: boolean;
    score: number;
    responseTimeMs: number;
  } | null;
};

export function toPublicQuestion(
  question: Question,
  currentQuestion: number,
  totalQuestions: number,
  reveal: boolean,
  existingAnswer?: {
    selectedAnswer: AnswerKey | null;
    isCorrect: boolean;
    isFinalized: boolean;
    score: number;
    responseTimeMs: number;
  } | null
): PublicQuestionPayload {
  return {
    id: question.id,
    text: question.text,
    imageUrl: question.imageUrl,
    options: [
      { key: "A", text: question.optionA },
      { key: "B", text: question.optionB },
      { key: "C", text: question.optionC },
      { key: "D", text: question.optionD }
    ],
    correctAnswer: reveal ? question.correctAnswer : undefined,
    explanation: reveal ? question.explanation : undefined,
    timeLimit: question.timeLimit,
    currentQuestion,
    totalQuestions,
    existingAnswer
  };
}

export async function ensureQuizSession(quiz: Pick<Quiz, "id" | "questionsPerSession">) {
  return prisma.quizSession.upsert({
    where: { quizId: quiz.id },
    update: {},
    create: {
      quizId: quiz.id,
      currentQuestionOrder: 1,
      totalQuestions: quiz.questionsPerSession,
      status: "WAITING"
    }
  });
}

export async function assignQuestionsForParticipant(
  quiz: Quiz,
  participant: QuizParticipant
) {
  const existingCount = await prisma.quizParticipantQuestion.count({
    where: { quizParticipantId: participant.id }
  });

  if (existingCount > 0) {
    return;
  }

  const questions = await prisma.question.findMany({
    where: { quizId: quiz.id },
    orderBy: { order: "asc" }
  });

  if (questions.length === 0) {
    throw new Error("Quiz has no questions");
  }

  const selected = quiz.randomizeQuestions
    ? [...questions].sort(() => Math.random() - 0.5).slice(0, quiz.questionsPerSession)
    : questions.slice(0, quiz.questionsPerSession);

  await prisma.quizParticipantQuestion.createMany({
    data: selected.map((question, index) => ({
      quizId: quiz.id,
      playerId: participant.playerId,
      quizParticipantId: participant.id,
      questionId: question.id,
      order: index + 1
    }))
  });
}

export async function getCurrentQuestionForParticipant(quizParticipantId: string) {
  const participant = await prisma.quizParticipant.findUnique({
    where: { id: quizParticipantId },
    include: { quiz: true }
  });

  if (!participant) {
    return null;
  }

  const assignment = await prisma.quizParticipantQuestion.findUnique({
    where: {
      quizParticipantId_order: {
        quizParticipantId,
        order: participant.currentQuestionOrder
      }
    },
    include: { question: true }
  });

  if (!assignment) {
    return {
      participant,
      session: participant,
      question: null,
      payload: null
    };
  }

  const existingAnswer = await prisma.playerAnswer.findUnique({
    where: {
      quizParticipantId_questionOrder: {
        quizParticipantId,
        questionOrder: participant.currentQuestionOrder
      }
    },
    select: {
      selectedAnswer: true,
      isCorrect: true,
      isFinalized: true,
      score: true,
      responseTimeMs: true
    }
  });

  const reveal =
    Boolean(existingAnswer?.isFinalized) ||
    participant.status === "SHOWING_ANSWER" ||
    participant.status === "LEADERBOARD" ||
    participant.status === "FINISHED";

  return {
    participant,
    session: participant,
    question: assignment.question,
    payload: toPublicQuestion(
      assignment.question,
      participant.currentQuestionOrder,
      participant.totalQuestions,
      reveal,
      existingAnswer
    )
  };
}

export async function answerCurrentQuestion(input: {
  quizId: string;
  quizParticipantId: string;
  questionId: string;
  selectedAnswer: AnswerKey;
}) {
  const participant = await prisma.quizParticipant.findUnique({
    where: { id: input.quizParticipantId },
    include: {
      quiz: true,
      player: true
    }
  });

  if (!participant || participant.quizId !== input.quizId) {
    throw new Error("Participant not found");
  }

  const quiz = participant.quiz;

  if (participant.status !== "QUESTION_ACTIVE") {
    throw new Error("Question is not active");
  }

  const assignment = await prisma.quizParticipantQuestion.findUnique({
    where: {
      quizParticipantId_order: {
        quizParticipantId: participant.id,
        order: participant.currentQuestionOrder
      }
    },
    include: { question: true }
  });

  if (!assignment || assignment.questionId !== input.questionId) {
    throw new Error("Question is not active for this participant");
  }

  const responseTimeMs = calculateResponseTimeMs(participant.questionStartedAt);
  const existing = await prisma.playerAnswer.findUnique({
    where: {
      quizParticipantId_questionOrder: {
        quizParticipantId: participant.id,
        questionOrder: participant.currentQuestionOrder
      }
    }
  });

  if (existing?.isFinalized) {
    return { answer: existing, participant, quiz, session: participant };
  }

  const responseField = responseFieldForAnswer(input.selectedAnswer);
  const firstResponseTimeForSelected = existing?.[responseField] ?? responseTimeMs;

  const answer = existing
    ? await prisma.playerAnswer.update({
        where: { id: existing.id },
        data: {
          selectedAnswer: input.selectedAnswer,
          isCorrect: false,
          isFinalized: false,
          responseTimeMs: firstResponseTimeForSelected,
          [responseField]: existing[responseField] ?? responseTimeMs,
          score: 0,
          submittedAt: new Date(),
          finalizedAt: null
        }
      })
    : await prisma.playerAnswer.create({
        data: {
          quizId: quiz.id,
          playerId: participant.playerId,
          quizParticipantId: participant.id,
          questionId: assignment.questionId,
          questionOrder: participant.currentQuestionOrder,
          selectedAnswer: input.selectedAnswer,
          isCorrect: false,
          isFinalized: false,
          responseTimeMs,
          [responseField]: responseTimeMs,
          score: 0
        }
      });

  return { answer, participant, quiz, session: participant };
}

export async function finalizeCurrentQuestion(quizParticipantId: string) {
  const participant = await prisma.quizParticipant.findUnique({
    where: { id: quizParticipantId },
    include: { quiz: true }
  });

  if (!participant) {
    throw new Error("Participant not found");
  }

  if (participant.status !== "QUESTION_ACTIVE") {
    return { participant };
  }

  const assignment = await prisma.quizParticipantQuestion.findUnique({
    where: {
      quizParticipantId_order: {
        quizParticipantId: participant.id,
        order: participant.currentQuestionOrder
      }
    },
    include: { question: true }
  });

  if (!assignment) {
    throw new Error("Question not found");
  }

  const existing = await prisma.playerAnswer.findUnique({
    where: {
      quizParticipantId_questionOrder: {
        quizParticipantId: participant.id,
        questionOrder: participant.currentQuestionOrder
      }
    }
  });

  const fallbackResponseTimeMs = calculateResponseTimeMs(participant.questionStartedAt);
  const responseTimeMs = existing
    ? getFirstResponseTimeForAnswer(existing.selectedAnswer, existing)
    : fallbackResponseTimeMs;
  const selectedAnswer = existing?.selectedAnswer ?? null;
  const isCorrect =
    selectedAnswer !== null &&
    selectedAnswer === assignment.question.correctAnswer &&
    responseTimeMs <= assignment.question.timeLimit * 1000;
  const score = calculateScore({ isCorrect, responseTimeMs });

  const [, updatedParticipant] = await prisma.$transaction([
    existing
      ? prisma.playerAnswer.update({
          where: { id: existing.id },
          data: {
            isCorrect,
            isFinalized: true,
            responseTimeMs,
            score,
            finalizedAt: new Date()
          }
        })
      : prisma.playerAnswer.create({
          data: {
            quizId: participant.quizId,
            playerId: participant.playerId,
            quizParticipantId: participant.id,
            questionId: assignment.questionId,
            questionOrder: participant.currentQuestionOrder,
            selectedAnswer: null,
            isCorrect: false,
            isFinalized: true,
            responseTimeMs,
            score: 0,
            finalizedAt: new Date()
          }
        }),
    prisma.quizParticipant.update({
      where: { id: participant.id },
      data: { status: "SHOWING_ANSWER" }
    })
  ]);

  return { participant: updatedParticipant };
}

export async function skipCurrentQuestion(quizParticipantId: string) {
  return finalizeCurrentQuestion(quizParticipantId);
}

export async function advanceParticipant(quizParticipantId: string) {
  const participant = await prisma.quizParticipant.findUnique({
    where: { id: quizParticipantId }
  });

  if (!participant) {
    throw new Error("Participant not found");
  }

  const existingAnswer = await prisma.playerAnswer.findUnique({
    where: {
      quizParticipantId_questionOrder: {
        quizParticipantId: participant.id,
        questionOrder: participant.currentQuestionOrder
      }
    }
  });

  if ((!existingAnswer || !existingAnswer.isFinalized) && participant.status === "QUESTION_ACTIVE") {
    await finalizeCurrentQuestion(participant.id);
  }

  if (participant.currentQuestionOrder >= participant.totalQuestions) {
    return prisma.quizParticipant.update({
      where: { id: participant.id },
      data: {
        status: "FINISHED",
        endedAt: new Date(),
        isOnline: false
      }
    });
  }

  return prisma.quizParticipant.update({
    where: { id: participant.id },
    data: {
      status: "QUESTION_ACTIVE",
      currentQuestionOrder: participant.currentQuestionOrder + 1,
      questionStartedAt: new Date()
    }
  });
}

export async function getLeaderboard(quizId: string): Promise<LeaderboardRow[]> {
  const participants = await prisma.quizParticipant.findMany({
    where: { quizId },
    include: {
      player: true,
      answers: true
    }
  });

  return participants
    .map((participant) => {
      const finalizedAnswers = participant.answers.filter((answer) => answer.isFinalized);
      const totalScore = finalizedAnswers.reduce((sum, answer) => sum + answer.score, 0);
      const correctCount = finalizedAnswers.filter((answer) => answer.isCorrect).length;
      const wrongCount = finalizedAnswers.filter((answer) => !answer.isCorrect).length;
      const averageResponseTimeMs =
        finalizedAnswers.length === 0
          ? 0
          : Math.round(
              finalizedAnswers.reduce((sum, answer) => sum + answer.responseTimeMs, 0) /
                finalizedAnswers.length
            );

      return {
        rank: 0,
        quizParticipantId: participant.id,
        playerId: participant.playerId,
        playerName: participant.player.name,
        totalScore,
        correctCount,
        wrongCount,
        averageResponseTimeMs
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || a.averageResponseTimeMs - b.averageResponseTimeMs)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function getAnsweredCount(quizId: string, questionOrder: number) {
  const [answeredCount, totalParticipants] = await Promise.all([
    prisma.playerAnswer.count({ where: { quizId, questionOrder, isFinalized: true } }),
    prisma.quizParticipant.count({ where: { quizId } })
  ]);

  return { answeredCount, totalParticipants };
}

export type QuizWithSession = Prisma.QuizGetPayload<{
  include: { session: true };
}>;

export function sessionPayload(quiz: QuizWithSession, session: QuizSession) {
  return {
    quizId: quiz.id,
    quizCode: quiz.code,
    status: session.status,
    currentQuestionOrder: session.currentQuestionOrder,
    totalQuestions: session.totalQuestions,
    questionStartedAt: session.questionStartedAt?.toISOString() ?? null
  };
}
