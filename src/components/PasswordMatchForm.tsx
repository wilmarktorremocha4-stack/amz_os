"use client";

import { useState, useId } from "react";
import { setNewPassword } from "@/lib/actions/passwordReset";

export function PasswordMatchForm({ email, tokenId }: { email: string; tokenId: string }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const pwId = useId();
  const cfId = useId();

  const hasMinLen = pw.length >= 8;
  const matches = pw.length > 0 && confirm.length > 0 && pw === confirm;
  const mismatch = confirm.length > 0 && pw !== confirm;
  const canSubmit = hasMinLen && matches;

  return (
    <form action={setNewPassword} className="flex flex-col gap-3">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="tokenId" value={tokenId} />

      <div className="flex flex-col gap-1">
        <input
          id={pwId}
          name="password"
          type="password"
          placeholder="New password (8+ characters)"
          required
          minLength={8}
          autoFocus
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
        />
        {pw.length > 0 && !hasMinLen && (
          <p className="text-xs text-red-400 px-1">Password must be at least 8 characters.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <input
          id={cfId}
          name="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:ring-2 ${
            mismatch
              ? "border-red-400/50 bg-red-500/5 focus:border-red-400/50 focus:ring-red-500/20"
              : matches
              ? "border-emerald-400/50 bg-emerald-500/5 focus:border-emerald-400/50 focus:ring-emerald-500/20"
              : "border-white/10 bg-white/5 focus:border-blue-400/50 focus:ring-blue-500/20"
          }`}
        />
        {mismatch && (
          <p className="text-xs text-red-400 px-1">Passwords do not match.</p>
        )}
        {matches && (
          <p className="text-xs text-emerald-400 px-1">Passwords match ✓</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Reset password →
      </button>
    </form>
  );
}
