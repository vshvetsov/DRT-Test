# Prototype Decisions

Purpose: unblock functional-spec writing by turning each load-bearing open question into an explicit, reversible default. These are prototype-scope decisions, optimized for a clickable Friday demo, not production choices. Every item here is a **working default**, not a confirmed fact — any stakeholder can override it during spec review.

Sources referenced: `customer-request.md`, `call-transcript.md`, `style-guide.md`, `database-notes.md`, `open-questions.md`, `assumptions.md`, `glossary.md`.

---

## 1. Tenancy model

**Prototype decision**
Each vendor is a direct NexTrade tenant. The prototype treats the `VENDORS` table as the tenant boundary and ignores the possibility of a higher-level "aggregator" client.

**Why this is the best default**
The call transcript's Nike/Adidas analogy and the database schema both support the vendor-as-tenant reading. The email's "Their vendors" phrasing is more ambiguous but does not contradict vendor-as-tenant. This is also the minimum-code interpretation.

**Risks / limitations**
If the "biggest client" turns out to be an aggregator that manages many vendors, the prototype will need an extra tier (client → vendors) and related access model. Reviewing vendor data across an aggregator's portfolio would not be supported.

**Upgrade path**
Introduce an `ACCOUNTS` (or `CLIENTS`) table that owns many `VENDORS`, plus an account-scope role. All current vendor-scoped queries continue to work; new account-scoped queries aggregate over owned vendors.

---

## 2. Auth model

**Prototype decision**
A landing page with a simple "Log in as Supplier 1 / Log in as Supplier 2" selector. Clicking a button creates a server-side session cookie that carries the selected `vendor_id`. No passwords, no SSO, no signup. A small "Switch vendor" control in the header lets the demo-operator change vendors to prove isolation.

**Why this is the best default**
Satisfies the transcript's "know exactly who is logged in" requirement and Sarah's "little dropdown" framing for proving isolation. Avoids the time cost of wiring real auth for a Thursday deadline.

**Risks / limitations**
Anyone with the URL can act as either vendor. Not safe for real data. Not defensible as "real auth" to a security reviewer.

**Upgrade path**
Swap the selector for SSO or email-magic-link auth. The session contract (server-side cookie carrying `vendor_id`) remains unchanged, so downstream code is unaffected.

---

## 3. Data-isolation model

**Prototype decision**
Isolation is enforced **server-side, at every data-access call site**, by:
1. Reading `vendor_id` from the session — never from the LLM, never from the client body.
2. Passing `vendor_id` as a bound parameter into every query template.
3. Never concatenating `vendor_id` into SQL strings.

The LLM never sees or produces `vendor_id`. The LLM never writes SQL directly (see §4). Queries are parameterized templates that require `vendor_id` as a non-null argument.

**Why this is the best default**
Matches Dave's "the code itself has to block it" and "airtight" constraints. Keeps isolation out of prompt-level trust, which is the class of risk Dave called out. Avoids the complexity of database-level RLS for a prototype.

**Risks / limitations**
A bug in any query template could still leak data — the protection is code-review-grade, not infrastructure-grade. There is no defense-in-depth if an engineer forgets to pass `vendor_id`.

**Upgrade path**
Add Postgres Row-Level Security policies keyed on a `current_vendor_id` session variable. Keep the application-layer filter as a belt-and-suspenders second line.

---

## 4. Backend approach for NL → answers/charts

**Prototype decision**
**Tool-calling against a small metric catalog**, not free-form text-to-SQL. The LLM is wired with ~6–10 named tools (e.g., `top_products_by_revenue`, `sales_over_time`, `category_breakdown`, `compare_periods`, `cancellation_summary`). Each tool accepts a bounded argument set (date range, limit, grouping, optional category) and internally runs a fixed parameterized SQL template with `vendor_id` injected from the session. The LLM's job is only to pick the tool and fill its arguments.

