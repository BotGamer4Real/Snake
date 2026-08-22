"use client";

import { AccountBar } from "@/components/AccountBar";
import { useAuth } from "@/components/AuthProvider";
import { GAME_IDS, GAME_META, type GameId } from "@/lib/games";

type Props = {
  onPlay: (gameId: GameId) => void;
};

export function ArcadeMenu({ onPlay }: Props) {
  const { highScores } = useAuth();

  return (
    <div className="flex min-h-dvh w-full max-w-[720px] flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
            BotGamers Arcade
          </p>
          <h1 className="mt-1 bg-gradient-to-r from-violet-300 via-amber-200 to-sky-300 bg-clip-text text-3xl font-semibold tracking-[0.12em] text-transparent sm:text-4xl">
            PLAY
          </h1>
        </div>
        <AccountBar />
      </div>

      <div className="mx-auto mt-6 w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/branding/botgamers-logo.jpg"
          alt="BotGamers"
          className="mx-auto max-h-40 w-auto rounded-2xl object-contain sm:max-h-52"
        />
      </div>

      <div className="mt-8 grid flex-1 content-start gap-3">
        {GAME_IDS.map((id) => {
          const meta = GAME_META[id];
          return (
            <GameCard
              key={id}
              title={meta.title}
              blurb={meta.blurb}
              action="Play"
              comingSoon={!meta.playable}
              best={meta.playable ? (highScores[id] ?? 0) : null}
              accent={id === "blocks" ? "cyan" : id === "chase" ? "rose" : "emerald"}
              onClick={meta.playable ? () => onPlay(id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

function GameCard({
  title,
  blurb,
  action,
  comingSoon = false,
  best,
  accent = "emerald",
  onClick,
}: {
  title: string;
  blurb: string;
  action?: string;
  comingSoon?: boolean;
  best?: number | null;
  accent?: "emerald" | "cyan" | "rose";
  onClick?: () => void;
}) {
  const playableClass =
    accent === "cyan"
      ? "border-cyan-300/25 bg-cyan-400/10 active:scale-[0.99]"
      : accent === "rose"
        ? "border-rose-300/25 bg-rose-400/10 active:scale-[0.99]"
        : "border-emerald-300/25 bg-emerald-400/10 active:scale-[0.99]";
  const className = `w-full rounded-2xl border px-5 py-4 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] ${
    comingSoon ? "border-white/8 bg-white/4 opacity-55" : playableClass
  }`;

  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-[0.14em] text-white uppercase">
          {title}
        </h2>
        <span
          className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${
            accent === "cyan"
              ? "text-cyan-200/80"
              : accent === "rose"
                ? "text-rose-200/80"
                : "text-emerald-200/80"
          }`}
        >
          {comingSoon ? "Soon" : action}
        </span>
      </div>
      <p className="mt-1 text-sm text-white/55">{blurb}</p>
      {best != null && (
        <p className="mt-2 font-mono text-sm text-white/70">
          Best {best}
        </p>
      )}
    </>
  );

  if (comingSoon) {
    return <div className={className}>{body}</div>;
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {body}
    </button>
  );
}
