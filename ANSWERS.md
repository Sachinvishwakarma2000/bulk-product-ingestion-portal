# Answers

> Write all of your written work here. Keep the four headings below. You may add
> sub-headings freely. Incomplete-but-honest beats complete-but-oblivious — if you
> ran out of time, say what you would have done.

---

## Part A — review

For each finding: **file:line — what goes wrong — severity** (`blocker` / `should-fix` / `nit`).

- **`server/routes/orders.js:6` — Hardcoded JWT secret in source code — `blocker`**
  Committing secrets directly into version control creates an immediate security vulnerability. Anyone with read access to the repo can mint arbitrary tokens and impersonate users or tenants. Must be stored in a secret manager or environment variable (e.g. `process.env.JWT_SECRET`). Furthermore, it is unused dead code in this module.

- **`server/routes/orders.js:10` — Direct SQL injection via string concatenation in tenant filter — `blocker`**
  `req.query.tenantId` is concatenated directly into the SQL string without sanitization or parameterization. Any caller can inject arbitrary SQL payloads (e.g. `1 OR 1=1`), bypassing tenant isolation, dumping other tenants' orders, or modifying/deleting database records. Must use parameterized queries (`WHERE tenant_id = $1`, `[req.query.tenantId]`).

- **`server/routes/orders.js:8-10` — Broken Object Level Authorization (BOLA/IDOR) on multi-tenant orders query — `blocker`**
  The endpoint trusts the client-supplied `req.query.tenantId` without verifying whether the authenticated user belongs to or is authorized to view that tenant's records. A tenant can read any competitor's orders simply by tampering with the URL parameter. Tenant ID must be derived from the validated authentication context (e.g. `req.user.tenantId`).

- **`server/routes/orders.js:12-15` — N+1 query problem and sequential async execution in loop — `should-fix`**
  For $N$ orders returned, the loop executes $2N$ additional sequential database queries over the network ($1$ customer query and $1$ items query per order). For 50 orders, this makes 101 separate round-trips to the database, exhausting connection pools and causing high latency. This should be resolved using SQL `JOIN`s, batch queries (`WHERE id IN (...)`), or at minimum parallelized with `Promise.all`.

- **`server/routes/orders.js:20,28` — SQL injection via template string interpolation on order ID — `blocker`**
  Both the order lookup (`WHERE id = ${req.params.id}`) and the status update (`WHERE id = ${req.params.id}`) interpolate route parameters directly into SQL statements, leaving the database vulnerable to SQL injection through crafted path parameters. Must use parameterized queries.

- **`server/routes/orders.js:19-28` — Missing tenant authorization and missing record check on refund — `blocker`**
  `POST /orders/:id/refund` does not verify tenant ownership or user permissions before issuing a refund. An attacker can trigger refunds on any order ID across all tenants. Additionally, if the order ID is not found, `order` is undefined, causing `order.status` to throw an uncaught `TypeError` and crash the request without returning a clean 404 response.

- **`server/routes/orders.js:22-28` — Concurrency race condition (double refund) without transaction or locking — `blocker`**
  Checking `order.status === 'refunded'` and updating it after an external gateway call is non-atomic. If two concurrent refund requests arrive simultaneously (e.g. rapid double-click or replay), both see `order.status !== 'refunded'`, both call the external payment gateway to refund the money twice, and both mark it refunded. Must use row-level locking (`SELECT ... FOR UPDATE`), atomic conditional updates (`UPDATE ... WHERE id = $1 AND status != 'refunded'`), and pass an idempotency key to `paymentGateway.refund`.

- **`server/routes/orders.js:26` — Unvalidated and unparsed refund amount — `blocker`**
  `parseFloat(req.body.amount)` accepts `NaN`, negative numbers, zero, or amounts exceeding the original purchase price. If negative, it may trigger an unintended charge or corrupted gateway state. Furthermore, partial refunds are not handled: any non-zero amount unconditionally sets `order.status = 'refunded'`.

