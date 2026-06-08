import { api } from "../api-client.js";

export const webhookTools = [
  {
    name: "create_webhook",
    description: "Register a webhook to receive event notifications.",
    schema: { type: "object", properties: { url: { type: "string", description: "HTTPS endpoint to receive events" }, events: { type: "array", items: { type: "string" }, description: "Event types to subscribe to, e.g. [\"fill.created\", \"deployment.stopped\"]" }, user_id: { type: "string" } }, required: ["url", "events", "user_id"] },
    handler: ({ url, events, user_id }) => api.post("/v1/webhooks", {}, { url, events, user_id }),
  },
  {
    name: "list_webhooks",
    description: "List all registered webhooks.",
    schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] },
    handler: ({ user_id }) => api.get("/v1/webhooks", { user_id }),
  },
  {
    name: "get_webhook",
    description: "Get details of a specific webhook.",
    schema: { type: "object", properties: { webhook_id: { type: "number" }, user_id: { type: "string" } }, required: ["webhook_id", "user_id"] },
    handler: ({ webhook_id, user_id }) => api.get(`/v1/webhooks/${webhook_id}`, { user_id }),
  },
  {
    name: "delete_webhook",
    description: "Delete a webhook.",
    schema: { type: "object", properties: { webhook_id: { type: "number" }, user_id: { type: "string" } }, required: ["webhook_id", "user_id"] },
    handler: ({ webhook_id, user_id }) => api.del(`/v1/webhooks/${webhook_id}`, { user_id }),
  },
  {
    name: "get_webhook_deliveries",
    description: "Get recent delivery attempts for a webhook.",
    schema: { type: "object", properties: { webhook_id: { type: "number" }, user_id: { type: "string" }, limit: { type: "number", default: 20 }, offset: { type: "number", default: 0 } }, required: ["webhook_id", "user_id"] },
    handler: ({ webhook_id, user_id, limit = 20, offset = 0 }) => api.get(`/v1/webhooks/${webhook_id}/deliveries`, { user_id, limit, offset }),
  },
  {
    name: "test_webhook",
    description: "Send a test event to a webhook.",
    schema: { type: "object", properties: { webhook_id: { type: "number" }, user_id: { type: "string" } }, required: ["webhook_id", "user_id"] },
    handler: ({ webhook_id, user_id }) => api.post(`/v1/webhooks/${webhook_id}/test`, {}, { user_id }),
  },
];
