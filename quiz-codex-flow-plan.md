# PLAN TRIỂN KHAI WEBSITE CUỘC THI TRẮC NGHIỆM REALTIME

> Mục tiêu: xây dựng website thi trắc nghiệm tự làm bài theo lượt thi cá nhân, có giao diện người chơi giống ảnh tham khảo: nền xanh/tím, câu hỏi ở phía trên, vòng đếm ngược ở giữa, 4 đáp án lớn dạng grid 2x2, tối ưu thao tác chạm trên tablet/mobile.

---

## 1. Vai trò của file này

File này dùng làm tài liệu điều phối cho Codex/Codex Flow khi triển khai dự án. Codex cần đọc file này trước khi code và thực hiện theo từng phase, không làm lan man ngoài phạm vi.

Nguyên tắc triển khai:

1. Làm từng phase nhỏ, sau mỗi phase phải đảm bảo chạy được.
2. Ưu tiên MVP trước, tính năng nâng cao làm sau.
3. Không phá vỡ flow đã chạy ổn định.
4. Tách component, service, database logic rõ ràng.
5. Mọi logic tính điểm phải đặt tập trung trong `lib/scoring.ts`.
6. Mọi realtime event phải có type rõ ràng.
7. UI người chơi phải ưu tiên tablet landscape giống ảnh tham khảo.

---

## 2. Product scope

Website gồm 3 khu vực chính:

### 2.1. Player App

Dành cho người chơi.

Tính năng:

- Nhập mã cuộc thi.
- Nhập thông tin người chơi.
- Tự bắt đầu lượt thi sau khi nhập thông tin.
- Nhận 20 câu random từ ngân hàng câu hỏi của cuộc thi.
- Chọn đáp án A/B/C/D.
- Khóa đáp án sau khi chọn.
- Xem trạng thái đã trả lời.
- Xem điểm cá nhân.
- Xem thứ hạng sau cuộc thi.

### 2.2. Admin App

Dành cho ban tổ chức.

Tính năng:

- Đăng nhập admin.
- Tạo/sửa/xóa cuộc thi.
- Tạo/sửa/xóa câu hỏi.
- Import câu hỏi từ Excel/CSV.
- Mở phòng thi.
- Bắt đầu cuộc thi.
- Chuyển câu hỏi.
- Hiển thị đáp án đúng.
- Tạm dừng/kết thúc cuộc thi.
- Xem người chơi online.
- Xem kết quả.
- Export kết quả Excel.

### 2.3. Display Screen

Dành cho màn hình lớn tại sự kiện.

Tính năng:

- Hiển thị đồng hồ đếm ngược.
- Hiển thị tiến độ câu hiện tại, ví dụ `Câu 3/20`.
- Hiển thị số người đã trả lời.
- Hiển thị leaderboard top 10.
- Nếu quiz không random câu hỏi theo người chơi, có thể hiển thị câu hỏi hiện tại, 4 đáp án và đáp án đúng sau khi admin bật.
- Nếu quiz random 20 câu riêng cho từng người chơi, display screen không hiển thị một câu hỏi chung.

---

## 3. Tech stack đề xuất

```txt
Next.js App Router
TypeScript
Tailwind CSS
Prisma ORM
PostgreSQL Neon
Managed realtime provider compatible with Vercel, ưu tiên Pusher Channels hoặc Ably
NextAuth/Auth.js cho admin
Zod validate dữ liệu
xlsx hoặc exceljs cho import/export Excel
Framer Motion cho animation nhẹ
```

Ghi chú:

- Deployment target chính: Vercel + Neon PostgreSQL.
- Dùng Neon làm database ngay từ đầu để tránh lệch schema giữa dev và production.
- Prisma dùng `DATABASE_URL` cho pooled connection runtime và `DIRECT_URL` cho migration nếu Neon yêu cầu.
- Không dùng Socket.IO server chạy trong Next.js trên Vercel, vì Vercel serverless không phù hợp với long-lived WebSocket server.
- Realtime MVP dùng Pusher Channels hoặc Ably: API Route/Server Action ghi DB, sau đó publish event tới channel theo `quizCode`.
- Người chơi không cần tài khoản, chỉ cần guest session/localStorage.

### 3.1. Quyết định kỹ thuật đã chốt

1. Deploy production bằng Vercel + Neon PostgreSQL.
2. Mỗi cuộc thi có ngân hàng câu hỏi lớn, ví dụ 400 câu.
3. Khi người chơi bắt đầu một lượt thi, hệ thống random và lưu cố định 20 câu cho lượt thi đó.
4. Trong cùng một session, người chơi reload vẫn nhận lại đúng bộ 20 câu đã được assign.
5. Admin không cần bấm start; người chơi tự thi ngay sau khi join.
6. Mỗi lượt thi có `currentQuestionOrder` và `questionStartedAt` riêng.
7. Server là nguồn sự thật cho timing: server set `questionStartedAt` và tự tính `responseTimeMs`.
8. Sau mỗi câu, lượt thi dừng ở trạng thái hiển thị đáp án/điểm để user xem trước khi bấm câu tiếp theo.
9. MVP vẫn có admin login bằng `AdminUser.passwordHash`.
10. Realtime chỉ là lớp mở rộng tuỳ chọn, không phải flow chính.

