# Realtime Events

The current product flow is self-paced: a player starts a private attempt immediately after joining, so realtime is not required for normal quiz taking. This file keeps the event contract as an optional legacy/extension layer if a synchronized event mode is added later.

Channel format:

```txt
quiz-{quizCode}
```

Supported events:

```txt
player:join
player:answer
quiz:start
quiz:next-question
quiz:show-answer
quiz:pause
quiz:finish
leaderboard:update
session:update
participants:update
answers:count-update
```

Important rules:

- Clients never publish with provider secret keys.
- Player answers go through `POST /api/answers`.
- Admin control goes through `/api/admin/quizzes/:quizId/*` actions.
- Server writes database first, then publishes realtime events.
- `responseTimeMs` is calculated on the server from `QuizSession.questionStartedAt`.
- With `randomizeQuestions = true`, events carry `currentQuestionOrder`, not a shared `questionId`.
