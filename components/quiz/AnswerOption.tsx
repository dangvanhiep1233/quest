"use client";

import type { AnswerKey } from "@/lib/realtime-events";
import { cn } from "@/lib/utils";

const gradientByKey: Record<AnswerKey, string> = {
  A: "from-blue-700 to-blue-500",
  B: "from-sky-600 to-cyan-500",
  C: "from-cyan-600 to-teal-500",
  D: "from-blue-600 to-cyan-600"
};

type AnswerOptionProps = {
  optionKey: AnswerKey;
  text: string;
  selected: boolean;
  locked: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  onSelect: (answer: AnswerKey) => void;
};

export function AnswerOption({
  optionKey,
  text,
  selected,
  locked,
  isCorrect,
  isWrong,
  onSelect
}: AnswerOptionProps) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onSelect(optionKey)}
      className={cn(
        "group min-h-28 rounded-[2rem] border-4 p-5 text-left shadow-glow transition duration-200 sm:min-h-36 sm:p-7",
        "bg-gradient-to-br text-white active:scale-[0.98]",
        gradientByKey[optionKey],
        selected ? "scale-[1.02] border-white" : "border-white/15 hover:border-white/60",
        locked && "cursor-default",
        isCorrect && "border-emerald-200 from-emerald-600 to-emerald-500",
        isWrong && "border-red-200 from-red-600 to-rose-500"
      )}
    >
      <div className="flex h-full items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-2xl font-black text-blue-700 shadow-lg sm:h-16 sm:w-16 sm:text-3xl">
          {optionKey}
        </div>
        <div className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">{text}</div>
      </div>
    </button>
  );
}
