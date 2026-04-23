# Glossary

Domain terms and names drawn only from the source materials (email, call transcript, style-guide PNGs, database-schema PNG). Definitions are scoped to how each term is used in those sources, not to general industry meaning.

## Company, product, roles

- **NexTrade** — the company / product brand. Style guide describes it as "a premium B2B logistics and vendor management platform".
- **NexTrade Vendor Portal** — the existing customer-facing portal referenced in the call title "NexTrade Vendor Portal Phase 2 Sync".
- **Phase 2 / Phase 2 Sync** — an undefined program phase referenced only by the meeting title. No Phase 1 content is given in the sources. See `open-questions.md`.
- **NexTrade AI** — name shown on the AI chat component in the style guide, used as the assistant's display name.
- **AI Reporting Assistant** — the name Kevin promised the client; the product/feature being prototyped.
- **Full-lifecycle AI engineer** — the role Alex will assign to build the prototype.
- **VP of Vendor Relations** — stakeholder role at the client ("our biggest account") who raised the complaint (per the call transcript). Whether this role represents a client that itself is a vendor, or a client that manages its own vendors, is not resolved in the sources.

## User / business entities

- **Vendor** — a seller on the marketplace. `VENDORS` table in the schema. Used interchangeably with "supplier" in the transcript.
- **Supplier** — same as vendor per the transcript. "Supplier 1" and "Supplier 2" are placeholder tenant names for dummy-data accounts used to demo data isolation.
- **Customer** — a buyer that places orders. `CUSTOMERS` table in the schema.
- **Product** — a SKU owned by a vendor. `PRODUCTS` table; `vendor_id` FK ties each product to one vendor.
- **Order** — a purchase placed by a customer. `ORDERS` table.
- **Order item** — a line item within an order linking to a product. `ORDER_ITEMS` table.
- **Order cancellation** — a record that an order was canceled. `ORDER_CANCELLATIONS` table; `order_id` is unique so an order has at most one cancellation.

## Product concepts

- **Chat window / chat** — the main UI of the prototype. Occupies most of the screen (per call transcript).
- **AI response** — the generated answer that combines text with an inline chart.
- **Chart types called out** —
  - Line graph: "sales trends over the last thirty days".
  - Pie chart: "category breakdown".
  - Bar chart: "top 10 list".
- **Data isolation** — the contractual requirement that a vendor can only see its own data. Transcript: "the code itself has to block it".
- **Hallucinating** — generating fabricated numbers or reasons when data is missing. Explicitly disallowed.
- **Text-to-SQL** — Alex's framing for the backend behavior (natural language → SQL). Not a confirmed implementation choice.
- **Master database table** — Dave's colloquial phrasing for the current sales-record storage ("one giant master database table"). Does not match the multi-table schema image; see `open-questions.md` 8a.
- **Airtight** — Dave's word for the level of data-isolation required. Implies no AI-only enforcement is acceptable.

## Style / design tokens (as labeled in the PNGs)

- **Primary Brand / Deep Teal** — `#008080`. Headers, primary buttons, main navigation.
- **Accent / AI Highlight / Neon Lime** — `#39FF14`. Used sparingly for AI output, loading states, critical highlights.
- **Background · App / Off-White** — `#F8F9FA`.
- **Background · Surface** — `#FFFFFF`. Cards, chat.
- **Text · Primary / Almost Black** — `#1A1A1A`.
- **Text · Muted / Cool Gray** — `#6C7570`.
- **Inter** — font family specified for both headers (700 weight) and body (400 / 500).
- **RADIUS 4PX / SHADOW-SM / HAIRLINE 1PX** — global component tokens stated on the UI Components page.
- **Primary action / Secondary / Ghost / AI Generate** — the four button variants shown in the style guide.

## Example content visible in the style guide (not product requirements, but useful domain vocabulary)

- **Shipment** — example card showed "SHIPMENT · 00412-B · IN TRANSIT", "Hamburg → Algeciras", ETA, CO₂, distance, value, "View manifest". This is style-guide sample content.
- **SLA (Service Level Agreement)** — referenced in sample text: "Which vendors are behind SLA this quarter?"
- **Carrier quotes, vendor SLAs, customs documentation** — domains the style guide says NexTrade aggregates.

## Schema vocabulary

- **uuid** — type shown for every `id` primary key.
- **varchar / decimal / integer / timestamp / text** — other column types shown in the schema.
- **PK / FK / unique** — key markers shown in the schema. `ORDER_CANCELLATIONS.order_id` is both FK and unique.
- **supplies / places / listed_in / contains / may_have** — relationship labels shown on the crow's-foot diagram.
