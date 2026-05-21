"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { QuestionScreen } from "@/components/quiz/QuestionScreen";
import type { AnswerKey } from "@/lib/realtime-events";

type CurrentQuestionResponse = {
  session: {
    status: string;
    currentQuestionOrder: number;
    totalQuestions: number;
    questionStartedAt: string | null;
  };
  question: {
    id: string;
    text: string;
    options: Array<{ key: AnswerKey; text: string }>;
    correctAnswer?: AnswerKey;
    explanation?: string | null;
    timeLimit: number;
    currentQuestion: number;
    totalQuestions: number;
    existingAnswer?: {
      selectedAnswer: AnswerKey | null;
      selectionVersion: number;
      isCorrect: boolean;
      isFinalized: boolean;
      score: number;
      responseTimeMs: number;
    } | null;
  } | null;
};

export default function PlayPage() {
  const params = useParams<{ quizCode: string }>();
  const router = useRouter();
  const quizCode = params.quizCode;
  const [participantId, setParticipantId] = useState("");
  const [quizId, setQuizId] = useState("");
  const [data, setData] = useState<CurrentQuestionResponse | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerKey | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [answerSavingCount, setAnswerSavingCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [handledTimeoutKey, setHandledTimeoutKey] = useState("");
  const selectionVersionRef = useRef(0);
  const inFlightAnswerRequests = useRef(new Set<Promise<void>>());

  useEffect(() => {
    const stored = localStorage.getItem(`quiz:${quizCode}`);
    if (!stored) {
      router.replace("/join");
      return;
    }
    const parsed = JSON.parse(stored);
    setParticipantId(parsed.quizParticipantId);
    setQuizId(parsed.quizId);
  }, [quizCode, router]);

  const fetchQuestion = useCallback(async () => {
    if (!participantId) {
      return;
    }
    const response = await fetch(`/api/participants/${participantId}/questions/current`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setData(payload);
      setSelectedAnswer(payload.question?.existingAnswer?.selectedAnswer ?? undefined);
      selectionVersionRef.current = Math.max(
        selectionVersionRef.current,
        payload.question?.existingAnswer?.selectionVersion ?? 0
      );
      if (payload.session.status === "FINISHED") {
        router.replace(`/result/${quizCode}`);
      }
    }
  }, [participantId, quizCode, router]);

  useEffect(() => {
    void fetchQuestion();
  }, [fetchQuestion]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const timeLeft = useMemo(() => {
    if (!data?.session.questionStartedAt || !data.question) {
      return data?.question?.timeLimit ?? 15;
    }
    const elapsed = (now - new Date(data.session.questionStartedAt).getTime()) / 1000;
    return Math.max(0, data.question.timeLimit - elapsed);
  }, [data, now]);

  const submitAnswer = useCallback(
    (answer: AnswerKey, selectionVersion: number, questionId: string) => {
      if (!quizId || !participantId) {
        return;
      }

      setAnswerSavingCount((count) => count + 1);

      const request = (async () => {
        try {
          const response = await fetch("/api/answers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quizId,
              quizParticipantId: participantId,
              questionId,
              selectedAnswer: answer,
              selectionVersion
            })
          });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.error || "Không thể gửi đáp án");
          }

          setData((current) => {
            if (!current?.question || current.question.id !== questionId) {
              return current;
            }

            const currentVersion = current.question.existingAnswer?.selectionVersion ?? 0;
            const payloadVersion = payload.answer?.selectionVersion ?? selectionVersion;
            if (payloadVersion < currentVersion) {
              return current;
            }

            return {
              ...current,
              question: {
                ...current.question,
                existingAnswer: {
                  selectedAnswer: payload.answer.selectedAnswer,
                  selectionVersion: payloadVersion,
                  isCorrect: payload.answer.isCorrect,
                  isFinalized: payload.answer.isFinalized,
                  score: payload.answer.score,
                  responseTimeMs: payload.answer.responseTimeMs
                }
              }
            };
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Không thể gửi đáp án");
        }
      })();

      inFlightAnswerRequests.current.add(request);
      request.finally(() => {
        inFlightAnswerRequests.current.delete(request);
        setAnswerSavingCount((count) => Math.max(0, count - 1));
      });
    },
    [participantId, quizId]
  );

  function handleSelect(answer: AnswerKey) {
    if (
      !data?.question ||
      data.question.existingAnswer?.isFinalized ||
      data.session.status !== "QUESTION_ACTIVE" ||
      timeLeft <= 0
    ) {
      return;
    }

    setSelectedAnswer(answer);
    setError("");
    const selectionVersion = selectionVersionRef.current + 1;
    selectionVersionRef.current = selectionVersion;
    submitAnswer(answer, selectionVersion, data.question.id);
  }

  async function handleNext() {
    if (!participantId) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/participants/${participantId}/next`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Không thể chuyển câu");
      }

      if (payload.participant.status === "FINISHED") {
        router.replace(`/result/${quizCode}`);
        return;
      }

      setSelectedAnswer(undefined);
      await fetchQuestion();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chuyển câu");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    async function markTimeout() {
      if (!participantId || !data?.question || data.question.existingAnswer?.isFinalized || submitting) {
        return;
      }

      const timeoutKey = `${participantId}:${data.question.id}`;
      if (timeLeft > 0 || data.session.status !== "QUESTION_ACTIVE" || handledTimeoutKey === timeoutKey) {
        return;
      }

      setHandledTimeoutKey(timeoutKey);
      setSubmitting(true);
      try {
        await Promise.allSettled(Array.from(inFlightAnswerRequests.current));
        await fetch(`/api/participants/${participantId}/skip`, { method: "POST" });
        await fetchQuestion();
      } finally {
        setSubmitting(false);
      }
    }

    void markTimeout();
  }, [data, fetchQuestion, handledTimeoutKey, participantId, submitting, timeLeft]);

  if (!data?.question) {
    return (
      <main className="quiz-gradient grid min-h-screen place-items-center px-4 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin" />
          <div className="mt-4 text-2xl font-black">Đang tải câu hỏi</div>
          {error && <div className="mt-3 text-red-100">{error}</div>}
        </div>
      </main>
    );
  }

  const showCorrectAnswer =
    Boolean(data.question.existingAnswer?.isFinalized) ||
    data.session.status === "SHOWING_ANSWER" ||
    data.session.status === "LEADERBOARD";
  const locked =
    Boolean(data.question.existingAnswer?.isFinalized) ||
    data.session.status !== "QUESTION_ACTIVE" ||
    timeLeft <= 0;

  return (
    <>
      <QuestionScreen
        question={data.question}
        currentQuestion={data.question.currentQuestion}
        totalQuestions={data.question.totalQuestions}
        timeLeft={timeLeft}
        timeLimit={data.question.timeLimit}
        selectedAnswer={selectedAnswer}
        locked={locked}
        showCorrectAnswer={showCorrectAnswer}
        score={data.question.existingAnswer?.score}
        responseTimeMs={data.question.existingAnswer?.responseTimeMs}
        isSavingAnswer={answerSavingCount > 0}
        onSelectAnswer={handleSelect}
      />
      {showCorrectAnswer && (
        <button
          type="button"
          onClick={() => void handleNext()}
          disabled={submitting}
          className="fixed bottom-5 right-5 z-20 rounded-2xl bg-yellow-300 px-6 py-4 text-lg font-black text-blue-950 shadow-xl transition hover:bg-white disabled:opacity-60"
        >
          {data.question.currentQuestion >= data.question.totalQuestions ? "Xem kết quả" : "Câu tiếp theo"}
        </button>
      )}
      {error && (
        <div className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg">
          {error}
        </div>
      )}
    </>
  );
}
