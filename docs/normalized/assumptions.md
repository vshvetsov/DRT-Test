# Working Assumptions

These are plausible interpretations of the source materials. They are not confirmed. Any of them could be overridden by the stakeholders before the functional spec is written. Each is tagged with the source(s) that motivated it.

1. The demo Friday is 2026-04-24 (the Friday immediately after the email dated Wed 2026-04-22). (customer-request)
2. "Vendor" and "supplier" refer to the same concept in this product. The call uses both interchangeably. (call-transcript)
3. The prototype's intended end user is a NexTrade vendor (logging in and asking questions about their own data). The immediate demo audience is the VP of Vendor Relations at the biggest client. This assumes the vendor-as-end-user framing from the call transcript; the email's "Their vendors" framing would put an additional intermediary layer between the client and the vendors that this assumption does not account for (see `open-questions.md` 4a). (customer-request, call-transcript)
4. The prototype is a web application accessible over a public URL. (call-transcript: "spin up a quick web app", "live link", "slack you the URL")
5. The prototype will use seeded dummy data that mirrors the six tables in `database-schema.png` rather than connecting to production. (call-transcript)
6. At least two seeded vendors ("Supplier 1", "Supplier 2") exist in the demo, and the UI includes a control to switch the logged-in vendor for demonstration purposes. (call-transcript)
7. Data isolation is implemented as a server-side filter that scopes every query to the active vendor's `vendor_id`, so the AI cannot return rows belonging to other vendors regardless of the prompt. (call-transcript)
8. The backend uses some form of question-to-query translation (likely LLM-driven text-to-SQL or a metric-catalog approach). The exact approach is not decided. (call-transcript)
9. Chart-type selection ("line for trends, pie for breakdowns, bar for top-N") is chosen by the system, not the user. (call-transcript)
10. Chat-style UX is single-turn for the prototype (one question → one answer + chart), unless stated otherwise. (call-transcript)
11. The style guide PNGs reflect the intended design language for the prototype even though they reference broader NexTrade product chrome (shipments, SLA). (style-guide, call-transcript)
12. Prototype pages should use: white card surfaces for charts, Deep Teal `#008080` for headers / primary buttons, Neon Lime `#39FF14` reserved for AI output indicators. (style-guide, call-transcript)
13. Inter is the intended primary typeface with a system-ui fallback stack. (style-guide)
14. "Last month", "this week", "Tuesday vs Wednesday" style time references in prompts are interpreted relative to the current date in the vendor's locale. No timezone was specified; UTC is a likely default. (customer-request, call-transcript)
15. Revenue questions are answered by summing `ORDER_ITEMS.unit_price * ORDER_ITEMS.quantity`, scoped to the vendor's products, unless specified otherwise. (database-notes)
16. Cancellation questions are answered from `ORDER_CANCELLATIONS`, with the AI refusing (not hallucinating) when asked "why" since the diagram shows only `reason_category` and `detailed_reason`, and operations stated customers don't record a reason. (call-transcript, database-notes)
17. The prototype is acceptable as an intentional proof-of-concept: not every feature must ship, only enough to demo credibly. (customer-request)
18. The unrelated offsite-catering and budget/T&E thread at the start of the call is not part of the product scope. (call-transcript)
19. The `unit_price` duplication between `PRODUCTS` and `ORDER_ITEMS` is interpreted as catalog price vs. price captured at time of order, with `ORDER_ITEMS.unit_price` authoritative for revenue calculations. The diagram does not label this. (database-notes)
20. Dave's "one giant master database table" remark is interpreted as colloquial phrasing for "a shared multi-tenant database without per-vendor isolation", not a literal claim that all sales live in a single table. The schema image is taken as the authoritative structural source. (call-transcript, database-notes)
