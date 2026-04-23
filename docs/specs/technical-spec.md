# Technical Specification

**Stage:** Technical spec (prototype).
**Sources of truth:** `docs/specs/functional-spec.md`, `docs/normalized/prototype-decisions.md`, `docs/normalized/database-notes.md`, `CLAUDE.md`.
**Scope guard:** Anything not grounded in those sources is flagged as a **[TECH-ASSUMPTION]** below.

---

## 1. Overview

A single-repo, single-URL web app built on Next.js. Two routes (`/` landing, `/chat` chat screen) share a Node server that holds an encrypted session cookie carrying the active vendor, talks to a Postgres database seeded with the 6-table schema from `database-notes.md`, and calls the Anthropic API in tool-use mode to map each natural-language question to one of seven fixed analytical tools. The LLM picks the tool and its arguments; the server runs the tool against a parameterized SQL template with `vendor_id` injected from the session. The tool's result shape determines the chart type deterministically; the frontend renders it with Recharts in the brand palette.

The prototype is intentionally small: one Next.js app, one Postgres database, one LLM endpoint, one deploy target.

## 2. Proposed Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend framework | **Next.js 14+ (App Router) + React 18 + TypeScript (strict)** | Single process for UI and API; fastest path to a shareable URL. |
| Styling | **Tailwind CSS** with a custom theme mapped to the 6 brand colour tokens + `#E5E7EB` hairline | Fast wiring of brand tokens; no separate design system needed. |
| Typography | **Inter** via `next/font/google` with a `system-ui` fallback | Matches §7.8 of the functional spec. |
| Charting | **Recharts** | Line / bar / pie out of the box; small API; easy to restyle to brand palette. |
| Backend | **Next.js route handlers** (Node runtime) | Keeps server and frontend in one deployable. |
| Database | **Postgres** (hosted; Neon or Supabase) | UUID/decimal/timestamp support matches `database-notes.md`; parameterized queries are straightforward. |
| DB access | **Drizzle ORM** | Typed query templates, lightweight migrations, no heavy abstractions. |
| LLM | **Anthropic Claude `claude-sonnet-4-6`** via the official TypeScript SDK, in **tool-use** mode | Reliable tool-calling for the bounded catalog. Haiku 4.5 is an acceptable cost fallback if latency matters in the demo. |
| Session | **`iron-session`** (AES-encrypted cookie) | Stateless session, no session table needed for the prototype. |
| Deployment | **Vercel** + **Neon Postgres** | Single command deploy; one URL; built-in HTTPS; env vars managed in dashboard. |
| Package manager / runtime | **pnpm**, **Node 20 LTS** | Consistent installs; fast. |
| Lint / format | **ESLint** (Next.js config) + **Prettier** | Default configs only. |
| Access gate (pre-demo) | **Basic auth middleware** keyed on env vars | Covers Q10 (URL access gate) for private demo sharing. |

## 3. System Architecture

**Frontend app.** Next.js App Router with two routes:

- `/` — landing: "Log in as Supplier 1" / "Log in as Supplier 2" buttons, prototype banner.
- `/chat` — chat: header with active vendor + Switch vendor; scrollable message list; bottom input with Enter/Shift+Enter handling.

Both routes are React client components that call the backend via `fetch` to JSON endpoints. No client-side state survives a hard reload; session persistence is via the cookie.

**Backend service.** Four JSON endpoints under `/api/` (see §6). Each endpoint:
1. Reads the encrypted session cookie.
2. For `/api/ask`, extracts `vendor_id` server-side; ignores any `vendor_id` passed in the body.
3. Calls downstream (DB or LLM) with parameterized inputs.
4. Returns a shape-stable JSON payload.

**Database.** Single Postgres instance. Schema matches `database-notes.md` exactly. No USERS/ACCOUNTS table (vendor selector stands in). One seed script populates two vendors and their products/orders/items/cancellations.

**LLM usage boundary.** The LLM runs only inside `/api/ask`. It receives the user's question plus a static system prompt plus the JSON-schema of the 7 tools. It returns either a `tool_use` with a bounded argument set, or a short refusal for out-of-scope or "why" questions. The LLM never sees `vendor_id`, database rows, or SQL. The server never executes anything the LLM did not select from the fixed catalog.

