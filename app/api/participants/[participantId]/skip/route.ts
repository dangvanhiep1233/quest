import { ok, serverError } from "@/lib/api";
import { skipCurrentQuestion } from "@/lib/quiz-data";

type Context = { params: Promise<{ participantId: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const { participantId } = await context.params;
    const result = await skipCurrentQuestion(participantId);
    return ok({
      participant: {
        id: result.participant.id,
        status: result.participant.status,
        currentQuestionOrder: result.participant.currentQuestionOrder,
        totalQuestions: result.participant.totalQuestions
      }
    });
  } catch (error) {
    return serverError(error);
  }
}