---

## 4. Cấu trúc thư mục mục tiêu

```txt
quiz-platform/
├── app/
│   ├── page.tsx
│   ├── join/
│   │   └── page.tsx
│   ├── lobby/
│   │   └── [quizCode]/
│   │       └── page.tsx
│   ├── play/
│   │   └── [quizCode]/
│   │       └── page.tsx
│   ├── result/
│   │   └── [quizCode]/
│   │       └── page.tsx
│   ├── leaderboard/
│   │   └── [quizCode]/
│   │       └── page.tsx
│   ├── display/
│   │   └── [quizCode]/
│   │       └── page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── quizzes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── questions/
│   │   │   └── [quizId]/
│   │   │       └── page.tsx
│   │   └── control/
│   │       └── [quizId]/
│   │           └── page.tsx
│   └── api/
│       ├── quizzes/
│       ├── players/
│       ├── answers/
│       ├── admin/
│       ├── import/
│       └── export/
├── components/
│   ├── quiz/
│   │   ├── QuestionScreen.tsx
│   │   ├── AnswerOption.tsx
│   │   ├── CountdownCircle.tsx
│   │   ├── LobbyScreen.tsx
│   │   ├── ResultCard.tsx
│   │   └── LeaderboardTable.tsx
│   ├── admin/
│   │   ├── QuizForm.tsx
│   │   ├── QuestionForm.tsx
│   │   ├── ImportQuestions.tsx
│   │   ├── QuizControlPanel.tsx
│   │   └── ParticipantList.tsx
│   └── ui/
├── lib/
│   ├── prisma.ts
│   ├── scoring.ts
│   ├── realtime.ts
│   ├── realtime-events.ts
│   ├── validations.ts
│   ├── quiz-status.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docs/
│   ├── api.md
│   ├── realtime-events.md
│   └── import-template.md
├── public/
└── README.md
```

---

## 5. Database model

Codex cần tạo Prisma schema theo thiết kế sau.

Thiết kế dữ liệu cần hỗ trợ quiz có ngân hàng câu hỏi lớn, ví dụ 400 câu, nhưng mỗi participant chỉ được assign cố định 20 câu random trong một session. Không random lại khi reload.

### 5.1. Enum

```prisma
enum QuizStatus {
  DRAFT
  OPEN
  RUNNING
  PAUSED
  FINISHED
}

enum SessionStatus {
  WAITING
  QUESTION_ACTIVE
  SHOWING_ANSWER
  LEADERBOARD
  FINISHED
}

enum ScoringMode {
  FIXED
  SPEED
  CUSTOM
}

enum AnswerKey {
  A
  B
  C
  D
}
```

### 5.2. Models cần có