**Chart rendering flow.**
1. User submits a question in `/chat`.
2. Frontend `POST`s to `/api/ask`.
3. Server calls the LLM; gets either a tool selection + args, or a refusal.
4. If tool selected, server runs the tool's parameterized SQL with `vendor_id` injected from session.
5. Server shapes the result into a typed chart payload (see §6).
6. Frontend receives `{ text, chart, status }` and renders:
   - Assistant message bubble with `text`.
   - Below it, the appropriate Recharts component selected by `chart.type`.

**Session / vendor context flow.**
1. Landing `POST`s `/api/session` with `{ vendorKey: "supplier_1" | "supplier_2" }`.
2. Server looks up the matching `VENDORS.id` by a stable seed-vendor key; writes `{ vendorId }` into the `iron-session` cookie.
3. Frontend navigates to `/chat`.
4. `/chat` calls `GET /api/session` on mount to read the display name and hydrate the header.
5. **Switch vendor** calls `DELETE /api/session` → clears cookie → `router.push("/")`.

## 4. Key Technical Decisions

**Vendor context.** The vendor's UUID lives only in the encrypted session cookie, never in request bodies, query strings, or LLM prompts. Every query template is wrapped in a helper whose signature requires `vendorId: string` as a non-optional argument: passing nothing is a TypeScript error, and the helper throws at runtime if the value is empty. The helper is a thin wrapper, not a framework.

**Sessions.** `iron-session` with a 32-byte `SESSION_SECRET`, cookie name `nxt_session`, `HttpOnly`, `SameSite=Lax`, `Secure` (prod only). No database session table. Refresh preserves the cookie; Switch vendor clears it.

**NL → supported operations.** A single Anthropic tool-use call with a static catalog of 7 tools (see §5), each with a JSON Schema defining bounded arguments. The model's only job is to pick at most one tool and fill its arguments — it does not author the response text. The system prompt explicitly states: (a) the tool catalog is the only way to answer with data; (b) if no tool fits, the model must call a sentinel `refuse` tool; (c) the model must not produce SQL, schema names, or prose. Free-form SQL generation is not part of the design.

**Textual answer generation.** The short textual answer that accompanies every response is composed **server-side** from a fixed per-tool template and the tool's own payload. Templates are short f-string-style patterns (e.g., `"Your top {n} products by {metric} {range}:"`) that the server fills with values taken verbatim from the tool result. The LLM never writes the response text, so there is no channel through which fabricated numbers could enter the response.

**Unsupported questions.** If the LLM returns no tool call (or calls a sentinel `refuse` tool / returns plain text), the server returns `status: "out_of_scope"` with the canned §7.7 message. The "why cancellation" case is detected the same way — the system prompt instructs the model to refuse when asked for causal reasons.

**No-data cases.** Each tool returns `{ rows: [], ... }` when a query has zero results. The server maps `rows.length === 0` to `status: "empty"` and a pre-composed "No data for that range." message.

**Deterministic chart mapping.** A pure server-side function `chartForResult(toolId, rows, args)` returns a tagged union (`line | bar_horizontal | bar_vertical | pie | grouped_bar | kpi | empty`). Mapping table is hard-coded per §7.6; the LLM has no input into chart type.

**Styling despite an incomplete guide.** Only the tokens enumerated in `functional-spec.md` §7.8 are used. Multi-series charts use Deep Teal and tints of teal derived algorithmically (e.g., HSL lightness steps) — single source of truth in `tailwind.config.ts`'s theme. No other colours may be imported.

**Seed / demo data.** A `db:seed` script writes deterministic fixtures (fixed UUIDs, fixed products, orders distributed via a seeded PRNG over the last 90 days) so chart outputs are stable across deploys. Seed names: `Supplier 1`, `Supplier 2`. Seed data targets `prototype-decisions.md` §9 (≈50 products + ≈500 orders per vendor, ~10% cancellation rate).

## 5. Data Model and Data Access

**Tables.** Exactly the six from `database-notes.md`:

