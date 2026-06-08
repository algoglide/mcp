import { api } from "../api-client.js";

export const platformTools = [
  { name: "get_api_status", description: "Check if the AlgoGlide API is operational.", schema: { type: "object", properties: {} }, handler: () => api.get("/health") },
  { name: "list_sdk_versions", description: "List available algoglide-sdk versions.", schema: { type: "object", properties: {} }, handler: () => api.get("/v1/platform/sdk-versions") },
  { name: "get_rate_limits", description: "Get current rate limit status for your API key.", schema: { type: "object", properties: {} }, handler: () => api.get("/v1/platform/rate-limits") },
  { name: "get_usage_stats", description: "Get API usage statistics for your account.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: ({ user_id }) => api.get("/v1/platform/usage", { user_id }) },
];
