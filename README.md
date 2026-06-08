<p align="center">
  <img src="logo.svg" alt="algoglide" width="72" />
</p>

<p align="center">
  MCP server for AI coding editors — deploy and manage prediction-market trading agents directly from your editor.
</p>

<p align="center">
  <a href="https://algoglide.com">algoglide.com</a> &nbsp;·&nbsp;
  <a href="https://docs.algoglide.com">Docs</a> &nbsp;·&nbsp;
  <a href="https://algoglide.com/app/api-keys">Get an API key</a>
</p>

<br/>

## Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- An algoglide API key — get one at [algoglide.com/app/api-keys](https://algoglide.com/app/api-keys)

---

## Setup by editor

<table>
<tr>
<td align="center" width="120"><b>Cursor</b></td>
<td>

Create `.cursor/mcp.json` in your project root (project-scoped) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "algoglide": {
      "command": "npx",
      "args": ["-y", "@algoglide/mcp-server"],
      "env": {
        "ALGOGLIDE_API_KEY": "sk_..."
      }
    }
  }
}
```

Or open **Cursor Settings → Tools & MCP → New MCP Server** and paste the config above.

</td>
</tr>
<tr>
<td align="center" width="120"><b>Cline</b></td>
<td>

1. Click the **MCP Servers** icon in the Cline sidebar
2. Click **Configure MCP Servers** to open `cline_mcp_settings.json`
3. Add the algoglide server:

```json
{
  "mcpServers": {
    "algoglide": {
      "command": "npx",
      "args": ["-y", "@algoglide/mcp-server"],
      "env": {
        "ALGOGLIDE_API_KEY": "sk_..."
      }
    }
  }
}
```

Config file location:
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

</td>
</tr>
<tr>
<td align="center" width="120"><b>Windsurf</b></td>
<td>

1. Open **Windsurf Settings → Cascade → MCP** (or **Manage Plugins → View raw config**)
2. Edit `mcp_config.json`:

```json
{
  "mcpServers": {
    "algoglide": {
      "command": "npx",
      "args": ["-y", "@algoglide/mcp-server"],
      "env": {
        "ALGOGLIDE_API_KEY": "sk_..."
      }
    }
  }
}
```

3. Click **Refresh** to connect.

Config file location:
- **macOS**: `~/.codeium/windsurf/mcp_config.json`
- **Windows**: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`

</td>
</tr>
<tr>
<td align="center" width="120"><b>Claude Code</b></td>
<td>

One-command install via the plugin marketplace:

```
/plugin marketplace add algoglide/mcp
/plugin install algoglide@algoglide
```

Then add your API key to `.mcp.json` or `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "algoglide": {
      "command": "node",
      "args": ["/path/to/algoglide/mcp/server/index.js"],
      "env": {
        "ALGOGLIDE_API_KEY": "sk_...",
        "ALGOGLIDE_BASE_URL": "https://api.algoglide.com"
      }
    }
  }
}
```

</td>
</tr>
<tr>
<td align="center" width="120"><b>Any MCP editor</b></td>
<td>

The server uses standard stdio transport and works with any MCP-compatible client:

```json
{
  "mcpServers": {
    "algoglide": {
      "command": "npx",
      "args": ["-y", "@algoglide/mcp-server"],
      "env": {
        "ALGOGLIDE_API_KEY": "sk_...",
        "ALGOGLIDE_BASE_URL": "https://api.algoglide.com"
      }
    }
  }
}
```

</td>
</tr>
</table>

---

## Tools

| Tool | Description |
|---|---|
| `list_deployments` | List all deployed agents and their live status |
| `get_deployment` | Get details and recent signals for a specific agent |
| `create_deployment` | Deploy a new trading agent from a template |
| `update_deployment` | Update agent code or configuration |
| `delete_deployment` | Remove a deployment |
| `run_backtest` | Run a strategy backtest over historical market data |
| `get_backtest_results` | Fetch results from a completed backtest |
| `validate_strategy` | Validate strategy code for syntax and structure errors |
| `list_markets` | Browse live prediction markets |
| `get_market` | Get current price, volume, and metadata for a market |
| `get_analytics` | Fetch PnL curves, drawdown, fill quality, and metrics |
| `get_positions` | View open positions across all deployments |
| `get_fills` | View recent order fills |
| `list_webhooks` | List registered webhooks |
| `create_webhook` | Register a new webhook endpoint |

---

## Example prompts

```
Deploy a new momentum strategy on ETH/BTC markets and run a 30-day backtest
```

```
Show me the PnL and drawdown for all my active agents this month
```

```
Find prediction markets about the Fed rate decision and check my current positions
```

```
Validate this strategy code and fix any issues before deploying
```

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ALGOGLIDE_API_KEY` | Yes | — | Your API key from [algoglide.com/app/api-keys](https://algoglide.com/app/api-keys) |
| `ALGOGLIDE_BASE_URL` | No | `https://api.algoglide.com` | Override for self-hosted deployments |

---

## Run locally

```bash
git clone https://github.com/algoglide/mcp
cd mcp
npm install
ALGOGLIDE_API_KEY=sk_... node server/index.js
```
