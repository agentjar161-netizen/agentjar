"use client";

import { useReadContract } from "wagmi";
import { AgentCard } from "@/components/agent-card";
import { agentJarAbi } from "@/lib/abi";
import { AGENTJAR_ADDRESS, botChain, isConfigured } from "@/lib/config";

export function AgentGrid() {
  const { data, isLoading, error } = useReadContract({
    abi: agentJarAbi,
    address: AGENTJAR_ADDRESS,
    chainId: botChain.id,
    functionName: "getAgents",
    args: [0n, 100n],
    query: { enabled: isConfigured, refetchInterval: 15_000 },
  });

  if (!isConfigured) return <p className="text-muted">Agents will appear here once the contract is configured.</p>;
  if (isLoading) return <p className="text-muted">Loading agents…</p>;
  if (error) return <p className="text-danger">Couldn&apos;t load agents. Check the RPC URL and contract address.</p>;
  if (!data || data.length === 0) {
    return <p className="text-muted">No agents yet. Register the first one.</p>;
  }

  // Newest first.
  const agents = [...data].reverse();

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <li key={agent.id.toString()}>
          <AgentCard agent={agent} />
        </li>
      ))}
    </ul>
  );
}
