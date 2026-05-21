import { formatScore } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/realtime-events";

type LeaderboardTableProps = {
  leaders: LeaderboardRow[];
};

export function LeaderboardTable({ leaders }: LeaderboardTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Người chơi</th>
            <th className="px-4 py-3">Điểm</th>
            <th className="px-4 py-3">Đúng</th>
            <th className="px-4 py-3">Sai</th>
            <th className="px-4 py-3">TB phản hồi</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((row) => (
            <tr key={row.quizParticipantId} className="border-t border-slate-100">
              <td className="px-4 py-3 font-black text-slate-900">#{row.rank}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{row.playerName}</td>
              <td className="px-4 py-3 font-bold text-blue-700">{formatScore(row.totalScore)}</td>
              <td className="px-4 py-3 text-emerald-700">{row.correctCount}</td>
              <td className="px-4 py-3 text-red-700">{row.wrongCount}</td>
              <td className="px-4 py-3 text-slate-600">{row.averageResponseTimeMs}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
      {leaders.length === 0 && <div className="p-6 text-center text-slate-500">Chưa có dữ liệu</div>}
    </div>
  );
}
