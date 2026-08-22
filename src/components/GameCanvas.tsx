"use client";

import { useEffect, useRef, useState } from "react";
import { AccountBar } from "@/components/AccountBar";
import { DPad } from "@/components/DPad";
import { Hud } from "@/components/Hud";
import { useAuth } from "@/components/AuthProvider";
import { COLS, ROWS } from "@/game/constants";
import type { Dir } from "@/game/engine";
import { DIR_EVENT, HIGH_SCORE_SET, HUD_EVENT, HUD_REQUEST, RESTART_EVENT, type HudPayload } from "@/game/events";
import { CELL, PAD } from "@/game/theme";

const GAME_WIDTH = COLS * CELL + PAD * 2;
const GAME_HEIGHT = ROWS * CELL + PAD * 2;
const SWIPE_MIN = 28;

const idleHud: HudPayload = {
  score: 0,
  highScore: 0,
  status: "playing",
  newBest: false,
  countdown: 3,
};

export default function GameCanvas() {
  type GameHandle = {
    events: {
      emit: (event: string, ...args: unknown[]) => void;
      on: (event: string, fn: (payload: HudPayload) => void) => void;
      off: (event: string, fn: (payload: HudPayload) => void) => void;
    };
    scale: { refresh: () => void };
    destroy: (removeCanvas: boolean) => void;
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const swipeRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const [hud, setHud] = useState<HudPayload>(idleHud);
  const { highScore: cloudHighScore } = useAuth();
  const cloudHighScoreRef = useRef(cloudHighScore);

  useEffect(() => {
    cloudHighScoreRef.current = cloudHighScore;
  }, [cloudHighScore]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    let cancelled = false;
    const onHud = (payload: HudPayload) => setHud(payload);

    (async () => {
      const { createGame } = await import("@/game/createGame");
      if (cancelled || !parentRef.current) return;
      const game = createGame(parentRef.current);
      gameRef.current = game;
      game.events.on(HUD_EVENT, onHud);
      game.events.emit(HUD_REQUEST);
      if (cloudHighScoreRef.current != null) {
        game.events.emit(HIGH_SCORE_SET, cloudHighScoreRef.current);
      }
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
    if (cloudHighScore == null) return;
    gameRef.current?.events.emit(HIGH_SCORE_SET, cloudHighScore);
  }, [cloudHighScore]);

  const emitDir = (dir: Dir) => {
    gameRef.current?.events.emit(DIR_EVENT, dir);
  };

  const emitRestart = () => {
    gameRef.current?.events.emit(RESTART_EVENT);
  };

  const onSwipeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    swipeRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const onSwipeEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || start.id !== event.pointerId) return;
    if (hud.status === "dead") return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
    if (Math.abs(dx) > Math.abs(dy)) emitDir(dx > 0 ? "right" : "left");
    else emitDir(dy > 0 ? "down" : "up");
  };

  const dead = hud.status === "dead";

  return (
    <div className="flex h-dvh max-h-dvh w-full max-w-[720px] flex-col overflow-hidden px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:h-auto sm:max-h-none sm:px-4 sm:py-6">
      <div className="flex shrink-0 items-start justify-between gap-2">
        <Hud hud={hud} />
        <AccountBar />
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center py-2 sm:py-4">
        <div
          className="relative w-full max-h-full touch-none"
          style={{
            maxWidth: "min(100%, 688px)",
            aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
          }}
          onPointerDown={onSwipeStart}
          onPointerUp={onSwipeEnd}
          onPointerCancel={() => {
            swipeRef.current = null;
          }}
        >
          <div className="pointer-events-none absolute -inset-4 rounded-[36px] bg-emerald-400/10 blur-3xl sm:-inset-8" />
          <div
            ref={parentRef}
            className="relative h-full w-full overflow-hidden rounded-[22px] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] sm:rounded-[28px]"
          />
          {hud.countdown != null && !dead && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[22px] bg-slate-950/35 sm:rounded-[28px]">
              <p className="font-mono text-6xl font-semibold text-white drop-shadow-[0_0_24px_rgba(52,211,153,0.55)] sm:text-7xl">
                {hud.countdown}
              </p>
            </div>
          )}
          {dead && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-[22px] bg-slate-950/55 backdrop-blur-[6px] sm:rounded-[28px]"
              onClick={emitRestart}
            >
              <div className="mx-6 w-full max-w-xs rounded-3xl border border-white/15 bg-slate-950/80 px-6 py-7 text-center shadow-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
                  Game over
                </p>
                <p className="mt-3 font-mono text-5xl font-semibold text-white">
                  {hud.score}
                </p>
                <p className="mt-2 text-sm text-emerald-200/80">
                  {hud.newBest ? "New personal best" : `Best ${hud.highScore}`}
                </p>
                <button
                  type="button"
                  className="mt-6 h-12 w-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 text-sm font-semibold tracking-[0.18em] text-slate-950 uppercase"
                  onClick={emitRestart}
                >
                  Play again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <DPad onDir={emitDir} onRestart={emitRestart} dead={dead} />
        <p className="mt-2 hidden text-center text-xs tracking-[0.18em] text-white/35 uppercase sm:mt-5 sm:block">
          WASD or arrows · eat · don&apos;t hit walls or yourself
        </p>
        <p className="mt-2 text-center text-[11px] tracking-[0.16em] text-white/35 uppercase sm:hidden">
          Swipe the board or use the pad
        </p>
      </div>
    </div>
  );
}
