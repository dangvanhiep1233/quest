"use client";

import { motion } from "framer-motion";
import type { AnswerKey } from "@/lib/realtime-events";
import { AnswerOption } from "@/components/quiz/AnswerOption";
import { CountdownCircle } from "@/components/quiz/CountdownCircle";
import { formatScore } from "@/lib/utils";

export type QuestionScreenProps = {
  question: {
    id: string;
    text: string;
    options: {
      key: AnswerKey;
      text: string;
    }[];
    correctAnswer?: AnswerKey;
    explanation?: string | null;
  };
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  timeLimit: number;
  selectedAnswer?: AnswerKey;
  locked: boolean;
  showCorrectAnswer: boolean;
  score?: number;
  responseTimeMs?: number;
  onSelectAnswer: (answer: AnswerKey) => void;
};

export function QuestionScreen({
  question,
  currentQuestion,
  totalQuestions,
  timeLeft,
  timeLimit,
  selectedAnswer,
  locked,
  showCorrectAnswer,
  score,
  responseTimeMs,
  onSelectAnswer
}: QuestionScreenProps) {
  const responseSeconds =
    typeof responseTimeMs === "number" ? (responseTimeMs / 1000).toFixed(1) : null;

  return (
    <main className="quiz-gradient min-h-screen overflow-hidden px-4 py-5 text-white sm:px-8 sm:py-7">
      <motion.section
        key={question.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col"
      >
        <header className="flex items-center justify-between gap-4">
          <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-bold text-cyan-50 backdrop-blur">
            Câu {currentQuestion}/{totalQuestions}
          </div>
          <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-bold text-cyan-50 backdrop-blur">
            {locked ? "Đã ghi nhận" : "Chọn đáp án"}
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-5 sm:gap-7">
          <CountdownCircle timeLeft={timeLeft} timeLimit={timeLimit} />

          <div className="max-w-5xl text-center">
            <h1 className="text-3xl font-black leading-tight text-white drop-shadow-xl sm:text-5xl lg:text-6xl">
              {question.text}
            </h1>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
            {question.options.map((option) => {
              const isCorrect = showCorrectAnswer && question.correctAnswer === option.key;
              const isWrong =
                showCorrectAnswer &&
                selectedAnswer === option.key &&
                question.correctAnswer !== option.key;

              return (
                <AnswerOption
                  key={option.key}
                  optionKey={option.key}
                  text={option.text}
                  selected={selectedAnswer === option.key}
                  locked={locked}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                  onSelect={onSelectAnswer}
                />
              );
            })}
          </div>

          <div className="min-h-14 text-center text-xl font-bold text-cyan-50 sm:text-2xl">
            {showCorrectAnswer && typeof score === "number" && (
              <div>
                Điểm câu này: <strong className="text-yellow-200">{formatScore(score)}</strong>
                {responseSeconds !== null && (
                  <span className="ml-3 text-cyan-100">
                    Thời gian: <strong className="text-white">{responseSeconds}s</strong>
                  </span>
                )}
              </div>
            )}
            {showCorrectAnswer && question.explanation && (
              <div className="mt-2 text-base font-medium text-cyan-100 sm:text-lg">{question.explanation}</div>
            )}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
