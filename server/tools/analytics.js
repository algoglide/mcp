import { api } from "../api-client.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

function ensureChartsDir(output_dir) {
  const dir = output_dir || path.join(os.homedir(), "Desktop", "algoglide-charts");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function runRscript(script, outputPath) {
  const tmpScript = path.join(os.tmpdir(), `algoglide_chart_${Date.now()}.R`);
  fs.writeFileSync(tmpScript, script);
  try {
    execSync(`Rscript "${tmpScript}"`, { timeout: 30000, stdio: "pipe" });
  } finally {
    fs.unlinkSync(tmpScript);
  }
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Chart generation failed -- output not created at ${outputPath}`);
  }
  return outputPath;
}

export const analyticsTools = [
  { name: "get_pnl_curve", description: "Get daily PnL curve data for a user.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: ({ user_id }) => api.get("/v1/analytics/pnl-curve", { user_id }) },
  { name: "get_win_rate", description: "Get win rate across all closed positions.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: async ({ user_id }) => { const fills = await api.get("/v1/fills", { user_id, limit: 10000 }); const wins = fills.filter((f) => (f.realized_pnl ?? 0) > 0).length; return { win_rate: fills.length ? wins / fills.length : 0, total_trades: fills.length }; } },
  { name: "get_drawdown", description: "Get max drawdown from peak equity.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: ({ user_id }) => api.get("/v1/analytics/drawdown", { user_id }) },
  { name: "get_trade_metrics", description: "Get avg win, avg loss, profit factor, Sharpe ratio.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: ({ user_id }) => api.get("/v1/analytics/metrics", { user_id }) },
  { name: "get_strategy_performance", description: "Get performance stats for a specific deployment.", schema: { type: "object", properties: { deployment_id: { type: "number" }, user_id: { type: "string" } }, required: ["deployment_id", "user_id"] }, handler: ({ deployment_id, user_id }) => api.get(`/v1/deployments/${deployment_id}/performance`, { user_id }) },
  { name: "get_fill_quality", description: "Get fill slippage stats -- how much worse than limit price fills occurred.", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: ({ user_id }) => api.get("/v1/analytics/fill-quality", { user_id }) },
  { name: "get_latency_stats", description: "Get order submission latency percentiles (p50/p95/p99).", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: ({ user_id }) => api.get("/v1/analytics/latency", { user_id }) },
  { name: "get_market_exposure", description: "Get current exposure by market (total USDC at risk per market).", schema: { type: "object", properties: { user_id: { type: "string" } }, required: ["user_id"] }, handler: async ({ user_id }) => { const positions = await api.get("/v1/positions", { user_id }); const exposure = {}; for (const p of positions) { exposure[p.market_slug] = (exposure[p.market_slug] ?? 0) + p.size * p.avg_price; } return exposure; } },
  {
    name: "generate_equity_chart",
    description: "Generate a PNG equity curve chart from trading data using R. Saves to disk and returns file path. Chart has white background. Shows cumulative PnL over time.",
    schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User's AlgoGlide user ID" },
        deployment_id: { type: "number", description: "Optional: filter to a specific deployment" },
        title: { type: "string", description: "Chart title", default: "Equity Curve" },
        output_dir: { type: "string", description: "Directory to save chart PNG. Defaults to ~/Desktop/algoglide-charts/" },
      },
      required: ["user_id"],
    },
    handler: async ({ user_id, deployment_id, title = "Equity Curve", output_dir }) => {
      const fills = await api.get("/v1/fills", { user_id, limit: 10000 });
      const dir = ensureChartsDir(output_dir);
      const dataPath = path.join(os.tmpdir(), `fills_${Date.now()}.json`);
      fs.writeFileSync(dataPath, JSON.stringify(fills));
      const outputPath = path.join(dir, `equity_curve_${Date.now()}.png`);
      const rScript = `
library(jsonlite)
fills <- fromJSON("${dataPath}")
if (nrow(fills) == 0) { png("${outputPath}", width=800, height=400, bg="white"); plot.new(); text(0.5,0.5,"No fills data"); dev.off(); quit() }
fills$cum_pnl <- cumsum(ifelse(is.na(fills$realized_pnl), 0, fills$realized_pnl))
fills$idx <- seq_len(nrow(fills))
png("${outputPath}", width=1200, height=600, bg="white")
par(mar=c(4,4,3,1))
plot(fills$idx, fills$cum_pnl, type="l", lwd=2, col="black",
     main="${title}", xlab="Trade #", ylab="Cumulative PnL ($)",
     panel.first=grid(col="gray90"))
abline(h=0, lty=2, col="gray50")
dev.off()
`;
      runRscript(rScript, outputPath);
      fs.unlinkSync(dataPath);
      return { path: outputPath, message: `Chart saved to ${outputPath}` };
    },
  },
  {
    name: "generate_strategy_analysis",
    description: "Generate a multi-panel strategy root cause analysis PNG (equity curve, win rate over time, win/loss size asymmetry, actual vs required breakeven). Uses R. Saves to disk.",
    schema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
        deployment_id: { type: "number", description: "Optional: filter to a specific deployment" },
        title: { type: "string", default: "Strategy Analysis" },
        output_dir: { type: "string", description: "Directory to save chart PNG. Defaults to ~/Desktop/algoglide-charts/" },
      },
      required: ["user_id"],
    },
    handler: async ({ user_id, deployment_id, title = "Strategy Analysis", output_dir }) => {
      const fills = await api.get("/v1/fills", { user_id, limit: 10000 });
      const dir = ensureChartsDir(output_dir);
      const dataPath = path.join(os.tmpdir(), `analysis_${Date.now()}.json`);
      fs.writeFileSync(dataPath, JSON.stringify(fills));
      const outputPath = path.join(dir, `strategy_analysis_${Date.now()}.png`);
      const rScript = `
library(jsonlite)
fills <- fromJSON("${dataPath}")
if (nrow(fills) == 0) { png("${outputPath}", width=1400, height=1000, bg="white"); plot.new(); text(0.5,0.5,"No fills data"); dev.off(); quit() }
fills$pnl <- ifelse(is.na(fills$realized_pnl), 0, fills$realized_pnl)
fills$cum_pnl <- cumsum(fills$pnl)
fills$win <- fills$pnl > 0
fills$idx <- seq_len(nrow(fills))

png("${outputPath}", width=1400, height=1000, bg="white")
par(mfrow=c(2,2), mar=c(4,4,3,2))

# Panel 1: Equity curve
plot(fills$idx, fills$cum_pnl, type="l", lwd=2, col="black",
     main="${title}: Equity Curve", xlab="Trade #", ylab="Cumulative PnL ($)",
     panel.first=grid(col="gray90"))
abline(h=0, lty=2, col="gray50")

# Panel 2: Rolling win rate (20-trade window)
window <- 20
if (nrow(fills) >= window) {
  wr <- zoo::rollmean(as.numeric(fills$win), window, fill=NA, align="right")
  plot(fills$idx, wr*100, type="l", lwd=2, col="#7C3AED",
       main="Rolling Win Rate (20-trade)", xlab="Trade #", ylab="Win Rate (%)",
       ylim=c(0,100), panel.first=grid(col="gray90"))
  abline(h=50, lty=2, col="gray50")
} else {
  plot.new(); title("Not enough trades for rolling WR")
}

# Panel 3: Win size vs loss size
wins <- fills$pnl[fills$pnl > 0]
losses <- abs(fills$pnl[fills$pnl < 0])
if (length(wins) > 0 && length(losses) > 0) {
  barplot(c(mean(wins), -mean(losses)), names.arg=c("Avg Win", "Avg Loss"),
          col=c("#22C55E","#EF4444"), main="Win Size vs Loss Size",
          ylab="PnL per trade ($)", border=NA)
  abline(h=0)
} else {
  plot.new(); title("Insufficient win/loss data")
}

# Panel 4: PnL distribution
hist(fills$pnl, breaks=30, col="#38BDF8", border="white",
     main="PnL Distribution", xlab="PnL per trade ($)", ylab="Frequency")
abline(v=0, lty=2, lwd=2, col="red")
abline(v=mean(fills$pnl), lty=2, lwd=2, col="black")
legend("topright", c("Zero","Mean"), lty=2, col=c("red","black"), bty="n")

dev.off()
`;
      runRscript(rScript, outputPath);
      fs.unlinkSync(dataPath);
      return { path: outputPath, message: `Multi-panel analysis saved to ${outputPath}` };
    },
  },
  {
    name: "generate_custom_chart",
    description: "Generate a custom chart by executing an R script. Provide the full R code -- it MUST save a PNG to the specified output_path. The script has access to jsonlite for reading API data. White background required.",
    schema: {
      type: "object",
      properties: {
        r_script: { type: "string", description: "Complete R script that generates a PNG. Must use png() with bg='white' and dev.off()." },
        output_path: { type: "string", description: "Absolute path where the PNG should be saved" },
        data_json: { type: "string", description: "Optional JSON string to pass as data. Will be written to a temp file accessible as DATA_PATH env var in the R script." },
      },
      required: ["r_script", "output_path"],
    },
    handler: ({ r_script, output_path, data_json }) => {
      const dir = path.dirname(output_path);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let finalScript = r_script;
      if (data_json) {
        const dataPath = path.join(os.tmpdir(), `custom_data_${Date.now()}.json`);
        fs.writeFileSync(dataPath, data_json);
        finalScript = `DATA_PATH <- "${dataPath}"\n${r_script}`;
      }
      runRscript(finalScript, output_path);
      return { path: output_path, message: `Chart saved to ${output_path}` };
    },
  },
];
