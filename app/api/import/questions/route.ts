import * as XLSX from "xlsx";
import { requireAdminApi } from "@/lib/auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return unauthorized();
  }

  try {
    const formData = await request.formData();
    const quizId = String(formData.get("quizId") || "");
    const file = formData.get("file");

    if (!quizId || !(file instanceof File)) {
      return badRequest("quizId and file are required");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const errors: Array<{ row: number; message: string }> = [];
    const validRows = rows
      .map((row, index) => {
        const parsed = questionSchema.safeParse({
          order: row.order || index + 1,
          text: row.question || row.text,
          optionA: row.optionA,
          optionB: row.optionB,
          optionC: row.optionC,
          optionD: row.optionD,
          correctAnswer: String(row.correctAnswer || "").trim().toUpperCase(),
          score: row.score || 2,
          timeLimit: row.timeLimit || 15,
          explanation: row.explanation || ""
        });

        if (!parsed.success) {
          errors.push({ row: index + 2, message: parsed.error.issues.map((issue) => issue.message).join(", ") });
          return null;
        }

        return parsed.data;
      })
      .filter(Boolean);

    if (errors.length > 0) {
      return badRequest("Import validation failed", { errors });
    }

    await prisma.question.createMany({
      data: validRows.map((row) => ({
        ...row!,
        quizId,
        imageUrl: row!.imageUrl || null,
        explanation: row!.explanation || null
      })),
      skipDuplicates: true
    });

    return ok({ imported: validRows.length });
  } catch (error) {
    return serverError(error);
  }
}
