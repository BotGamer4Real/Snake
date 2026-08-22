"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ArcadeMenu } from "@/components/ArcadeMenu";
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

const BlocksCanvas = dynamic(() => import("@/components/BlocksCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[410/528] w-full max-w-[464px] items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-cyan-200/70">
      Loading well…
    </div>
  ),
});

type Screen = "splash" | "menu" | "snake" | "blocks";

export function PlayClient() {
  const [screen, setScreen] = useState<Screen>("splash");

  return (
    <AuthProvider>
      {screen === "splash" ? (
        <SplashScreen onDone={() => setScreen("menu")} />
      ) : screen === "menu" ? (
        <ArcadeMenu
          onPlay={(gameId) => {
            if (gameId === "snake") setScreen("snake");
            if (gameId === "blocks") setScreen("blocks");
          }}
        />
      ) : screen === "snake" ? (
        <GameCanvas onBack={() => setScreen("menu")} />
      ) : (
        <BlocksCanvas onBack={() => setScreen("menu")} />
      )}
    </AuthProvider>
  );
}
