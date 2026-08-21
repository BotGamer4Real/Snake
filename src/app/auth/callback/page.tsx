"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

function AuthCallback() {
  const params = useSearchParams();
  const code = params.get("code");
  const errorDescription = params.get("error_description");
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code || errorDescription) return;
    getSupabase()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setExchangeError(error.message);
          return;
        }
        setDone(true);
        window.location.replace("/");
      });
  }, [code, errorDescription]);

  const message =
    errorDescription ??
    exchangeError ??
    (!code
      ? "Missing confirmation code. Request a new email from Sign in."
      : done
        ? "Confirmed. Taking you to Snake…"
        : "Confirming your account…");

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/12 bg-slate-950/80 p-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
          Account
        </p>
        <p className="mt-3 text-white/90">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 px-5 text-sm font-semibold tracking-[0.16em] text-slate-950 uppercase"
        >
          Back to Snake
        </Link>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full items-center justify-center text-white/70">
          Confirming your account…
        </main>
      }
    >
      <AuthCallback />
    </Suspense>
  );
}
