# Backtest and Analyze a Strategy

## When to use
Use this workflow to run a historical simulation of a strategy, poll until it finishes, retrieve quantitative results, and render an equity curve chart for visual inspection.

## Tools used (in order)
- `create_backtest` — submit a backtest job with strategy code and a date range
- `get_backtest` — poll job status until `status` reaches a terminal state
- `get_backtest_results` — fetch aggregated performance metrics after completion
- `get_backtest_equity_curve` — fetch the time-series equity data points
- `generate_equity_chart` — render a PNG chart from the equity curve data

## Step-by-step

### Step 1: Submit the backtest job
**Call:** `create_backtest({ strategy_path: "/path/to/strategy.py", start_date: "2025-01-01", end_date: "2025-12-31", user_id: "<your-user-id>" })`
**What to look for:** A response containing `backtest_id` and `status: "pending"` or `status: "running"`. Save the `backtest_id` immediately. The job runs asynchronously — do not attempt to read results yet.

### Step 2: Poll until the job reaches a terminal state
**Call:** `get_backtest({ backtest_id: "<id>", user_id: "<your-user-id>" })`
**What to look for:** The `status` field. Repeat this call until `status` is one of `"completed"`, `"failed"`, or `"cancelled"`. While `status` is `"pending"` or `"running"`, wait and retry. A typical backtest over a one-year window finishes in 10–60 seconds depending on trade frequency. If `status` is `"failed"`, the `error` field contains the failure reason — treat this like a strategy error and refer to the debug-live-deployment cookbook.

### Step 3: Retrieve aggregated results
**Call:** `get_backtest_results({ backtest_id: "<id>", user_id: "<your-user-id>" })`
**What to look for:** The following fields indicate a viable strategy:
- `win_rate` above `0.55` — more than half of resolved trades closed profitably
- `max_drawdown` below `0.20` — peak-to-trough equity decline stayed under 20%
- `total_pnl` positive
- `sharpe_ratio` above `1.0` for any strategy intended for live capital

If `max_drawdown` exceeds `0.30`, the strategy is carrying excessive risk regardless of win rate. If `win_rate` is high but `total_pnl` is low or negative, check `avg_win` vs `avg_loss` — a poor win/loss ratio can erase a high win rate.

### Step 4: Fetch the equity curve time series
**Call:** `get_backtest_equity_curve({ backtest_id: "<id>", user_id: "<your-user-id>" })`
**What to look for:** An array of objects each containing a `timestamp` and `equity` value. Look for smooth compounding growth with no cliff-edge drops. A curve that rises steadily then collapses near the end of the window signals regime sensitivity — the strategy may be overfit to early data. You can also call `get_backtest_trade_log({ backtest_id: "<id>", user_id: "<your-user-id>" })` to inspect individual trade entries and exits.

### Step 5: Render the equity chart
**Call:** `generate_equity_chart({ user_id: "<your-user-id>", title: "Strategy Equity Curve 2025" })`
**What to look for:** The response contains a `path` field with the absolute path to the generated PNG file. Save this path. Do not attempt to display image content inline — open the file from disk. The chart shows equity over time with drawdown shading. A healthy chart shows a rising line with shallow, short-lived drawdown periods.

## Common pitfalls
- Reading results before the job completes: calling `get_backtest_results` while `status` is still `"running"` will return partial or empty data. Always poll `get_backtest` first and confirm `status: "completed"`.
- Interpreting results without context: a `win_rate` of `0.70` on 5 trades is statistically meaningless. Check `total_trades` in the results — fewer than 30 resolved trades makes any metric unreliable. Extend the date range or find a higher-frequency strategy before drawing conclusions.
- Ignoring the trade log: aggregate metrics can hide clustering effects. A strategy might win 20 trades in a single week and lose the rest. Call `get_backtest_trade_log` and inspect the `resolved_at` timestamps to check for time clustering.
- Using too short a date window: a 30-day backtest will not capture regime changes, news-driven volatility, or low-liquidity periods. Use at minimum a 6-month window for any strategy intended for live deployment.
- Forgetting to compare: after iterating on strategy parameters, call `compare_backtests({ backtest_id_a: "<id1>", backtest_id_b: "<id2>", user_id: "<your-user-id>" })` to get a side-by-side diff of key metrics rather than comparing numbers manually.
