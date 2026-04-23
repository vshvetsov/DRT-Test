# Style Guide — Normalized

Sources:
- `docs/raw/style-guide-1.png` (cover + Colors, marked "01 / 03")
- `docs/raw/style-guide-2.png` (Typography, marked "02 / 03")
- `docs/raw/style-guide-3.png` (UI Components, marked "03 / 03")

This document captures only what is visibly present in the images. Unclear items are sent to `open-questions.md`.

Note on completeness: in the call transcript Sarah describes what she is sharing as "a piece of our new NexTrade brand guide". The three PNGs may not be the full brand guide — see `open-questions.md`.

## Brand framing (visible text on cover page)

- Header label: "VISUAL IDENTITY GUIDELINES".
- Title: "A sharp, data-centric system for logistics at scale."
- Intro paragraph: "This guide defines the foundational tokens and component primitives for NexTrade — a premium B2B logistics and vendor management platform. Clean edges, high contrast, and measured restraint."
- Section index on the cover: "01 COLORS · 02 TYPOGRAPHY · 03 COMPONENTS".

## Colors (page 01 / 03)

Visible color tokens with the exact labels and hex values shown on the page:

| Token label | Description text on page | Hex |
|---|---|---|
| Primary Brand | "Deep Teal. Headers, primary buttons, main navigation." | `#008080` |
| Accent / AI Highlight | "Neon Lime. Use sparingly for AI output, loading states, critical highlights." | `#39FF14` |
| Background · App | "Off-White" | `#F8F9FA` |
| Background · Surface | "Cards, Chat" | `#FFFFFF` |
| Text · Primary | "Almost Black" | `#1A1A1A` |
| Text · Muted | "Cool Gray" | `#6C7570` |

Page also shows a header annotation "6 TOKENS · HEX · NAMED".

## Typography (page 02 / 03)

Font family called out at top of panels: "Inter · SYSTEM-UI".

Header styles (panel labeled "HEADERS · Inter · 700 · -0.05em"):

| Level | Size / line-height shown | Sample shown |
|---|---|---|
| H1 | 60 / 0.95 | "Freight, unified." |
| H2 | 36 / 1 | "Vendor performance" |
| H3 | 26 / 1.2 | "Quarterly shipment summary" |

Body styles (panel labeled "BODY · Inter · 400 / 500"):

| Style | Size / line-height shown | Sample shown |
|---|---|---|
| BODY | 15 / 1.5 | "NexTrade aggregates carrier quotes, vendor SLAs, and customs documentation into a single workspace. Built for operators who move freight in volume." |
| SMALL | 13 / 1.5 | "Last synced 4 minutes ago from 12 connected vendors. Auto-refresh every 60 seconds." |
| LABEL | 11 / CAPS | "SHIPMENT · 00412-B" (rendered in a monospaced style) |

Explicit typographic rules shown on the page:

- RULE 01: "Headers use tight letter-spacing (-0.05em to -0.05em) for a geometric, engineered feel."
  (Note: both endpoints of the range are shown as -0.05em in the image; see `open-questions.md`.)
- RULE 02: "Body copy stays at 400–500 weight with line-height 1.5–1.6 for sustained data reading."
- RULE 03: "Metadata, IDs, and hex values use a monospaced stack for columnar alignment."

## UI Components (page 03 / 03)

Global component tokens shown in the page header: "RADIUS 4PX · SHADOW-SM · HAIRLINE 1PX".

### Card component (labeled "COMPONENT · CARD")

Example content visibly rendered:
- Top row: "SHIPMENT · 00412-B" on the left, "IN TRANSIT" on the right.
- Heading: "Hamburg → Algeciras" with "ETA 3d 14h" next to it.
- Subtitle line: "MV Orinoco · 38 containers · Maersk Line".
- Progress indicator labeled "DEPARTED" on the left and "ARRIVING" on the right, with "62%" annotated.
- Three metrics row: "DISTANCE 2,847 nm", "VALUE $1.24M", "CO₂ 184.2t".
- Footer line: "Last update 4 min ago".
- Primary action button (teal): "View manifest →".

Card tokens strip under the card:
- RADIUS: `4px`
- SHADOW: `0 8 24 / 0.08` (as printed — looks like box-shadow offset-x / offset-y / blur with 0.08 alpha, but unit is not stated; see `open-questions.md`)
- BORDER: `1px · #E5E7EB`

### AI Chat component (labeled "COMPONENT · AI CHAT")

Example content visibly rendered:
- Header row: a small filled dot marker (lime, matching the AI MARKER token `#39FF14`) · "NexTrade AI" on the left · "ASSISTANT" on the right.
- User message bubble (dark): "Which vendors are behind SLA this quarter?"
- AI response block labeled "AI RESPONSE":
  - Title line: "3 vendors are tracking below SLA this quarter:"
  - List:
    - "Meridian Logistics — 87.2%"
    - "Kuehne Freight Co. — 91.8%"
    - "Atlas Shipping Ltd. — 93.5%"
- Input field placeholder: "Ask NexTrade AI anything about shipments, vendors, or co..." with a send button on the right.
- Input footer hint row: "ENTER TO SEND · SHIFT + ENTER NEWLINE · AI READY".

AI chat tokens strip under the chat:
- FOCUS RING: `#008080 / 12%`
- AI MARKER: `#39FF14`
- RADIUS: `4px`

### Buttons (labeled "COMPONENT · BUTTONS")

Four variants are visible in the row:
1. "Primary action" — filled teal, white text.
2. "Secondary" — white fill, hairline border, dark text.
3. "Ghost" — no background/border, dark text only.
4. "AI Generate" — filled neon-lime with a leading dot indicator, dark text.

## UI tone / style direction (quoted or visibly stated)

- "Clean edges, high contrast, and measured restraint." (cover)
- "Premium B2B logistics and vendor management platform." (cover)
- "Sharp, data-centric system for logistics at scale." (cover title)
- From the call transcript (`call-transcript.md`) — not from the style guide images — additional directional guidance:
  - Deep Teal backgrounds for headers.
  - Clean white cards for charts.
  - Use the specific sans-serif fonts from the guide.
  - Chat window should take up most of the screen.
  - No generic Bootstrap templates.

## Items sent to open questions

- Whether the letter-spacing range in RULE 01 is a typo (both endpoints shown as -0.05em).
- Exact unit for the card shadow token `0 8 24 / 0.08` (presumed px, not stated).
- Whether "Inter · SYSTEM-UI" means Inter with a system-ui fallback stack, or two distinct roles.
- Whether the monospaced font used for labels, metadata, and hex values has a specific name (not visibly named).
- Color roles for charts themselves (axes, series, grid) are not defined in the visible guide.
- Dark mode / theming is not shown.
- Whether these three PNGs are the complete brand guide or only the "piece" Sarah shared.
