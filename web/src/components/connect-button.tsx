"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { botChain } from "@/lib/config";
import { shortAddress } from "@/lib/utils";

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();

  if (!isConnected || !address) {
    return (
      <Button onClick={() => connect({ connector: connectors[0] })} disabled={isPending || !connectors[0]}>
        {isPending ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  if (chainId !== botChain.id) {
    return (
      <Button onClick={() => switchChain({ chainId: botChain.id })} disabled={switching}>
        {switching ? "Switching…" : `Switch to ${botChain.name}`}
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={() => disconnect()} title="Disconnect">
      <span className="size-2 rounded-full bg-teal" aria-hidden />
      {shortAddress(address)}
    </Button>
  );
}
