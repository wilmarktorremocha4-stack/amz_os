"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function LoginLockout({ until }: { until: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((until - Date.now()) / 1000)));

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const secs = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [until, remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;

  if (remaining <= 0) {
    return (
      <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300 text-center">
        Lockout expired.{" "}
        <Link href="/login" className="underline font-medium">
          Try again →
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 text-center space-y-2">
      <p className="font-semibold text-red-200">Too many wrong attempts. Please wait:</p>
      <p className="text-3xl font-bold text-red-400 tabular-nums">{display}</p>
      <p className="text-xs text-red-300/70">
        Forgot your password?{" "}
        <Link href="/forgot-password" className="underline text-red-300 hover:text-white">
          Reset it here →
        </Link>
      </p>
    </div>
  );
}
