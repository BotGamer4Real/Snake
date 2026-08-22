"use client";

import type { Dir } from "@/game/engine";

export function DPad({ onDir }: { onDir: (dir: Dir) => void }) {
  return (
    <div className="flex flex-col items-center select-none">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-2">
        <span />
        <PadButton dir="up" onPress={() => onDir("up")} />
        <span />
        <PadButton dir="left" onPress={() => onDir("left")} />
        <span />
        <PadButton dir="right" onPress={() => onDir("right")} />
        <span />
        <PadButton dir="down" onPress={() => onDir("down")} />
        <span />
      </div>
    </div>
  );
}

function PadButton({ dir, onPress }: { dir: Dir; onPress: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir}
      className="flex h-[6.375rem] w-[6.375rem] items-center justify-center rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] touch-none select-none active:translate-y-[1px] active:brightness-75 sm:h-16 sm:w-16"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress();
      }}
    >
      <Chevron dir={dir} />
    </button>
  );
}

function Chevron({ dir }: { dir: Dir }) {
  const rotate =
    dir === "up"
      ? "rotate-0"
      : dir === "right"
        ? "rotate-90"
        : dir === "down"
          ? "rotate-180"
          : "-rotate-90";
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-11 w-11 sm:h-7 sm:w-7 ${rotate}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 14l6-6 6 6" />
    </svg>
  );
}
