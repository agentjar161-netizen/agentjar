import { defineChain } from "viem";

// Static property access so Next.js can inline these at build time.
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 0);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "";
const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "";
const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "BOT";

export const AGENTJAR_ADDRESS = (process.env.NEXT_PUBLIC_AGENTJAR_ADDRESS ?? "") as `0x${string}`;

/** False until all required NEXT_PUBLIC_* values are set in .env.local. */
export const isConfigured = Boolean(chainId && rpcUrl && AGENTJAR_ADDRESS);

export const CURRENCY_SYMBOL = symbol;

export const botChain = defineChain({
  id: chainId || 1,
  name: process.env.NEXT_PUBLIC_CHAIN_NAME ?? "BOT Chain Testnet",
  nativeCurrency: { name: symbol, symbol, decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl || "http://127.0.0.1:8545"] } },
  ...(explorerUrl
    ? { blockExplorers: { default: { name: "Explorer", url: explorerUrl } } }
    : {}),
});
