import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number) {
  return Number.isInteger(score) ? `${score}` : score.toFixed(2).replace(/0$/, "");
}

export function normalizeQuizCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function toCsvSafe(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
