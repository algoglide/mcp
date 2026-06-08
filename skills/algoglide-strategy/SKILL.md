# AlgoGlide Strategy Authoring

Use this skill when writing, deploying, or debugging AlgoGlide strategies.

## REQUIRED PATTERN

Every strategy MUST follow this structure exactly:

```python
from algoglide import BaseStrategy, TickContext

class StrategyName(BaseStrategy):
    markets = ["exact-polymarket-slug"]  # non-empty list of slugs

    def on_market_update(self, ctx: TickContext) -> None:
        # YOUR LOGIC HERE
        pass
```

## FINDING MARKET SLUGS

NEVER guess slugs. Always call `search_markets` first:
```
search_markets(query="trump 2026")
-> returns list with actual slugs
```

Use the exact `slug` field from the result.

## PLACING ORDERS

```python
# Buy YES at market
ctx.buy("Yes", size_usd=10.0)

# Buy YES at limit price
ctx.buy("Yes", size_usd=10.0, limit_price=0.55)

# Sell YES position
ctx.sell("Yes", size_usd=10.0)

# Cancel an order
ctx.cancel(order_id)
```

## READING MARKET STATE

```python
def on_market_update(self, ctx: TickContext) -> None:
    yes = ctx.market.outcome("Yes")   # OutcomeSnapshot or None
    no  = ctx.market.outcome("No")

    if yes:
        ctx.log(f"slug={ctx.market.slug} yes_price={yes.price:.2f} elapsed={ctx.market.elapsed_pct:.0%}")

    # elapsed_pct: 0.0 = start of market window, 1.0 = end
    if ctx.market.elapsed_pct < 0.5:
        return  # wait until halfway through window
```

## FILL HANDLING

```python
    def on_fill(self, ctx: FillContext) -> None:
        ctx.log(f"filled: {ctx.outcome} @ {ctx.price:.3f} size={ctx.size:.2f}")
        ctx.log(f"position: {ctx.position.size} @ {ctx.position.avg_price:.3f}")
```

## DEPLOYMENT WORKFLOW

1. Write strategy -> call `validate_strategy` with the code
2. Fix any issues reported
3. Call `create_deployment` with the path and user's user_id
4. Monitor with `get_deployment_logs`
5. Check performance with `get_strategy_performance`

## ANALYSIS AND CHARTS

Use `generate_strategy_analysis` or `generate_equity_chart` to produce PNG charts:
- Charts are saved to disk (never displayed inline)
- All charts use white backgrounds
- Use `generate_custom_chart` with custom R scripts for bespoke visualizations
- Report the file path to the user after generation

## ANTI-PATTERNS (NEVER DO THESE)

- `while True:` or `time.sleep()` -- strategies are event-driven, not polling loops
- `import requests` or any external HTTP -- use `ctx.log()` for output, no external I/O
- `print()` -- use `ctx.log()` instead
- Guessing market slugs -- always call `search_markets` first
- Empty `markets = []` -- strategy will receive no ticks
- Blocking the event loop -- all hooks must return quickly

## BACKTEST BEFORE DEPLOY

For any non-trivial strategy, run a backtest first:
```
create_backtest(strategy_path, start_date="2025-01-01", end_date="2025-06-01", user_id=...)
get_backtest_results(backtest_id, user_id=...)
```
Only deploy live if backtest win rate > 55% and drawdown is acceptable.
