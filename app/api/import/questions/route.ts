import * as XLSX from "xlsx";
import { requireAdminApi } from "@/lib/auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";

function normalizeTopic(value: unknown, fallback: string) {
  return String(value || fallback).trim().slice(0, 31) || "Chung";
}

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
    const errors: Array<{ row: number; message: string }> = [];
    const validRows = workbook.SheetNames.flatMap((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const topic = normalizeTopic(sheetName, "Chung");

      return rows
        .map((row, index) => {
          const parsed = questionSchema.safeParse({
            topic: normalizeTopic(row.topic, topic),
            order: row.order || index + 1,
            text: row.question || row.text,
            imageUrl: row.imageUrl || "",
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
            errors.push({
              row: index + 2,
              message: `${sheetName}: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`
            });
            return null;
          }

          return parsed.data;
        })
        .filter(Boolean);
    });

    const seenKeys = new Set<string>();
    for (const row of validRows) {
      const key = `${row!.topic}::${row!.order}`;
      if (seenKeys.has(key)) {
        errors.push({ row: row!.order, message: `Duplicate order ${row!.order} in topic ${row!.topic}` });
      }
      seenKeys.add(key);
    }

    if (errors.length > 0) {
      return badRequest("Import validation failed", { errors });
    }

    const existingKeys = new Set(
      (
        await prisma.question.findMany({
          where: { quizId },
          select: { topic: true, order: true }
        })
      ).map((question) => `${question.topic}::${question.order}`)
    );

    await prisma.$transaction(
      validRows.map((row) =>
        prisma.question.upsert({
          where: {
            quizId_topic_order: {
              quizId,
              topic: row!.topic,
              order: row!.order
            }
          },
          update: {
            topic: row!.topic,
            text: row!.text,
            imageUrl: row!.imageUrl || null,
            optionA: row!.optionA,
            optionB: row!.optionB,
            optionC: row!.optionC,
            optionD: row!.optionD,
            correctAnswer: row!.correctAnswer,
            score: row!.score,
            timeLimit: row!.timeLimit,
            explanation: row!.explanation || null
          },
          create: {
            ...row!,
            quizId,
            imageUrl: row!.imageUrl || null,
            explanation: row!.explanation || null
          }
        })
      )
    );

    const updated = validRows.filter((row) => existingKeys.has(`${row!.topic}::${row!.order}`)).length;
    const created = validRows.length - updated;

    return ok({ imported: validRows.length, created, updated });
  } catch (error) {
    return serverError(error);
  }
}
