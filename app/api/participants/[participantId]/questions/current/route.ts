import { notFound, ok, serverError } from "@/lib/api";
import { getCurrentQuestionForParticipant } from "@/lib/quiz-data";

type Context = { params: Promise<{ participantId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { participantId } = await context.params;
    const result = await getCurrentQuestionForParticipant(participantId);

    if (!result) {
      return notFound("Participant not found");
    }

    return ok({
      session: {
        status: result.session.status,
        currentQuestionOrder: result.session.currentQuestionOrder,
        totalQuestions: result.session.totalQuestions,
        questionStartedAt: result.session.questionStartedAt?.toISOString() ?? null
      },
      question: result.payload
    });
  } catch (error) {
    return serverError(error);
  }
}
