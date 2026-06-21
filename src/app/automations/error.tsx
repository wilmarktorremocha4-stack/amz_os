"use client";

export default function AutomationsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, padding: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Something went wrong</h2>
      <pre style={{ fontSize: 11, color: "#EF4444", background: "#FEF2F2", padding: 16, borderRadius: 8, maxWidth: 600, overflow: "auto", whiteSpace: "pre-wrap" }}>
        {error.message}
        {error.digest && `\n\nDigest: ${error.digest}`}
      </pre>
      <button onClick={reset} style={{ borderRadius: 8, border: "1px solid var(--border)", padding: "8px 20px", fontSize: 13, cursor: "pointer" }}>
        Try again
      </button>
    </div>
  );
}
