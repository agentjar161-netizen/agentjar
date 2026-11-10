import { parseAbi } from "viem";

export const agentJarAbi = parseAbi([
  "struct Agent { uint256 id; address owner; uint64 createdAt; uint256 totalTips; string name; string description; string imageUrl; }",
  "function createAgent(string name, string description, string imageUrl) returns (uint256 agentId)",
  "function updateAgent(uint256 agentId, string name, string description, string imageUrl)",
  "function tip(uint256 agentId) payable",
  "function totalAgents() view returns (uint256)",
  "function getAgent(uint256 agentId) view returns (Agent)",
  "function getAgents(uint256 offset, uint256 limit) view returns (Agent[])",
  "error EmptyName()",
  "error NameTooLong()",
  "error DescriptionTooLong()",
  "error ImageUrlTooLong()",
  "error AgentNotFound()",
  "error NotAgentOwner()",
  "error ZeroTip()",
  "error TransferFailed()",
  "error UseTipFunction()",
]);

export type Agent = {
  id: bigint;
  owner: `0x${string}`;
  createdAt: bigint;
  totalTips: bigint;
  name: string;
  description: string;
  imageUrl: string;
};

export const LIMITS = { name: 64, description: 512, imageUrl: 256 } as const;
