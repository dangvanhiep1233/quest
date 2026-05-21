import { AdminShell } from "@/components/admin/AdminShell";
import { QuizManager } from "@/components/admin/QuizManager";

export default function AdminQuizzesPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-950">Cuộc thi</h1>
        <p className="text-slate-600">Tạo, sửa và mở trang điều khiển cuộc thi.</p>
      </div>
      <QuizManager />
    </AdminShell>
  );
}
