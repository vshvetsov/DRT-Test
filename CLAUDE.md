# Project Instructions

## Goal
Build and deploy a clickable prototype web app based on the approved normalized materials and locked prototype decisions.

## Source of truth
- Raw source files: `docs/raw/`
- Normalized files: `docs/normalized/`
- Locked prototype decisions: `docs/normalized/prototype-decisions.md`

## Workflow
Work in this order:
1. Normalize sources
2. Functional spec
3. Technical spec
4. Implementation
5. Verification
6. Deployment

Do not skip stages.
Do not implement before the technical spec is approved.

## General rules
- Do not invent requirements.
- Separate confirmed facts from assumptions.
- Treat prototype decisions as working defaults, not confirmed business requirements.
- If something conflicts with normalized files or prototype decisions, flag it explicitly instead of silently overriding it.
- Prefer the simplest solution that supports the prototype goal.

## Prototype architecture defaults
- Build a single-screen web app with a chat-first UI.
- Use explicit vendor context for the prototype.
- Enforce vendor scoping server-side.
- Do not use unconstrained free-form SQL generation.
- Prefer a bounded metric catalog / tool-based backend approach.
- Use deterministic server-side chart mapping from supported result shapes.
- Return clear unsupported / no-data states instead of hallucinating answers.

## Functional spec rules
- Ground the functional spec in `docs/normalized/` and `prototype-decisions.md`.
- Clearly mark prototype-only behavior.
- Explicitly list assumptions, exclusions, and open questions.

## Technical spec rules
- Follow the locked prototype decisions unless explicitly revised.
- Keep backend behavior controlled and testable.
- Keep tenancy and vendor isolation explicit in the design.

## Implementation rules
- Explore first, then propose a plan, then implement.
- Keep code modular, simple, and readable.
- Use bounded logic and safe defaults.
- Add validation and error handling for important flows.
- Do not silently broaden scope.

## Verification rules
Before marking work complete:
- run the app
- verify key flows manually
- run tests if present
- confirm behavior matches the specs
- note remaining prototype limitations

## Commands
Package manager: **npm** (pnpm is the plan's documented choice but not installed locally; scripts are compatible with either).

- `npm install` — install dependencies
- `npm run dev` — start Next.js dev server at http://localhost:3000
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run typecheck` — `tsc --noEmit`

Database / LLM scripts not yet created (D3 migrate, D4 seed). Apply schema manually for now:
- `psql "$DATABASE_URL" -f db/schema.sql`

Before `npm run dev` can hit session-backed routes, copy `.env.example` to `.env.local` and set `SESSION_SECRET` (32+ chars, e.g. `openssl rand -hex 32`). `DATABASE_URL` and `ANTHROPIC_API_KEY` are only needed once later slices are wired up.

Keep this section updated as the repo evolves.

## Completion rule
A stage is complete only when its artifact is created, reviewed, and explicitly approved.