"use client";

type CountdownCircleProps = {
  timeLeft: number;
  timeLimit: number;
};

export function CountdownCircle({ timeLeft, timeLimit }: CountdownCircleProps) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLimit > 0 ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 0;

  return (
    <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28 lg:h-32 lg:w-32">
      <svg className="-rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="rgba(15,23,42,0.28)" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="transparent"
          stroke={timeLeft <= 5 ? "#fbbf24" : "#67e8f9"}
          strokeLinecap="round"
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-4xl font-black leading-none text-white sm:text-5xl">{Math.ceil(timeLeft)}</div>
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cyan-100 sm:text-xs">giây</div>
        </div>
      </div>
    </div>
  );
}
