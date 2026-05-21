import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="text-xl font-black text-slate-950">
            Quiz Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm font-bold text-slate-600">
            <Link href="/admin/quizzes">Cuộc thi</Link>
            <span>{admin.email}</span>
            <form action="/api/admin/logout" method="post">
              <button className="rounded-full bg-slate-900 px-4 py-2 text-white">Đăng xuất</button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </main>
  );
}
