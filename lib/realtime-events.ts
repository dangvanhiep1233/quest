import type { SessionStatus } from "@prisma/client";

export type AnswerKey = "A" | "B" | "C" | "D";

export type LeaderboardRow = {
  rank: number;
  quizParticipantId: string;
  playerId: string;
  playerName: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  averageResponseTimeMs: number;
};

export type RealtimeEvents = {
  "player:join": {
    quizCode: string;
    playerId: string;
    quizParticipantId: string;
    playerName: string;
  };
  "player:answer": {
    quizCode: string;
    quizId: string;
    questionId: string;
    quizParticipantId: string;
    questionOrder: number;
    selectedAnswer: AnswerKey;
  };
  "quiz:start": {
    quizCode: string;
    quizId: string;
    currentQuestionOrder: number;
    questionStartedAt: string;
  };
  "quiz:next-question": {
    quizCode: string;
    quizId: string;
    currentQuestionOrder: number;
    totalQuestions: number;
    questionStartedAt: string;
  };
  "quiz:show-answer": {
    quizCode: string;
    quizId: string;
    currentQuestionOrder: number;
  };
  "quiz:pause": {
    quizCode: string;
    quizId: string;
  };
  "quiz:finish": {
    quizCode: string;
    quizId: string;
  };
  "leaderboard:update": {
    quizId: string;
    quizCode: string;
    leaders: LeaderboardRow[];
  };
  "session:update": {
    quizId: string;
    quizCode: string;
    status: SessionStatus;
    currentQuestionOrder: number;
    totalQuestions: number;
    questionStartedAt: string | null;
  };
  "participants:update": {
    quizId: string;
    quizCode: string;
    onlineCount: number;
    totalCount: number;
  };
  "answers:count-update": {
    quizId: string;
    quizCode: string;
    currentQuestionOrder: number;
    answeredCount: number;
    totalParticipants: number;
  };
};

export type RealtimeEventName = keyof RealtimeEvents;

export function quizChannel(quizCode: string) {
  return `quiz-${quizCode}`;
}
