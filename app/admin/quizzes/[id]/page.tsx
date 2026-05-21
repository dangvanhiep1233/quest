import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuizEditForm } from "@/components/admin/QuizEditForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function AdminQuizDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id } });

  if (!quiz) {
    notFound();
  }

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Sửa cuộc thi</h1>
          <p className="text-slate-600">{quiz.code}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/questions/${quiz.id}`} className="rounded-xl bg-slate-200 px-4 py-3 font-black">
            Câu hỏi
          </Link>
          <Link href={`/admin/control/${quiz.id}`} className="rounded-xl bg-blue-700 px-4 py-3 font-black text-white">
            Điều khiển
          </Link>
        </div>
      </div>
      <QuizEditForm
        quiz={{
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          code: quiz.code,
          defaultTimeLimit: quiz.defaultTimeLimit,
          questionsPerSession: quiz.questionsPerSession,
          randomizeQuestions: quiz.randomizeQuestions,
          allowChangeAnswer: quiz.allowChangeAnswer,
          showCorrectAnswer: quiz.showCorrectAnswer
        }}
      />
    </AdminShell>
  );
}
