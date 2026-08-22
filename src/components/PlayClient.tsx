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
    <div className="flex aspect-[340/640] w-full max-w-[340px] items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-cyan-200/70">
      Loading well…
    </div>
  ),
});

const ChaseCanvas = dynamic(() => import("@/components/ChaseCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[412/452] w-full max-w-[412px] items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-rose-200/70">
      Loading maze…
    </div>
  ),
});

const SwarmCanvas = dynamic(() => import("@/components/SwarmCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[464/536] w-full max-w-[464px] items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-amber-200/70">
      Loading swarm…
    </div>
  ),
});

type Screen = "splash" | "menu" | "snake" | "blocks" | "chase" | "swarm";

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
            if (gameId === "chase") setScreen("chase");
            if (gameId === "swarm") setScreen("swarm");
          }}
        />
      ) : screen === "snake" ? (
        <GameCanvas onBack={() => setScreen("menu")} />
      ) : screen === "blocks" ? (
        <BlocksCanvas onBack={() => setScreen("menu")} />
      ) : screen === "chase" ? (
        <ChaseCanvas onBack={() => setScreen("menu")} />
      ) : (
        <SwarmCanvas onBack={() => setScreen("menu")} />
      )}
    </AuthProvider>
  );
}
