"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setFading(true);
    window.setTimeout(onDone, 280);
  }, [onDone]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = () => {
      void video.play().catch(() => {
        finish();
      });
    };
    play();
  }, [finish]);

  return (
    <button
      type="button"
      aria-label="Skip intro"
      onClick={finish}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#050510] transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        src="/branding/botgamers-splash.mp4"
        poster="/branding/botgamers-logo.jpg"
        playsInline
        muted
        autoPlay
        onEnded={finish}
        onError={finish}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img>
        src="/branding/botgamers-logo.jpg"
        alt="BotGamers"
        className="pointer-events-none absolute bottom-8 left-1/2 w-[min(220px,46vw)] -translate-x-1/2 rounded-lg opacity-90 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
      />
      <span className="pointer-events-none absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] text-[11px] tracking-[0.22em] text-white/50 uppercase">
        Tap to skip
      </span>
    </button>
  );
}