```prisma
model AdminUser {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Quiz {
  id                 String      @id @default(cuid())
  title              String
  description        String?
  code               String      @unique
  status             QuizStatus  @default(DRAFT)
  scoringMode        ScoringMode @default(SPEED)
  showCorrectAnswer  Boolean     @default(true)
  allowChangeAnswer  Boolean     @default(false)
  defaultTimeLimit   Int         @default(20)
  randomizeQuestions Boolean     @default(true)
  questionsPerSession Int        @default(20)
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  questions          Question[]
  participants       QuizParticipant[]
  sessions           QuizSession[]
  answers            PlayerAnswer[]
  assignedQuestions  QuizParticipantQuestion[]

  @@index([code])
  @@index([status])
}

model Question {
  id            String    @id @default(cuid())
  quizId        String
  order         Int
  text          String
  imageUrl      String?
  optionA       String
  optionB       String
  optionC       String
  optionD       String
  correctAnswer AnswerKey
  explanation   String?
  score         Int       @default(1000)
  timeLimit     Int       @default(20)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  quiz          Quiz      @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers       PlayerAnswer[]
  participantAssignments QuizParticipantQuestion[]

  @@index([quizId])
  @@unique([quizId, order])
}

model Player {
  id            String   @id @default(cuid())
  name          String
  phone         String?
  email         String?
  organization  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  participations QuizParticipant[]
  answers        PlayerAnswer[]
  assignedQuestions QuizParticipantQuestion[]
}

model QuizParticipant {
  id        String   @id @default(cuid())
  quizId    String
  playerId  String
  joinedAt  DateTime @default(now())
  isOnline  Boolean  @default(false)

  quiz      Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  player    Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  assignedQuestions QuizParticipantQuestion[]
  answers   PlayerAnswer[]

  @@unique([quizId, playerId])
  @@index([quizId])
  @@index([playerId])
}

model QuizParticipantQuestion {
  id                String          @id @default(cuid())
  quizId            String
  playerId          String
  quizParticipantId String
  questionId        String
  order             Int
  assignedAt        DateTime        @default(now())

  quiz              Quiz            @relation(fields: [quizId], references: [id], onDelete: Cascade)
  player            Player          @relation(fields: [playerId], references: [id], onDelete: Cascade)
  quizParticipant   QuizParticipant @relation(fields: [quizParticipantId], references: [id], onDelete: Cascade)
  question          Question        @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([quizParticipantId, order])
  @@unique([quizParticipantId, questionId])
  @@index([quizId])
  @@index([playerId])
  @@index([questionId])
}

model QuizSession {
  id                   String        @id @default(cuid())
  quizId               String
  currentQuestionOrder Int           @default(1)
  totalQuestions       Int           @default(20)
  status               SessionStatus @default(WAITING)
  questionStartedAt    DateTime?
  startedAt            DateTime?
  endedAt              DateTime?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  quiz                 Quiz          @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@unique([quizId])
  @@index([quizId])
}

model PlayerAnswer {
  id              String     @id @default(cuid())
  quizId          String
  questionId      String
  playerId        String
  quizParticipantId String
  questionOrder   Int
  selectedAnswer  AnswerKey?
  isCorrect       Boolean    @default(false)
  responseTimeMs  Int        @default(0)
  score           Int        @default(0)
  submittedAt     DateTime   @default(now())

  quiz            Quiz       @relation(fields: [quizId], references: [id], onDelete: Cascade)
  question        Question   @relation(fields: [questionId], references: [id], onDelete: Cascade)
  player          Player     @relation(fields: [playerId], references: [id], onDelete: Cascade)
  quizParticipant QuizParticipant @relation(fields: [quizParticipantId], references: [id], onDelete: Cascade)

  @@unique([quizParticipantId, questionOrder])
  @@unique([quizId, questionId, playerId])
  @@index([quizId])
  @@index([questionId])
  @@index([playerId])
  @@index([quizParticipantId])
}
```

### 5.3. Random question assignment flow

Áp dụng cho quiz có `randomizeQuestions = true`:

1. Admin import/tạo ngân hàng câu hỏi, ví dụ 400 câu.
2. Player join quiz bằng `POST /api/players/join`.
3. Server kiểm tra participant đã có `QuizParticipantQuestion` chưa.
4. Nếu chưa có, server random `quiz.questionsPerSession` câu, mặc định 20 câu, từ toàn bộ question bank của quiz.
5. Server lưu thứ tự câu vào `QuizParticipantQuestion.order` từ 1 đến 20.
6. Khi admin start/next, server chỉ tăng `QuizSession.currentQuestionOrder`.
7. Player fetch câu hiện tại bằng `quizParticipantId` + `currentQuestionOrder`.
8. Player reload không random lại vì bộ câu đã được lưu trong DB.

Nếu `randomizeQuestions = false`, toàn bộ người chơi dùng chung thứ tự câu theo `Question.order`, phù hợp với display screen hiển thị câu hỏi chung.

---

## 6. Scoring logic

Tạo file:

```txt
lib/scoring.ts
```

Yêu cầu:

```ts
type CalculateScoreInput = {
  isCorrect: boolean;
  baseScore: number;
  scoringMode: 'FIXED' | 'SPEED' | 'CUSTOM';
  timeLimit: number;
  responseTimeMs: number;
};

export function calculateScore(input: CalculateScoreInput): number {
  // Nếu sai hoặc không trả lời: 0
  // FIXED: đúng thì nhận đủ baseScore
  // SPEED: đúng thì tính theo tốc độ
  // CUSTOM: tạm thời giống FIXED, để mở rộng sau
}
```

Công thức SPEED:

```txt
remainingTime = max(0, timeLimit - responseTimeSeconds)
score = baseScore * (0.5 + 0.5 * remainingTime / timeLimit)
```

Quy tắc:

- Sai: 0 điểm.
- Không trả lời: 0 điểm.
- Đúng sát giờ: tối thiểu 50% điểm.
- Đúng rất nhanh: gần 100% điểm.
- Làm tròn bằng `Math.round`.
- `responseTimeMs` phải do server tính từ `QuizSession.questionStartedAt` và thời điểm server nhận/lưu answer.
- Client không được gửi hoặc quyết định `responseTimeMs`.

---

## 7. UI requirements

### 7.1. Player Question Screen

Component chính:

```txt
components/quiz/QuestionScreen.tsx
```

