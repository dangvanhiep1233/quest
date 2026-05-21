"use client";

import { useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";

type Question = {
  id: string;
  topic: string;
  order: number;
  text: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string | null;
  score: number;
  timeLimit: number;
};

const emptyQuestion = {
  id: "",
  topic: "Chung",
  order: 1,
  text: "",
  imageUrl: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A" as const,
  explanation: "",
  score: 2,
  timeLimit: 15
};

export function QuestionManager({ quizId }: { quizId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<Question>(emptyQuestion);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch(`/api/quizzes/${quizId}/questions`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setQuestions(payload.questions);
      setForm((current) => ({ ...current, order: payload.questions.length + 1 }));
    }
  }

  useEffect(() => {
    void load();
  }, [quizId]);

  async function saveQuestion() {
    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/questions/${form.id}` : `/api/quizzes/${quizId}/questions`;
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Không lưu được câu hỏi");
      return;
    }
    setMessage("Đã lưu câu hỏi");
    setForm({ ...emptyQuestion, order: questions.length + 2 });
    await load();
  }

  async function deleteQuestion(id: string) {
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    await load();
  }

  async function importQuestions() {
    if (!file) return;
    const formData = new FormData();
    formData.append("quizId", quizId);
    formData.append("file", file);
    const response = await fetch("/api/import/questions", { method: "POST", body: formData });
    const payload = await response.json();
    setMessage(
      response.ok
        ? `Đã import ${payload.imported} câu: tạo mới ${payload.created}, cập nhật ${payload.updated}`
        : payload.error
    );
    await load();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">{form.id ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void saveQuestion();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.topic}
              onChange={(event) => setForm({ ...form, topic: event.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Chủ đề"
            />
            <input
              type="number"
              value={form.order}
              onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Thứ tự"
            />
            <select
              value={form.correctAnswer}
              onChange={(event) => setForm({ ...form, correctAnswer: event.target.value as Question["correctAnswer"] })}
              className="col-span-2 rounded-xl border border-slate-300 px-3 py-2"
            >
              {["A", "B", "C", "D"].map((key) => (
                <option key={key}>{key}</option>
              ))}
            </select>
          </div>
          <textarea
            value={form.text}
            onChange={(event) => setForm({ ...form, text: event.target.value })}
            className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Nội dung câu hỏi"
          />
          {(["optionA", "optionB", "optionC", "optionD"] as const).map((key) => (
            <input
              key={key}
              value={form[key]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder={key}
            />
          ))}
          <textarea
            value={form.explanation ?? ""}
            onChange={(event) => setForm({ ...form, explanation: event.target.value })}
            className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Giải thích"
          />
          <button className="w-full rounded-xl bg-blue-700 px-4 py-3 font-black text-white">Lưu câu hỏi</button>
        </form>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black text-slate-950">Import/Export Excel</h3>
          </div>
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <a
              href={`/api/export/questions/${quizId}`}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700"
            >
              <Download className="h-4 w-4" /> Export câu hỏi
            </a>
            <a
              href="/api/export/template/questions"
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-200 px-3 py-2 text-sm font-black text-slate-700"
            >
              <Download className="h-4 w-4" /> Template
            </a>
          </div>
          <p className="mb-3 text-sm font-semibold text-slate-600">
            Export file hiện tại, chỉnh nội dung trong Excel, rồi import lại. Hệ thống cập nhật câu hỏi theo cột
            <span className="font-black"> order</span> trong từng sheet/chủ đề.
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          <button
            type="button"
            onClick={() => void importQuestions()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
        </div>

        {message && <div className="mt-4 rounded-xl bg-cyan-50 p-3 text-sm font-bold text-cyan-800">{message}</div>}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Ngân hàng câu hỏi ({questions.length})</h2>
        <div className="mt-4 space-y-3">
          {questions.map((question) => (
            <div key={question.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-blue-700">
                    {question.topic} · #{question.order} · Đáp án {question.correctAnswer}
                  </div>
                  <div className="mt-1 font-bold text-slate-950">{question.text}</div>
                  <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                    <div>A. {question.optionA}</div>
                    <div>B. {question.optionB}</div>
                    <div>C. {question.optionC}</div>
                    <div>D. {question.optionD}</div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => setForm(question)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold">
                    Sửa
                  </button>
                  <button onClick={() => void deleteQuestion(question.id)} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
