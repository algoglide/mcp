# Debug a Live Deployment

## When to use
Use this workflow when a deployment is unhealthy, stopped unexpectedly, or producing unexpected trades — to locate the error, understand its cause, fix the agent code, and redeploy.

## Tools used (in order)
- `get_deployment` — check current status and metadata before pulling logs
- `get_deployment_logs` — retrieve recent log output and locate error lines
- `explain_strategy_error` — get a plain-language explanation of a specific error message
- `validate_strategy` — confirm the fixed code is structurally correct before redeploying
- `lint_strategy` — catch any new warnings introduced by the fix
- `deploy_agent_project` — push the corrected code as a new deployment

## Step-by-step

### Step 1: Check the deployment state
**Call:** `get_deployment({ deployment_id: "<id>", user_id: "<your-user-id>" })`
**What to look for:** The `status` field. Values to act on:
- `"stopped"` or `"error"` — the process has exited; logs will contain the exit reason
- `"running"` with `health: "degraded"` — the process is alive but misbehaving
- `"starting"` for more than 60 seconds — the agent failed to initialize

Also check `last_updated_at` to understand how long ago the state changed.

### Step 2: Pull recent logs
**Call:** `get_deployment_logs({ deployment_id: "<id>", user_id: "<your-user-id>", limit: 100 })`
**What to look for:** Scan for lines containing `ERROR` or `WARN`. The log format prefixes each line with a severity level. An `ERROR` line typically includes a Python exception type and traceback. A `WARN` line typically indicates a recoverable condition such as a missed market update, a rejected order, or a rate-limit backoff.

Key patterns:
- `ERROR ... KeyError` — the agent is accessing a market data field that does not exist in the current payload shape
- `ERROR ... ConnectionRefusedError` — the agent lost its feed connection; check if the market is still active
- `WARN ... order rejected` — the exchange rejected an order; the `reason` field in the log line explains why
- `WARN ... position size exceeded` — the config's `max_position` constraint was hit; this is expected behavior, not a bug

Do not dismiss `WARN`-level lines. Repeated warnings often precede a hard crash and are the most actionable signal.

### Step 3: Explain the error
**Call:** `explain_strategy_error({ error_message: "<paste the full ERROR line here>" })`
**What to look for:** The response contains a `fix` field with a plain-language explanation of what went wrong and how to resolve it. Apply the suggested fix to your local copy of the strategy code. If the error is a market data schema issue, also call `get_market({ slug: "<slug>" })` to inspect the current field names in the live market payload.

### Step 4: Stream logs in real time (optional)
**Call:** `stream_deployment_logs({ deployment_id: "<id>", user_id: "<your-user-id>" })`
**What to look for:** Use this instead of `get_deployment_logs` when the deployment is still running and you need to watch for errors as they occur. Stream until you observe the error reproducing or confirm it has stopped.

### Step 5: Validate the fixed code
**Call:** `validate_strategy({ strategy_code: "<fixed code>" })`
**What to look for:** `valid: true`. If the fix introduced a new structural error, `errors` will list it with the exact `field` path. Do not skip this step — deploying invalid code will immediately fail and create a new unhealthy deployment alongside the old one.

### Step 6: Lint the fixed code
**Call:** `lint_strategy({ strategy_code: "<fixed code>" })`
**What to look for:** No new `severity: "error"` items compared to the pre-fix lint output. If the fix added new logic branches, check that no new `severity: "warning"` items appeared around position management or error handling.

### Step 7: Redeploy with the corrected code
**Call:** `deploy_agent_project({ user_id: "<your-user-id>", agent_code: "<fixed code>", config_yaml: "<config>", name: "my-strategy-v2" })`
**What to look for:** A new `deployment_id` with `status: "starting"`. Immediately follow up with `get_deployment_logs({ deployment_id: "<new id>", user_id: "<your-user-id>", limit: 30 })` after 10–15 seconds to confirm the new deployment started cleanly and did not reproduce the original error.

## Common pitfalls
- Redeploying without fixing: pushing the same code again will produce the same error. Always locate and address the root cause before calling `deploy_agent_project`.
- Ignoring WARN-level logs: `WARN` lines do not stop the process, which makes them easy to overlook. A `WARN` about repeated order rejections means the strategy is running but not trading — PnL will be flat while fees accumulate.
- Patching symptoms instead of causes: `explain_strategy_error` describes the immediate cause. If the suggested fix is a try/except block that swallows an exception, look deeper — the underlying data or logic issue will resurface in a different form.
- Forgetting to stop the old deployment: `deploy_agent_project` creates a new deployment but does not automatically stop the previous one. If the old deployment is still in `"running"` state, both agents may be trading the same market simultaneously. Call `stop_deployment({ deployment_id: "<old id>", user_id: "<your-user-id>" })` after confirming the new deployment is healthy.
- Losing the old deployment_id: keep both the old and new `deployment_id` values until the new deployment is confirmed healthy. You may need the old ID to pull additional log history.
