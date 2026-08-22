export function LivesMeter({ lives }: { lives: number }) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-2xl border-2 border-rose-400/55 bg-rose-500/20 px-3 py-1.5 shadow-[0_8px_24px_rgba(244,63,94,0.28)] sm:gap-2.5 sm:px-3.5 sm:py-2"
      aria-label={`${lives} lives`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-8 w-8 shrink-0 text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.85)] sm:h-10 sm:w-10"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.1 21.35 10.6 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.6 11.54l-1.3 1.31Z" />
      </svg>
      <span className="font-mono text-3xl font-semibold leading-none tabular-nums text-white sm:text-4xl">
        {lives}
      </span>
    </div>
  );
}