Props:

```ts
type AnswerKey = 'A' | 'B' | 'C' | 'D';

type QuestionScreenProps = {
  question: {
    id: string;
    text: string;
    options: {
      key: AnswerKey;
      text: string;
    }[];
    correctAnswer?: AnswerKey;
  };
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  timeLimit: number;
  selectedAnswer?: AnswerKey;
  locked: boolean;
  showCorrectAnswer: boolean;
  onSelectAnswer: (answer: AnswerKey) => void;
};
```

`correctAnswer` chỉ được truyền vào component khi session ở trạng thái `SHOWING_ANSWER` hoặc sau khi quiz kết thúc. API player question không được trả `correctAnswer` trong lúc câu hỏi đang active.

Yêu cầu giao diện:

- Full viewport: `min-h-screen`.
- Background xanh/tím gradient.
- Font lớn, dễ đọc.
- Tối ưu tablet landscape.
- Header nhỏ hiển thị `Câu 3/20`.
- Vòng tròn countdown ở giữa phía trên.
- Câu hỏi căn giữa, màu trắng.
- 4 đáp án dạng card lớn.
- Desktop/tablet: grid 2x2.
- Mobile nhỏ: grid 1 cột.
- Đáp án có nhãn A/B/C/D.
- Card bo góc lớn, gradient xanh.
- Khi hover/touch: sáng nhẹ.
- Khi selected: viền trắng, scale nhẹ.
- Khi locked: không cho chọn lại.
- Khi showCorrectAnswer:
  - Đúng: xanh lá.
  - Sai đã chọn: đỏ.

### 7.2. Màu sắc tham khảo

```txt
Background: from-indigo-950 via-blue-900 to-cyan-700
Answer card A: from-blue-700 to-blue-500
Answer card B: from-sky-600 to-cyan-500
Answer card C: from-cyan-600 to-teal-500
Answer card D: from-blue-600 to-cyan-600
Selected border: white
Correct: emerald
Wrong: red
```

### 7.3. UX khi trả lời

- Người chơi click/touch vào đáp án.
- Gọi `POST /api/answers` để submit đáp án.
- Server validate, tự tính `responseTimeMs`, lưu DB, rồi publish realtime event `answers:count-update` và `leaderboard:update`.
- Card được chọn đổi trạng thái ngay lập tức.
- Hiển thị text: `Đã ghi nhận câu trả lời`.
- Không được bấm lại nếu `allowChangeAnswer = false`.

---

## 8. Pages cần triển khai

### 8.1. Public pages

```txt
/                         Landing hoặc redirect sang /join
/join                     Nhập mã cuộc thi
/lobby/[quizCode]         Phòng chờ
/play/[quizCode]          Màn hình chơi chính
/result/[quizCode]        Kết quả cá nhân
/leaderboard/[quizCode]   Bảng xếp hạng
/display/[quizCode]       Màn hình trình chiếu
```

### 8.2. Admin pages

```txt
/admin                    Dashboard
/admin/login              Đăng nhập admin
/admin/quizzes            Danh sách cuộc thi
/admin/quizzes/[id]       Chi tiết/sửa cuộc thi
/admin/questions/[quizId] Quản lý câu hỏi
/admin/control/[quizId]   Điều khiển cuộc thi
```

---

## 9. API endpoints

Codex cần tạo API rõ ràng, validate bằng Zod.

### 9.1. Quiz

```txt
GET    /api/quizzes
POST   /api/quizzes
GET    /api/quizzes/:id
PATCH  /api/quizzes/:id
DELETE /api/quizzes/:id
GET    /api/quizzes/code/:quizCode
```

### 9.2. Question

```txt
GET    /api/quizzes/:quizId/questions
POST   /api/quizzes/:quizId/questions
PATCH  /api/questions/:id
DELETE /api/questions/:id
```

### 9.3. Player

```txt
POST /api/players/join
GET  /api/quizzes/:quizId/participants
GET  /api/participants/:participantId/questions
GET  /api/participants/:participantId/questions/current
```

`POST /api/players/join` phải:

- Tạo hoặc tìm `Player`.
- Tạo hoặc tìm `QuizParticipant`.
- Nếu participant chưa có bộ câu hỏi, random `quiz.questionsPerSession` câu từ ngân hàng câu hỏi của quiz và lưu vào `QuizParticipantQuestion`.
- Trả về `playerId`, `quizParticipantId`, `quizId`, `quizCode`, `questionsPerSession`.

### 9.4. Answer

```txt
POST /api/answers
GET  /api/quizzes/:quizId/answers
```

`POST /api/answers` chỉ nhận:

```ts
{
  quizId: string;
  quizParticipantId: string;
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
}
```

Server phải tự:

