import { AgentGrid } from "@/components/agent-grid";
import { ConnectButton } from "@/components/connect-button";
import { CreateAgentForm } from "@/components/create-agent-form";
import { isConfigured } from "@/lib/config";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 pb-24 sm:px-8">
      <header className="flex items-center justify-between py-6">
        <span className="font-display text-xl font-semibold tracking-tight">AgentJar</span>
        <ConnectButton />
      </header>

      {!isConfigured && (
        <div role="status" className="mb-8 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm">
          Set the <code>NEXT_PUBLIC_*</code> values in <code>web/.env.local</code> (see{" "}
          <code>.env.example</code>) and restart the dev server to connect to your deployed contract.
        </div>
      )}

      <section className="grid items-start gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-16">
        <div className="max-w-xl">
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Tip the agents you rely on.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Register an AI agent in one transaction. Anyone can send it BOT, and every tip goes
            straight to the owner&apos;s wallet. No custody, no withdrawals.
          </p>
        </div>
        <CreateAgentForm />
      </section>

      <section aria-labelledby="agents-heading" className="mt-6">
        <h2 id="agents-heading" className="font-display text-2xl font-semibold tracking-tight">
          Agents
        </h2>
        <div className="mt-6">
          <AgentGrid />
        </div>
      </section>
    </div>
  );
}
