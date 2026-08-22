type PlayHud = {
  score: number;
  highScore: number;
};

export function Hud({
  hud,
  title,
  kicker = "Classic rules",
}: {
  hud: PlayHud;
  title: string;
  kicker?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-end justify-between gap-2">
      <div className="min-w-0">
        <p className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/45 sm:block">
          {kicker}
        </p>
        <h1 className="bg-gradient-to-r from-emerald-200 via-white to-rose-200 bg-clip-text text-2xl font-semibold tracking-[0.18em] text-transparent sm:text-4xl">
          {title}
        </h1>
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        <Stat label="Score" value={hud.score} accent />
        <Stat label="Best" value={hud.highScore} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`min-w-[64px] rounded-2xl border px-2.5 py-1.5 text-right shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md sm:min-w-[76px] sm:px-3 sm:py-2 ${
        accent
          ? "border-emerald-300/25 bg-emerald-400/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>
      <div className="font-mono text-xl font-semibold tabular-nums text-white sm:text-2xl">
        {value}
      </div>
    </div>
  );
}
