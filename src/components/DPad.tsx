"use client";

import type { Dir } from "@/game/engine";

export function DPad({ onDir, onRestart }: { onDir: (dir: Dir) => void; onRestart: () => void }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 select-none">
      <div className="grid grid-cols-3 gap-2 w-56">
        <span />
        <PadButton label="UP" onPress={() => onDir("up")} />
        <span />
        <PadButton label="LEFT" onPress={() => onDir("left")} />
        <PadButton label="DOWN" onPress={() => onDir("down")} />
        <PadButton label="RIGHT" onPress={() => onDir("right")} />
      </div>
      <button
        type="button"
        className="h-14 w-56 rounded-md bg-[#0f380f] text-[#9bbc0f] text-lg font-bold tracking-widest active:scale-95"
        onClick={onRestart}
      >
        RESTART
      </button>
    </div>
  );
}

function PadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      className="h-16 rounded-md bg-[#306230] text-[#c7f0d8] text-sm font-bold tracking-wide active:bg-[#0f380f]"
      onPointerDown={(event) => {
        event.preventDefault();
        onPress();
      }}
    >
      {label}
    </button>
  );
}