- **`server/routes/orders.js:27-28` — Distributed inconsistency between external payment gateway and database — `should-fix`**
  If `paymentGateway.refund()` succeeds but the database update on line 28 fails (network blip, DB timeout, constraint violation), the money has left the account but the database still shows the order as unrefunded. Subsequent retries will issue duplicate refunds. Must incorporate retry logic, transaction/outbox patterns, and error recovery.

- **`server/routes/orders.js:8-17, 19-31` — Missing error handling and async middleware — `should-fix`**
  Neither route wraps asynchronous operations in `try/catch` or uses an async route error handler. An unexpected database failure or payment gateway rejection results in an unhandled promise rejection, hanging the client HTTP connection until timeout or crashing the process depending on Node version.

- **`web/src/OrderList.jsx:19` — `key={Math.random()}` forces complete DOM recreation on every render — `blocker`**
  Generating a new random key for list elements on every render breaks React's virtual DOM reconciliation. React destroys and recreates every `Row` component and its internal DOM state on each re-render (keystroke), causing flickering, lost focus, lost internal state, and severe UI lag. Must use a stable unique identifier such as `key={o.id}`.

- **`web/src/OrderList.jsx:8-12` — Race condition on search input due to missing abort/cleanup — `blocker`**
  Every keystroke triggers a network request via `useEffect`. If a slow earlier request returns after a faster later request, `setOrders` will overwrite the latest search results with stale data from an earlier query. Must use an `AbortController` in the `useEffect` cleanup return function or debounce the user input.

- **`web/src/OrderList.jsx:12` — Stale closure / missing `tenantId` in dependency array — `should-fix`**
  The `useEffect` dependency array only includes `[query]` and omits `tenantId`. If `tenantId` changes in parent props, the list fails to refetch, displaying incorrect data from the previous tenant. Must include `[tenantId, query]`.

- **`web/src/OrderList.jsx:18` — Uncontrolled, un-debounced input causes API request spam — `should-fix`**
  Updating `query` on every keystroke (`onChange`) triggers an HTTP request for every character typed. Typing a 10-character word fires 10 concurrent requests to the backend, causing unnecessary server load. Needs a debounce (e.g. 300ms) or submit trigger.

- **`web/src/OrderList.jsx:10-11, 14` — Lack of error handling causes runtime crash on non-200 responses — `should-fix`**
  If `/api/orders` fails and returns a non-200 error object (e.g. `{ error: "..." }`), `r.json()` passes that object to `setOrders`. On line 14, `orders.reduce` throws `TypeError: orders.reduce is not a function`, completely crashing the React component tree. Needs HTTP status validation and defensive checks (e.g. `Array.isArray(orders)`).

- **`web/src/OrderList.jsx:14` — IEEE-754 floating-point inaccuracies in currency addition — `nit`**
  Adding currency values with JavaScript floats (`sum + o.amount`) causes precision errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). Financial amounts should be represented in integer cents or formatted using `Intl.NumberFormat`.

- **`web/src/OrderList.jsx:18` — Missing form labels / accessibility metadata — `nit`**
  The `<input>` tag lacks an associated `<label>`, `placeholder`, or `aria-label`, creating accessibility barriers for screen readers.

---

## Part B — assumptions

Every decision you made that the brief did not spell out. One line each: what you
chose, and why.

