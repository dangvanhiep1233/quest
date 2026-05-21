"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";

type SessionPayload = {
  status: string;
  currentQuestionOrder: number;
  totalQuestions: number;
};

export default function LobbyPage() {
  const params = useParams<{ quizCode: string }>();
  const router = useRouter();
  const quizCode = params.quizCode;
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(`quiz:${quizCode}`);
      if (!stored) {
        router.replace("/join");
        return;
      }

      const data = JSON.parse(stored);
      setPlayerName(data.name);
      router.replace(`/play/${quizCode}`);

    async function fetchSession() {
      const response = await fetch(`/api/quizzes/code/${quizCode}/session`, { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) {
        setSession(payload.session);
        if (payload.session.status === "QUESTION_ACTIVE" || payload.session.status === "SHOWING_ANSWER") {
          router.replace(`/play/${quizCode}`);
        }
        if (payload.session.status === "FINISHED") {
          router.replace(`/result/${quizCode}`);
        }
      }
    }

    void fetchSession();
    const timer = window.setInterval(fetchSession, 2000);
    return () => window.clearInterval(timer);
  }, [quizCode, router]);

  return (
    <main className="quiz-gradient flex min-h-screen items-center justify-center px-4 py-8 text-white">
      <section className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-white/12 p-8 text-center shadow-glow backdrop-blur-md">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-cyan-300 text-blue-950">
          <Play className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-black sm:text-5xl">Phòng chờ</h1>
        <p className="mt-3 text-xl font-bold text-cyan-50">{playerName}</p>
        <div className="mt-8 rounded-3xl bg-white/10 p-5">
          <div className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-100">Mã cuộc thi</div>
          <div className="mt-2 text-5xl font-black tracking-[0.18em]">{quizCode}</div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-3 text-lg font-bold text-cyan-50">
          <Loader2 className="h-6 w-6 animate-spin" />
          Đang chờ admin bắt đầu
        </div>
        {session && (
          <div className="mt-4 text-sm font-semibold text-cyan-100">
            Trạng thái: {session.status} · Câu {session.currentQuestionOrder}/{session.totalQuestions}
          </div>
        )}
      </section>
    </main>
  );
}
