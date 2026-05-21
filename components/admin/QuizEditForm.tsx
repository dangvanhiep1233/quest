"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QuizEditFormProps = {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    code: string;
    defaultTimeLimit: number;
    questionsPerSession: number;
    randomizeQuestions: boolean;
    allowChangeAnswer: boolean;
    showCorrectAnswer: boolean;
  };
};

export function QuizEditForm({ quiz }: QuizEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...quiz,
    description: quiz.description ?? ""
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/quizzes/${quiz.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <form
      className="max-w-3xl rounded-2xl bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-bold text-slate-600">Tên cuộc thi</span>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-600">Mã</span>
          <input
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 font-black"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-600">Số câu mỗi session</span>
          <input
            type="number"
            value={form.questionsPerSession}
            onChange={(event) => setForm({ ...form, questionsPerSession: Number(event.target.value) })}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-600">Thời gian/câu</span>
          <input
            type="number"
            value={form.defaultTimeLimit}
            onChange={(event) => setForm({ ...form, defaultTimeLimit: Number(event.target.value) })}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-bold text-slate-600">Mô tả</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["randomizeQuestions", "Random 20 câu/user"],
          ["allowChangeAnswer", "Cho đổi đáp án"],
          ["showCorrectAnswer", "Hiện đáp án đúng"]
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold">
            <input
              type="checkbox"
              checked={Boolean(form[key as keyof typeof form])}
              onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
      <button className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-black text-white">
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  );
}
