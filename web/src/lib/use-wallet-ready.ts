"use client";

import { useAccount } from "wagmi";
import { botChain } from "@/lib/config";

/** True when a wallet is connected and on the configured BOT Chain network. */
export function useWalletReady() {
  const { isConnected, chainId } = useAccount();
  return isConnected && chainId === botChain.id;
}
