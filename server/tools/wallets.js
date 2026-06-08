import { api } from "../api-client.js";

export const walletTools = [
  { name: "get_wallet", description: "Get wallet info for a user.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: ({ user_id }) => api.get("/v1/wallets", { user_id }) },
  { name: "get_wallet_balance", description: "Get USDC balance for a user's wallet.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: ({ user_id }) => api.get("/v1/wallets/balance", { user_id }) },
  { name: "provision_wallet", description: "Provision a new Privy embedded wallet for a user.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: ({ user_id }) => api.post("/v1/wallets/provision", { user_id }) },
  { name: "get_wallet_address", description: "Get the EVM address for a user's wallet.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: async ({ user_id }) => { const wallets = await api.get("/v1/wallets", { user_id }); return { evm_address: wallets[0]?.evm_address ?? null }; } },
];
