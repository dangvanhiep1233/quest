"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

type Quiz = {
  id: string;
  title: string;
  code: string;
  status: string;
  questionsPerSession: number;
  defaultTimeLimit: number;
  randomizeQuestions: boolean;
  _count?: { questions: number; participants: number };
};

export function QuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("Cuộc thi mới");
  const [code, setCode] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/quizzes", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setQuizzes(payload.quizzes);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createQuiz() {
    setSaving(true);
    await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        code,
        description: "",
        defaultTimeLimit: 15,
        questionsPerSession: 20,
        randomizeQuestions: true,
        allowChangeAnswer: false,
        showCorrectAnswer: true
      })
    });
    setCode("");
    setSaving(false);
    await load();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Tạo cuộc thi</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void createQuiz();
          }}
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Tên cuộc thi"
          />
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-black uppercase"
            placeholder="Mã, ví dụ DEMO123"
          />
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-black text-white">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            Tạo
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Danh sách cuộc thi</h2>
        {loading ? (
          <div className="mt-5 text-slate-500">Đang tải...</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Tên</th>
                  <th>Mã</th>
                  <th>Trạng thái</th>
                  <th>Câu</th>
                  <th>Người chơi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="border-t border-slate-100">
                    <td className="py-3 font-bold text-slate-950">{quiz.title}</td>
                    <td className="font-black text-blue-700">{quiz.code}</td>
                    <td>{quiz.status}</td>
                    <td>{quiz._count?.questions ?? 0}</td>
                    <td>{quiz._count?.participants ?? 0}</td>
                    <td className="space-x-2 text-right">
                      <Link href={`/admin/quizzes/${quiz.id}`} className="rounded-lg bg-slate-100 px-3 py-2 font-bold">
                        Sửa
                      </Link>
                      <Link href={`/admin/questions/${quiz.id}`} className="rounded-lg bg-slate-100 px-3 py-2 font-bold">
                        Câu hỏi
                      </Link>
                      <Link href={`/admin/control/${quiz.id}`} className="rounded-lg bg-blue-700 px-3 py-2 font-bold text-white">
                        Điều khiển
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
