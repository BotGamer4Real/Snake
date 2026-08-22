"use client";

import type { BlocksDir } from "@/game/blocks/events";

export function BlocksPad({
  onMoveStart,
  onMoveEnd,
  onRotate,
}: {
  onMoveStart: (dir: BlocksDir) => void;
  onMoveEnd: (dir: BlocksDir) => void;
  onRotate: () => void;
}) {
  return (
    <div className="flex items-end justify-center gap-6 select-none">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-2">
        <span />
        <PadButton label="rotate" onPress={onRotate} />
        <span />
        <HoldButton label="left" onPress={() => onMoveStart("left")} onRelease={() => onMoveEnd("left")} />
        <span />
        <HoldButton label="right" onPress={() => onMoveStart("right")} onRelease={() => onMoveEnd("right")} />
        <span />
        <HoldButton label="down" onPress={() => onMoveStart("down")} onRelease={() => onMoveEnd("down")} />
        <span />
      </div>
      <button
        type="button"
        aria-label="rotate"
        className="mb-1 flex h-[6.375rem] w-[6.375rem] items-center justify-center rounded-full border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(46,230,230,0.22),rgba(255,255,255,0.04))] text-cyan-100 shadow-[0_10px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] touch-none select-none active:translate-y-[1px] active:brightness-75 sm:h-16 sm:w-16"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          onRotate();
        }}
      >
        <RotateIcon />
      </button>
    </div>
  );
}

function PadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-[6.375rem] w-[6.375rem] items-center justify-center rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] touch-none select-none active:translate-y-[1px] active:brightness-75 sm:h-16 sm:w-16"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress();
      }}
    >
      {label === "rotate" ? <RotateIcon /> : <Chevron dir={label} />}
    </button>
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
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-[6.375rem] w-[6.375rem] items-center justify-center rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] touch-none select-none active:translate-y-[1px] active:brightness-75 sm:h-16 sm:w-16"
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
      <Chevron dir={label} />
    </button>
  );
}

function Chevron({ dir }: { dir: string }) {
  const rotate =
    dir === "up" || dir === "rotate"
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

function RotateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-11 w-11 sm:h-7 sm:w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.3-6" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
