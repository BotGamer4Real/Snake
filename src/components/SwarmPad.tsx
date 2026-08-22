"use client";

import type { SwarmDir } from "@/game/swarm/events";

export function SwarmPad({
  onMoveStart,
  onMoveEnd,
  onFire,
}: {
  onMoveStart: (dir: SwarmDir) => void;
  onMoveEnd: (dir: SwarmDir) => void;
  onFire: () => void;
}) {
  return (
    <div className="flex items-end justify-center gap-8 select-none">
      <div className="flex gap-3">
        <HoldButton label="left" onPress={() => onMoveStart("left")} onRelease={() => onMoveEnd("left")} />
        <HoldButton label="right" onPress={() => onMoveStart("right")} onRelease={() => onMoveEnd("right")} />
      </div>
      <button
        type="button"
        aria-label="fire"
        className="mb-1 flex h-[5.2rem] w-[5.2rem] items-center justify-center rounded-full border border-amber-200/25 bg-[linear-gradient(180deg,rgba(251,191,36,0.28),rgba(255,255,255,0.04))] text-amber-100 shadow-[0_10px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] touch-none select-none active:translate-y-[1px] active:brightness-75 sm:h-16 sm:w-16"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          onFire();
        }}
      >
        <span className="text-sm font-semibold tracking-[0.18em] uppercase">Fire</span>
      </button>
    </div>
  );
}

function HoldButton({
  label,
  onPress,
  onRelease,
}: {
  label: string;
  onPress: () => void;
  onRelease: () => void;
}) {
  const rotate = label === "right" ? "rotate-90" : "-rotate-90";
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-[4.85rem] w-[4.85rem] items-center justify-center rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] touch-none select-none active:translate-y-[1px] active:brightness-75 sm:h-16 sm:w-16"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onLostPointerCapture={onRelease}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-8 w-8 sm:h-7 sm:w-7 ${rotate}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 14l6-6 6 6" />
      </svg>
    </button>
  );
}
