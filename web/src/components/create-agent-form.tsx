"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { type BaseError } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { agentJarAbi, LIMITS } from "@/lib/abi";
import { AGENTJAR_ADDRESS, botChain, isConfigured } from "@/lib/config";
import { useWalletReady } from "@/lib/use-wallet-ready";
import { byteLength, isHttpUrl } from "@/lib/utils";

export function CreateAgentForm() {
  const ready = useWalletReady();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!isSuccess) return;
    void queryClient.invalidateQueries();
    setName("");
    setDescription("");
    setImageUrl("");
  }, [isSuccess, queryClient]);

  const trimmed = { name: name.trim(), description: description.trim(), imageUrl: imageUrl.trim() };
  const problem =
    byteLength(trimmed.name) > LIMITS.name
      ? `Name must be ${LIMITS.name} bytes or fewer.`
      : byteLength(trimmed.description) > LIMITS.description
        ? `Description must be ${LIMITS.description} bytes or fewer.`
        : trimmed.imageUrl && !isHttpUrl(trimmed.imageUrl)
          ? "Image URL must start with http:// or https://."
          : byteLength(trimmed.imageUrl) > LIMITS.imageUrl
            ? `Image URL must be ${LIMITS.imageUrl} bytes or fewer.`
            : null;

  const busy = isPending || confirming;
  const canSubmit = isConfigured && ready && !busy && trimmed.name.length > 0 && !problem;

  function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    reset();
    writeContract({
      abi: agentJarAbi,
      address: AGENTJAR_ADDRESS,
      chainId: botChain.id,
      functionName: "createAgent",
      args: [trimmed.name, trimmed.description, trimmed.imageUrl],
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-panel p-6">
      <h2 className="font-display text-xl font-semibold">Register an agent</h2>
      <p className="mt-1 text-sm text-muted">You become the owner and receive its tips.</p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Scout" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Description</span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this agent do?"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Image URL (optional)</span>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            inputMode="url"
          />
        </label>
      </div>

      {problem && <p className="mt-4 text-sm text-danger">{problem}</p>}
      {error && <p className="mt-4 text-sm text-danger">{(error as BaseError).shortMessage ?? error.message}</p>}
      {isSuccess && <p className="mt-4 text-sm text-teal">Agent registered.</p>}

      <Button type="submit" className="mt-6 w-full" disabled={!canSubmit}>
        {isPending ? "Confirm in wallet…" : confirming ? "Registering…" : "Register agent"}
      </Button>
      {!ready && isConfigured && (
        <p className="mt-3 text-center text-xs text-muted">Connect your wallet on {botChain.name} to register.</p>
      )}
    </form>
  );
}
