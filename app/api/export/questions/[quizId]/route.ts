import * as XLSX from "xlsx";
import { requireAdminApi } from "@/lib/auth";
import { notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ quizId: string }> };

export async function GET(_request: Request, context: Context) {
  if (!(await requireAdminApi())) {
    return unauthorized();
  }

  const { quizId } = await context.params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!quiz) {
    return notFound("Quiz not found");
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(
    quiz.questions.map((question) => ({
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

  XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const safeCode = quiz.code.replace(/[^A-Z0-9_-]/gi, "_");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${safeCode}-questions.xlsx`
    }
  });
}
