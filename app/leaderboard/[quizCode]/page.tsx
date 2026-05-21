"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LeaderboardTable } from "@/components/quiz/LeaderboardTable";
import type { LeaderboardRow } from "@/lib/realtime-events";

export default function PublicLeaderboardPage() {
  const params = useParams<{ quizCode: string }>();
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      const response = await fetch(`/api/quizzes/code/${params.quizCode}/leaderboard`, { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) {
        setLeaders(payload.leaders);
      }
    }

    void fetchLeaderboard();
    const timer = window.setInterval(fetchLeaderboard, 2500);
    return () => window.clearInterval(timer);
  }, [params.quizCode]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <section className="mx-auto max-w-5xl">
        <h1 className="mb-5 text-3xl font-black text-slate-950">Bảng xếp hạng</h1>
        <LeaderboardTable leaders={leaders} />
      </section>
    </main>
  );
}
