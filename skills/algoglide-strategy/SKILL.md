# algoglide Strategy Development

Use this skill when writing, validating, or deploying algoglide trading agents.

## REQUIRED PATTERN

```python
from algoglide import BaseStrategy, TickContext

class StrategyName(BaseStrategy):
    markets = ["exact-polymarket-slug"]  # NEVER guess — use search_markets first

    async def on_market_update(self, ctx: TickContext) -> None:
        yes = ctx.market.outcome("Yes")
        if not yes:
            return
        # your logic here
```

## STEP 1: FIND A MARKET SLUG

NEVER guess slugs. Always call search_markets first:
```
search_markets(query="fed rate decision 2026")
→ returns list of active markets with real slugs, prices, and volume
```

Pick slugs with volume_24h > $1,000 (liquid enough to trade).

## STEP 2: WRITE THE STRATEGY

### Reading market state
```python
yes = ctx.market.outcome("Yes")   # OutcomeSnapshot or None
no  = ctx.market.outcome("No")

yes.price      # midpoint 0.0–1.0
yes.best_bid   # top bid
yes.best_ask   # top ask
yes.depth      # USDC available

ctx.market.elapsed_pct  # 0.0=start, 1.0=end of market window
ctx.market.slug         # "will-fed-cut-rates-july-2026"
```

### Placing orders
```python
ctx.buy("Yes", size_usd=10.0)                        # market buy
ctx.buy("Yes", size_usd=10.0, limit_price=0.45)      # limit buy
ctx.sell("Yes", size_usd=10.0)                       # market sell
ctx.cancel(order_id)                                  # cancel
```

### Signal intelligence (async)
```python
signal = await ctx.signal(ctx.market.slug)
# signal.sentiment     "bullish" | "bearish" | "neutral"
# signal.confidence    0.0–1.0
# signal.price_momentum  recent price direction
# signal.narrative     human-readable summary string
```

### News and web search (async)
```python
news = await ctx.news("Keir Starmer resignation")
results = await ctx.search("UK political crisis June 2026")
summary = await ctx.market_summary(ctx.market.slug)
```

### Persistent state
```python
position = ctx.state.get("shares", 0.0)    # read
ctx.state["shares"] = 5.0                  # write (persists across ticks)
```

### Event decorators
```python
from algoglide import on_news, on_signal_change

@on_news("Keir Starmer")
def handle_news(self, item):
    self.log(f"News: {item.headline}")

@on_signal_change("my-market-slug", threshold=0.1)
def handle_signal_shift(self, before, after):
    self.log(f"Signal: {before.confidence:.2f} → {after.confidence:.2f}")
```

### Fill handling
```python
async def on_fill(self, ctx: FillContext) -> None:
    ctx.log(f"Filled: {ctx.outcome} @ {ctx.price:.3f}")
    ctx.log(f"Position: {ctx.position.size} shares @ {ctx.position.avg_price:.3f}")
```

## STEP 3: VALIDATE

```
validate_strategy(strategy_code="<full code>")
lint_strategy(strategy_code="<full code>")
```

Fix all issues before proceeding.

## STEP 4: DEPLOY

**Via MCP (recommended for Claude Code):**
```
deploy_agent_project(
  agent_code="<full agent.py>",
  config_yaml="name: my-strategy\nmarkets:\n  - my-slug\nrisk:\n  max_position_usd: 15.0"
)
```

**Via CLI (from terminal):**
```bash
pip install algoglide   # gets the algo command
algo deploy             # deploy from current directory
```

## STEP 5: MONITOR

```
get_deployment_logs(deployment_id=<id>)
get_deployment_signals(deployment_id=<id>)
list_positions()
```

## ANTI-PATTERNS — NEVER DO THESE

- `while True:` or `time.sleep()` — event-driven, not polling
- `import requests` — no external HTTP; use ctx.search() / ctx.news() / ctx.llm()
- `print()` — use ctx.log() instead
- Guessing market slugs — always call search_markets first
- `markets = []` — empty list means no ticks ever received
- Blocking calls in on_market_update — must return quickly (< 500ms)
- Using user_id — not needed; auth is via API key header only

## BACKTEST BEFORE GOING LIVE

```
create_backtest(
  strategy_path="agent.py",
  start_date="2025-01-01",
  end_date="2025-06-01"
)
get_backtest_results(backtest_id=<id>)
```

Deploy live only if win rate > 55% and max drawdown < 25%.
