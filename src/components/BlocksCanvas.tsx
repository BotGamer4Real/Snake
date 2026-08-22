"use client";

import { useEffect, useRef, useState } from "react";
import { BlocksPad } from "@/components/BlocksPad";
import { BlocksPanels } from "@/components/BlocksPanels";
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
  next: "I",
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
    <div className="flex h-dvh max-h-dvh w-full max-w-[820px] flex-col overflow-hidden px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:h-auto sm:max-h-none sm:px-4 sm:py-6">
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/45 sm:block">
            Clear lines
          </p>
          <h1 className="bg-gradient-to-r from-cyan-200 via-white to-amber-200 bg-clip-text text-2xl font-semibold tracking-[0.18em] text-transparent sm:text-4xl">
            BLOCKS
          </h1>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-white/70 uppercase hover:bg-white/10"
        >
          Main menu
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center py-2 sm:py-4">
        <div className="flex h-full min-h-0 min-w-0 w-full items-center justify-center gap-2 sm:gap-3">
          <div
            data-testid="blocks-well"
            className="relative min-h-0 min-w-0 max-h-full w-full max-w-[21.25rem] flex-1"
            style={{
              aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
            }}
          >
            <div className="pointer-events-none absolute -inset-3 rounded-[32px] bg-cyan-400/12 blur-2xl sm:-inset-6" />
            <div
              ref={parentRef}
              className="absolute inset-0 overflow-hidden rounded-[20px] border border-cyan-200/15 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] sm:rounded-[24px]"
            />
            {hud.countdown != null && !dead && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[20px] bg-slate-950/35 sm:rounded-[24px]">
                <p className="font-mono text-6xl font-semibold text-white drop-shadow-[0_0_24px_rgba(46,230,230,0.55)] sm:text-7xl">
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
                  <p className="mt-2 text-sm text-cyan-200/80">
                    {hud.newBest ? "New personal best" : `Best ${hud.highScore}`}
                  </p>
                  <p className="mt-1 text-xs tracking-[0.16em] text-white/40 uppercase">
                    Lines {hud.lines} · Level {hud.level}
                  </p>
                  <button
                    type="button"
                    className="mt-5 h-11 w-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-300 text-sm font-semibold tracking-[0.18em] text-slate-950 uppercase"
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
          <BlocksPanels
            next={hud.next}
            score={hud.score}
            highScore={hud.highScore}
            level={hud.level}
            lines={hud.lines}
          />
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