- **Encoding and Unicode:** Assumed UTF-8 encoding; international characters and accents (e.g. `Café Crème`, `日本語キーボード`) are preserved losslessly.
- **Header naming & order:** Assumed header names are case-insensitive (`sku`, `name`, `price`, `stock`, `category`) and column order is flexible as long as all required columns exist.
- **Catalogue update semantics (Upsert):** Assumed subsequent valid rows with an existing SKU update the catalogue (upsert / last-write-wins) rather than rejecting the batch, matching standard e-commerce catalogue feed updates.
- **Currency symbols in price:** Assumed currency symbols (`₹`, `$`) in price fields are rejected as invalid because unannounced currencies risk importing values into the wrong store base currency.
- **Comma thousands-separators:** Assumed formatted numbers with commas (e.g. `"1,199.00"`) are safe to normalize into decimal values (`1199.00`).
- **Strictly positive pricing:** Assumed product price must be strictly positive (`price > 0`); zero-price items (`0`) are rejected to avoid accidental free-product data leaks.
- **Stock integrity (non-negative integer):** Assumed stock represents discrete units; fractional values (`3.5`) and negative values (`-5`) are rejected as invalid inventory.
- **Category requirement:** Assumed category is required and cannot be empty; rows with empty category are flagged for operational review rather than defaulting to arbitrary placeholders.
- **Malformed row handling:** Assumed rows with column counts mismatched from the header (e.g. 3 columns instead of 5) are rejected at the row level without aborting the rest of the file.
- **In-memory persistence:** Assumed an in-memory SKU-keyed Map is sufficient as permitted by the brief, enabling instant updates and querying without database migration overhead.

### Part B — what I did not build (and why)

- **User authentication / tenant isolation:** Omitted to prioritize robust CSV parsing, row-level validation, and UX within the 55-minute limit.
- **Database schema migrations & relational persistence:** Used in-memory storage as explicitly allowed by the brief ("We are not marking your schema migrations").
- **Asynchronous worker queues (BullMQ / Redis):** For files under 25 MB, synchronous HTTP processing with streaming parser provides immediate feedback without extra infrastructure dependencies.
- **Downloadable rejected-rows CSV export:** Operations can review and filter all validation failures directly in the UI table; a dedicated export endpoint was deferred to save time.
- **Draft / staged imports with manual review rollback:** Valid rows are committed directly to the catalogue; full staging-approval workflows were out of scope for the time budget.

---

## Part C — design at 100× load

Under a page. Components + how a file moves through them; the three decisions you are
least sure about and what you traded away; what you keep vs. throw out from Part B;
the first thing that breaks at 10× this load. Prose + ASCII, or link a photo of a
whiteboard sketch committed to the repo.

### Architecture & File Flow

```
[ Ops Web UI ]
      |
      | 1. Request presigned upload URL
      v
[ API Gateway ] ---> [ Ingestion Service ] ---> Generates S3 Presigned URL & Job record in DB
      |
      | 2. Direct Multipart S3 Upload (500 MB)
      v
[ S3 Object Storage ]
      |
      | 3. ObjectCreated Event / SQS Notification
      v
[ Fair-Share Dispatcher ] <====> [ Tenant Queues (Redis DRR) ]
  (Deficit Round-Robin across 500 tenants)
      |
      | 4. Dispatch 5,000-row chunk tasks
      v
[ Worker Pool (Auto-scaled) ]
      |
      +---> [ Row Validation & Chunk Parser ]
      |
      +---> [ Multi-tenant Postgres ] (Batch COPY / ON CONFLICT upsert)
      |
      +---> [ S3 Error Sink ] (Append-only /errors/{tenant_id}/{job_id}.jsonl)
      |
      +---> [ Redis Job State ] (HINCRBY processed, valid, invalid counts)
                  |
                  | 5. Server-Sent Events (SSE) / WebSocket
                  v
          [ Ops UI Progress Bar & Live Error Feed ]
```

1. **Direct-to-S3 Upload:** Client requests a pre-signed S3 multipart URL from API Gateway. The 500 MB file streams directly from browser to S3, bypassing application web servers and avoiding memory bloat.
2. **Job Registration:** S3 triggers an `ObjectCreated` event to the Ingestion Service, which registers an `ImportJob` in PostgreSQL with tenant metadata.
3. **Tenant-Fair Scheduling (Deficit Round-Robin):** A centralized dispatcher manages virtual queues per tenant in Redis. Workers pull jobs using Deficit Round-Robin (DRR). A tenant uploading 500k rows cannot monopolize the worker pool; smaller 50-row tenant uploads are serviced immediately.
4. **Streaming Chunk Processing:** Workers stream the S3 file using streaming chunk readers (e.g. 5,000 rows per chunk). Workers execute row validation rules in parallel.
5. **Database Ingestion:** Valid rows are bulk-upserted into multi-tenant PostgreSQL using `COPY` into an unlogged staging table, followed by `INSERT INTO products ... ON CONFLICT (tenant_id, sku) DO UPDATE`.
6. **Error Reporting & Live Progress:** Rejected rows are written to an S3 error log (`/errors/{tenant}/{job_id}.jsonl`). Redis atomic counters (`HINCRBY`) track valid and invalid row counts. Progress percentages and failure summaries stream to the client via Server-Sent Events (SSE).

