import { api } from "../api-client.js";

export const deploymentTools = [
  {
    name: "create_deployment",
    description: "Upload a strategy file and deploy it. The strategy must be a Python file with a BaseStrategy subclass.",
    schema: { type: "object", properties: { name: { type: "string", description: "Human-readable name for this deployment" }, strategy_path: { type: "string", description: "Absolute path to the strategy.py file" }, user_id: { type: "string", description: "The user's AlgoGlide user ID" } }, required: ["name", "strategy_path", "user_id"] },
    handler: ({ name, strategy_path, user_id }) => api.postForm("/v1/deployments", { name, user_id }, strategy_path),
  },
  {
    name: "get_deployment",
    description: "Get the status, config snapshot, and image hash for a deployment.",
    schema: { type: "object", properties: { deployment_id: { type: "number" }, user_id: { type: "string" } }, required: ["deployment_id", "user_id"] },
    handler: ({ deployment_id, user_id }) => api.get(`/v1/deployments/${deployment_id}`, { user_id }),
  },
  {
    name: "list_deployments",
    description: "List all deployments for a user.",
    schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] },
    handler: ({ user_id }) => api.get("/v1/deployments", { user_id }),
  },
  {
    name: "start_deployment",
    description: "Start a stopped deployment.",
    schema: { type: "object", properties: { deployment_id: { type: "number" }, user_id: { type: "string" } }, required: ["deployment_id", "user_id"] },
    handler: ({ deployment_id, user_id }) => api.post(`/v1/deployments/${deployment_id}/start`, { user_id }),
  },
  {
    name: "stop_deployment",
    description: "Stop a running deployment.",
    schema: { type: "object", properties: { deployment_id: { type: "number" }, user_id: { type: "string" } }, required: ["deployment_id", "user_id"] },
    handler: ({ deployment_id, user_id }) => api.post(`/v1/deployments/${deployment_id}/stop`, { user_id }),
  },
  {
    name: "delete_deployment",
    description: "Permanently delete a deployment and its records.",
    schema: { type: "object", properties: { deployment_id: { type: "number" }, user_id: { type: "string" } }, required: ["deployment_id", "user_id"] },
    handler: ({ deployment_id, user_id }) => api.del(`/v1/deployments/${deployment_id}`, { user_id }),
  },
  {
    name: "get_deployment_logs",
    description: "Get paginated log output for a deployment.",
    schema: { type: "object", properties: { deployment_id: { type: "number" }, user_id: { type: "string" }, limit: { type: "number", default: 100 } }, required: ["deployment_id", "user_id"] },
    handler: ({ deployment_id, user_id, limit = 100 }) => api.get(`/v1/deployments/${deployment_id}/logs`, { user_id, limit }),
  },
  {
    name: "stream_deployment_logs",
    description: "Get the last N log lines for a running deployment.",
    schema: { type: "object", properties: { deployment_id: { type: "number" }, user_id: { type: "string" }, tail: { type: "number", default: 50 } }, required: ["deployment_id", "user_id"] },
    handler: ({ deployment_id, user_id, tail = 50 }) => api.get(`/v1/deployments/${deployment_id}/logs`, { user_id, limit: tail }),
  },
];
