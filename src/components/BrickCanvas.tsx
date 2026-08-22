"use client";

import { useEffect, useRef, useState } from "react";
import { BrickPad } from "@/components/BrickPad";
import { LivesMeter } from "@/components/LivesMeter";
import { useAuth } from "@/components/AuthProvider";
import { GAME_HEIGHT, GAME_WIDTH, PAD, SCALE } from "@/game/brick/constants";
import type { BrickDir, BrickHud } from "@/game/brick/events";
import {
  HIGH_SCORE_SET,
  HUD_EVENT,
  HUD_REQUEST,
  LAUNCH_EVENT,
  MOVE_END,
  MOVE_START,
  PADDLE_SET,
  RESTART_EVENT,
} from "@/game/brick/events";

const idleHud: BrickHud = {
  score: 0,
  highScore: 0,
  lives: 3,
  level: 1,
  bricks: 0,
  status: "playing",
  newBest: false,
  countdown: 3,
  served: false,
};

export default function BrickCanvas({ onBack }: { onBack: () => void }) {
  type GameHandle = {
    events: {
      emit: (event: string, ...args: unknown[]) => void;
      on: (event: string, fn: (payload: BrickHud) => void) => void;
      off: (event: string, fn: (payload: BrickHud) => void) => void;
    };
    scale: { refresh: () => void };
    destroy: (removeCanvas: boolean) => void;
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [hud, setHud] = useState<BrickHud>(idleHud);
  const { highScores } = useAuth();
  const best = highScores.brick;
  const bestRef = useRef(best);

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;
    let cancelled = false;
    const onHud = (payload: BrickHud) => setHud(payload);

    (async () => {
      const { createBrickGame } = await import("@/game/brick/createGame");
      if (cancelled || !parentRef.current) return;
      const game = createBrickGame(parentRef.current);
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

  const emitPaddleFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - bounds.left;
    const world = (px / Math.max(1, bounds.width)) * GAME_WIDTH;
    gameRef.current?.events.emit(PADDLE_SET, (world - PAD) / SCALE);
  };

  const dead = hud.status === "dead";

  return (
    <div className="flex h-dvh max-h-dvh w-full max-w-[760px] flex-col overflow-hidden px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:h-auto sm:max-h-none sm:px-4 sm:py-6">
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0">
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/45 sm:block">
              Bounce. Break. Repeat.
            </p>
            <h1 className="bg-gradient-to-r from-sky-200 via-white to-violet-200 bg-clip-text text-2xl font-semibold tracking-[0.18em] text-transparent sm:text-4xl">
              BRICK
            </h1>
          </div>
          <LivesMeter lives={hud.lives} />
        </div>
        <div className="flex items-start gap-1.5 sm:gap-2">
          <Stat label="Score" value={hud.score} accent />
          <Stat label="Best" value={hud.highScore} />
          <Stat label="Lv" value={hud.level} />
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-white/70 uppercase hover:bg-white/10"
          >
            Main menu
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm tracking-[0.16em] text-white/50 uppercase">
        {hud.served ? `Bricks ${hud.bricks}` : "Launch to serve"}
      </p>
      <div className="flex min-h-0 flex-1 items-center justify-center py-2 sm:py-4">
        <div
          className="relative max-h-full min-h-0 min-w-0 touch-none"
          style={{
            width: "min(28rem, 100%)",
            aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
          }}
          onPointerDown={(event) => {
            emitPaddleFromPointer(event);
            if (!hud.served) gameRef.current?.events.emit(LAUNCH_EVENT);
          }}
          onPointerMove={emitPaddleFromPointer}
        >
          <div className="pointer-events-none absolute -inset-3 rounded-[32px] bg-sky-400/10 blur-2xl sm:-inset-6" />
          <div
            ref={parentRef}
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] border border-sky-200/15 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] sm:rounded-[24px]"
          />
          {hud.countdown != null && !dead && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[20px] bg-slate-950/35 sm:rounded-[24px]">
              <p className="font-mono text-6xl font-semibold text-white drop-shadow-[0_0_24px_rgba(56,189,248,0.55)] sm:text-7xl">
                {hud.countdown}
              </p>
            </div>
          )}
          {dead && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-slate-950/55 backdrop-blur-[6px] sm:rounded-[24px]"
              onClick={() => gameRef.current?.events.emit(RESTART_EVENT)}
            >
              <div className="mx-4 w-full max-w-[16rem] rounded-3xl border border-white/15 bg-slate-950/85 px-5 py-6 text-center shadow-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
                  Game over
                </p>
                <p className="mt-3 font-mono text-5xl font-semibold text-white">{hud.score}</p>
                <p className="mt-2 text-sm text-sky-200/80">
                  {hud.newBest ? "New personal best" : `Best ${hud.highScore}`}
                </p>
                <button
                  type="button"
                  className="mt-5 h-11 w-full rounded-full bg-gradient-to-r from-sky-300 to-violet-300 text-sm font-semibold tracking-[0.18em] text-slate-950 uppercase"
                  onClick={(event) => {
                    event.stopPropagation();
                    gameRef.current?.events.emit(RESTART_EVENT);
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
        <BrickPad
          onMoveStart={(dir: BrickDir) => gameRef.current?.events.emit(MOVE_START, dir)}
          onMoveEnd={(dir: BrickDir) => gameRef.current?.events.emit(MOVE_END, dir)}
          onLaunch={() => gameRef.current?.events.emit(LAUNCH_EVENT)}
        />
        <p className="mt-2 hidden text-center text-xs tracking-[0.18em] text-white/35 uppercase sm:mt-5 sm:block">
          Arrows or AD · space to serve · drag the field
        </p>
        <p className="mt-2 text-center text-[11px] tracking-[0.16em] text-white/35 uppercase sm:hidden">
          Drag the field or use the pad · go to serve
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
        accent ? "border-sky-300/25 bg-sky-400/10" : "border-white/10 bg-white/5"
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
