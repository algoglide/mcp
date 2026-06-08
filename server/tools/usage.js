import { api } from "../api-client.js";

export const usageTools = [
  {
    name: "get_usage_summary",
    description: "Get API usage summary for a billing period.",
    schema: { type: "object", properties: { user_id: { type: "string" }, start_date: { type: "string", description: "ISO date start of period, e.g. 2025-01-01" }, end_date: { type: "string", description: "ISO date end of period, e.g. 2025-01-31" } }, required: ["user_id"] },
    handler: ({ user_id, start_date, end_date }) => {
      const params = { user_id };
      if (start_date !== undefined) params.start_date = start_date;
      if (end_date !== undefined) params.end_date = end_date;
      return api.get("/v1/usage/summary", params);
    },
  },
];