- `vendors(id uuid PK, company_name, contact_email, status, created_at)`
- `customers(id uuid PK, email, region, signup_date)`
- `products(id uuid PK, vendor_id uuid FK, sku, name, category, unit_price numeric, created_at)`
- `orders(id uuid PK, customer_id uuid FK, order_date, status, total_amount numeric, shipped_at, delivered_at)`
- `order_items(id uuid PK, order_id uuid FK, product_id uuid FK, quantity int, unit_price numeric)`
- `order_cancellations(id uuid PK, order_id uuid FK UNIQUE, reason_category, detailed_reason, cancelled_at)`

No additional tables. No additional columns. Enum columns (`status`, `reason_category`) are stored as `varchar` and seeded with placeholder values per `prototype-decisions.md` §9.

**Simplifying assumptions (prototype-level).**
- Every seeded order is single-vendor: all its `order_items` belong to products with the same `vendor_id`. This makes "orders for a vendor" unambiguous.
- All money is USD; no `currency` column.
- All timestamps are UTC; no timezone column.
- `PRODUCTS.unit_price` exists but is not used for revenue. `ORDER_ITEMS.unit_price` is authoritative.
- Canceled = has a row in `order_cancellations`; `orders.status` is ignored for the cancellation-vs-not distinction.

**Vendor scoping enforcement.**
- Every query template includes `products.vendor_id = $vendorId` in a mandatory `JOIN` or `WHERE`.
- `vendor_id` is typed `Uuid` and passed as a bound parameter; never string-interpolated.
- A DB-access helper refuses to run a query template if `vendor_id` is `null`/`undefined`.
- LLM has no channel to influence `vendor_id`.

**Tool → metric → query map.**

| Tool | Inputs (bounded) | Reads from | Returns |
|---|---|---|---|
| `top_products` | `metric: "revenue"\|"units"`, `limit ≤ 20`, `date_from?`, `date_to?` | `order_items ⋈ products ⋈ orders [⋈ !order_cancellations]` | ranked `[{product_name, value}]` |
| `bottom_products` | same as above | same | ranked ascending |
| `sales_over_time` | `metric: "revenue"\|"units"`, `date_from`, `date_to`, `bucket: "day"\|"week"\|"month"` | same | `[{bucket_start, value}]` |
| `period_comparison` | `metric`, `period_a {from,to}`, `period_b {from,to}` | same | `[{label, value}]` for a, b, + delta |
| `category_breakdown` | `metric`, `date_from?`, `date_to?` | same, grouped by `products.category` | `[{category, value}]` |
| `cancellation_summary` | `date_from?`, `date_to?`, `group_by?: "reason_category"` | `orders ⋈ order_cancellations [⋈ products via order_items]` | counts, rate, optional breakdown |
| `simple_total` | `metric: "revenue"\|"orders"\|"units"`, `date_from`, `date_to` | same | `{value}` |

Each tool has exactly one parameterized SQL template. No dynamic SQL beyond slotting in the bound parameters.

**Schema uncertainties + mitigations.** (All tracked in `open-questions.md`.)
- Unknown enum values for `orders.status`, `order_cancellations.reason_category` → we seed a fixed placeholder set; tools never filter on these enums in a way that would break if real values differ, except `cancellation_summary` which groups whatever values are present.
- Dave's "one giant master database table" remark is not reconciled → prototype uses the diagrammed schema; if production differs, the repo's query templates are the only place changes are needed.
- No `users`/`accounts` table → vendor selector is the only session driver.

## 6. API / Backend Contract

Four endpoints, all JSON.

### `POST /api/session`
Enter vendor context.
```ts
// Request
{ vendorKey: "supplier_1" | "supplier_2" }

// Response (200)
{ vendorId: string, displayName: string }
```
Writes encrypted session cookie. 400 if `vendorKey` is unknown.

### `GET /api/session`
Read current session.
```ts
// Response (200) when session exists
{ vendorId: string, displayName: string }

// Response (401) when no session
{ error: "no_session" }
```

### `DELETE /api/session`
Clear session.
```ts
// Response (204) no body
```

### `POST /api/ask`
Ask a question. Requires an active session.
```ts
// Request
{ question: string }  // 1..500 chars; rejected otherwise

// Response (200) — stable envelope
{
  status: "ok" | "out_of_scope" | "empty" | "unavailable_reason",
  text: string,                  // short textual answer or canned refusal
  chart: ChartPayload | null     // null when status != "ok" or tool was KPI-only
}

// Response (401) when no session
{ error: "no_session" }
```

