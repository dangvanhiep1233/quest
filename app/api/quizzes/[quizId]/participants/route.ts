import { ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ quizId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { quizId } = await context.params;
    const participants = await prisma.quizParticipant.findMany({
      where: { quizId },
      include: {
        player: true,
        _count: { select: { answers: true, assignedQuestions: true } }
      },
      orderBy: { joinedAt: "asc" }
    });

    return ok({ participants });
  } catch (error) {
    return serverError(error);
  }
}
