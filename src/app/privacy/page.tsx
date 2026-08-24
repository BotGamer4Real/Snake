export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 text-white/85">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
        BotGamers Arcade
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Privacy policy</h1>
      <p className="mt-2 text-sm text-white/50">Last updated 24 August 2026</p>

      <div className="mt-8 space-y-5 text-sm leading-6">
        <p>
          BotGamers Arcade is a collection of single-player games (including Snake, Chase,
          Blocks, Swarm, and Brick). If you play without an account, we store your high
          score for each game only on your device.
        </p>
        <p>
          If you create an account we collect your email address, password (stored by
          Supabase Auth, not in plain text), a display name you choose, and your high
          score for each game so they can sync across devices. This is stored in our
          Supabase project and sent over HTTPS.
        </p>
        <p>
          We do not sell your data. We do not use advertising SDKs or analytics SDKs.
          Scores may appear on a public leaderboard with your display name once that
          feature ships.
        </p>
        <p>
          You can sign out at any time. To delete your account and cloud scores, open an
          issue on{" "}
          <a className="text-emerald-300 underline" href="https://github.com/BotGamer4Real/botgamers-arcade">
            BotGamer4Real/botgamers-arcade
          </a>{" "}
          with the email on the account. We will remove the profile and scores.
        </p>
        <p>
          The Play Store and Steam listings for this app use this page as their privacy
          policy: https://botgamers-arcade.vercel.app/privacy
        </p>
      </div>
    </main>
  );
}
