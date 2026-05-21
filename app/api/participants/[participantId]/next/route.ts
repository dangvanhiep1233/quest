import { ok, serverError } from "@/lib/api";
import { advanceParticipant } from "@/lib/quiz-data";

type Context = { params: Promise<{ participantId: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const { participantId } = await context.params;
    const participant = await advanceParticipant(participantId);
    return ok({
      participant: {
        id: participant.id,
        status: participant.status,
        currentQuestionOrder: participant.currentQuestionOrder,
        totalQuestions: participant.totalQuestions
      }
    });
  } catch (error) {
    return serverError(error);
  }
}