**Why this is the best default**
- Makes isolation structurally enforceable (§3).
- Removes the entire class of "LLM writes wrong SQL" failures.
- Easier to seed, test, and style than free-form SQL.
- Fastest route to a demo-quality result for the examples in the sources.

**Risks / limitations**
- Strictly limited vocabulary: questions outside the catalog get a polite refusal (§7), not an answer.
- A surprise question during the Friday demo may not be covered.
- Less impressive than a "it can answer anything" story.

**Upgrade path**
Add more tools over time. When coverage matures, optionally introduce a safe text-to-SQL pathway behind a feature flag, with AST validation, table allow-lists, and mandatory vendor filter injection.

---

## 5. Supported question scope

**Prototype decision**
The demo catalog covers at minimum:
- **Top / bottom N products** — by revenue, by units sold (covers "top five items last month", "top three worst-performing items").
- **Sales time series** — revenue or units over a specified date range (covers "sales trends over the last thirty days").
- **Day-to-day / period-to-period comparison** — two named periods or two explicit dates (covers "Tuesday vs Wednesday", "this week vs last week").
- **Category breakdown** — revenue or units grouped by `PRODUCTS.category`.
- **Cancellation summary** — counts, cancellation rate, breakdown by `reason_category`. Explicitly does **not** explain *why* customers canceled (see §7).
- **Simple totals** — revenue, orders, units for a period.

Question recognition is guided by the LLM's tool-calling; each of the above maps to one tool.

**Why this is the best default**
Covers every question example in the email and transcript, plus adjacent questions a demo-watcher is likely to try.

**Risks / limitations**
- Questions about shipping times, customer demographics, regional performance, or vendor comparisons are out of scope.
- The word "category" currently corresponds only to `PRODUCTS.category`; sub-categorizations don't exist.

**Upgrade path**
Add tools incrementally; each new tool requires only (a) SQL template with `vendor_id` filter, (b) tool schema, (c) chart-mapping entry (§6).

---

## 6. Chart-mapping strategy

**Prototype decision**
The server (not the LLM) chooses the chart type based on the shape of the tool's result, using this deterministic table:

| Result shape | Chart |
|---|---|
| Time series of one metric | **Line chart** |
| Ranked list (top/bottom N) | **Horizontal bar chart** |
| Grouping over a categorical dimension | **Pie chart** if ≤ 6 slices, else **bar chart** |
| Two labeled values (compare periods) | **Grouped bar chart** with delta in the caption |
| Single scalar (KPI) | **Formatted number** with label, no chart |
| Empty result | **Empty-state card** with explanatory text |

Every chart response also includes a short textual answer above the chart.

**Why this is the best default**
- Matches the three examples explicitly stated in the transcript (line / pie / bar).
- Removes LLM non-determinism from the visual decision.
- Lets the chart library and brand palette be locked in one place.

**Risks / limitations**
- Pie charts at >6 slices fall back to bars, which may surprise a demo-watcher expecting a pie.
- No mixed-chart or dashboard responses.

**Upgrade path**
Let the server propose a chart and let the user override with a chip / dropdown. Add stacked bars, area charts, and heatmaps as new shape types.

---

## 7. Response behavior when data is unavailable

**Prototype decision**
Three explicit failure modes, each with fixed UX:

- **Out-of-scope question** (no tool matches): reply with a short message naming the supported domains, e.g., *"I can help with your products, sales, orders, and cancellations. I can't answer that one yet."* No chart.
- **In-scope but empty result**: reply with an empty-state card, e.g., *"No orders in that range."* No fabricated numbers.
- **"Why"-type question with no recorded reason** (e.g., why cancellation rates are high): reply explicitly that the underlying data is not captured, e.g., *"I don't have customer-provided cancellation reasons in our records."* No speculation.

The LLM system prompt forbids hallucinating numbers or reasons. All numbers in responses come from tool outputs only; the LLM is not allowed to invent arithmetic.