---

### Three Decisions Least Sure About & Trade-offs

1. **Chunk size (5,000 rows) vs Database Lock Contention:**
   - *Trade-off:* Smaller chunks give smoother real-time progress bars and low memory footprints, but generate excessive transaction overhead and index contention during upserts. Larger chunks optimize bulk database throughput but increase worker retry cost if a network blip fails a chunk.
2. **Parallel chunking vs Intra-file duplicate SKU ordering:**
   - *Trade-off:* Distributing chunks of the same file across multiple workers allows high concurrency, but if duplicate SKUs exist across distant rows, concurrent workers can suffer race conditions or deadlocks during upserts. I chose to pin all chunks of a single tenant import to the same worker or partition by `hash(sku)`, trading away maximum parallelism for deterministic ordering.
3. **S3 JSONL error sink vs Queryable SQL error table:**
   - *Trade-off:* Writing 50,000 row errors to PostgreSQL causes write amplification and index bloat for transient data. I chose an append-only S3 file with summary metrics in Redis. The trade-off is operations cannot perform complex SQL ad-hoc queries on errors without downloading the log.

---

### What I Keep vs. Throw Out from Part B

- **Keep:** The domain validation engine (`validateRow`), field normalization rules (trimming, comma handling, non-negative stock, positive price), error summary structure, and clean UI error reporting model.
- **Throw Out:** Multer in-memory file buffering (`memoryStorage`), synchronous HTTP request-response cycle, single-threaded synchronous CSV parsing, and in-memory Map persistence.

---

### What Breaks First at 10× This Load (5 GB / 5,000,000 rows)

- **PostgreSQL Write-Ahead Log (WAL) and B-Tree Index IOPS Saturation:**
  At 5M rows per file across 500 tenants, concurrent `ON CONFLICT` updates against heavily-indexed tables saturate disk IOPS, cause WAL write amplification, and trigger aggressive autovacuum locks. The primary database becomes unresponsive to regular retail customer traffic.
  *Remediation:* Ingest into unlogged tenant staging tables, merge offline in batch windows, or route high-frequency catalogue feeds through an append-only analytical store (e.g. ClickHouse) with periodic read-model projections.



---

## Part D — review

Would you merge `critique/app/pricing/fx.py`? For each objection: the problem, and
**blocker** vs **raise-it**.

### Verdict: **NO — Do not merge.**
Although the unit tests in `test_fx.py` pass, the test suite only exercises a single happy-path scenario with a mock client. In a live production environment, this module will cause serious financial inaccuracies, severe latency bottlenecks, memory leaks, and unhandled production outages.

---

### Objections & Findings:

- **Unbounded global dictionary cache without TTL or expiration (`CACHE = {}`) — `blocker`**
  - **Problem:** Currency exchange rates fluctuate continuously. Because `CACHE` has no Time-To-Live (TTL) or invalidation mechanism, the first exchange rate fetched for any pair remains cached permanently for the entire lifetime of the process. If EUR/USD moves from 1.05 to 1.15, the service will continue charging or calculating at 1.05, creating direct financial losses. Furthermore, `CACHE` grows unbounded with no size cap or eviction policy (LRU), causing a slow memory leak in long-running processes.
  - **Fix:** Use a TTL-based cache (e.g., `cachetools.TTLCache(maxsize=1000, ttl=300)`) or an external shared cache like Redis with automated expiration.

