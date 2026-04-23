/**
 * Reference-date helper, shared between the seed script and /api/ask.
 *
 * The prototype operates on a fixed reference date (the LLM's "today"). By
 * default it is 2026-04-24 (the Friday demo date). Both the seed fixtures and
 * the LLM's time-framing must resolve against the same value.
 */

export const DEFAULT_REFERENCE_DATE = '2026-04-24';

export function resolveReferenceDate(raw: string | undefined): Date {
  const value = raw && raw.trim() !== '' ? raw.trim() : DEFAULT_REFERENCE_DATE;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(
      `SEED_REFERENCE_DATE must be in YYYY-MM-DD format. Got: ${value}`,
    );
  }
  const [, y, m, d] = match;
  // Treat the reference date as UTC midnight — matches the prototype's
  // UTC-only policy.
  const iso = `${y}-${m}-${d}T00:00:00.000Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid SEED_REFERENCE_DATE: ${value}`);
  }
  return date;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
