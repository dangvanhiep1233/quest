"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { LeaderboardTable } from "@/components/quiz/LeaderboardTable";
import type { LeaderboardRow } from "@/lib/realtime-events";

type Quiz = {
  id: string;
  title: string;
  code: string;
  status: string;
  randomizeQuestions: boolean;
  questionsPerSession: number;
  session: {
    status: string;
    currentQuestionOrder: number;
    totalQuestions: number;
    questionStartedAt: string | null;
  } | null;
  _count: {
    questions: number;
    participants: number;
  };
};

type Answer = {
  id: string;
  questionOrder: number;
};

const actions = [
  ["open", "Mở phòng"],
  ["start", "Bắt đầu"],
  ["next-question", "Câu tiếp theo"],
  ["show-answer", "Hiện đáp án"],
  ["show-leaderboard", "Hiện BXH"],
  ["pause", "Tạm dừng"],
  ["resume", "Tiếp tục"],
  ["finish", "Kết thúc"]
] as const;

export function ControlPanel({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [runningAction, setRunningAction] = useState("");

  async function load() {
    const [quizResponse, leaderboardResponse, answersResponse] = await Promise.all([
      fetch(`/api/quizzes/${quizId}`, { cache: "no-store" }),
      fetch(`/api/quizzes/${quizId}/leaderboard`, { cache: "no-store" }),
      fetch(`/api/answers?quizId=${quizId}`, { cache: "no-store" })
    ]);

    const quizPayload = await quizResponse.json();
    const leaderboardPayload = await leaderboardResponse.json();
    const answersPayload = await answersResponse.json();

    if (quizResponse.ok) setQuiz(quizPayload.quiz);
    if (leaderboardResponse.ok) setLeaders(leaderboardPayload.leaders);
    if (answersResponse.ok) setAnswers(answersPayload.answers);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 2500);
    return () => window.clearInterval(timer);
  }, [quizId]);

  const answeredCount = useMemo(() => {
    if (!quiz?.session) return 0;
    return answers.filter((answer) => answer.questionOrder === quiz.session?.currentQuestionOrder).length;
  }, [answers, quiz]);

  async function run(action: string) {
    setRunningAction(action);
    await fetch(`/api/admin/quizzes/${quizId}/${action}`, { method: "POST" });
    setRunningAction("");
    await load();
  }

  if (!quiz) {
    return <div className="text-slate-500">Đang tải...</div>;
  }

  const session = quiz.session;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="space-y-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">{quiz.title}</h2>
              <div className="mt-1 font-black text-blue-700">{quiz.code}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/join`} className="rounded-xl bg-slate-100 px-4 py-3 font-bold">
                Player join
              </Link>
              <a href={`/api/export/results/${quiz.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white">
                <Download className="h-4 w-4" /> Export
              </a>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Stat label="Quiz" value={quiz.status} />
            <Stat label="Session" value={session?.status ?? "WAITING"} />
            <Stat label="Câu hiện tại" value={`${session?.currentQuestionOrder ?? 1}/${session?.totalQuestions ?? quiz.questionsPerSession}`} />
            <Stat label="Đã trả lời" value={`${answeredCount}/${quiz._count.participants}`} />
          </div>
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {quiz.randomizeQuestions
              ? "Quiz đang bật random câu hỏi: admin điều khiển theo thứ tự câu, mỗi người chơi có thể thấy câu khác nhau."
              : "Quiz dùng thứ tự câu hỏi chung, phù hợp trình chiếu một câu trên màn hình lớn."}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-slate-950">Tác vụ tuỳ chọn</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Flow chính không cần các nút này. Player nhập mã là bắt đầu một lượt thi riêng với 20 câu random.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map(([action, label]) => (
              <button
                key={action}
                onClick={() => void run(action)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-black text-white disabled:opacity-60"
                disabled={Boolean(runningAction)}
              >
                {runningAction === action && <Loader2 className="h-4 w-4 animate-spin" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-slate-950">Luồng sử dụng</h3>
          <div className="mt-3 grid gap-3 text-sm font-semibold text-slate-600 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">1. Admin tạo/import 400 câu</div>
            <div className="rounded-xl bg-slate-50 p-3">2. Player nhập mã cuộc thi</div>
            <div className="rounded-xl bg-slate-50 p-3">3. Server random 20 câu/lượt</div>
            <div className="rounded-xl bg-slate-50 p-3">4. Player tự thi đến kết quả</div>
          </div>
        </div>
      </section>

      <aside className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xl font-black text-slate-950">Leaderboard</h3>
        <LeaderboardTable leaders={leaders.slice(0, 10)} />
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}
