import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { botChain } from "@/lib/config";

export const wagmiConfig = createConfig({
  chains: [botChain],
  connectors: [injected()],
  transports: { [botChain.id]: http() },
  ssr: true,
});
