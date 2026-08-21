"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type Mode = "signin" | "signup" | "reset";

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { signIn, signUp, sendReset, updatePassword, recovering } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const title = recovering
    ? "Set a new password"
    : mode === "signup"
      ? "Create account"
      : mode === "reset"
        ? "Reset password"
        : "Sign in";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (recovering) {
        if (password.length < 8) {
          setMessage("Password must be at least 8 characters.");
          return;
        }
        if (password !== confirm) {
          setMessage("Passwords do not match.");
          return;
        }
        const error = await updatePassword(password);
        setMessage(error ?? "Password updated. You are signed in.");
        if (!error) onClose();
        return;
      }
      if (mode === "reset") {
        const error = await sendReset(email);
        setMessage(error ?? "Check your email for a reset link.");
        return;
      }
      if (mode === "signup") {
        if (!/^[A-Za-z0-9_]{3,20}$/.test(displayName)) {
          setMessage("Display name: 3–20 letters, numbers, or underscores.");
          return;
        }
        if (password.length < 8) {
          setMessage("Password must be at least 8 characters.");
          return;
        }
        if (password !== confirm) {
          setMessage("Passwords do not match.");
          return;
        }
        const error = await signUp(email, password, displayName);
        if (error?.startsWith("Check your email")) {
          setMessage(error);
          return;
        }
        setMessage(error);
        if (!error) onClose();
        return;
      }
      const error = await signIn(email, password);
      setMessage(error);
      if (!error) onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl border border-white/12 bg-slate-950/90 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
              Account
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
          </div>
          <button
            type="button"
            className="text-white/50 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {!recovering && (
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-300/40"
            />
          )}
          {mode === "signup" && !recovering && (
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-300/40"
            />
          )}
          {(mode !== "reset" || recovering) && (
            <input
              type="password"
              required={mode !== "reset" || recovering}
              autoComplete={mode === "signup" || recovering ? "new-password" : "current-password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-300/40"
            />
          )}
          {(mode === "signup" || recovering) && (
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-300/40"
            />
          )}
        </div>

        {message && (
          <p className="mt-3 text-sm text-emerald-200/90">{message}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 h-11 w-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 text-sm font-semibold tracking-[0.16em] text-slate-950 uppercase disabled:opacity-60"
        >
          {busy
            ? "Please wait"
            : recovering
              ? "Save password"
              : mode === "signup"
                ? "Create account"
                : mode === "reset"
                  ? "Send reset link"
                  : "Sign in"}
        </button>

        {!recovering && (
          <div className="mt-4 space-y-2 text-center text-sm text-white/50">
            {mode !== "signin" && (
              <button type="button" className="hover:text-white" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            )}
            {mode === "signin" && (
              <>
                <div>
                  <button type="button" className="hover:text-white" onClick={() => setMode("signup")}>
                    Create an account
                  </button>
                </div>
                <div>
                  <button type="button" className="hover:text-white" onClick={() => setMode("reset")}>
                    Forgot password
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