- **Creating a new `httpx.AsyncClient()` on every cache miss — `blocker`**
  - **Problem:** `get_exchange_rate` opens and tears down a brand new `httpx.AsyncClient` inside an async context manager on every single cache miss. This completely disables TCP connection reuse and HTTP keep-alive, forcing expensive TLS handshakes on every request. Under burst traffic, it rapidly exhausts ephemeral ports and file descriptors, leading to socket starvation (`OSError: [Errno 24] Too many open files`).
  - **Fix:** Maintain a long-lived, shared `httpx.AsyncClient` instance tied to the application lifespan/context with a configured connection pool.

- **Sequential $O(N)$ HTTP round-trips in `convert_all` (N+1 query pattern) — `blocker`**
  - **Problem:** `for order in orders:` sequentially awaits `get_exchange_rate` for each order one at a time. If a batch contains 100 orders with diverse uncached currencies, the server executes 100 serial outbound network calls. If each call takes 150ms, the batch takes 15+ seconds, almost certainly timing out upstream clients.
  - **Fix:** Collect distinct currencies first (`set(order["currency"] for order in orders)`), prefetch missing exchange rates concurrently using `asyncio.gather()` (or call a bulk rates endpoint), and then map the retrieved rates synchronously over the orders.

- **Missing timeouts, status validation, and network error handling — `blocker`**
  - **Problem:** `client.get(...)` has no configured timeout parameter and lacks `response.raise_for_status()`. If the third-party rates service hangs, the coroutine hangs indefinitely. If the rates API returns HTTP 429 (rate limited), 500 (internal server error), or an error payload, `response.json()["rate"]` will crash with an unhandled `KeyError` or `HTTPStatusError`, bringing down the entire order conversion pipeline without retry, circuit breaker, or fallback.
  - **Fix:** Set explicit request timeouts (`timeout=5.0`), check HTTP response status (`response.raise_for_status()`), and wrap network calls in `try/except httpx.HTTPError` with fallbacks or structured domain errors.

- **Use of binary floating-point numbers (`float` and `round`) for financial math — `blocker`**
  - **Problem:** IEEE 754 binary floats cannot accurately represent decimal fractions (e.g., `0.1 + 0.2 = 0.30000000000000004`). Multiplying order amounts and rates using `float` followed by standard `round()` creates accumulated rounding drift and precision discrepancies that fail accounting audits.
  - **Fix:** Use Python's standard `decimal.Decimal` for currency calculations, with explicit quantizing and rounding rules (e.g., `ROUND_HALF_UP`), or store all amounts as integer minor currency units (cents).

- **Cache stampede / dogpiling under concurrent async load — `raise-it`**
  - **Problem:** When multiple coroutines invoke `get_exchange_rate("JPY", "USD")` simultaneously before the initial response resolves, every coroutine detects a cache miss and dispatches identical duplicate HTTP requests to the third-party API, exacerbating rate limiting.
  - **Fix:** Implement an async lock per currency key (or a single-flight / coalescing promise) so that only one outgoing request is dispatched per currency pair while others await that resolution.

- **Untyped dictionary structures and lack of input validation — `raise-it`**
  - **Problem:** `orders: list[dict]` is loosely typed. If an incoming order is missing the `"currency"` or `"amount"` keys, or if `"amount"` is negative or non-numeric, the code crashes midway through batch execution with an unhandled `KeyError` or corrupts downstream calculations.
  - **Fix:** Define Pydantic models or `typing.TypedDict` with input schema validation (e.g., `amount >= 0`, 3-letter ISO-4217 currency code).

- **Fragile coupling and implicit dependency in `total_usd` — `raise-it`**
  - **Problem:** `total_usd` assumes `order["usd"]` exists on every dictionary. If passed an unconverted order list or a list where one item failed conversion, it raises `KeyError: 'usd'`.
  - **Fix:** Enforce explicit input types or combine conversion and totalization into a safe domain model.
