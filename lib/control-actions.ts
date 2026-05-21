import type { SessionStatus, QuizStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publishRealtimeEvent } from "@/lib/realtime";
import { getAnsweredCount, getLeaderboard, sessionPayload } from "@/lib/quiz-data";

export type ControlAction =
  | "open"
  | "start"
  | "next-question"
  | "show-answer"
  | "show-leaderboard"
  | "pause"
  | "resume"
  | "finish";

function statusForAction(action: ControlAction): {
  quizStatus?: QuizStatus;
  sessionStatus?: SessionStatus;
  startedAt?: Date;
  endedAt?: Date;
  questionStartedAt?: Date | null;
  incrementQuestion?: boolean;
} {
  const now = new Date();

  switch (action) {
    case "open":
      return { quizStatus: "OPEN", sessionStatus: "WAITING", questionStartedAt: null };
    case "start":
      return { quizStatus: "RUNNING", sessionStatus: "QUESTION_ACTIVE", startedAt: now, questionStartedAt: now };
    case "next-question":
      return {
        quizStatus: "RUNNING",
        sessionStatus: "QUESTION_ACTIVE",
        questionStartedAt: now,
        incrementQuestion: true
      };
    case "show-answer":
      return { quizStatus: "RUNNING", sessionStatus: "SHOWING_ANSWER" };
    case "show-leaderboard":
      return { quizStatus: "RUNNING", sessionStatus: "LEADERBOARD" };
    case "pause":
      return { quizStatus: "PAUSED", sessionStatus: "WAITING", questionStartedAt: null };
    case "resume":
      return { quizStatus: "RUNNING", sessionStatus: "QUESTION_ACTIVE", questionStartedAt: now };
    case "finish":
      return { quizStatus: "FINISHED", sessionStatus: "FINISHED", endedAt: now, questionStartedAt: null };
  }
}

export async function runControlAction(quizId: string, action: ControlAction) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { session: true }
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  const target = statusForAction(action);
  const existingSession =
    quiz.session ??
    (await prisma.quizSession.create({
      data: {
        quizId: quiz.id,
        currentQuestionOrder: 1,
        totalQuestions: quiz.questionsPerSession,
        status: "WAITING"
      }
    }));

  const nextOrder = target.incrementQuestion
    ? Math.min(existingSession.currentQuestionOrder + 1, existingSession.totalQuestions)
    : action === "start"
      ? 1
      : existingSession.currentQuestionOrder;

  const [updatedQuiz, updatedSession] = await prisma.$transaction([
    prisma.quiz.update({
      where: { id: quiz.id },
      data: target.quizStatus ? { status: target.quizStatus } : {},
      include: { session: true }
    }),
    prisma.quizSession.update({
      where: { quizId: quiz.id },
      data: {
        status: target.sessionStatus,
        currentQuestionOrder: nextOrder,
        questionStartedAt: target.questionStartedAt,
        startedAt: target.startedAt,
        endedAt: target.endedAt
      }
    })
  ]);

  const sessionUpdate = sessionPayload(updatedQuiz, updatedSession);
  await publishRealtimeEvent(quiz.code, "session:update", sessionUpdate);

  if (action === "start") {
    await publishRealtimeEvent(quiz.code, "quiz:start", {
      quizCode: quiz.code,
      quizId: quiz.id,
      currentQuestionOrder: updatedSession.currentQuestionOrder,
      questionStartedAt: updatedSession.questionStartedAt?.toISOString() ?? new Date().toISOString()
    });
  }

  if (action === "next-question") {
    await publishRealtimeEvent(quiz.code, "quiz:next-question", {
      quizCode: quiz.code,
      quizId: quiz.id,
      currentQuestionOrder: updatedSession.currentQuestionOrder,
      totalQuestions: updatedSession.totalQuestions,
      questionStartedAt: updatedSession.questionStartedAt?.toISOString() ?? new Date().toISOString()
    });
  }

  if (action === "show-answer") {
    await publishRealtimeEvent(quiz.code, "quiz:show-answer", {
      quizCode: quiz.code,
      quizId: quiz.id,
      currentQuestionOrder: updatedSession.currentQuestionOrder
    });
  }

  if (action === "pause") {
    await publishRealtimeEvent(quiz.code, "quiz:pause", { quizCode: quiz.code, quizId: quiz.id });
  }

  if (action === "finish") {
    await publishRealtimeEvent(quiz.code, "quiz:finish", { quizCode: quiz.code, quizId: quiz.id });
  }

  const [{ answeredCount, totalParticipants }, leaders] = await Promise.all([
    getAnsweredCount(quiz.id, updatedSession.currentQuestionOrder),
    getLeaderboard(quiz.id)
  ]);

  await publishRealtimeEvent(quiz.code, "answers:count-update", {
    quizId: quiz.id,
    quizCode: quiz.code,
    currentQuestionOrder: updatedSession.currentQuestionOrder,
    answeredCount,
    totalParticipants
  });

  await publishRealtimeEvent(quiz.code, "leaderboard:update", {
    quizId: quiz.id,
    quizCode: quiz.code,
    leaders
  });

  return {
    quiz: updatedQuiz,
    session: updatedSession,
    answeredCount,
    totalParticipants,
    leaders
  };
}
