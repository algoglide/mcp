import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { deploymentTools } from "./tools/deployments.js";
import { backtestTools } from "./tools/backtests.js";
import { strategyTools } from "./tools/strategies.js";
import { marketTools } from "./tools/markets.js";
import { positionTools } from "./tools/positions.js";
import { orderTools } from "./tools/orders.js";
import { walletTools } from "./tools/wallets.js";
import { analyticsTools } from "./tools/analytics.js";
import { platformTools } from "./tools/platform.js";
import { webhookTools } from "./tools/webhooks.js";
import { usageTools } from "./tools/usage.js";
import { signalTools } from "./tools/signals.js";

const ALL_TOOLS = [
  ...deploymentTools,
  ...backtestTools,
  ...strategyTools,
  ...marketTools,
  ...positionTools,
  ...orderTools,
  ...walletTools,
  ...analyticsTools,
  ...platformTools,
  ...webhookTools,
  ...usageTools,
  ...signalTools,
];

const toolMap = new Map(ALL_TOOLS.map((t) => [t.name, t]));

const server = new Server(
  { name: "algoglide", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.schema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = toolMap.get(name);
  if (!tool) {
    return {
      content: [{ type: "text", text: `Error: unknown tool "${name}"` }],
      isError: true,
    };
  }
  try {
    const result = await tool.handler(args || {});
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[algoglide-mcp] ${ALL_TOOLS.length} tools loaded`);
