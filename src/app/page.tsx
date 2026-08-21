import { PlayClient } from "@/components/PlayClient";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold tracking-[0.35em] text-[#9bbc0f]">
        SNAKE
      </h1>
      <PlayClient />
      <p className="mt-4 max-w-sm text-center text-xs tracking-wide text-[#8bac0f]">
        WASD or arrows. Eat. Don&apos;t hit walls or yourself.
      </p>
    </main>
  );
}
