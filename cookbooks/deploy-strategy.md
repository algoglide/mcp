# Deploy a Strategy

## When to use
Use this workflow to go from a blank slate to a live running deployment: find a target market, scaffold agent code, validate and lint it, then deploy and confirm it is running.

## Tools used (in order)
- `search_markets` — find a real market slug; never guess or hard-code a slug
- `get_strategy_template` — fetch working starter code for a given strategy type
- `validate_strategy` — catch structural and schema errors before any network call
- `lint_strategy` — catch style, logic, and best-practice warnings
- `deploy_agent_project` — push `agent.py` + `config.yaml` as a live deployment
- `get_deployment_logs` — confirm the deployment started and is receiving data

## Step-by-step

### Step 1: Find a real market slug
**Call:** `search_markets({ query: "bitcoin", status: "active" })`
**What to look for:** A result with `status: "active"` and a non-null `slug` field. Copy the exact `slug` value — this is required for the config. If the list is empty, broaden the query or call `list_active_markets({})` to see all open markets.

### Step 2: Get a strategy template
**Call:** `get_strategy_template({ style: "directional" })`
**What to look for:** A response containing a `template` field with the Python source string. If you are unsure which style to use, call `list_strategy_templates({})` first and pick a `style` from the returned list (`"directional"`, `"mean-reversion"`, or `"market-making"`).

### Step 3: Check the BaseStrategy interface
**Call:** `get_strategy_schema({})`
**What to look for:** Confirm the lifecycle hook you need (`on_market_update`) exists, and note the exact `ctx.buy` / `ctx.sell` signatures before writing code.

After reviewing the schema, write your `agent.py` using the template from Step 2 as a base. Ensure `markets` is set to the slug found in Step 1.

### Step 4: Validate the strategy
**Call:** `validate_strategy({ strategy_code: "<your code>" })`
**What to look for:** `valid: true` in the response. If `valid: false`, inspect the `errors` array. Each error includes a `field` and `message`. Fix all errors before proceeding — a deployment will be rejected if validation fails server-side anyway.

### Step 5: Lint the strategy
**Call:** `lint_strategy({ strategy_code: "<your code>" })`
**What to look for:** `issues` array should be empty or contain only `severity: "info"` items. Any `severity: "error"` item is a blocking issue. Any `severity: "warning"` item about position sizing or risk limits should be addressed before a live deployment — these are the most common source of unexpected behavior at runtime.

### Step 6: Deploy the agent project
**Call:** `deploy_agent_project({ user_id: "<your-user-id>", agent_code: "<your code>", config_yaml: "<your config>", name: "my-strategy-v1" })`
**What to look for:** A response containing `deployment_id` and `status: "starting"` or `status: "running"`. Save the `deployment_id` — all subsequent monitoring calls require it.

### Step 7: Confirm the deployment is running
**Call:** `get_deployment_logs({ deployment_id: "<id>", user_id: "<your-user-id>", limit: 50 })`
**What to look for:** Log lines containing `"agent started"` or `"connected to market feed"`. The absence of any `ERROR` lines in the first 50 lines indicates a clean start. If the deployment stops immediately, the exit code will appear in the logs — pass the error message to `explain_strategy_error` for diagnosis.

## Common pitfalls
- Guessing a market slug: slugs are opaque identifiers. Always call `search_markets` or `list_active_markets` first. A hardcoded slug that looked valid in development will silently fail or attach to the wrong market in production.
- Skipping validation before deploy: `deploy_agent_project` runs its own server-side validation. Calling `validate_strategy` locally first gives you faster, more detailed error messages and avoids wasting a deployment attempt.
- Deploying with lint errors: `lint_strategy` warnings about position sizing or missing stop-loss logic are not blocking at deploy time but will cause runaway losses in live trading. Treat `severity: "warning"` as blocking for any real-capital deployment.
- Not saving the deployment_id: the `deployment_id` is the only handle to logs, signals, and redeploy operations. Store it before the response goes out of context.
- Getting no results from `search_markets`: a narrow or misspelled query against a recently resolved market set returns an empty list. Broaden the query or call `list_active_markets` to confirm available slugs before writing strategy code.
