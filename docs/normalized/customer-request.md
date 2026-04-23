# Customer Request — Normalized

Source: `docs/raw/customer-request.docx`
Original format: forwarded internal email from Kevin (Head of Sales) to the Engineering Team.
Original date stated in email: Wednesday, April 22, 2026.
Original subject line: "Fwd: URGENT: Friday Vendor Call - Prototype Needed" — the "URGENT" and "Prototype Needed" framing is part of how the request arrived.

## Summary (facts from the email)

Kevin forwards an urgent request triggered by a "heated call" with the company's biggest external client. The email's literal phrasing is "Their vendors are threatening to leave our marketplace because our reporting tools are too rigid." Vendors are described as "completely done downloading massive spreadsheets just to figure out their daily performance."

Kevin has promised the client a working prototype of an "AI Reporting Assistant" for a sync "this Friday". The client needs a live link they can click around in during that meeting, explicitly "to prove we are taking this seriously."

## Explicit goals

- Deliver a working prototype of an "AI Reporting Assistant".
- Have the prototype ready for a vendor sync on Friday.
- Provide a live, clickable link that the client can use during the meeting.
- Prove that "the concept works and looks professional".
- Signal seriousness / commitment to the client ("to prove we are taking this seriously").

## Requested outcomes / desired behavior

- User logs in.
- User types a natural-language question, examples given:
  - "What were my top five items last month?"
  - "How do my sales from Tuesday compare to Wednesday?"
- The system "instantly" returns a "nice-looking, accurate chart" rendered directly in the chat.

## Constraints (stated in the email)

- Deadline: Friday (of the same week as the email dated Wed 2026-04-22).
- Must be demoable via a live URL.
- Must "look professional" — not a throwaway-looking demo.

## Non-goals / exclusions (stated)

- "It doesn't need to have every feature under the sun."
- Scope is explicitly a prototype / proof of concept, not a full product.

## Mentioned features

- Login / authenticated access (implied by "log in").
- Natural-language question input ("chat" style interaction).
- Automatic chart generation in the chat response.
- Accuracy of answers is called out as important.

## Referenced artefacts / systems

- A "Friday" sync / meeting with the external client.
- Existing reporting tools / spreadsheets used by vendors today (implied, not described).

## Open items carried from this document

- "Biggest external client" is not named in the email.
- Exact Friday date is not stated (email dated Wed 2026-04-22, so Friday is presumably 2026-04-24, but this is an assumption — see `assumptions.md`).
- No list of required chart types or metrics is given in the email itself.
- The email's phrasing "Their vendors are threatening to leave our marketplace" suggests the client has vendors. The call transcript's phrasing suggests vendors are direct NexTrade users and the client might itself be a vendor. The two framings are not reconciled in the source material — see `open-questions.md`.
