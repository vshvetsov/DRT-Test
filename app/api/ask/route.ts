import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { selectTool } from '@/lib/llm/client';
import { topProducts } from '@/lib/tools/top-products';
import { chartForTopProducts } from '@/lib/charts/map';
import { textForTopProducts } from '@/lib/text/answer';
import { resolveReferenceDate } from '@/lib/reference-date';
import type { AskResponse, AskErrorResponse } from '@/lib/types';

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
    // Config-level failures (missing key, bad auth) deserve a clear 500 so
    // the developer sees them immediately. Transient failures fall through
    // to a graceful out_of_scope response.
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

  // --- 6. Execute the selected tool, server-side vendor scope -------------
  if (selection.toolName === 'top_products') {
    let rows;
    try {
      rows = await topProducts.run(selection.args, session.vendorId);
    } catch (err) {
      console.error('[api/ask] top_products query failed:', err);
      return errorJson({ error: 'tool_failed' }, 500);
    }

    if (rows.length === 0) {
      return askJson({
        status: 'empty',
        text: EMPTY_TEXT,
        chart: chartForTopProducts(rows, selection.args),
      });
    }

    return askJson({
      status: 'ok',
      text: textForTopProducts(rows, selection.args),
      chart: chartForTopProducts(rows, selection.args),
    });
  }

  // --- 7. Exhaustiveness fallback -----------------------------------------
  return askJson({
    status: 'out_of_scope',
    text: OUT_OF_SCOPE_TEXT,
    chart: null,
  });
}
