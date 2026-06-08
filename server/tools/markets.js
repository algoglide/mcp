import { api } from "../api-client.js";

export const marketTools = [
  { name: "search_markets", description: "Search active Polymarket markets by keyword.", schema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number", default: 20 } }, required: ["query"] }, handler: ({ query, limit = 20 }) => api.get("/v1/markets", { q: query, limit }) },
  { name: "get_market", description: "Get a single market by slug.", schema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] }, handler: ({ slug }) => api.get(`/v1/markets/${slug}`) },
  { name: "list_active_markets", description: "List the highest-volume active markets.", schema: { type: "object", properties: { limit: { type: "number", default: 50 }, offset: { type: "number", default: 0 } } }, handler: ({ limit = 50, offset = 0 }) => api.get("/v1/markets", { limit, offset }) },
  { name: "get_market_history", description: "Get historical price data for a market.", schema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] }, handler: ({ slug }) => api.get(`/v1/markets/${slug}/history`) },
  { name: "list_markets_by_category", description: "List markets by category tag (e.g. crypto, elections, sports).", schema: { type: "object", properties: { category: { type: "string" }, limit: { type: "number", default: 50 } }, required: ["category"] }, handler: ({ category, limit = 50 }) => api.get("/v1/markets", { category, limit }) },
  { name: "get_market_book", description: "Get the current order book (bids/asks) for a market.", schema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] }, handler: ({ slug }) => api.get(`/v1/markets/${slug}/book`) },
  { name: "get_market_outcomes", description: "Get the outcomes and current prices for a market.", schema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] }, handler: async ({ slug }) => { const m = await api.get(`/v1/markets/${slug}`); return m.outcomes ?? []; } },
  { name: "get_market_resolution", description: "Get the resolution status of a market (open/closed/resolved).", schema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] }, handler: async ({ slug }) => { const m = await api.get(`/v1/markets/${slug}`); return { closed: m.closed, active: m.active, end_time_unix: m.end_time_unix }; } },
];
