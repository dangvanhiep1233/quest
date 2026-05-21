import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [quizCount, playerCount, answerCount, latestQuizzes] = await Promise.all([
    prisma.quiz.count(),
    prisma.player.count(),
    prisma.playerAnswer.count(),
    prisma.quiz.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true, participants: true } } }
    })
  ]);

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Dashboard</h1>
          <p className="text-slate-600">Quản lý cuộc thi, ngân hàng câu hỏi và kết quả lượt thi tự động.</p>
        </div>
        <Link href="/admin/quizzes" className="rounded-xl bg-blue-700 px-4 py-3 font-black text-white">
          Quản lý cuộc thi
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Cuộc thi", quizCount],
          ["Người chơi", playerCount],
          ["Câu trả lời", answerCount]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-500">{label}</div>
            <div className="mt-2 text-4xl font-black text-slate-950">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Cuộc thi gần đây</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {latestQuizzes.map((quiz) => (
            <div key={quiz.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-black text-slate-950">{quiz.title}</div>
                <div className="text-sm text-slate-500">
                  {quiz.code} · {quiz._count.questions} câu · {quiz._count.participants} người
                </div>
              </div>
              <Link href={`/admin/control/${quiz.id}`} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold">
                Điều khiển
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