**`ChartPayload` discriminated union (TypeScript sketch):**
```ts
type ChartPayload =
  | { type: "line";          title: string; points: { t: string; v: number }[]; unit: "usd" | "count" | "pct" }
  | { type: "bar_horizontal"; title: string; rows:   { label: string; v: number }[]; unit: "usd" | "count" | "pct" }
  | { type: "bar_vertical";   title: string; rows:   { label: string; v: number }[]; unit: "usd" | "count" | "pct" }
  | { type: "pie";            title: string; slices: { label: string; v: number }[]; unit: "usd" | "count" | "pct" }
  | { type: "grouped_bar";    title: string; pair:   { label: string; v: number }[]; delta: { abs: number; pct: number }; unit: "usd" | "count" | "pct" }
  | { type: "kpi";            title: string; value: number; unit: "usd" | "count" | "pct" }
  | { type: "empty";          title: string; message: string };
```

**Canned texts** (fixed strings, not generated by the LLM):

| `status` | `text` |
|---|---|
| `out_of_scope` | `"I can help with your products, sales, orders, and cancellations. I can't answer that one yet."` |
| `empty` | `"No data for that range."` |
| `unavailable_reason` | `"I don't have customer-provided cancellation reasons in our records."` |

For `status: "ok"`, `text` is composed server-side from a fixed per-tool template filled with values from the tool result — the LLM does not write it. Numbers are rendered with the unit rule: `usd` → `$1,234.56`; `count` → integer with thousands separators; `pct` → `12.3%` (one decimal).

## 7. Frontend Structure

**Pages / views.**
- `/` — `<LandingPage>`: logo/title, two large buttons (Primary Teal), prototype banner.
- `/chat` — `<ChatPage>`: header (vendor name + Switch vendor button), scrollable `<MessageList>`, `<ChatInput>` footer.

**Main components.**
- `<VendorSelector>` — two buttons; calls `POST /api/session` then `router.push("/chat")`.
- `<ChatHeader>` — shows `displayName`, Switch vendor (Secondary button).
- `<MessageList>` — array of `{ role: "user" | "assistant", content }`; auto-scrolls to bottom on new message.
- `<AssistantMessage>` — renders `text` above a `<ChartRenderer chart={chart}/>`.
- `<ChartRenderer>` — switch on `chart.type` → Recharts component preset with brand palette.
- `<ChatInput>` — textarea (single line expanding), Enter to send, Shift+Enter for newline, send button.
- `<PrototypeBanner>` — fixed footer "Prototype · Seed data · Do not share externally".

**State.**
- Session: derived from `GET /api/session` on mount of `/chat`; redirect to `/` if 401.
- Chat messages: local React state inside `<ChatPage>`; cleared on route mount (turn-independent, not persisted).
- In-flight ask: boolean for loading indicator.

**Loading / error / empty states.**
- Loading: lime-coloured typing indicator in assistant bubble while `/api/ask` is pending.
- Error (network / 500): inline assistant message "Something went wrong. Please try again."
- Empty chat: header + placeholder hint only; no example-question suggestions (explicitly out of scope per functional spec §5).
- Empty result: rendered via the `chart.type === "empty"` path inside `<ChartRenderer>`.

**Style-guide constraints.**
- Tailwind theme defines the only permitted colour tokens; no ad-hoc CSS colours.
- Inter loaded via `next/font`; headers get `font-weight: 700; letter-spacing: -0.05em;`.
- Radius `4px`, hairline `#E5E7EB`, shadow `0 8px 24px rgba(0,0,0,0.08)` exposed as CSS variables on the root and referenced by components.
- Button variants: `Primary` (teal), `Secondary` (white + hairline), `Ghost`, `AIGenerate` (lime) — one `<Button variant>` component.
- Chart components read series colours from the theme: primary series = Deep Teal; additional series = algorithmic teal tints; axes/grid = Cool Gray; Neon Lime reserved for AI indicators only, never on data marks.

## 8. LLM Integration Design

**Where it is used.** Only in `/api/ask`, and only to pick at most one tool from the fixed catalog and fill its arguments.

**Where it is not used.** It is not used for: authentication, authorization, query writing, chart selection, response text, number calculation, data storage, or cross-request memory. In particular, the model does not author the response text that the user sees — the server composes that from a per-tool template and the tool's payload (see §4 "Textual answer generation").