- Kiểm tra quiz/session đang cho trả lời.
- Kiểm tra `questionId` là câu được assign cho participant ở `currentQuestionOrder`.
- Tính `responseTimeMs = now - questionStartedAt`.
- Tính điểm bằng `lib/scoring.ts`.
- Chặn duplicate answer nếu `allowChangeAnswer = false`.

### 9.5. Leaderboard

```txt
GET /api/quizzes/:quizId/leaderboard
GET /api/quizzes/code/:quizCode/leaderboard
```

### 9.6. Import/Export

```txt
POST /api/import/questions
GET  /api/export/results/:quizId
GET  /api/export/template/questions
```

### 9.7. Admin control actions

```txt
POST /api/admin/quizzes/:quizId/open
POST /api/admin/quizzes/:quizId/start
POST /api/admin/quizzes/:quizId/next-question
POST /api/admin/quizzes/:quizId/show-answer
POST /api/admin/quizzes/:quizId/pause
POST /api/admin/quizzes/:quizId/resume
POST /api/admin/quizzes/:quizId/finish
```

Các endpoint này phải:

- Yêu cầu admin auth.
- Validate trạng thái hiện tại trước khi đổi trạng thái.
- Cập nhật `Quiz` và `QuizSession`.
- Set `questionStartedAt` bằng server time khi start/resume/next-question.
- Publish realtime event sau khi database update thành công.

---

## 10. Realtime events

Tạo file tài liệu:

```txt
docs/realtime-events.md
```

Tạo type trong:

```txt
lib/realtime-events.ts
```

### 10.1. Channel rule

- Mỗi cuộc thi là một realtime channel theo `quizCode`, ví dụ `quiz-DEMO123`.
- Player subscribe channel bằng `quizCode`.
- Admin action gọi API route trước; API route cập nhật database rồi publish event.
- Không publish trực tiếp từ client bằng secret key.
- Dữ liệu quan trọng luôn lấy lại từ API/DB khi reload, realtime chỉ dùng để đồng bộ UI nhanh.

### 10.2. Events từ player

```ts
'player:join' = {
  quizCode: string;
  playerId: string;
  quizParticipantId: string;
  playerName: string;
}

'player:answer' = {
  quizCode: string;
  quizId: string;
  questionId: string;
  quizParticipantId: string;
  questionOrder: number;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
}
```

Ghi chú: trong Vercel MVP, player không emit trực tiếp event này lên realtime provider. Player gọi `POST /api/answers`, server lưu DB rồi publish broadcast tương ứng.

### 10.3. Events từ admin

```ts
'quiz:start' = {
  quizCode: string;
  quizId: string;
  currentQuestionOrder: number;
  questionStartedAt: string;
}

'quiz:next-question' = {
  quizCode: string;
  quizId: string;
  currentQuestionOrder: number;
  totalQuestions: number;
  questionStartedAt: string;
}

'quiz:show-answer' = {
  quizCode: string;
  quizId: string;
  currentQuestionOrder: number;
}

'quiz:pause' = {
  quizCode: string;
  quizId: string;
}

'quiz:finish' = {
  quizCode: string;
  quizId: string;
}
```

### 10.4. Events server broadcast

```ts
'session:update' = {
  quizId: string;
  quizCode: string;
  status: 'WAITING' | 'QUESTION_ACTIVE' | 'SHOWING_ANSWER' | 'LEADERBOARD' | 'FINISHED';
  currentQuestionOrder: number;
  totalQuestions: number;
  questionStartedAt: string | null;
}

'leaderboard:update' = {
  quizId: string;
  quizCode: string;
  leaders: Array<{
    rank: number;
    playerId: string;
    playerName: string;
    totalScore: number;
    correctCount: number;
  }>;
}

'participants:update' = {
  quizId: string;
  quizCode: string;
  onlineCount: number;
  totalCount: number;
}

'answers:count-update' = {
  quizId: string;
  quizCode: string;
  currentQuestionOrder: number;
  answeredCount: number;
  totalParticipants: number;
}

'question:update' = {
  quizId: string;
  quizCode: string;
  currentQuestionOrder: number;
  totalQuestions: number;
}
```

Vì mỗi participant có bộ câu hỏi random riêng, event `question:update` không chứa `questionId`. Client player phải gọi API `GET /api/participants/:participantId/questions/current` để lấy câu đúng của chính mình theo `currentQuestionOrder`.

---

## 11. Admin control flow

Trang:

```txt
/admin/control/[quizId]
```

Cần có:

- Tên cuộc thi.
- Mã cuộc thi.
- Trạng thái hiện tại.
- Số người tham gia.
- Thứ tự câu hiện tại, ví dụ `Câu 3/20`.
- Số người đã trả lời câu hiện tại.
- Nút mở phòng.
- Nút bắt đầu.
- Nút câu tiếp theo.
- Nút hiện đáp án.
- Nút hiện leaderboard.
- Nút tạm dừng.
- Nút kết thúc.

