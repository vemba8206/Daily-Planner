export default function ProgressRing({ percentage, size = 96 }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative grid place-items-center" style={{ height: size, width: size }}>
      <svg viewBox="0 0 96 96" className="-rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          className="text-violet-100 dark:text-white/10"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeLinecap="round"
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="progress-gradient">
            <stop stopColor="#8b5cf6" />
            <stop offset="0.55" stopColor="#d946ef" />
            <stop offset="1" stopColor="#ed2939" />
          </linearGradient>
        </defs>
      </svg>
      <strong className="absolute text-lg text-slate-950 dark:text-white">{percentage}%</strong>
    </div>
  );
}
