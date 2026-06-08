import { api } from "../api-client.js";

export const strategyTools = [
  {
    name: "validate_strategy",
    description: "Validate a strategy file -- checks syntax, BaseStrategy inheritance, markets declaration. Returns valid or an error message.",
    schema: { type: "object", properties: { strategy_code: { type: "string", description: "Full Python source code of the strategy" } }, required: ["strategy_code"] },
    handler: async ({ strategy_code }) => api.post("/v1/strategies/validate", {}, { code: strategy_code }),
  },
  {
    name: "lint_strategy",
    description: "Lint a strategy for common anti-patterns: missing on_market_update, empty markets list, blocking calls.",
    schema: { type: "object", properties: { strategy_code: { type: "string" } }, required: ["strategy_code"] },
    handler: async ({ strategy_code }) => {
      const issues = [];
      if (!strategy_code.includes("on_market_update")) {
        issues.push("Missing on_market_update -- strategy will receive ticks but never act");
      }
      if (strategy_code.includes("markets = []")) {
        issues.push("markets list is empty -- strategy will receive no ticks");
      }
      if (/time\.sleep|requests\.get|urllib/.test(strategy_code)) {
        issues.push("Blocking call detected -- use ctx.log() instead of print(), avoid blocking I/O");
      }
      return { issues, clean: issues.length === 0 };
    },
  },
  {
    name: "get_strategy_template",
    description: "Get a starter strategy template for a given style (directional, mean-reversion, market-making).",
    schema: { type: "object", properties: { style: { type: "string", enum: ["directional", "mean-reversion", "market-making"] }, language: { type: "string", enum: ["python", "typescript", "rust"], default: "python" } }, required: ["style"] },
    handler: ({ style, language = "python" }) => {
      const templates = {
        python: {
          directional: 'from algoglide import BaseStrategy, TickContext\n\nclass DirectionalStrategy(BaseStrategy):\n    markets = ["btc-updown-15m-1778896800"]\n\n    def on_market_update(self, ctx: TickContext) -> None:\n        yes = ctx.market.outcome("Yes")\n        if yes and ctx.market.elapsed_pct > 0.6 and yes.best_ask < 0.55:\n            ctx.buy("Yes", size_usd=10.0, limit_price=yes.best_ask)\n',
          "mean-reversion": 'from algoglide import BaseStrategy, TickContext\n\nclass MeanReversionStrategy(BaseStrategy):\n    markets = ["will-fed-cut-rates-october"]\n\n    def on_market_update(self, ctx: TickContext) -> None:\n        yes = ctx.market.outcome("Yes")\n        if yes and yes.price < 0.30:\n            ctx.buy("Yes", size_usd=10.0)\n',
          "market-making": 'from algoglide import BaseStrategy, TickContext\n\nclass MarketMakingStrategy(BaseStrategy):\n    markets = ["will-trump-win-2026"]\n\n    def on_market_update(self, ctx: TickContext) -> None:\n        yes = ctx.market.outcome("Yes")\n        if yes and (yes.best_ask - yes.best_bid) > 0.05:\n            ctx.buy("Yes", size_usd=5.0, limit_price=yes.best_bid + 0.01)\n            ctx.sell("Yes", size_usd=5.0, limit_price=yes.best_ask - 0.01)\n',
        },
      };
      return { template: templates[language]?.[style] ?? "Template not available for this language/style" };
    },
  },
  {
    name: "list_strategy_templates",
    description: "List available strategy templates by style and language.",
    schema: { type: "object", properties: {} },
    handler: () => ({ styles: ["directional", "mean-reversion", "market-making"], languages: ["python", "typescript", "rust"] }),
  },
  {
    name: "get_strategy_schema",
    description: "Get the full BaseStrategy interface -- all lifecycle hooks, context methods, and types.",
    schema: { type: "object", properties: {} },
    handler: () => ({
      lifecycle_hooks: ["on_start()", "on_market_update(ctx: TickContext)", "on_fill(ctx: FillContext)", "on_timer(ts: int)", "on_shutdown()"],
      tick_context_methods: ["ctx.buy(outcome, size_usd, limit_price?)", "ctx.sell(outcome, size_usd, limit_price?)", "ctx.cancel(order_id)", "ctx.log(msg, level?)"],
      market_snapshot: { slug: "str", question: "str", end_time_unix: "int", elapsed_pct: "float 0-1", outcomes: "list[OutcomeSnapshot]" },
      outcome_snapshot: { name: "str", token_id: "str", price: "float", best_bid: "float", best_ask: "float", depth: "float" },
    }),
  },
  {
    name: "explain_strategy_error",
    description: "Given an error message from a failed deployment or backtest, explain what went wrong and how to fix it.",
    schema: { type: "object", properties: { error_message: { type: "string" } }, required: ["error_message"] },
    handler: ({ error_message }) => {
      const known = {
        "must import from algoglide": "Add 'from algoglide import BaseStrategy' at the top of your strategy file.",
        "inheriting BaseStrategy": "Your strategy class must inherit from BaseStrategy: 'class MyStrategy(BaseStrategy):'",
        "wallet not provisioned": "Call POST /v1/wallets/provision first, or use the provision_wallet tool.",
        "build failed": "The Docker build failed. Check that your strategy has no missing imports and no syntax errors.",
      };
      for (const [pattern, fix] of Object.entries(known)) {
        if (error_message.includes(pattern)) return { fix };
      }
      return { fix: "No known fix pattern. Check deployment logs with get_deployment_logs." };
    },
  },
  {
    name: "deploy_agent_project",
    description: "Deploy a new agent from inline code. Provide the three project files: agent_code (agent.py), config_yaml (config.yaml), and optionally algoglide_yaml (algoglide.yaml). Creates a deployment and seeds its project files. Returns the new deployment object including its ID.",
    schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "The user's AlgoGlide user ID" },
        name: { type: "string", description: "Human-readable name for this deployment" },
        agent_code: { type: "string", description: "Python agent code (agent.py) using the AlgoGlide SDK" },
        config_yaml: { type: "string", description: "YAML config defining markets and risk params (config.yaml)" },
        algoglide_yaml: { type: "string", description: "Optional algoglide.yaml build+deploy spec" },
        template_id: { type: "string", description: "Optional base template (e.g. 'blank', 'fed-watch')", default: "blank" },
      },
      required: ["user_id", "name", "agent_code", "config_yaml"],
    },
    handler: async ({ user_id, name, agent_code, config_yaml, algoglide_yaml, template_id = "blank" }) => {
      const DEFAULT_ALGOGLIDE_YAML = `version: "1"\nbuild:\n  runtime: python3.11\nbacktest:\n  period: 90d\ndeploy:\n  mode: paper\n`;
      const dep = await api.post("/v1/deployments", { user_id }, { name, template_id });
      try {
        await api.post(`/v1/deployments/${dep.id}/project`, { user_id }, {
          files: {
            "agent.py": agent_code,
            "config.yaml": config_yaml,
            "algoglide.yaml": algoglide_yaml ?? DEFAULT_ALGOGLIDE_YAML,
          },
        });
      } catch (seedErr) {
        try { await api.del(`/v1/deployments/${dep.id}`, { user_id }); } catch (_) {}
        throw new Error(`Project seeding failed for deployment ${dep.id}: ${seedErr.message}`);
      }
      return dep;
    },
  },
  {
    name: "fork_agent",
    description: "Fork an existing deployment to create an independent copy you can modify. Returns the new deployment ID.",
    schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "The user's AlgoGlide user ID" },
        deployment_id: { type: "string", description: "ID of the deployment to fork" },
        name: { type: "string", description: "Name for the forked agent" },
      },
      required: ["user_id", "deployment_id", "name"],
    },
    handler: async ({ deployment_id, user_id, name }) => api.post(`/v1/deployments/${deployment_id}/fork`, { user_id }, { name }),
  },
];
