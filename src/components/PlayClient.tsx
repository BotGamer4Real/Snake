"use client";

import dynamic from "next/dynamic";
import { AuthProvider } from "@/components/AuthProvider";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[528px] w-full max-w-[688px] items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-emerald-200/70">
      Loading arena…
    </div>
  ),
});

export function PlayClient() {
  return (
    <AuthProvider>
      <GameCanvas />
    </AuthProvider>
  );
}
