import type { AskResponse } from '@/lib/types';

// F8 — client fetcher for POST /api/ask. Maps HTTP outcomes onto a small
// discriminated union the chat page consumes:
//   - `ok`               → render the AskResponse as an assistant message
//   - `unauthenticated`  → redirect to the landing
//   - `error`            → render a muted error message
export type AskResult =
  | { kind: 'ok'; response: AskResponse }
  | { kind: 'unauthenticated' }
  | { kind: 'error'; message: string };

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export async function postQuestion(question: string): Promise<AskResult> {
  let res: Response;
  try {
    res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
  } catch {
    return { kind: 'error', message: GENERIC_ERROR };
  }

  if (res.status === 401) {
    return { kind: 'unauthenticated' };
  }

  if (!res.ok) {
    return { kind: 'error', message: GENERIC_ERROR };
  }

  try {
    const body = (await res.json()) as AskResponse;
    return { kind: 'ok', response: body };
  } catch {
    return { kind: 'error', message: GENERIC_ERROR };
  }
}
