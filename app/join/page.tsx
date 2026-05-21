"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { normalizeQuizCode } from "@/lib/utils";

type Step = "code" | "player";

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("code");
  const [quizCode, setQuizCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifyCode() {
    setError("");
    setLoading(true);
    const code = normalizeQuizCode(quizCode);

    try {
      const response = await fetch(`/api/quizzes/code/${code}`);
      if (!response.ok) {
        throw new Error("Không tìm thấy cuộc thi");
      }
      setQuizCode(code);
      setStep("player");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  async function joinQuiz() {
    setError("");
    setLoading(true);
    const stored = localStorage.getItem(`quiz:${quizCode}`);
    const storedData = stored ? JSON.parse(stored) : {};

    try {
      const response = await fetch("/api/players/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizCode,
          playerId: storedData.playerId,
          name,
          phone,
          organization
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể tham gia");
      }

      localStorage.setItem(
        `quiz:${quizCode}`,
        JSON.stringify({
          playerId: data.playerId,
          quizParticipantId: data.quizParticipantId,
          quizId: data.quizId,
          quizCode,
          name
        })
      );
      router.push(`/play/${quizCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="quiz-gradient flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/20 bg-white/12 p-6 text-white shadow-glow backdrop-blur-md sm:p-8">
        <div className="mb-7 text-center">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-100">Realtime Quiz</div>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Vào cuộc thi</h1>
        </div>

        {step === "code" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void verifyCode();
            }}
          >
            <label className="block">
              <span className="text-sm font-bold text-cyan-50">Mã cuộc thi</span>
              <input
                value={quizCode}
                onChange={(event) => setQuizCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white px-5 py-4 text-center text-3xl font-black uppercase tracking-[0.18em] text-blue-950 outline-none ring-cyan-300 focus:ring-4"
                placeholder="DEMO123"
              />
            </label>
            <button
              type="submit"
              disabled={loading || quizCode.trim().length < 3}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 text-xl font-black text-blue-950 transition hover:bg-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ArrowRight className="h-6 w-6" />}
              Tiếp tục
            </button>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void joinQuiz();
            }}
          >
            <label className="block">
              <span className="text-sm font-bold text-cyan-50">Tên người chơi</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white px-5 py-4 text-xl font-bold text-blue-950 outline-none ring-cyan-300 focus:ring-4"
                placeholder="Nhập tên"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-cyan-50">Số điện thoại</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-white px-4 py-3 font-semibold text-blue-950 outline-none ring-cyan-300 focus:ring-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-cyan-50">Đơn vị</span>
                <input
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-white px-4 py-3 font-semibold text-blue-950 outline-none ring-cyan-300 focus:ring-4"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={loading || name.trim().length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 text-xl font-black text-blue-950 transition hover:bg-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ArrowRight className="h-6 w-6" />}
              Bắt đầu thi
            </button>
          </form>
        )}

        {error && <div className="mt-4 rounded-2xl bg-red-500/20 px-4 py-3 text-sm font-bold text-red-50">{error}</div>}
      </section>
    </main>
  );
}
