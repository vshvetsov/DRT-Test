import type Anthropic from '@anthropic-ai/sdk';

// JSON Schema sent to Anthropic for tool-use. Mirrored from the Zod schema in
// lib/tools/top-products.ts; the Zod schema remains the runtime source of
// truth for argument validation after the model selects a tool.

type Tool = Anthropic.Messages.Tool;

export const TOP_PRODUCTS_TOOL: Tool = {
  name: 'top_products',
  description:
    "Rank the current vendor's own products by revenue or units sold over an optional date range. Use this for ranked-list questions only (for example \"top 5 products\", \"best sellers last month\"), never for totals, trends, category splits, or cancellations.",
  input_schema: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        enum: ['revenue', 'units'],
        description:
          "Whether to rank by revenue (USD) or units sold (item count).",
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 20,
        description:
          'How many products to return, 1..20. Default to 5 if the user did not specify.',
      },
      date_from: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description:
          'Inclusive start date in YYYY-MM-DD (UTC). Omit for no lower bound.',
      },
      date_to: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description:
          'Inclusive end date in YYYY-MM-DD (UTC). Omit for no upper bound.',
      },
    },
    required: ['metric', 'limit'],
  },
};

export const REFUSE_TOOL: Tool = {
  name: 'refuse',
  description:
    'Call this when the question cannot be answered by any data tool above. Use reason=out_of_scope for anything that does not fit top_products. Use reason=unavailable_reason when the question asks WHY about cancellations or cancellation reasons.',
  input_schema: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        enum: ['out_of_scope', 'unavailable_reason'],
        description:
          'out_of_scope for unsupported question categories. unavailable_reason specifically for WHY-cancellation questions.',
      },
    },
    required: ['reason'],
  },
};

export const TOOL_DEFS: Tool[] = [TOP_PRODUCTS_TOOL, REFUSE_TOOL];
