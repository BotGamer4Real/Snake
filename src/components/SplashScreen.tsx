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
      <span className="pointer-events-none absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] text-[11px] tracking-[0.22em] text-white/50 uppercase">
        Tap to skip
      </span>
    </button>
  );
}
