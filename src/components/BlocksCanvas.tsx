"use client";

import { useEffect, useRef, useState } from "react";
import { BlocksPad } from "@/components/BlocksPad";
import { Hud } from "@/components/Hud";
import { useAuth } from "@/components/AuthProvider";
import { GAME_HEIGHT, GAME_WIDTH } from "@/game/blocks/constants";
import type { BlocksDir, BlocksHud } from "@/game/blocks/events";
import {
  HIGH_SCORE_SET,
  HUD_EVENT,
  HUD_REQUEST,
  MOVE_END,
  MOVE_START,
  RESTART_EVENT,
  ROTATE_EVENT,
} from "@/game/blocks/events";

const idleHud: BlocksHud = {
  score: 0,
  highScore: 0,
  status: "playing",
  newBest: false,
  countdown: 3,
  lines: 0,
  level: 0,
};

export default function BlocksCanvas({ onBack }: { onBack: () => void }) {
  type GameHandle = {
    events: {
      emit: (event: string, ...args: unknown[]) => void;
      on: (event: string, fn: (payload: BlocksHud) => void) => void;
      off: (event: string, fn: (payload: BlocksHud) => void) => void;
    };
    scale: { refresh: () => void };
    destroy: (removeCanvas: boolean) => void;
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [hud, setHud] = useState<BlocksHud>(idleHud);
  const { highScores } = useAuth();
  const best = highScores.blocks;
  const bestRef = useRef(best);

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    let cancelled = false;
    const onHud = (payload: BlocksHud) => setHud(payload);

    (async () => {
      const { createBlocksGame } = await import("@/game/blocks/createGame");
      if (cancelled || !parentRef.current) return;
      const game = createBlocksGame(parentRef.current);
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

  const emitMoveStart = (dir: BlocksDir) => {
    gameRef.current?.events.emit(MOVE_START, dir);
  };
  const emitMoveEnd = (dir: BlocksDir) => {
    gameRef.current?.events.emit(MOVE_END, dir);
  };
  const emitRotate = () => {
    gameRef.current?.events.emit(ROTATE_EVENT);
  };
  const emitRestart = () => {
    gameRef.current?.events.emit(RESTART_EVENT);
  };

  const dead = hud.status === "dead";

  return (
    <div className="flex h-dvh max-h-dvh w-full max-w-[720px] flex-col overflow-hidden px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:h-auto sm:max-h-none sm:px-4 sm:py-6">
      <div className="flex shrink-0 items-start justify-between gap-2">
        <Hud hud={hud} title="BLOCKS" kicker="Clear lines" />
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-white/70 uppercase hover:bg-white/10"
        >
          Main menu
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center py-2 sm:py-4">
        <div
          className="relative w-full max-h-full"
          style={{
            maxWidth: "min(100%, 464px)",
            aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
          }}
        >
          <div className="pointer-events-none absolute -inset-4 rounded-[36px] bg-cyan-400/10 blur-3xl sm:-inset-8" />
          <div
            ref={parentRef}
            className="relative h-full w-full overflow-hidden rounded-[22px] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] sm:rounded-[28px]"
          />
          {hud.countdown != null && !dead && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[22px] bg-slate-950/35 sm:rounded-[28px]">
              <p className="font-mono text-6xl font-semibold text-white drop-shadow-[0_0_24px_rgba(46,230,230,0.55)] sm:text-7xl">
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
                <p className="mt-2 text-sm text-cyan-200/80">
                  {hud.newBest ? "New personal best" : `Best ${hud.highScore}`}
                </p>
                <p className="mt-1 text-xs tracking-[0.16em] text-white/40 uppercase">
                  Lines {hud.lines} · Level {hud.level}
                </p>
                <button
                  type="button"
                  className="mt-6 h-12 w-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-300 text-sm font-semibold tracking-[0.18em] text-slate-950 uppercase"
                  onClick={(event) => {
                    event.stopPropagation();
                    emitRestart();
                  }}
                >
                  Play again
                </button>
                <button
                  type="button"
                  className="mt-3 h-11 w-full rounded-full border border-white/15 text-xs font-semibold tracking-[0.18em] text-white/80 uppercase"
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
        <BlocksPad onMoveStart={emitMoveStart} onMoveEnd={emitMoveEnd} onRotate={emitRotate} />
        <p className="mt-2 hidden text-center text-xs tracking-[0.18em] text-white/35 uppercase sm:mt-5 sm:block">
          Arrows or WASD · Z/X rotate · down to drop
        </p>
        <p className="mt-2 text-center text-[11px] tracking-[0.16em] text-white/35 uppercase sm:hidden">
          Pad to move · rotate to turn
        </p>
      </div>
    </div>
  );
}
