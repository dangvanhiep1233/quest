import bcrypt from "bcryptjs";
import { PrismaClient, AnswerKey } from "@prisma/client";

const prisma = new PrismaClient();

const demoTopics = [
  "Chu de 1",
  "Chu de 2",
  "Chu de 3",
  "Chu de 4",
  "Chu de 5",
  "Chu de 6",
  "Chu de 7",
  "Chu de 8"
] as const;

const demoQuestions = [
  ["Thủ đô của Việt Nam là thành phố nào?", "Hà Nội", "Đà Nẵng", "Huế", "TP. Hồ Chí Minh", "A"],
  ["Đỉnh núi cao nhất Việt Nam là gì?", "Bạch Mã", "Phan Xi Păng", "Ba Vì", "Langbiang", "B"],
  ["Hành tinh nào gần Mặt Trời nhất?", "Sao Kim", "Sao Hỏa", "Sao Thủy", "Sao Mộc", "C"],
  ["Đơn vị đo cường độ dòng điện là gì?", "Volt", "Watt", "Ohm", "Ampere", "D"],
  ["Ai là tác giả Truyện Kiều?", "Nguyễn Du", "Hồ Xuân Hương", "Nguyễn Trãi", "Nam Cao", "A"],
  ["Sông nào dài nhất Việt Nam chảy hoàn toàn trong lãnh thổ?", "Sông Đồng Nai", "Sông Hồng", "Sông Mã", "Sông Ba", "A"],
  ["HTML là viết tắt của cụm từ nào?", "HyperText Markup Language", "HighText Machine Language", "HyperTool Multi Language", "Home Tool Markup Language", "A"],
  ["CSS dùng để làm gì trong website?", "Quản lý dữ liệu", "Tạo kiểu giao diện", "Chạy máy chủ", "Mã hóa mật khẩu", "B"],
  ["Kết quả của 12 x 8 là bao nhiêu?", "84", "90", "96", "108", "C"],
  ["Nước nào có diện tích lớn nhất thế giới?", "Canada", "Trung Quốc", "Hoa Kỳ", "Nga", "D"],
  ["Bảng tuần hoàn hóa học sắp xếp nguyên tố theo gì?", "Khối lượng riêng", "Số hiệu nguyên tử", "Màu sắc", "Nhiệt độ nóng chảy", "B"],
  ["Loài cây nào thường được dùng làm biểu tượng Tết Việt Nam ở miền Bắc?", "Hoa mai", "Hoa đào", "Hoa sen", "Hoa cúc", "B"],
  ["Tốc độ ánh sáng trong chân không xấp xỉ bao nhiêu?", "300.000 km/s", "30.000 km/s", "3.000 km/s", "300 km/s", "A"],
  ["Trong bóng đá, một đội có bao nhiêu cầu thủ trên sân khi bắt đầu trận?", "9", "10", "11", "12", "C"],
  ["Nền tảng Vercel thường dùng để deploy framework nào rất phổ biến?", "Next.js", "Laravel", "Django", "Spring Boot", "A"],
  ["Neon là dịch vụ database tương thích với hệ quản trị nào?", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "B"],
  ["Trong JavaScript, kiểu dữ liệu boolean có mấy giá trị cơ bản?", "1", "2", "3", "4", "B"],
  ["Biển Đông nằm ở phía nào của Việt Nam?", "Đông", "Tây", "Bắc", "Nam", "A"],
  ["Câu lệnh SQL nào dùng để lấy dữ liệu?", "INSERT", "SELECT", "UPDATE", "DELETE", "B"],
  ["Màu xanh lá thường dùng để biểu thị trạng thái nào trong quiz?", "Sai", "Đúng", "Hết giờ", "Chưa chọn", "B"],
  ["Một phút có bao nhiêu giây?", "30", "45", "60", "90", "C"],
  ["React component thường trả về gì?", "SQL", "HTML/XML-like UI", "File ảnh", "Binary", "B"],
  ["Prisma trong dự án này đóng vai trò gì?", "ORM database", "Thư viện animation", "Realtime provider", "CSS framework", "A"],
  ["Tailwind CSS hỗ trợ chính cho phần nào?", "Database", "Authentication", "Styling utility classes", "Email server", "C"],
  ["HTTP status 404 thường có nghĩa là gì?", "Thành công", "Không tìm thấy", "Lỗi xác thực", "Chuyển hướng", "B"]
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  await prisma.adminUser.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash, name: "Demo Admin" },
    create: {
      email: "admin@example.com",
      name: "Demo Admin",
      passwordHash
    }
  });

  const quiz = await prisma.quiz.upsert({
    where: { code: "DEMO123" },
    update: {
      title: "Cuộc thi demo realtime",
      description: "Quiz demo với 400 câu hỏi, mỗi lượt thi nhận 20 câu random.",
      status: "OPEN",
      randomizeQuestions: true,
      questionsPerSession: 20,
      defaultTimeLimit: 15
    },
    create: {
      title: "Cuộc thi demo realtime",
      description: "Quiz demo với 400 câu hỏi, mỗi lượt thi nhận 20 câu random.",
      code: "DEMO123",
      status: "OPEN",
      randomizeQuestions: true,
      questionsPerSession: 20,
      defaultTimeLimit: 15
    }
  });

  await prisma.playerAnswer.deleteMany({ where: { quizId: quiz.id } });
  await prisma.quizParticipantQuestion.deleteMany({ where: { quizId: quiz.id } });
  await prisma.quizParticipant.deleteMany({ where: { quizId: quiz.id } });
  await prisma.quizSession.deleteMany({ where: { quizId: quiz.id } });
  await prisma.question.deleteMany({ where: { quizId: quiz.id } });

  const seededQuestions = Array.from({ length: 400 }, (_, index) => {
    const row = demoQuestions[index % demoQuestions.length];
    const topic = demoTopics[index % demoTopics.length];
    const topicOrder = Math.floor(index / demoTopics.length) + 1;
    return { row, index, topic, topicOrder };
  });

  await prisma.question.createMany({
    data: seededQuestions.map(({ row, index, topic, topicOrder }) => ({
      quizId: quiz.id,
      topic,
      order: topicOrder,
      text: `${row[0]} (${topic} #${topicOrder})`,
      optionA: row[1],
      optionB: row[2],
      optionC: row[3],
      optionD: row[4],
      correctAnswer: row[5] as AnswerKey,
      score: 2,
      timeLimit: 15,
      explanation: `Đáp án đúng là ${row[5]}.`
    }))
  });

  await prisma.quizSession.create({
    data: {
      quizId: quiz.id,
      currentQuestionOrder: 1,
      totalQuestions: 20,
      status: "WAITING"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