**Prompt / tool bounding.**
- **System prompt** (fixed string, version-controlled). Includes: role description, rules (no SQL, no prose, no numbers — just pick a tool; out-of-scope and "why cancellation" questions must call the sentinel `refuse` tool), list of the 7 tools + the `refuse` tool with JSON-schema.
- **Tool schemas** constrain arguments: enums for `metric`, integer caps for `limit` (≤ 20), ISO-date strings for ranges, fixed `bucket` values.
- **Request shape.** `tools: [...]`, `tool_choice: "auto"`, `max_tokens: 256`, `temperature: 0`. Single LLM call per user question.

**Hallucination reduction.**
- The LLM never writes user-visible text, so it cannot introduce fabricated numbers or reasons at all.
- The sentinel `refuse` tool is the only way for the model to "answer" an out-of-scope question — any non-tool output is treated as a refusal by the server.
- `temperature: 0`.

**Deterministic wrapping.**
- Chart type is picked by the server, not the model.
- Vendor scope is injected by the server, not the model.
- Textual answer is composed by the server, not the model.
- Date parsing ("last 30 days", "Tuesday") happens model-side as tool arguments, but is immediately validated and normalized server-side before being bound into SQL. Invalid dates → `status: "out_of_scope"`.
- If the model calls a tool not in the catalog, or fills arguments that fail validation, or emits text instead of a tool call, the server returns `status: "out_of_scope"` without retrying.
- **[TECH-ASSUMPTION]** The server applies a 20 s timeout to the Anthropic call; on timeout it returns `status: "out_of_scope"` with the canned message.

## 9. Security and Safety for Prototype

**Session handling.**
- `iron-session` cookie: encrypted + signed with `SESSION_SECRET` (32 bytes, env var).
- `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- TTL: 12 hours (enough for the demo day).
- No session table; no refresh tokens.

**Server-side vendor scoping.**
- `vendor_id` sourced from the session cookie on every `/api/ask` call.
- DB helper refuses queries without a bound `vendor_id`.
- LLM prompts and tool schemas do not mention `vendor_id` or any vendor identifier.

**Input validation.**
- `question` length 1..500 chars; trimmed.
- `vendorKey` checked against a static set.
- Tool arguments validated via JSON Schema (Zod or similar) before SQL binding.
- Dates parsed with a strict parser; invalid dates → `out_of_scope`.

**Output constraints.**
- Response envelope is a fixed TypeScript type; server never forwards raw LLM text without this envelope.
- Canned strings for the three failure modes (§6).
- Numbers in `text` are verified against the tool result.

**Secret handling.**
- Env vars only: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `SESSION_SECRET`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`.
- No secrets in the repo. `.env.example` committed; `.env.local` / Vercel env vars hold real values.
- `ANTHROPIC_API_KEY` used only server-side; never shipped to the client bundle.

**Intentionally not production-grade.**
- No real authentication (vendor selector is a demo affordance).
- No rate limiting, abuse controls, or cost caps on the LLM endpoint.
- No audit log.
- No database-layer isolation (RLS) — open question Q7.
- No CSRF token on the JSON endpoints — mitigated only by `SameSite=Lax` and same-origin.
- No WAF / bot protection.
- Basic-auth gate is the only deterrent to public traffic.

## 10. Deployment Approach

**Target.** Vercel (Next.js native) + Neon Postgres (managed) + Anthropic API.

**Environment assumptions.**
- Node 20 LTS in the Vercel build image.
- Single Vercel project; single production deployment URL.
- Single Neon project with one branch for the prototype.

**Required env vars (Vercel project settings).**
- `DATABASE_URL` — Neon connection string with SSL.
- `ANTHROPIC_API_KEY` — server-only.
- `SESSION_SECRET` — 32-byte random string.
- `BASIC_AUTH_USER`, `BASIC_AUTH_PASS` — shared with Kevin; applied via middleware.

