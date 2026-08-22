"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { SplashScreen } from "@/components/SplashScreen";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[688/528] w-full max-w-[688px] items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-emerald-200/70">
      Loading arena…
    </div>
  ),
});

export function PlayClient() {
  const [introDone, setIntroDone] = useState(false);

  if (!introDone) {
    return <SplashScreen onDone={() => setIntroDone(true)} />;
  }

  return (
    <AuthProvider>
      <GameCanvas />
    </AuthProvider>
  );
}
