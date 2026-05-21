export type CalculateScoreInput = {
  isCorrect: boolean;
  responseTimeMs: number;
};

export function calculateScore(input: CalculateScoreInput): number {
  if (!input.isCorrect) {
    return 0;
  }

  const responseSeconds = input.responseTimeMs / 1000;

  if (responseSeconds <= 5) {
    return 2;
  }

  if (responseSeconds <= 10) {
    return 1.75;
  }

  if (responseSeconds <= 15) {
    return 1;
  }

  return 0;
}

export function calculateResponseTimeMs(startedAt: Date | null, now = new Date()): number {
  if (!startedAt) {
    return 0;
  }

  return Math.max(0, now.getTime() - startedAt.getTime());
}
