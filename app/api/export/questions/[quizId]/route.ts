import * as XLSX from "xlsx";
import { requireAdminApi } from "@/lib/auth";
import { notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ quizId: string }> };

function safeSheetName(topic: string, index: number) {
  const cleaned = topic.replace(/[:\\/?*\[\]]/g, " ").trim() || `Topic ${index + 1}`;
  return cleaned.slice(0, 31);
}

export async function GET(_request: Request, context: Context) {
  if (!(await requireAdminApi())) {
    return unauthorized();
  }

  const { quizId } = await context.params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: [{ topic: "asc" }, { order: "asc" }]
      }
    }
  });

  if (!quiz) {
    return notFound("Quiz not found");
  }

  const workbook = XLSX.utils.book_new();
  const grouped = new Map<string, typeof quiz.questions>();
  for (const question of quiz.questions) {
    grouped.set(question.topic, [...(grouped.get(question.topic) ?? []), question]);
  }

  let sheetIndex = 0;
  for (const [topic, questions] of grouped) {
    const worksheet = XLSX.utils.json_to_sheet(
      questions.map((question) => ({
        topic: question.topic,
        order: question.order,
        question: question.text,
        imageUrl: question.imageUrl ?? "",
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        correctAnswer: question.correctAnswer,
        score: question.score,
        timeLimit: question.timeLimit,
        explanation: question.explanation ?? ""
      }))
    );

    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(topic, sheetIndex));
    sheetIndex += 1;
  }
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const safeCode = quiz.code.replace(/[^A-Z0-9_-]/gi, "_");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${safeCode}-questions.xlsx`
    }
  });
}
