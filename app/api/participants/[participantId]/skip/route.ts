import { ok, serverError } from "@/lib/api";
import { skipCurrentQuestion } from "@/lib/quiz-data";
import { finalizeAnswerSchema } from "@/lib/validations";

type Context = { params: Promise<{ participantId: string }> };

async function readOptionalJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { participantId } = await context.params;
    const body = finalizeAnswerSchema.parse(await readOptionalJson(request));
    const result = await skipCurrentQuestion(participantId, body);
    return ok({
      participant: {
        id: result.participant.id,
        status: result.participant.status,
        currentQuestionOrder: result.participant.currentQuestionOrder,
        totalQuestions: result.participant.totalQuestions,
        questionStartedAt: result.participant.questionStartedAt?.toISOString() ?? null
      },
      question: result.payload ?? null
    });
  } catch (error) {
    return serverError(error);
  }
}
