"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { formatEther, parseEther, type BaseError } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { agentJarAbi, type Agent } from "@/lib/abi";
import { AGENTJAR_ADDRESS, botChain, CURRENCY_SYMBOL } from "@/lib/config";
import { useWalletReady } from "@/lib/use-wallet-ready";
import { isHttpUrl, shortAddress } from "@/lib/utils";

function parseAmount(value: string): bigint | null {
  try {
    const wei = parseEther(value);
    return wei > 0n ? wei : null;
  } catch {
    return null;
  }
}

export function AgentCard({ agent }: { agent: Agent }) {
  const ready = useWalletReady();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("1");

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) void queryClient.invalidateQueries();
  }, [isSuccess, queryClient]);

  const wei = parseAmount(amount);
  const busy = isPending || confirming;

  function onTip() {
    if (!wei) return;
    reset();
    writeContract({
      abi: agentJarAbi,
      address: AGENTJAR_ADDRESS,
      chainId: botChain.id,
      functionName: "tip",
      args: [agent.id],
      value: wei,
    });
  }

  const hasImage = agent.imageUrl && isHttpUrl(agent.imageUrl);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center gap-3">
        {hasImage ? (
          // Remote user-supplied URL, so a plain <img> avoids configuring next/image remote hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.imageUrl}
            alt=""
            className="size-12 rounded-xl border border-line object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="grid size-12 place-items-center rounded-xl bg-ink font-display text-lg font-semibold text-amber"
            aria-hidden
          >
            {agent.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold">{agent.name}</h3>
          <p className="text-xs text-muted">by {shortAddress(agent.owner)}</p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
        {agent.description || "No description yet."}
      </p>

      <p className="mt-5 text-sm text-muted">
        Tips received{" "}
        <span className="block font-display text-2xl font-semibold text-amber">
          {formatEther(agent.totalTips)} {CURRENCY_SYMBOL}
        </span>
      </p>

      <div className="mt-4 flex gap-2">
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          aria-label={`Tip amount in ${CURRENCY_SYMBOL}`}
          className="w-24"
        />
        <Button onClick={onTip} disabled={!ready || busy || !wei} className="flex-1">
          {isPending ? "Confirm in wallet…" : confirming ? "Sending…" : `Tip ${CURRENCY_SYMBOL}`}
        </Button>
      </div>

      {!ready && <p className="mt-2 text-xs text-muted">Connect your wallet to tip.</p>}
      {amount && !wei && <p className="mt-2 text-xs text-danger">Enter an amount greater than 0.</p>}
      {error && <p className="mt-2 text-xs text-danger">{(error as BaseError).shortMessage ?? error.message}</p>}
      {isSuccess && <p className="mt-2 text-xs text-teal">Tip sent. Thank you!</p>}
    </article>
  );
}
