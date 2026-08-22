"use client";

import type { ReactNode } from "react";
import { previewCells, type PieceId } from "@/game/blocks/engine";
import { PIECE_HEX } from "@/game/blocks/theme";

export function BlocksPanels({
  next,
  score,
  highScore,
  level,
  lines,
}: {
  next: PieceId;
  score: number;
  highScore: number;
  level: number;
  lines: number;
}) {
  return (
    <aside className="flex w-[6.75rem] shrink-0 flex-col gap-2 sm:w-[8.5rem] sm:gap-2.5">
      <Panel label="Next">
        <NextPiece id={next} />
      </Panel>
      <Panel label="Score" accent>
        <p className="font-mono text-xl font-semibold tabular-nums tracking-tight text-white sm:text-[1.7rem]">
          {score}
        </p>
      </Panel>
      <Panel label="Best">
        <p className="font-mono text-lg font-semibold tabular-nums text-white/90 sm:text-xl">
          {highScore}
        </p>
      </Panel>
      <Panel label="Level">
        <p className="font-mono text-xl font-semibold tabular-nums text-cyan-100 sm:text-2xl">
          {level}
        </p>
      </Panel>
      <Panel label="Lines">
        <p className="font-mono text-xl font-semibold tabular-nums text-white sm:text-2xl">
          {lines}
        </p>
      </Panel>
    </aside>
  );
}

function Panel({
  label,
  accent = false,
  children,
}: {
  label: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border px-2.5 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] sm:px-3 sm:py-2.5 ${
        accent
          ? "border-cyan-300/25 bg-cyan-400/10"
          : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <p className="text-[9px] font-semibold tracking-[0.22em] text-white/40 uppercase sm:text-[10px]">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function NextPiece({ id }: { id: PieceId }) {
  const cells = centeredPreview(id);
  return (
    <div className="mx-auto grid aspect-square w-[4.6rem] grid-cols-4 grid-rows-4 gap-[3px] rounded-xl bg-black/35 p-1.5 ring-1 ring-white/10 sm:w-[5.5rem]">
      {Array.from({ length: 16 }, (_, index) => {
        const x = index % 4;
        const y = Math.floor(index / 4);
        const on = cells.some((cell) => cell.x === x && cell.y === y);
        return (
          <div
            key={index}
            className="rounded-[3px]"
            style={
              on
                ? {
                    background: `linear-gradient(180deg, ${PIECE_HEX[id]} 0%, ${PIECE_HEX[id]} 55%, #00000055 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 0 8px ${PIECE_HEX[id]}55`,
                  }
                : { background: "rgba(255,255,255,0.04)" }
            }
          />
        );
      })}
    </div>
  );
}

function centeredPreview(id: PieceId) {
  const cells = previewCells(id);
  const xs = cells.map((cell) => cell.x);
  const ys = cells.map((cell) => cell.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const ox = Math.floor((4 - (maxX - minX + 1)) / 2) - minX;
  const oy = Math.floor((4 - (maxY - minY + 1)) / 2) - minY;
  return cells.map((cell) => ({ x: cell.x + ox, y: cell.y + oy }));
}
