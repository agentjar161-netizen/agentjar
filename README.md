# AgentJar

An AI agent tip jar on BOT Chain. Register an agent, receive tips in native BOT.

```
agentjar/
├── contracts/   Foundry project (AgentJar.sol, tests, deploy script)
└── web/         Next.js 16 + TypeScript + Tailwind v4 + wagmi/viem frontend
```

## 1. Contracts (Foundry)

```bash
cd contracts
curl -L https://foundry.paradigm.xyz | bash && foundryup   # once
forge install foundry-rs/forge-std --no-git                # test/script helpers
forge build
forge test -vv
```

`foundry.toml` pins `solc 0.8.24` and `evm_version = "paris"` (no PUSH0) as a safe default
for a new EVM chain. Change to `shanghai` once BOT Chain support is confirmed.

### Deploy to BOT Chain testnet

Get the chain ID, RPC URL, explorer and faucet from BOT Chain's official docs, fund a
throwaway deployer wallet, then use an encrypted keystore instead of a raw key:

```bash
cast wallet import agentjar-deployer --interactive
cp .env.example .env        # set BOT_RPC_URL
source .env
forge script script/Deploy.s.sol --rpc-url $BOT_RPC_URL --account agentjar-deployer --broadcast
```

Copy the printed contract address into the frontend env (next section).

## 2. Frontend

```bash
cd web
pnpm install
cp .env.example .env.local   # fill in chain ID, RPC URL, explorer, contract address
pnpm dev                     # http://localhost:3000
pnpm typecheck && pnpm build
```

All `NEXT_PUBLIC_*` values are public and shipped to the browser. Never put private keys there.

## Contract summary

| Function | Who | Purpose |
| --- | --- | --- |
| `createAgent(name, description, imageUrl)` | anyone | Registers an agent, caller becomes owner |
| `updateAgent(id, name, description, imageUrl)` | owner | Replaces metadata |
| `tip(id)` payable | anyone | Forwards BOT to the owner, increments `totalTips` |
| `totalAgents()` / `getAgent(id)` / `getAgents(offset, limit)` | anyone | Reads |

`TipReceived` includes a `token` field (`address(0)` = native BOT) so ERC20 tipping can be
added later without changing the event schema.

## Next steps

- Run `forge test` and fix anything the compiler flags (this scaffold was written without a local Foundry install).
- Deploy to testnet, then smoke-test create and tip from the UI with two wallets.
- Add `tipERC20(id, token, amount)` with SafeERC20 and a per-token totals mapping.
- Add an agent detail page, owner-only edit form, and a tips leaderboard indexed from events.
