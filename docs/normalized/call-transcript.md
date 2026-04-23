# Call Transcript — Normalized

Source: `docs/raw/call-transcript.docx`
Meeting title (from transcript header): "NexTrade Vendor Portal Phase 2 Sync". The title references a "Phase 2" without defining what Phase 1 was or what Phase 2's broader scope is — see `open-questions.md`.
Transcript is marked "Auto-Generated".
Stated duration: 22:41.
Speakers (roles as labeled in transcript): Alex (Product), Kevin (Sales), Sarah (Design), Dave (Operations).

## Summary of discussion (facts)

The team meets to plan a Friday demo in response to vendor complaints about rigid reporting. Kevin restates the customer problem. The group agrees to build a prototype chat interface that answers vendor questions in natural language and renders charts inline. Dave raises data-isolation / confidentiality concerns. Sarah insists the prototype adhere to the NexTrade brand guide. Alex commits to assigning the build to a "full-lifecycle AI engineer" and to delivering a live URL by Thursday afternoon.

## Decisions mentioned

- Build a prototype web app with a chat-style interface that accepts natural-language questions and returns charts.
- Use dummy/seed data for the demo rather than production data.
- Include at least two suppliers in the dummy data ("Supplier 1", "Supplier 2") and provide a dropdown to switch between them, specifically to prove data isolation during the demo.
- Strict adherence to the NexTrade brand guide for colors and fonts. No generic Bootstrap look. Chat window should occupy most of the screen (not a tiny sidebar).
- Data-isolation must be enforced in code, not by trusting the AI. Dave's exact phrasing: "It has to be airtight. I don't trust the AI to just 'promise' not to look at other people's stuff. The code itself has to block it." Alex restates this as "lock them into only looking at their own profile's data before it tries to answer the question."
- The AI must not hallucinate. If data is not available (example given: cancellation reasons), it must say so rather than invent. Kevin: "no hallucinating numbers or reasons."
- Delivery target: live URL slacked to Kevin by Thursday afternoon; demo is Friday.
- Engineer will "spin up the prototype, seed the database, and deploy it within a day."

## Desired user flows (as described)

- Vendor (supplier) logs in.
- Vendor types a plain-English question, examples given:
  - "How many red widgets did I sell on Tuesday compared to Wednesday?"
  - "What are my top three worst-performing items this month?"
  - "Why are my cancellation rates so high this week?" (example of a question the system must refuse to answer with a fabricated reason)
- System responds in the same chat window with:
  - A textual answer, and
  - A chart chosen to fit the question:
    - Line graph for trends (example: "sales trends over the last thirty days").
    - Pie chart for a "category breakdown".
    - Bar chart for a "top 10 list".

## Pain points (as stated)

- Vendors currently have to go to the portal, click "export", download a CSV, and build their own pivot tables to understand performance.
- Weekly data exports feel dated ("It's 2026. They're asking why we don't have AI doing this for them").
- Vendors are described as "visual people" — text-only answers are insufficient.
- The biggest account is "threatening to walk".
- Dave characterizes the current data layout as: "all the vendors' sales records are just sitting in one giant master database table on our end." This is his colloquial phrasing — it does not fully match the multi-table schema image (see `database-notes.md` and `open-questions.md`).

## Constraints (as stated)

- Brand: Deep Teal backgrounds for headers, clean white cards for charts, specific sans-serif fonts from the brand guide (see `style-guide.md`). Sarah's own wording: she is dropping "a piece of our new NexTrade brand guide" into the project folder — both "new" (recently produced) and "a piece" (possibly not the full guide) are her words.
- Layout: chat window must take up most of the screen.
- Security / contractual: vendors must never see other vendors' data. Example given: "If Nike logs in and sees Adidas's sales data" = breach of contract.
- Data truthfulness: no hallucinated numbers or reasons.
- Schedule: prototype URL by Thursday afternoon; demo Friday.

## Unresolved / open items from the transcript

- The "biggest account" / client is not named in the call. The transcript also leaves unclear whether the account *is* a vendor on NexTrade (consistent with "If Nike logs in and sees Adidas's sales data") or an entity whose own vendors are on NexTrade (consistent with the email's "Their vendors").
- The exact auth mechanism (SSO? internal? mocked?) is not specified — only that the system must know "exactly who is logged in".
- How to represent the "switch between Supplier 1 and Supplier 2" affordance is described as "a little dropdown" only.
- No list is given of which chart types must be supported beyond line / pie / bar.
- No list is given of which metrics / questions must be answerable at demo time.
- No mapping from question intent to chart type is provided beyond the three examples.
- Kevin explicitly says "I don't know what SQL is" after Alex's phrase "text-to-SQL". Whether the backend must actually use SQL generation is not decided in the transcript.
- Offsite catering and an unrelated budget/T&E thread are discussed at the start — not relevant to the product scope.

## Customer / team terminology used

- "AI Reporting Assistant" (from customer email; implied in call).
- "Vendor Portal" (meeting title).
- "NexTrade" (company / product brand name).
- "Full-lifecycle AI engineer" (role that will build the prototype).
- "Vendors" and "Suppliers" are used interchangeably in the transcript.
- "Data isolation" (Dave's phrasing: each vendor sees only their own data).
- "Text-to-SQL" (Alex's phrasing for the backend pattern; not confirmed as the chosen approach).
- "Supplier 1", "Supplier 2" — placeholder names for dummy-data tenants used to prove isolation.
