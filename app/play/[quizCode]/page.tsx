"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type AnswerResponseTimes = Partial<Record<AnswerKey, number>>;

function answerDraftKey(participantId: string, questionId: string) {
  return `quiz-answer:${participantId}:${questionId}`;
}

function readAnswerDraft(key: string) {
  try {
    const draft = JSON.parse(localStorage.getItem(key) || "null") as
      | {
          selectedAnswer?: AnswerKey;
          answerResponseTimes?: AnswerResponseTimes;
        }
      | null;

    return draft;
  } catch {
    return null;
  }
}

function writeAnswerDraft(key: string, selectedAnswer: AnswerKey, answerResponseTimes: AnswerResponseTimes) {
  localStorage.setItem(key, JSON.stringify({ selectedAnswer, answerResponseTimes }));
}

function getBrowserResponseTimeMs(data: CurrentQuestionResponse | null) {
  if (!data?.session.questionStartedAt || !data.question) {
    return 0;
  }

  const elapsedMs = Date.now() - new Date(data.session.questionStartedAt).getTime();
  return Math.max(0, Math.min(Math.round(elapsedMs), data.question.timeLimit * 1000));
}

export default function PlayPage() {
  const params = useParams<{ quizCode: string }>();
  const router = useRouter();
  const quizCode = params.quizCode;
  const [participantId, setParticipantId] = useState("");
  const [data, setData] = useState<CurrentQuestionResponse | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerKey | undefined>();
  const [answerResponseTimes, setAnswerResponseTimes] = useState<AnswerResponseTimes>({});
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [handledTimeoutKey, setHandledTimeoutKey] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(`quiz:${quizCode}`);
    if (!stored) {
      router.replace("/join");
      return;
    }
    const parsed = JSON.parse(stored);
    setParticipantId(parsed.quizParticipantId);
  }, [quizCode, router]);

  const fetchQuestion = useCallback(async () => {
    if (!participantId) {
      return;
    }
    const response = await fetch(`/api/participants/${participantId}/questions/current`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setData(payload);
      if (payload.question?.existingAnswer?.isFinalized) {
        setSelectedAnswer(payload.question.existingAnswer.selectedAnswer ?? undefined);
        setAnswerResponseTimes({});
      } else if (payload.question) {
        const draft = readAnswerDraft(answerDraftKey(participantId, payload.question.id));
        setSelectedAnswer(draft?.selectedAnswer ?? payload.question.existingAnswer?.selectedAnswer ?? undefined);
        setAnswerResponseTimes(draft?.answerResponseTimes ?? {});
      } else {
        setSelectedAnswer(undefined);
        setAnswerResponseTimes({});
      }

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
    const responseTimeMs = getBrowserResponseTimeMs(data);
    const draftKey = answerDraftKey(participantId, data.question.id);

    setAnswerResponseTimes((previousTimes) => {
      const nextTimes =
        typeof previousTimes[answer] === "number"
          ? previousTimes
          : { ...previousTimes, [answer]: responseTimeMs };

      writeAnswerDraft(draftKey, answer, nextTimes);
      return nextTimes;
    });
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
      setAnswerResponseTimes({});
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
        const responseTimeMs =
          selectedAnswer && typeof answerResponseTimes[selectedAnswer] === "number"
            ? answerResponseTimes[selectedAnswer]
            : undefined;
        const response = await fetch(`/api/participants/${participantId}/skip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedAnswer: selectedAnswer ?? null,
            responseTimeMs,
            answerResponseTimes
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Không thể tính điểm");
        }
        localStorage.removeItem(answerDraftKey(participantId, data.question.id));
        if (payload.question) {
          setData((current) =>
            current
              ? {
                  ...current,
                  session: {
                    ...current.session,
                    status: payload.participant.status,
                    currentQuestionOrder: payload.participant.currentQuestionOrder,
                    totalQuestions: payload.participant.totalQuestions,
                    questionStartedAt: payload.participant.questionStartedAt
                  },
                  question: payload.question
                }
              : current
          );
          setSelectedAnswer(payload.question.existingAnswer?.selectedAnswer ?? undefined);
          setAnswerResponseTimes({});
        } else {
          await fetchQuestion();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tính điểm");
      } finally {
        setSubmitting(false);
      }
    }

    void markTimeout();
  }, [
    answerResponseTimes,
    data,
    fetchQuestion,
    handledTimeoutKey,
    participantId,
    selectedAnswer,
    submitting,
    timeLeft
  ]);

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
        isSavingAnswer={submitting}
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