Button states:

- Quiz DRAFT: chỉ cho cấu hình hoặc mở phòng.
- Quiz OPEN: cho người chơi vào, admin có thể start.
- Quiz RUNNING: cho next/show answer/pause/finish.
- Quiz PAUSED: cho resume/finish.
- Quiz FINISHED: chỉ xem kết quả/export.

Ghi chú random question set:

- Admin điều khiển theo `currentQuestionOrder`, không điều khiển theo một `questionId` chung.
- Ở cùng `currentQuestionOrder`, mỗi participant có thể đang trả lời một câu hỏi khác nhau.
- Nếu cần màn hình display hiển thị một câu hỏi chung cho cả hội trường, phải tắt `randomizeQuestions` hoặc tạo mode riêng.

---

## 12. Import câu hỏi từ Excel/CSV

File mẫu:

```csv
question,optionA,optionB,optionC,optionD,correctAnswer,score,timeLimit,explanation
Ngọn núi cao nhất Việt Nam là gì?,Thăng Hoa,Phan Xi Păng,Thiên Việt,Thiên Minh,B,1000,20,Phan Xi Păng là đỉnh núi cao nhất Việt Nam.
```

Yêu cầu:

- Upload `.xlsx` hoặc `.csv`.
- Parse bằng `xlsx` hoặc `exceljs`.
- Preview trước khi import.
- Validate từng dòng.
- Nếu có lỗi, hiển thị dòng lỗi.
- Nếu hợp lệ, lưu vào DB theo `quizId`.
- `correctAnswer` chỉ nhận A/B/C/D.
- `score` và `timeLimit` phải là số dương.
- Import phải xử lý ổn định ngân hàng câu hỏi khoảng 400 dòng cho mỗi quiz.

---

## 13. Export kết quả

Export file Excel gồm các sheet:

### Sheet 1: Leaderboard

```txt
Rank
Player Name
Phone
Organization
Total Score
Correct Count
Wrong Count
Skipped Count
Average Response Time
```

### Sheet 2: Answer Detail

```txt
Player Name
Question Order
Question Text
Selected Answer
Correct Answer
Is Correct
Response Time Ms
Score
Submitted At
```

---

## 14. Phase triển khai cho Codex

## Phase 0 — Chuẩn bị repo

Mục tiêu:

- Kiểm tra project hiện có.
- Nếu chưa có project, tạo mới Next.js App Router + TypeScript + Tailwind.
- Cài package cần thiết.

Tasks:

```txt
1. Inspect repository.
2. Create or confirm Next.js App Router structure.
3. Install dependencies:
   - prisma
   - @prisma/client
   - zod
   - pusher hoặc ably
   - xlsx hoặc exceljs
   - framer-motion
   - bcryptjs
   - next-auth hoặc auth.js
4. Setup .env.example.
5. Setup README initial.
```

Done when:

- `npm run dev` chạy được.
- Tailwind hoạt động.
- Có `.env.example` gồm `DATABASE_URL`, `DIRECT_URL`, realtime provider env, admin auth secret.

---

## Phase 1 — Database + seed data

Mục tiêu:

- Tạo Prisma schema.
- Tạo seed data cho 1 cuộc thi demo.

Tasks:

```txt
1. Create prisma/schema.prisma.
2. Add enums and models.
3. Create lib/prisma.ts.
4. Create prisma/seed.ts.
5. Seed quiz demo code: DEMO123.
6. Seed ít nhất 25 câu hỏi demo để test random 20 câu mỗi participant.
7. Seed admin demo với `passwordHash`.
8. Add npm scripts:
   - prisma:generate
   - prisma:migrate
   - prisma:seed
```

Done when:

- Migration chạy được.
- Seed tạo được cuộc thi demo đủ câu hỏi để random session.

---

## Phase 2 — Player UI MVP

Mục tiêu:

- Người chơi có thể nhập mã, nhập tên, vào lobby và xem màn hình câu hỏi demo.

Tasks:

```txt
1. Build /join page.
2. Build player info form.
3. Build /lobby/[quizCode].
4. Build QuestionScreen.tsx.
5. Build AnswerOption.tsx.
6. Build CountdownCircle.tsx.
7. Build /play/[quizCode] using mock/local data first.
8. Store player info and `quizParticipantId` in localStorage.
```

Done when:

- Giao diện `/play/DEMO123` giống ảnh tham khảo.
- Chọn đáp án được, card đổi trạng thái.
- Responsive tablet/mobile ổn.
- Reload không làm mất participant session.

---

## Phase 3 — Admin CRUD MVP

Mục tiêu:

- Admin quản lý được cuộc thi và câu hỏi.

Tasks:

