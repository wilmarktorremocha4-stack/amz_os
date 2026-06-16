import { Bot } from "lucide-react";

export default function AiAgentPage() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          AI Agent
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Your embedded AI assistant will live here.
        </p>
      </div>

      <div className="card card-glow flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="relative z-10 rounded-full bg-[var(--accent-soft)] p-4 text-[var(--accent)]">
          <Bot size={28} />
        </div>
        <div className="relative z-10 font-medium text-[var(--foreground)]">
          No AI agent connected yet
        </div>
        <p className="relative z-10 max-w-md text-sm text-[var(--muted)]">
          Once you provide an embed code (e.g. from your chat agent
          provider), it will be wired in here.
        </p>
      </div>
    </main>
  );
}
