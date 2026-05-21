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
  isSavingAnswer?: boolean;
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
  isSavingAnswer,
  onSelectAnswer
}: QuestionScreenProps) {
  const responseSeconds =
    typeof responseTimeMs === "number" ? (responseTimeMs / 1000).toFixed(1) : null;

  return (
    <main className="quiz-gradient h-[100dvh] overflow-y-auto px-3 py-3 text-white sm:overflow-hidden sm:px-5 sm:py-4 lg:px-7 lg:py-5">
      <motion.section
        key={question.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mx-auto flex h-full max-w-7xl flex-col"
      >
        <header className="flex shrink-0 items-center justify-between gap-3">
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold text-cyan-50 backdrop-blur sm:px-5 sm:py-2 sm:text-base">
            Câu {currentQuestion}/{totalQuestions}
          </div>
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold text-cyan-50 backdrop-blur sm:px-5 sm:py-2 sm:text-base">
            {showCorrectAnswer ? "Kết quả" : isSavingAnswer ? "Đang lưu" : "Đang trả lời"}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 py-3 sm:gap-4 sm:py-4 lg:gap-5">
          <div className="grid shrink-0 items-center gap-3 sm:gap-4 md:grid-cols-[7rem_minmax(0,1fr)_7rem] lg:grid-cols-[8rem_minmax(0,1fr)_8rem]">
            <div className="justify-self-center md:justify-self-start">
              <CountdownCircle timeLeft={timeLeft} timeLimit={timeLimit} />
            </div>

            <div className="min-w-0 text-center">
              <h1 className="text-2xl font-black leading-tight text-white drop-shadow-xl sm:text-3xl lg:text-4xl xl:text-5xl">
                {question.text}
              </h1>
            </div>

            <div className="hidden md:block" />
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:grid-rows-2 sm:gap-4 lg:gap-5">
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

          <div className="min-h-10 shrink-0 text-center text-lg font-bold text-cyan-50 sm:min-h-12 sm:text-xl lg:text-2xl">
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
              <div className="mt-1 text-sm font-medium text-cyan-100 sm:text-base lg:text-lg">{question.explanation}</div>
            )}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