```txt
1. Build /admin page.
2. Build /admin/login với password hash.
3. Protect admin routes.
4. Build /admin/quizzes.
5. Build quiz create/edit form.
6. Build /admin/questions/[quizId].
7. Build question create/edit/delete.
8. Add Zod validation.
9. Connect APIs to Prisma.
```

Done when:

- Admin tạo được quiz.
- Admin thêm/sửa/xóa câu hỏi.
- Player page đọc được câu hỏi từ database.
- Admin routes yêu cầu login.

---

## Phase 4 — Scoring + answer submit

Mục tiêu:

- Người chơi trả lời, hệ thống lưu đáp án và tính điểm.

Tasks:

```txt
1. Create lib/scoring.ts.
2. Create API POST /api/answers.
3. Validate duplicate answer.
4. Apply allowChangeAnswer rule.
5. Calculate responseTimeMs trên server bằng `questionStartedAt`.
6. Calculate score.
7. Create GET leaderboard API.
8. Build result page.
9. Build leaderboard page.
```

Done when:

- Trả lời đúng/sai được lưu DB.
- Điểm tính chính xác.
- Leaderboard hiển thị đúng.
- Không tin `responseTimeMs` từ client.

---

## Phase 5 — Managed realtime

Mục tiêu:

- Admin điều khiển realtime, player nhận trạng thái realtime.

Tasks:

```txt
1. Create lib/realtime.ts server publisher.
2. Create lib/realtime-events.ts typed payloads.
3. Create client subscription helper.
4. Implement channel by quizCode.
5. Publish participants:update after player join.
6. Implement quiz:start API action.
7. Implement quiz:next-question API action.
8. Implement quiz:show-answer API action.
9. Implement quiz:pause API action.
10. Implement quiz:finish API action.
11. Broadcast session:update.
12. Broadcast leaderboard:update.
13. Broadcast answers:count-update.
```

Done when:

- Mở 2 trình duyệt: admin và player.
- Admin bấm start, player chuyển từ lobby sang câu hỏi.
- Admin next-question, player nhận `currentQuestionOrder` mới và fetch câu đã assign cho mình.
- Player trả lời, admin thấy số người đã trả lời tăng.

---

## Phase 6 — Admin control panel

Mục tiêu:

- Ban tổ chức điều khiển cuộc thi thực tế.

Tasks:

```txt
1. Build /admin/control/[quizId].
2. Show quiz status.
3. Show current question.
4. Show participants count.
5. Show answered count.
6. Add action buttons.
7. Connect buttons to realtime-backed API actions.
8. Update database status/session.
```

Done when:

- Admin điều khiển full flow từ waiting đến finished.

---

## Phase 7 — Display screen

Mục tiêu:

- Màn hình lớn dùng tại sự kiện.

Tasks:

```txt
1. Build /display/[quizCode].
2. Listen to session:update.
3. Show current question only when `randomizeQuestions = false`.
4. Show answer cards only when `randomizeQuestions = false`.
5. Show countdown.
6. Show answered count.
7. Show correct answer when enabled.
8. Show leaderboard top 10.
```

Done when:

- Display screen tự cập nhật theo admin control.
- Nếu quiz dùng random question set, display screen hiển thị progress/countdown/leaderboard thay vì một câu hỏi chung.

---

## Phase 8 — Import/Export Excel

Mục tiêu:

- Admin import câu hỏi và export kết quả.

Tasks:

```txt
1. Build import UI.
2. Add template download.
3. Parse Excel/CSV.
4. Preview import rows.
5. Validate rows.
6. Save rows to DB.
7. Build export leaderboard.
8. Build export answer detail.
```

Done when:

- Import file mẫu thành công.
- Export kết quả ra Excel được.

---

## Phase 9 — Polish + QA

Mục tiêu:

- Hoàn thiện giao diện, test lỗi, chuẩn bị deploy.

Tasks:

```txt
1. Test responsive mobile/tablet/desktop.
2. Test duplicate answer.
3. Test player reload page.
4. Test admin reload page.
5. Test network reconnect basic.
6. Test quiz finished state.
7. Add empty states.
8. Add loading states.
9. Add error toasts.
10. Update README.
```

Done when:

- MVP chạy ổn định từ đầu đến cuối.

---

## 15. MVP ưu tiên làm trước

Nếu thời gian gấp, chỉ làm các mục sau:

```txt
1. Database models.
2. Seed quiz DEMO123.
3. Admin login password hash.
4. /join và assign 20 câu random.
5. /play/[quizCode].
6. QuestionScreen UI giống ảnh.
7. Submit answer.
8. Calculate score server-side.
9. Leaderboard.
10. Admin control đơn giản.
11. Managed realtime tương thích Vercel.
```

Chưa cần làm ngay:

