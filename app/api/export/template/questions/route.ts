import * as XLSX from "xlsx";

export async function GET() {
  const workbook = XLSX.utils.book_new();
  const topics = [
    "Chu de 1",
    "Chu de 2",
    "Chu de 3",
    "Chu de 4",
    "Chu de 5",
    "Chu de 6",
    "Chu de 7",
    "Chu de 8"
  ];

  for (const topic of topics) {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        topic,
        order: 1,
        question: "Thủ đô của Việt Nam là gì?",
        optionA: "Hà Nội",
        optionB: "Đà Nẵng",
        optionC: "Huế",
        optionD: "TP. Hồ Chí Minh",
        correctAnswer: "A",
        score: 2,
        timeLimit: 15,
        explanation: "Hà Nội là thủ đô của Việt Nam."
      }
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, topic);
  }
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=question-template.xlsx"
    }
  });
}