**Why this is the best default**
Directly honors Kevin and Dave's "no hallucinating numbers or reasons" constraint and the specific cancellation-reason example.

**Risks / limitations**
The refusal phrasing may feel robotic. A persistent demo-watcher can still try to provoke a wrong answer with a creatively phrased question.

**Upgrade path**
Add a follow-up suggestion system: "I don't have that, but I can show you X, Y, Z" with clickable chips that trigger in-scope tools.

---

## 8. Style-guide completeness gaps

**Prototype decision**
Use only what the three visible PNGs explicitly define, plus these minimal additions needed to render charts:

- **Chart series palette**: Deep Teal `#008080` as the primary series color; tints/shades of teal for additional series in the same chart; Cool Gray `#6C7570` for axes, grid, and secondary labels; Neon Lime `#39FF14` reserved for AI-generated highlight accents only (never for a data series). No other colors.
- **Fonts**: Inter with `system-ui` fallback for all text. For monospaced labels, IDs, and hex values, use a standard monospaced stack (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`).
- **Component tokens**: radius 4px, hairline 1px, surface shadow interpreted as `0 8px 24px rgba(0,0,0,0.08)`.
- **Letter-spacing rule**: apply `letter-spacing: -0.05em` to all header levels (treating the printed range as a single value because both endpoints are identical).
- **No dark mode.** Light surfaces only.
- **Chat window occupies the dominant area of the screen**, not a sidebar (per Sarah).

**Why this is the best default**
Lets the visual language feel consistent with the brand guide without inventing tokens. The additions are the smallest set needed to render a line / pie / bar chart on a white card.

**Risks / limitations**
If the missing pages of the brand guide define a specific chart palette, iconography, or motion guidance, the prototype may visibly diverge. Multi-series charts will look monochromatic.

**Upgrade path**
Replace the teal-tint chart palette with whatever the full brand guide specifies. Introduce dark mode as a theme toggle if required.

---

## 9. Database / schema uncertainty handling

**Prototype decision**
- The schema PNG is treated as the authoritative structure. Dave's "master table" remark is interpreted as colloquial.
- All six tables are created in Postgres (or equivalent) exactly as shown; column types match the PNG (`uuid`, `varchar`, `decimal`, `integer`, `timestamp`, `text`).
- **Revenue** is computed as `SUM(order_items.quantity * order_items.unit_price)` for non-canceled orders, scoped to `products.vendor_id`. `ORDER_ITEMS.unit_price` is authoritative over `PRODUCTS.unit_price`.
- **Currency**: all money values are treated as USD; the UI renders them as `$1,234.56`.
- **Timezone**: all timestamps are treated as UTC; date filters like "Tuesday" use the UTC day in the vendor's local-time-equivalent (prototype uses UTC directly).
- **Cancellation status**: an order counts as canceled if it has a matching `ORDER_CANCELLATIONS` row. `ORDERS.status` is not trusted as the sole source of truth for cancellation, because its enum values are unknown.
- **Enum values** for `VENDORS.status`, `ORDERS.status`, `ORDER_CANCELLATIONS.reason_category` are filled with a small, reasonable seed set (e.g., `active`, `inactive`; `placed`, `shipped`, `delivered`, `canceled`; `out_of_stock`, `customer_changed_mind`, `shipping_delay`, `other`). These are seed-only and flagged in the spec.
- **Seed data**: 2 vendors, ~50 products per vendor, ~500 orders per vendor distributed over the last 90 days, ~10% cancellation rate. Enough to make charts non-trivial.
- No new tables are invented for the prototype. In particular, there is no `USERS` / `ACCOUNTS` table; the vendor selector serves as a session-only stand-in.

**Why this is the best default**
Keeps the data model close to the diagram so upgrade paths stay open. Fills the smallest number of gaps needed to compute the questions in §5. Treats every unstated enum value as a seed-only placeholder rather than a product claim.

**Risks / limitations**
If the real cancellation-reason enum is very different, cancellation-breakdown charts may look off. If production currency is not USD, the UI's dollar formatting will need to generalize.

**Upgrade path**
Replace seed enums with real enum values once confirmed. Add currency and timezone columns to the schema. Swap the vendor selector for a real auth table.

---

## 10. Production-readiness limitations of the prototype

**Prototype decision**
The following are intentional gaps that must not be hidden. The prototype clearly documents them (inside the repo README and/or a small "This is a prototype" footer):

- **Auth is a demo selector**, not real authentication. Do not expose the URL publicly without a basic-auth gate or IP allowlist.
- **Data is seeded**, not production data; vendor names are fictional.
- **English only.**
- **Single-turn chat**: no conversation history, no follow-up ("ok now break that down by week"); each prompt is independent.
- **Fixed question catalog** (~6–10 tools); out-of-scope questions are refused.
- **No export** of charts or answers to PDF/PNG/CSV.
- **No audit logging** of AI responses for compliance.
- **No rate limiting, no cost controls, no LLM model fallback.**
- **Chart images are client-rendered** and not themselves sharable as static assets.

**Why this is the best default**
Honesty about demo scope prevents the client from treating the prototype as a shippable product. Each gap corresponds to a pre-existing open question in `open-questions.md`.

**Upgrade path**
Each bullet above is a Phase-2 workstream.

---

## Locked defaults for functional spec

The functional spec should treat the following as settled, without reopening debate, unless a stakeholder explicitly overrides them:

- **Tenant = vendor.** One vendor per session. (§1)
- **Login = vendor selector.** Session cookie carries `vendor_id`. (§2)
- **Isolation = server-side parameterized queries**, with `vendor_id` sourced only from the session. (§3)
- **Backend = LLM tool-calling over a metric catalog.** No free-form SQL generation. (§4)
- **Question scope = the six tool categories listed.** (§5)
- **Chart selection = deterministic, server-side, by result shape.** (§6)
- **Unavailable data = explicit refusal, no fabrication.** (§7)
- **Visual language = the six color tokens, Inter, RADIUS 4px, light mode, teal-tint chart palette, chat occupies dominant area.** (§8)
- **Data model = the six tables as-drawn; ORDER_ITEMS.unit_price authoritative; USD; UTC.** (§9)
- **Auth, currency, timezone, i18n, conversation memory, export, audit are out of scope.** (§10)

## What must be clearly marked as prototype-only

These items must be visibly labeled in the demo UI or accompanying materials so that nobody mistakes prototype behavior for a product claim:

1. The vendor selector ("Log in as Supplier 1 / 2").
2. A "Prototype · Seed data · Do not share externally" footer or banner.
3. The refusal message for out-of-scope questions, which names the supported domains.
4. Any enum values displayed in the UI that were invented as seed (e.g., cancellation reason categories) — styled or footnoted as placeholders.
5. The fact that all amounts are USD and all dates are UTC, if shown anywhere that might mislead.

## What can be upgraded in phase 2

Each item below picks up exactly where the prototype left off, with no rewrite required:

- **Real auth** replaces the vendor selector (§2).
- **Database-layer isolation (RLS)** layers on top of application-layer parameter filtering (§3).
- **Expanded tool catalog** adds questions as they surface from vendors (§4–5).
- **Safe text-to-SQL** behind a feature flag, gated by AST validation and table allow-lists (§4).
- **Conversation memory and follow-up questions** (§10).
- **Export of answers and charts** (PDF/PNG/CSV) (§10).
- **Audit logging of AI calls and responses** for compliance (§10).
- **Aggregator/client tier** if the tenancy assumption turns out to be one level off (§1).
- **Real enum values** replace seed placeholders (§9).
- **Dark mode and full brand-guide coverage** once the missing pages are shared (§8).
- **i18n** once a second language is required (§10).