**Seed / demo data setup.**
- `pnpm db:migrate` — applies Drizzle migrations (creates the 6 tables).
- `pnpm db:seed` — writes 2 vendors, ~50 products each, ~500 orders each over the last 90 days, ~10% cancellations, fixed RNG seed. **Destructive reseed:** truncates all six tables with `CASCADE` and repopulates, so stable fixtures always survive across deploys.
- Both scripts run locally against `DATABASE_URL`, and once against the production Neon branch after the first deploy. No `postinstall` hook — seeding is a manual step, executed once per environment.

**Build / run / deploy flow.**
1. Local dev: `pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev`.
2. Commit → push → Vercel preview deploy.
3. Promote preview to production.
4. Run `pnpm db:seed` once against the production Neon branch.

**Post-deploy smoke checks.**
- Open the URL → basic auth prompt → landing renders with two buttons and banner.
- Click "Log in as Supplier 1" → chat loads with "Supplier 1" in header.
- Ask "Show my top 5 products by revenue last 30 days" → returns text + horizontal bar chart.
- Ask "Why are my cancellation rates so high?" → returns the canned no-reason message.
- Click Switch vendor → returns to landing.
- Click "Log in as Supplier 2" → repeat the same question → returns different data with no overlap of product names.

## 11. Testing and Verification

**Minimum check matrix.**

| Category | What | How |
|---|---|---|
| Manual smoke | Landing, session, chat input, switch vendor | Browser, happy path |
| Backend | Each of the 7 tools | Integration test calling the tool function directly with a fixed `vendor_id` on the seeded DB |
| Backend | Vendor scoping | Run each tool as Supplier 1 and Supplier 2; assert result sets are disjoint on `product_id` / names |
| Backend | Input validation | `POST /api/ask` with oversized / empty / non-string `question` → structured 400 |
| Backend | Session enforcement | `POST /api/ask` with no cookie → 401 |
| Frontend | Chart mapping | Manual visual pass: render each `chart.type` from a sample `ChartPayload` and eyeball the result against the style guide |
| Frontend | Keyboard | Enter sends, Shift+Enter inserts newline |
| Seeded-question | Each of the 7 supported categories returns `status: "ok"` with a chart | Manual: a prepared list of 7 questions |
| Non-hallucination | "Why" cancellation question | Assert `status: "unavailable_reason"`, canned text, `chart: null` |
| Non-hallucination | Out-of-scope question (e.g., weather) | Assert `status: "out_of_scope"`, canned text |
| Non-hallucination | Numbers in `text` match payload (template-driven, so this is structural, not a runtime heuristic) | Code review of the per-tool template functions |
| Isolation probe | Adversarial prompts from AC-12 (cross-vendor queries, "ignore instructions") | Manual; assert no cross-vendor rows |

No CI required for the prototype; `pnpm test` executed locally before each deploy is sufficient.

## 12. Known Limitations

- Encrypted cookie is the only session; no server-side session record means no forced-logout capability.
- Fixed 7-tool catalog; any new question category is a code change (new tool + new SQL template + new text template + chart-mapping entry).
- Multi-series chart colours are algorithmic teal tints — may diverge visibly from whatever a full brand guide would specify.
- No tool-level retries; on Anthropic error or 20 s timeout the server returns `out_of_scope`.
- LLM latency is not guaranteed; no SLA for "instant" response (Q9).
- Basic auth is the only deterrent against public access; sharing the URL publicly without it is unsafe.
- Seed data lives only in Postgres; `pnpm db:seed` is destructive and is the way to restore a clean demo state.
- Response text is templated; phrasing is stable but not personalized. Acceptable for the prototype; may feel robotic compared with a free-text LLM answer.

## 13. Open Technical Questions

None that block implementation. Items that would be resolved before productionization — already tracked in `open-questions.md`:

- **TQ1.** Should the DB layer also enforce isolation (RLS) alongside the application-layer filter? (Q7)
- **TQ2.** Is the basic-auth gate the right pre-demo access control, or is an IP allowlist preferred? (Q10)
- **TQ3.** What LLM model tier should be used in the final demo — Sonnet 4.6 (default) vs. Haiku 4.5 for lower latency? Decide after the first end-to-end test run.
- **TQ4.** Should `POST /api/ask` be rate-limited for the demo (e.g., 1 req/s per session) to protect the Anthropic budget? Current design has no limiter.
- **TQ5.** Do we need a structured audit log of each `(question, tool, args, vendor_id)` tuple for post-demo review? Currently out of scope.
