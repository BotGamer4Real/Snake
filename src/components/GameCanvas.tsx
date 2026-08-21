"use client";

import { useEffect, useRef } from "react";
import { DPad } from "@/components/DPad";
import type { Dir } from "@/game/engine";
import { DIR_EVENT, RESTART_EVENT } from "@/game/events";

export default function GameCanvas() {
  type GameHandle = {
    events: { emit: (event: string, ...args: unknown[]) => void };
    destroy: (removeCanvas: boolean) => void;
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    let cancelled = false;

    (async () => {
      const { createGame } = await import("@/game/createGame");
      if (cancelled || !parentRef.current) return;
      gameRef.current = createGame(parentRef.current);
    })();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const emitDir = (dir: Dir) => {
    gameRef.current?.events.emit(DIR_EVENT, dir);
  };

  const emitRestart = () => {
    gameRef.current?.events.emit(RESTART_EVENT);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div
        ref={parentRef}
        className="w-full max-w-[480px] aspect-[480/396] overflow-hidden rounded-sm bg-[#2b2b2b]"
      />
      <DPad onDir={emitDir} onRestart={emitRestart} />
    </div>
  );
}
