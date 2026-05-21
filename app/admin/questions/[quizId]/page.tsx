import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ quizId: string }> };

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage({ params }: PageProps) {
  await requireAdmin();
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });

  if (!quiz) {
    notFound();
  }

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Câu hỏi</h1>
          <p className="text-slate-600">
            {quiz.title} · {quiz.code}
          </p>
        </div>
        <Link href={`/admin/control/${quiz.id}`} className="rounded-xl bg-blue-700 px-4 py-3 font-black text-white">
          Điều khiển
        </Link>
      </div>
      <QuestionManager quizId={quiz.id} />
    </AdminShell>
  );
}
