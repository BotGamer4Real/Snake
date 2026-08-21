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
    destroy: (removeCanvas: boolean) => void;
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
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
    })();

    return () => {
      cancelled = true;
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

  const dead = hud.status === "dead";

  return (
    <div className="flex w-full flex-col items-center">
      <AccountBar />
      <Hud hud={hud} />
      <div className="relative w-full max-w-[688px]">
        <div className="pointer-events-none absolute -inset-8 rounded-[36px] bg-emerald-400/10 blur-3xl" />
        <div
          ref={parentRef}
          className="relative w-full overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]"
          style={{ aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}` }}
        />
        {hud.countdown != null && !dead && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[28px] bg-slate-950/35">
            <p className="font-mono text-7xl font-semibold text-white drop-shadow-[0_0_24px_rgba(52,211,153,0.55)]">
              {hud.countdown}
            </p>
          </div>
        )}
        {dead && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-slate-950/55 backdrop-blur-[6px]"
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
      <DPad onDir={emitDir} onRestart={emitRestart} dead={dead} />
      <p className="mt-5 max-w-sm text-center text-xs tracking-[0.18em] text-white/35 uppercase">
        WASD or arrows · eat · don&apos;t hit walls or yourself · git ok
      </p>
    </div>
  );
}
