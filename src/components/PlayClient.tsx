"use client";

import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[396px] w-full max-w-[480px] items-center justify-center bg-[#2b2b2b] text-[#9bbc0f]">
      Loading…
    </div>
  ),
});

export function PlayClient() {
  return <GameCanvas />;
}
