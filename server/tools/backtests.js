import { api } from "../api-client.js";

export const backtestTools = [
  {
    name: "create_backtest",
    description: "Submit a strategy for historical backtesting over a date range.",
    schema: { type: "object", properties: { strategy_path: { type: "string", description: "Path to strategy.py" }, start_date: { type: "string", description: "ISO date, e.g. 2025-01-01" }, end_date: { type: "string", description: "ISO date, e.g. 2025-12-31" }, user_id: { type: "string" } }, required: ["strategy_path", "start_date", "end_date", "user_id"] },
    handler: ({ strategy_path, start_date, end_date, user_id }) => api.postForm("/v1/backtests", { start_date, end_date, user_id }, strategy_path),
  },
  {
    name: "get_backtest",
    description: "Get the status and results of a backtest run.",
    schema: { type: "object", properties: { backtest_id: { type: "number" }, user_id: { type: "string" } }, required: ["backtest_id", "user_id"] },
    handler: ({ backtest_id, user_id }) => api.get(`/v1/backtests/${backtest_id}`, { user_id }),
  },
  {
    name: "list_backtests",
    description: "List all backtest runs for a user.",
    schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] },
    handler: ({ user_id }) => api.get("/v1/backtests", { user_id }),
  },
  {
    name: "get_backtest_results",
    description: "Get detailed results (PnL, win rate, trade log) for a completed backtest.",
    schema: { type: "object", properties: { backtest_id: { type: "number" }, user_id: { type: "string" } }, required: ["backtest_id", "user_id"] },
    handler: ({ backtest_id, user_id }) => api.get(`/v1/backtests/${backtest_id}/trades`, { user_id }),
  },
  {
    name: "get_backtest_equity_curve",
    description: "Get the equity curve time series for a completed backtest.",
    schema: { type: "object", properties: { backtest_id: { type: "number" }, user_id: { type: "string" } }, required: ["backtest_id", "user_id"] },
    handler: ({ backtest_id, user_id }) => api.get(`/v1/backtests/${backtest_id}/equity-curve`, { user_id }),
  },
  {
    name: "get_backtest_trade_log",
    description: "Get the individual trade log for a completed backtest.",
    schema: { type: "object", properties: { backtest_id: { type: "number" }, user_id: { type: "string" }, limit: { type: "number" }, offset: { type: "number" } }, required: ["backtest_id", "user_id"] },
    handler: ({ backtest_id, user_id, limit = 50, offset = 0 }) => api.get(`/v1/backtests/${backtest_id}/trades`, { user_id, limit, offset }),
  },
  {
    name: "cancel_backtest",
    description: "Cancel a running backtest.",
    schema: { type: "object", properties: { backtest_id: { type: "number" }, user_id: { type: "string" } }, required: ["backtest_id", "user_id"] },
    handler: ({ backtest_id, user_id }) => api.post(`/v1/backtests/${backtest_id}/cancel`, { user_id }),
  },
  {
    name: "compare_backtests",
    description: "Compare two backtest runs side by side.",
    schema: { type: "object", properties: { backtest_id_a: { type: "number" }, backtest_id_b: { type: "number" }, user_id: { type: "string" } }, required: ["backtest_id_a", "backtest_id_b", "user_id"] },
    handler: async ({ backtest_id_a, backtest_id_b, user_id }) => {
      const [a, b] = await Promise.all([
        api.get(`/v1/backtests/${backtest_id_a}`, { user_id }),
        api.get(`/v1/backtests/${backtest_id_b}`, { user_id }),
      ]);
      return { a, b };
    },
  },
];
