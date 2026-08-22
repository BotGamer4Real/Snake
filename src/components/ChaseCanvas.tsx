"use client";

import { useEffect, useRef, useState } from "react";
import { DPad } from "@/components/DPad";
import { useAuth } from "@/components/AuthProvider";
import { GAME_HEIGHT, GAME_WIDTH } from "@/game/chase/constants";
import type { ChaseDir, ChaseHud } from "@/game/chase/events";
import {
  DIR_EVENT,
  HIGH_SCORE_SET,
  HUD_EVENT,
  HUD_REQUEST,
  RESTART_EVENT,
} from "@/game/chase/events";

const idleHud: ChaseHud = {
  score: 0,
  highScore: 0,
  lives: 3,
  level: 0,
  pips: 0,
  status: "playing",
  newBest: false,
  countdown: 3,
};

export default function ChaseCanvas({ onBack }: { onBack: () => void }) {
  type GameHandle = {
    events: {
      emit: (event: string, ...args: unknown[]) => void;
      on: (event: string, fn: (payload: ChaseHud) => void) => void;
      off: (event: string, fn: (payload: ChaseHud) => void) => void;
    };
    scale: { refresh: () => void };
    destroy: (removeCanvas: boolean) => void;
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [hud, setHud] = useState<ChaseHud>(idleHud);
  const { highScores } = useAuth();
  const best = highScores.chase;
  const bestRef = useRef(best);

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;
    let cancelled = false;
    const onHud = (payload: ChaseHud) => setHud(payload);

    (async () => {
      const { createChaseGame } = await import("@/game/chase/createGame");
      if (cancelled || !parentRef.current) return;
      const game = createChaseGame(parentRef.current);
      gameRef.current = game;
      game.events.on(HUD_EVENT, onHud);
      game.events.emit(HUD_REQUEST);
      game.events.emit(HIGH_SCORE_SET, bestRef.current);
      game.scale.refresh();
    })();

    const onResize = () => gameRef.current?.scale.refresh();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      gameRef.current?.events.off(HUD_EVENT, onHud);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.events.emit(HIGH_SCORE_SET, best);
  }, [best]);

  const emitDir = (dir: ChaseDir) => {
    gameRef.current?.events.emit(DIR_EVENT, dir);
  };
  const emitRestart = () => {
    gameRef.current?.events.emit(RESTART_EVENT);
  };

  const dead = hud.status === "dead";

  return (
    <div className="flex h-dvh max-h-dvh w-full max-w-[760px] flex-col overflow-hidden px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:h-auto sm:max-h-none sm:px-4 sm:py-6">
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-200/45 sm:block">
            Eat. Dodge. Boost.
          </p>
          <h1 className="bg-gradient-to-r from-rose-200 via-white to-sky-200 bg-clip-text text-2xl font-semibold tracking-[0.18em] text-transparent sm:text-4xl">
            CHASE
          </h1>
        </div>
        <div className="flex items-start gap-1.5 sm:gap-2">
          <Stat label="Score" value={hud.score} accent />
          <Stat label="Best" value={hud.highScore} />
          <Stat label="Lv" value={hud.level + 1} />
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-white/70 uppercase hover:bg-white/10"
          >
            Main menu
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] tracking-[0.16em] text-white/40 uppercase">
        Lives {hud.lives} · Pips {hud.pips}
      </p>
      <div className="flex min-h-0 flex-1 items-center justify-center py-2 sm:py-4">
        <div
          className="relative max-h-full min-h-0 min-w-0"
          style={{
            width: "min(26rem, 100%)",
            aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
          }}
        >
          <div className="pointer-events-none absolute -inset-3 rounded-[32px] bg-rose-400/10 blur-2xl sm:-inset-6" />
          <div
            ref={parentRef}
            className="absolute inset-0 overflow-hidden rounded-[20px] border border-rose-200/15 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] sm:rounded-[24px]"
          />
          {hud.countdown != null && !dead && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[20px] bg-slate-950/35 sm:rounded-[24px]">
              <p className="font-mono text-6xl font-semibold text-white drop-shadow-[0_0_24px_rgba(251,113,133,0.55)] sm:text-7xl">
                {hud.countdown}
              </p>
            </div>
          )}
          {dead && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-slate-950/55 backdrop-blur-[6px] sm:rounded-[24px]"
              onClick={emitRestart}
            >
              <div className="mx-4 w-full max-w-[16rem] rounded-3xl border border-white/15 bg-slate-950/85 px-5 py-6 text-center shadow-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
                  Game over
                </p>
                <p className="mt-3 font-mono text-5xl font-semibold text-white">
                  {hud.score}
                </p>
                <p className="mt-2 text-sm text-rose-200/80">
                  {hud.newBest ? "New personal best" : `Best ${hud.highScore}`}
                </p>
                <button
                  type="button"
                  className="mt-5 h-11 w-full rounded-full bg-gradient-to-r from-rose-300 to-amber-200 text-sm font-semibold tracking-[0.18em] text-slate-950 uppercase"
                  onClick={(event) => {
                    event.stopPropagation();
                    emitRestart();
                  }}
                >
                  Play again
                </button>
                <button
                  type="button"
                  className="mt-3 h-10 w-full rounded-full border border-white/15 text-xs font-semibold tracking-[0.18em] text-white/80 uppercase"
                  onClick={(event) => {
                    event.stopPropagation();
                    onBack();
                  }}
                >
                  Main menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <DPad onDir={emitDir} />
        <p className="mt-2 hidden text-center text-xs tracking-[0.18em] text-white/35 uppercase sm:mt-5 sm:block">
          WASD or arrows · eat pips · boosts reverse the hunt
        </p>
        <p className="mt-2 text-center text-[11px] tracking-[0.16em] text-white/35 uppercase sm:hidden">
          Pad to turn · grab the four boosts
        </p>
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
      className={`min-w-[52px] rounded-2xl border px-2 py-1.5 text-right sm:min-w-[68px] sm:px-3 sm:py-2 ${
        accent
          ? "border-rose-300/25 bg-rose-400/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
      <div className="font-mono text-lg font-semibold tabular-nums text-white sm:text-xl">
        {value}
      </div>
    </div>
  );
}
