import * as XLSX from "xlsx";
import { requireAdminApi } from "@/lib/auth";
import { unauthorized } from "@/lib/api";
import { getLeaderboard } from "@/lib/quiz-data";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ quizId: string }> };

export async function GET(_request: Request, context: Context) {
  if (!(await requireAdminApi())) {
    return unauthorized();
  }

  const { quizId } = await context.params;
  const [leaders, answers] = await Promise.all([
    getLeaderboard(quizId),
    prisma.playerAnswer.findMany({
      where: { quizId },
      include: { player: true, question: true },
      orderBy: [{ questionOrder: "asc" }, { submittedAt: "asc" }]
    })
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      leaders.map((row) => ({
        Rank: row.rank,
        "Player Name": row.playerName,
        "Total Score": row.totalScore,
        "Correct Count": row.correctCount,
        "Wrong Count": row.wrongCount,
        "Average Response Time": row.averageResponseTimeMs
      }))
    ),
    "Leaderboard"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      answers.map((answer) => ({
        "Player Name": answer.player.name,
        "Question Order": answer.questionOrder,
        "Question Text": answer.question.text,
        "Selected Answer": answer.selectedAnswer,
        "Correct Answer": answer.question.correctAnswer,
        "Is Correct": answer.isCorrect,
        "Response Time Ms": answer.responseTimeMs,
        Score: answer.score,
        "Submitted At": answer.submittedAt.toISOString()
      }))
    ),
    "Answer Detail"
  );

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=quiz-results.xlsx"
    }
  });
}
