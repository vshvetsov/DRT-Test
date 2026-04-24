import { NextResponse, type NextRequest } from 'next/server';
import { chartForResult } from '@/lib/charts/map';
import { selectTool } from '@/lib/llm/client';
import { resolveReferenceDate } from '@/lib/reference-date';
import { getSession } from '@/lib/session';
import { answerForResult } from '@/lib/text/answer';
import { runTool, type ToolResult } from '@/lib/tools';
import type { AskErrorResponse, AskResponse } from '@/lib/types';

// Canned text per functional-spec §7.7. The LLM never authors these strings.
const OUT_OF_SCOPE_TEXT =
  "I can help with your products, sales, orders, and cancellations. I can't answer that one yet.";
const EMPTY_TEXT = 'No data for that range.';
const UNAVAILABLE_REASON_TEXT =
  "I don't have customer-provided cancellation reasons in our records.";

function askJson(body: AskResponse): NextResponse<AskResponse> {
  return NextResponse.json(body);
}

function errorJson(
  body: AskErrorResponse,
  status: number,
): NextResponse<AskErrorResponse> {
  return NextResponse.json(body, { status });
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<AskResponse | AskErrorResponse>> {
  // --- 1. Session gate (server-derived vendor_id only) --------------------
  const session = await getSession();
  if (!session.vendorId) {
    return errorJson({ error: 'no_session' }, 401);
  }

  // --- 2. Minimal input validation ----------------------------------------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson({ error: 'invalid_json' }, 400);
  }
  const rawQuestion = (body as { question?: unknown })?.question;
  if (typeof rawQuestion !== 'string') {
    return errorJson({ error: 'invalid_question' }, 400);
  }
  const question = rawQuestion.trim();
  if (question.length === 0 || question.length > 500) {
    return errorJson({ error: 'invalid_question' }, 400);
  }

  // --- 3. Resolve reference date (same as seed, LLM "today") --------------
  const referenceDate = resolveReferenceDate(process.env.SEED_REFERENCE_DATE);

  // --- 4. Ask the LLM to pick a tool --------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    console.log('[api/ask] question:', JSON.stringify(question));
  }
  let selection;
  try {
    selection = await selectTool(question, referenceDate);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/ask] LLM call failed:', msg);
    const isConfigError =
      msg.includes('ANTHROPIC_API_KEY') ||
      msg.toLowerCase().includes('authentication') ||
      msg.toLowerCase().includes('invalid x-api-key');
    if (isConfigError) {
      // Don't leak the full message in the HTTP body; it's already logged
      // server-side above.
      return errorJson({ error: 'llm_unavailable' }, 500);
    }
    return askJson({
      status: 'out_of_scope',
      text: OUT_OF_SCOPE_TEXT,
      chart: null,
    });
  }

  // --- 5. Refusal paths ---------------------------------------------------
  if (selection.kind === 'refuse') {
    if (selection.reason === 'unavailable_reason') {
      return askJson({
        status: 'unavailable_reason',
        text: UNAVAILABLE_REASON_TEXT,
        chart: null,
      });
    }
    return askJson({
      status: 'out_of_scope',
      text: OUT_OF_SCOPE_TEXT,
      chart: null,
    });
  }

  // --- 6. Execute the selected tool via the generic dispatcher ------------
  // Strip the `kind` discriminator to produce a ToolSelectionInput. The
  // discriminated-union destructure preserves toolName ↔ args correlation so
  // runTool sees a correctly typed variant.
  const { kind: _selectionKind, ...toolInput } = selection;
  let result: ToolResult;
  try {
    result = await runTool(toolInput, session.vendorId);
  } catch (err) {
    console.error('[api/ask] tool execution failed:', err);
    return errorJson({ error: 'tool_failed' }, 500);
  }

  // --- 7. Render response via deterministic chart + text dispatchers ------
  if (result.rows.length === 0) {
    return askJson({
      status: 'empty',
      text: EMPTY_TEXT,
      chart: chartForResult(result),
    });
  }

  return askJson({
    status: 'ok',
    text: answerForResult(result),
    chart: chartForResult(result),
  });
}
