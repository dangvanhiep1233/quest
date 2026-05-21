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
        "group flex h-full min-h-24 rounded-2xl border-[3px] p-3 text-left shadow-glow transition duration-150 sm:min-h-0 sm:p-4 lg:rounded-[1.75rem] lg:p-5",
        "bg-gradient-to-br text-white active:scale-[0.98]",
        gradientByKey[optionKey],
        selected ? "scale-[1.02] border-white" : "border-white/15 hover:border-white/60",
        locked && "cursor-default",
        isCorrect && "border-emerald-200 from-emerald-600 to-emerald-500",
        isWrong && "border-red-200 from-red-600 to-rose-500"
      )}
    >
      <div className="flex h-full w-full items-center gap-3 sm:gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-blue-700 shadow-lg sm:h-12 sm:w-12 sm:text-xl lg:h-14 lg:w-14 lg:text-2xl">
          {optionKey}
        </div>
        <div className="min-w-0 text-base font-extrabold leading-snug sm:text-xl lg:text-2xl">{text}</div>
      </div>
    </button>
  );
}
