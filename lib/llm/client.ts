import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';
import { systemPrompt } from './system-prompt';
import { TOOL_DEFS } from './schema';
import { topProducts, type TopProductsArgs } from '@/lib/tools/top-products';

export type ToolSelection =
  | { kind: 'tool'; toolName: 'top_products'; args: TopProductsArgs }
  | { kind: 'refuse'; reason: 'out_of_scope' | 'unavailable_reason' };

const TIMEOUT_MS = 20_000;

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client === null) {
    _client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      timeout: TIMEOUT_MS,
    });
  }
  return _client;
}

function refuseAsOutOfScope(reason: string): ToolSelection {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[llm] refusing (out_of_scope):', reason);
  }
  return { kind: 'refuse', reason: 'out_of_scope' };
}

export async function selectTool(
  question: string,
  referenceDate: Date,
): Promise<ToolSelection> {
  const response = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    temperature: 0,
    system: systemPrompt(referenceDate),
    tools: TOOL_DEFS,
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: question }],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    return refuseAsOutOfScope('no tool_use in response');
  }

  if (toolUse.name === 'refuse') {
    const input = toolUse.input as { reason?: unknown };
    if (input.reason === 'unavailable_reason') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[llm] refusing (unavailable_reason)');
      }
      return { kind: 'refuse', reason: 'unavailable_reason' };
    }
    return refuseAsOutOfScope(`refuse tool: reason=${String(input.reason)}`);
  }

  if (toolUse.name === 'top_products') {
    const parsed = topProducts.argSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      return refuseAsOutOfScope(
        `top_products arg validation failed: ${parsed.error.message}`,
      );
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[llm] selected tool: top_products', parsed.data);
    }
    return { kind: 'tool', toolName: 'top_products', args: parsed.data };
  }

  return refuseAsOutOfScope(`unknown tool name: ${toolUse.name}`);
}