```txt
1. NextAuth nâng cao.
2. Import Excel.
3. Export Excel.
4. Display screen.
5. Animation phức tạp.
6. Multi-admin.
7. Analytics nâng cao.
```

---

## 16. Acceptance criteria

### Player flow

- Người chơi vào bằng mã cuộc thi.
- Người chơi nhập được tên.
- Hệ thống assign cố định 20 câu random từ ngân hàng câu hỏi của quiz.
- Người chơi thấy phòng chờ.
- Khi admin start, người chơi thấy câu hỏi.
- Người chơi chọn được A/B/C/D.
- Sau khi chọn, không chọn lại nếu không được phép.
- Hệ thống lưu đáp án.
- Hệ thống tính điểm.
- Kết thúc cuộc thi, người chơi xem được kết quả.

### Admin flow

- Admin tạo được quiz.
- Admin tạo được câu hỏi.
- Admin đăng nhập được bằng password hash.
- Admin mở phòng.
- Admin bắt đầu cuộc thi.
- Admin chuyển câu hỏi.
- Admin hiện đáp án.
- Admin kết thúc cuộc thi.
- Admin xem leaderboard.

### Realtime

- Player subscribe channel thành công.
- Admin action broadcast tới player.
- Player answer broadcast count tới admin.
- Leaderboard update sau mỗi câu hoặc khi kết thúc.

### UI

- Màn hình chơi giống ảnh tham khảo.
- Tablet landscape hiển thị đẹp.
- Mobile không vỡ layout.
- 4 đáp án rõ ràng, dễ bấm.
- Countdown dễ nhìn.

---

## 17. Prompt ngắn cho Codex khi bắt đầu

```txt
Hãy đọc file quiz-codex-flow-plan.md và triển khai dự án theo từng phase. Bắt đầu từ Phase 0 và Phase 1. Không làm vượt scope. Sau mỗi phase, chạy test/build nếu có, báo rõ file đã tạo/sửa và bước tiếp theo.
```

---

## 18. Prompt cho Codex khi làm UI màn hình chơi

```txt
Hãy tập trung triển khai Player Question Screen giống ảnh tham khảo. Dùng React, TypeScript, Tailwind CSS. Giao diện full screen, nền xanh/tím gradient, phía trên có câu hỏi và countdown vòng tròn, bên dưới có 4 đáp án A/B/C/D dạng grid 2x2 lớn, tối ưu tablet landscape. Khi chọn đáp án thì card đổi trạng thái, khóa lựa chọn, có animation nhẹ. Không xử lý backend trong task này, chỉ tạo component sạch dễ tích hợp.
```

---

## 19. Prompt cho Codex khi làm realtime

```txt
Hãy triển khai managed realtime tương thích Vercel cho quiz, ưu tiên Pusher Channels hoặc Ably. Mỗi quizCode là một channel. Admin gọi API action để start, next question, show answer, pause, finish; server cập nhật database rồi publish event. Player subscribe channel và submit answer qua POST /api/answers. Server tự tính responseTimeMs từ questionStartedAt, tính điểm bằng lib/scoring.ts, broadcast answered count và leaderboard update. Viết type rõ ràng cho payload, tránh any nếu có thể.
```

---

## 20. Ghi chú bảo mật và ổn định

- Không tin dữ liệu từ client.
- `correctAnswer` không gửi xuống player khi chưa đến trạng thái show answer.
- API submit answer phải kiểm tra quiz status.
- API submit answer phải kiểm tra question hiện tại theo `quizParticipantId` và `currentQuestionOrder`.
- Không cho player trả lời câu không active.
- Không cho duplicate answer nếu `allowChangeAnswer = false`.
- Không nhận `responseTimeMs` từ client.
- Realtime secret key chỉ dùng server-side.
- Admin routes cần auth.
- Không log thông tin nhạy cảm.
- `.env` không commit lên git.

---

## 21. README cần có sau khi hoàn thành

README phải bao gồm:

```txt
1. Giới thiệu dự án.
2. Tech stack.
3. Cách cài đặt.
4. Cách cấu hình .env.
5. Cách chạy database migration.
6. Cách seed dữ liệu demo.
7. Cách chạy dev server.
8. Cách cấu hình Neon và realtime provider.
9. Tài khoản admin demo.
10. Mã cuộc thi demo.
11. Cấu trúc thư mục.
12. Flow sử dụng.
13. Hướng dẫn import câu hỏi.
14. Hướng dẫn export kết quả.
```

---

## 22. Kết luận

Ưu tiên số 1 là tạo được MVP ổn định deploy được trên Vercel + Neon, giao diện chơi giống ảnh, admin điều khiển realtime qua managed provider và tính điểm chính xác trên server. Các tính năng như import/export Excel, display screen đầy đủ và animation nâng cao triển khai sau khi flow chính đã chạy ổn định.
