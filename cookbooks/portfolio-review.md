# Portfolio Review

## When to use
Use this workflow for a structured periodic review of live trading performance: assess overall portfolio health, check order execution quality, measure risk metrics, and produce a visual analysis report.

## Tools used (in order)
- `get_portfolio_summary` — top-level snapshot of all positions and capital allocation
- `get_fill_quality` — measure how well orders executed versus the expected price
- `get_drawdown` — quantify peak-to-trough equity decline and recovery time
- `get_win_rate` — measure trade-level profitability ratio across all resolved positions
- `generate_strategy_analysis` — produce a multi-panel PNG report combining all key metrics

## Step-by-step

### Step 1: Get the portfolio snapshot
**Call:** `get_portfolio_summary({ user_id: "<your-user-id>" })`
**What to look for:** The `open_positions` field is the count of currently open positions. `total_realized_pnl` shows cumulative realized profit or loss. `total_fills` is the total number of fills recorded. `active_deployments` shows how many strategies are currently running. If `open_positions` is unexpectedly high, inspect per-deployment exposure with `get_market_exposure({ user_id: "<your-user-id>" })`.

### Step 2: Check fill quality and slippage
**Call:** `get_fill_quality({ user_id: "<your-user-id>" })`
**What to look for:** The `avg_slippage_bps` field measures how many basis points away from the mid-price fills landed on average. Below 5 bps is healthy for a liquid prediction market. Above 20 bps suggests the strategy is trading into thin books or sizing positions too large relative to available liquidity. `fill_rate` below 0.90 means more than 10% of orders are not filling — the strategy may be using limit orders that expire before matching. Also check `avg_latency_ms` against the result from `get_latency_stats({ user_id: "<your-user-id>" })` — high latency combined with high slippage points to network or infrastructure issues, not strategy logic.

### Step 3: Measure drawdown
**Call:** `get_drawdown({ user_id: "<your-user-id>" })`
**What to look for:** `max_drawdown` is the largest peak-to-trough equity decline expressed as a decimal (0.15 = 15%). A value above 0.20 indicates the strategy carries more risk than most discretionary thresholds allow. `current_drawdown` tells you whether the portfolio is currently in a drawdown — if non-zero, compare it to `max_drawdown` to judge severity. `avg_recovery_days` is the typical number of days to recover from a drawdown to a new equity high; above 14 days suggests the strategy does not recover quickly enough to compound.

### Step 4: Measure win rate
**Call:** `get_win_rate({ user_id: "<your-user-id>" })`
**What to look for:** `win_rate` is the fraction of resolved trades that closed with positive PnL. Above 0.55 with at least 30 resolved trades is the minimum threshold for statistical confidence. Also inspect `avg_win` and `avg_loss` — a `win_rate` of 0.65 is insufficient if `avg_loss` is three times `avg_win`. The `expectancy` field (if present) combines both: a positive expectancy means the strategy has positive expected value per trade. Cross-reference `total_trades` to confirm there is enough data to trust the ratio.

### Step 5: Generate the strategy analysis report
**Call:** `generate_strategy_analysis({ user_id: "<your-user-id>", title: "Portfolio Review June 2026" })`
**What to look for:** The response contains a `path` field with the absolute path to a PNG file on disk. Save this path. The PNG is a multi-panel chart combining the equity curve, win rate over time, win/loss size asymmetry, and a PnL distribution histogram. Open the file from its path — do not attempt to display the image inline. If specific deployments need separate analysis, call `get_strategy_performance({ deployment_id: "<id>", user_id: "<your-user-id>" })` for each deployment before generating the combined chart.

## Common pitfalls
- Reviewing too short a window: a 7-day window will capture fewer than 30 trades for most strategies, making win rate and drawdown metrics statistically unreliable. Use a minimum 30-day window; 90 days is preferred for a meaningful periodic review.
- Ignoring fill quality slippage: `avg_slippage_bps` is easy to overlook because it does not appear in PnL directly. On a high-frequency strategy, 15 bps of consistent slippage can erase a 0.60 win rate entirely. Always inspect `get_fill_quality` before concluding a strategy is underperforming.
- Conflating win rate with profitability: a strategy with `win_rate: 0.70` and `avg_loss` three times `avg_win` loses money. Always read `avg_win`, `avg_loss`, and `total_pnl` together.
- Not saving the chart path: `generate_strategy_analysis` returns `path` as the only reference to the generated chart. If this value is lost before being recorded, the chart cannot be retrieved — it must be regenerated with another API call.
- Reviewing aggregate metrics without per-deployment breakdown: `get_portfolio_summary` aggregates across all active strategies. If one deployment is profitable and another is losing, the aggregate can look neutral. Call `get_strategy_performance` per deployment to isolate which strategies are contributing positively.
