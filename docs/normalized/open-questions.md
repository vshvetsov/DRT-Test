# Open Questions

Numbered list of gaps, contradictions, and decisions needed before a reliable functional spec can be written. Each item notes the source(s) that raised it.

## Scope & stakeholders
1. Who is the "biggest external client"? The customer email and the call transcript both reference a single major account but never name it. (customer-request, call-transcript)
2. What is the exact Friday demo date? Email is dated Wed 2026-04-22, but "Friday" is not spelled out. (customer-request)
3. Who is the end user of the prototype during the demo — the client's VP of Vendor Relations, vendors directly, or both? (call-transcript)
4. Is this prototype intended to graduate into a production feature of the NexTrade Vendor Portal, or is it single-use for Friday only? The transcript calls it both a "proof of concept" and "exactly what we need to save this account". (call-transcript)
4a. Is the "biggest client" itself a vendor on NexTrade (consistent with the Nike/Adidas analogy and vendor-as-user framing), or is it an entity whose own vendors use NexTrade (consistent with the email's "Their vendors are threatening to leave our marketplace")? The two source documents frame this differently. (customer-request, call-transcript)
4b. What does "Phase 2" in the meeting title "NexTrade Vendor Portal Phase 2 Sync" refer to? Are there Phase 1 decisions, scope boundaries, or existing code that constrain Phase 2? (call-transcript)
4c. Are the three style-guide PNGs the complete brand guide, or only the "piece" Sarah shared? (call-transcript, style-guide)

## Auth & data isolation
5. What authentication mechanism is expected for the prototype? The transcript mandates knowing "exactly who is logged in" but specifies no SSO, password, token, or mock-login scheme. (call-transcript)
6. The demo is supposed to show data isolation via "a little dropdown" to switch between Supplier 1 and Supplier 2. Is this dropdown an acceptable demo affordance, or does the client expect actual per-user login? (call-transcript)
7. Where exactly must data-isolation be enforced — database row filter, API layer, prompt, or multiple layers? The transcript says "the code itself has to block it" but does not locate that code. (call-transcript)
8. The database schema has no visible users/accounts/auth table. How is a "logged-in vendor" represented in the data for the prototype? (database-notes)
8a. Dave describes current storage as "one giant master database table" while the schema image shows several tables. Which is the actual present-day layout, and does the prototype need to match it? (call-transcript, database-notes)
8b. Should isolation be enforced via database-layer controls (e.g., row-level security, per-vendor schemas) or purely in application code? Dave's phrasing "the code itself has to block it" is compatible with either but does not decide. (call-transcript)

## AI behavior
9. Is the backend actually a text-to-SQL pipeline, a metric-catalog lookup, or something else? Alex suggests "text-to-SQL", Kevin acknowledges without understanding the term, and no decision is recorded. (call-transcript)
10. What is the required response latency? Kevin says the chart should appear "instantly"; no numeric target is given. (customer-request, call-transcript)
11. When the AI cannot answer (example: cancellation reasons), what is the exact fallback behavior and UI? The transcript only says it must not hallucinate. (call-transcript)
12. Which languages must be supported? Only English-language examples are given. (customer-request, call-transcript)
13. Is conversation history / follow-up context required, or is each prompt independent? Not specified. (customer-request, call-transcript)

## Visualizations
14. Beyond line / pie / bar, which chart types must be supported for the demo? (call-transcript)
15. What is the exact mapping from question intent to chart type? Only three directional examples are provided. (call-transcript)
16. Are tabular responses (no chart) allowed when a chart does not fit? Not stated. (call-transcript)
17. Which metrics must be answerable for the demo (sales totals, top-N, comparisons by date, cancellations, etc.)? The email and transcript list only illustrative examples. (customer-request, call-transcript)
18. Colors / theming for charts (axes, grid, series palette) are not defined in the visible style guide. (style-guide)

## Data & schema
19. `VENDORS.status` enum — what values are valid? (database-notes)
20. `ORDERS.status` enum — what values are valid? (database-notes)
21. `ORDER_CANCELLATIONS.reason_category` enum — what values are valid? The transcript says customer-provided cancellation reasons are not captured at checkout, which raises the question of who fills `reason_category` and `detailed_reason`. (call-transcript, database-notes)
22. Currency of `unit_price` and `total_amount` is not indicated on the schema. (database-notes)
23. Timezone semantics of `timestamp` columns are not indicated. (database-notes)
24. How should vendor scoping on orders be computed — by joining through `ORDER_ITEMS.product_id → PRODUCTS.vendor_id`? The diagram has no direct vendor column on `ORDERS`. (database-notes)
25. How should orders with items from multiple vendors be handled in a single-vendor view? (database-notes)
26. Are the `unit_price` values on `PRODUCTS` and `ORDER_ITEMS` intended to diverge (catalog vs. historical), and if so which is authoritative for revenue questions? (database-notes)
27. What is the expected volume of dummy/seed data needed to make charts look meaningful? (call-transcript)

## Style guide clarifications
28. RULE 01 on the typography page shows letter-spacing as "(-0.05em to -0.05em)" — is this a typo for a range? (style-guide)
29. The card shadow token is printed as `0 8 24 / 0.08`. Unit (presumed px) and semantics (offset-x, offset-y, blur, alpha) are not labeled. (style-guide)
30. Is "Inter · SYSTEM-UI" meant as Inter with a system-ui fallback stack, or as two named roles? (style-guide)
31. Which monospaced font is intended for labels, IDs, and hex values? The guide says "monospaced stack" but does not name one. (style-guide)
32. Is a dark mode required? The visible guide shows only light surfaces. (style-guide)
32a. Are the three PNGs the full NexTrade brand guide, or only the "piece" Sarah shared? Missing pages could contain chart palettes, iconography, motion, or accessibility guidance. (style-guide, call-transcript)

## Delivery & hosting
33. Where should the live URL be hosted, and is any existing NexTrade domain / subdomain expected? (call-transcript)
34. Are there security / compliance requirements for the prototype URL (e.g., IP allowlist, basic auth gate, HTTPS only)? (call-transcript)
35. Who on the team owns sharing the link with the client and walking the demo? Kevin is presenting; Alex is delivering the URL. No contingency owner is named. (call-transcript)
