"use client";

import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/components/AuthProvider";

export function AccountBar() {
  const { user, profile, loading, recovering, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const modalOpen = open || recovering;

  return (
    <>
      <div className="flex shrink-0 justify-end">
        {loading ? (
          <span className="text-xs tracking-[0.18em] text-white/30 uppercase">
            Account
          </span>
        ) : user ? (
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pr-1.5 pl-3">
            <span className="max-w-[140px] truncate text-sm text-white/80">
              {profile?.display_name ?? "Player"}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full bg-white/10 px-3 py-1 text-xs tracking-[0.14em] text-white/70 uppercase hover:bg-white/15"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-emerald-100 uppercase hover:bg-emerald-300/20"
          >
            Sign in
          </button>
        )}
      </div>
      <AuthModal open={modalOpen} onClose={() => { if (!recovering) setOpen(false); }} />
    </>
  );
}
