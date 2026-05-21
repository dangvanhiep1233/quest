import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ControlPanel } from "@/components/admin/ControlPanel";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ quizId: string }> };

export const dynamic = "force-dynamic";

export default async function AdminControlPage({ params }: PageProps) {
  await requireAdmin();
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true } });

  if (!quiz) {
    notFound();
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-950">Theo dõi cuộc thi</h1>
        <p className="text-slate-600">Người chơi tự bắt đầu lượt thi sau khi nhập mã, không cần admin start.</p>
      </div>
      <ControlPanel quizId={quiz.id} />
    </AdminShell>
  );
}
