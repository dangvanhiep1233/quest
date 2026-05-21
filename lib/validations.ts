import { z } from "zod";

export const answerKeySchema = z.enum(["A", "B", "C", "D"]);

export const quizSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional().nullable(),
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/),
  defaultTimeLimit: z.coerce.number().int().positive().max(60).default(15),
  questionsPerSession: z.coerce.number().int().positive().max(100).default(20),
  randomizeQuestions: z.coerce.boolean().default(true),
  allowChangeAnswer: z.coerce.boolean().default(false),
  showCorrectAnswer: z.coerce.boolean().default(true)
});

export const questionSchema = z.object({
  topic: z.coerce.string().trim().min(1).max(31).default("Chung"),
  order: z.coerce.number().int().positive(),
  text: z.coerce.string().min(3),
  imageUrl: z.coerce.string().url().optional().or(z.literal("")).nullable(),
  optionA: z.coerce.string().min(1),
  optionB: z.coerce.string().min(1),
  optionC: z.coerce.string().min(1),
  optionD: z.coerce.string().min(1),
  correctAnswer: answerKeySchema,
  explanation: z.coerce.string().optional().nullable(),
  score: z.coerce.number().positive().default(2),
  timeLimit: z.coerce.number().int().positive().max(60).default(15)
});

export const joinPlayerSchema = z.object({
  quizCode: z.string().min(3),
  playerId: z.string().optional(),
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  organization: z.string().optional()
});

export const submitAnswerSchema = z.object({
  quizId: z.string().min(1),
  quizParticipantId: z.string().min(1),
  questionId: z.string().min(1),
  selectedAnswer: answerKeySchema,
  selectionVersion: z.coerce.number().int().nonnegative().default(0)
});

export const finalizeAnswerSchema = z.object({
  selectedAnswer: answerKeySchema.nullish(),
  responseTimeMs: z.coerce.number().int().nonnegative().optional(),
  answerResponseTimes: z
    .object({
      A: z.coerce.number().int().nonnegative().optional(),
      B: z.coerce.number().int().nonnegative().optional(),
      C: z.coerce.number().int().nonnegative().optional(),
      D: z.coerce.number().int().nonnegative().optional()
    })
    .optional()
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
