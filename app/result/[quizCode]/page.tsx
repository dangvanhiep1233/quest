"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/quiz/LeaderboardTable";
import type { LeaderboardRow } from "@/lib/realtime-events";
import { formatScore } from "@/lib/utils";

export default function ResultPage() {
  const params = useParams<{ quizCode: string }>();
  const router = useRouter();
  const [quizParticipantId, setQuizParticipantId] = useState("");
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(`quiz:${params.quizCode}`);
    if (!stored) {
      router.replace("/join");
      return;
    }
    setQuizParticipantId(JSON.parse(stored).quizParticipantId);

    async function fetchLeaderboard() {
      const response = await fetch(`/api/quizzes/code/${params.quizCode}/leaderboard`, { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) {
        setLeaders(payload.leaders);
      }
    }

    void fetchLeaderboard();
  }, [params.quizCode, router]);

  const me = useMemo(
    () => leaders.find((row) => row.quizParticipantId === quizParticipantId),
    [leaders, quizParticipantId]
  );

  return (
    <main className="quiz-gradient min-h-screen px-4 py-8 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-[2rem] border border-white/20 bg-white/12 p-7 text-center shadow-glow backdrop-blur">
          <Trophy className="mx-auto h-14 w-14 text-yellow-200" />
          <h1 className="mt-3 text-4xl font-black">Kết quả cá nhân</h1>
          {me ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/12 p-4">
                <div className="text-sm font-bold text-cyan-100">Xếp hạng</div>
                <div className="text-4xl font-black">#{me.rank}</div>
              </div>
              <div className="rounded-2xl bg-white/12 p-4">
                <div className="text-sm font-bold text-cyan-100">Điểm</div>
                <div className="text-4xl font-black">{formatScore(me.totalScore)}</div>
              </div>
              <div className="rounded-2xl bg-white/12 p-4">
                <div className="text-sm font-bold text-cyan-100">Câu đúng</div>
                <div className="text-4xl font-black">{me.correctCount}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-cyan-100">Chưa có kết quả</div>
          )}
          <Link
            href={`/leaderboard/${params.quizCode}`}
            className="mt-6 inline-flex rounded-full bg-cyan-300 px-5 py-3 font-black text-blue-950"
          >
            Xem bảng xếp hạng
          </Link>
        </div>
        <LeaderboardTable leaders={leaders} />
      </section>
    </main>
  );
}
