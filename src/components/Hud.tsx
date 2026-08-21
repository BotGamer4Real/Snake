import type { HudPayload } from "@/game/events";

export function Hud({ hud }: { hud: HudPayload }) {
  return (
    <div className="mb-4 flex w-full max-w-[688px] items-end justify-between gap-3 px-1">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/45">
          Classic rules
        </p>
        <h1 className="bg-gradient-to-r from-emerald-200 via-white to-rose-200 bg-clip-text text-4xl font-semibold tracking-[0.18em] text-transparent">
          SNAKE
        </h1>
      </div>
      <div className="flex gap-2">
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
      className={`min-w-[76px] rounded-2xl border px-3 py-2 text-right shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md ${
        accent
          ? "border-emerald-300/25 bg-emerald-400/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>
      <div className="font-mono text-2xl font-semibold tabular-nums text-white">
        {value}
      </div>
    </div>
  );
}
