export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 text-white/85">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
        BotGamers Arcade
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Privacy policy</h1>
      <p className="mt-2 text-sm text-white/50">Last updated 22 August 2026</p>

      <div className="mt-8 space-y-5 text-sm leading-6">
        <p>
          BotGamers Arcade is a collection of single-player games. If you play without an
          account, we store your high score for each game only on your device.
        </p>
        <p>
          If you create an account we collect your email address, password (stored by
          Supabase Auth, not in plain text), a display name you choose, and your high
          score for each game so they can sync across devices. This is stored in our
          Supabase project.
        </p>
        <p>
          We do not sell your data. We do not use advertising SDKs. Scores may appear on
          a public leaderboard with your display name once that feature ships.
        </p>
        <p>
          You can sign out at any time. Account deletion will remove your profile and
          scores from our database when that feature is enabled.
        </p>
        <p>
          Questions: contact the developer through the GitHub repository{" "}
          <a className="text-emerald-300 underline" href="https://github.com/BotGamer4Real/Snake">
            BotGamer4Real/Snake
          </a>
          .
        </p>
      </div>
    </main>
  );
}
