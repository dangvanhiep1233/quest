# Realtime Quiz Platform

Tablet-first self-paced quiz website for event competitions. The player screen uses a blue/purple gradient, large touch-friendly answer cards, a circular countdown timer, per-question answer locking, and a leaderboard.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- Neon PostgreSQL
- Zod validation
- bcryptjs admin password hashing
- xlsx import/export

## Local Setup

```bash
npm install
cp .env.example .env
```

Configure Neon:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
ADMIN_SESSION_SECRET="replace-with-a-long-random-secret"
```

## Database

```bash
npm run prisma:generate
npm run db:push
npm run prisma:seed
```

Seed data:

- Admin email: `admin@example.com`
- Admin password: `Admin@123`
- Demo quiz code: `DEMO123`
- Demo quiz contains 400 generated questions across 8 topics; each attempt receives 20 random assigned questions from the full bank.

## Development

```bash
npm run dev
```

Open:

- Player join: `http://localhost:3000/join`
- Admin: `http://localhost:3000/admin/login`

## Core Flow

1. Admin logs in.
2. Admin creates or opens quiz `DEMO123`.
3. Player joins with quiz code and profile info.
4. Server creates a new self-paced attempt and assigns 20 random questions to it.
5. Player starts immediately without waiting for admin.
6. Player answers the current assigned question.
7. Server calculates response time and score.
8. The player sees the correct answer and earned points after each question.
9. Player taps next question until the attempt is finished.

## Scoring

Implemented in `lib/scoring.ts`:

- Wrong/no answer: `0`
- Correct within 0-5 seconds: `2`
- Correct within 6-10 seconds: `1.75`
- Correct within 11-15 seconds: `1`
- Later than 15 seconds: `0`

`responseTimeMs` is calculated server-side from the attempt's `questionStartedAt`.

## Import/Export

Admin question import supports `.xlsx`, `.xls`, and `.csv` through `xlsx`.

Question bank files can contain 8 sheets for 8 topics. The sheet name is used as the default `topic` for rows in that sheet. Import upserts questions by `topic + order`, so you can export, edit in Excel, and import the file back to update existing questions.

Template:

```txt
/api/export/template/questions
```

Results export:

```txt
/api/export/results/:quizId
```

Question export:

```txt
/api/export/questions/:quizId
```

Question export creates one sheet per topic. Results export includes leaderboard and answer detail sheets.

## Structure

```txt
app/                 Next.js routes and API routes
components/quiz/     Player quiz UI
components/admin/    Admin management UI
lib/                 Prisma, auth, scoring, validation, quiz services
prisma/              Schema and seed
docs/                Event documentation
```
