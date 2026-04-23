import type Anthropic from '@anthropic-ai/sdk';

// JSON Schema sent to Anthropic for tool-use. Mirrored from the shared Zod
// schema in lib/tools/ranked-products.ts; Zod remains the runtime source of
// truth for argument validation after the model selects a tool.

type Tool = Anthropic.Messages.Tool;

// Both ranked-product tools take the same inputs; the description differs.
const RANKED_PRODUCTS_INPUT_SCHEMA: Tool['input_schema'] = {
  type: 'object',
  properties: {
    metric: {
      type: 'string',
      enum: ['revenue', 'units'],
      description:
        'Whether to rank by revenue (USD) or units sold (item count).',
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
};

export const TOP_PRODUCTS_TOOL: Tool = {
  name: 'top_products',
  description:
    "Rank the current vendor's own products by HIGHEST revenue or units sold over an optional date range. Use this for highest-ranked questions only (for example \"top 5 products\", \"best sellers last month\", \"highest revenue items\"), never for totals, trends, category splits, or cancellations.",
  input_schema: RANKED_PRODUCTS_INPUT_SCHEMA,
};

export const BOTTOM_PRODUCTS_TOOL: Tool = {
  name: 'bottom_products',
  description:
    "Rank the current vendor's own products by LOWEST revenue or units sold over an optional date range. Use this for lowest-ranked questions only (for example \"bottom 5 products\", \"worst sellers this month\", \"lowest revenue items\", \"fewest units sold\"), never for totals, trends, category splits, or cancellations.",
  input_schema: RANKED_PRODUCTS_INPUT_SCHEMA,
};

export const REFUSE_TOOL: Tool = {
  name: 'refuse',
  description:
    'Call this when the question cannot be answered by any data tool above. Use reason=out_of_scope for anything that does not fit the available data tools. Use reason=unavailable_reason when the question asks WHY about cancellations or cancellation reasons.',
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

export const TOOL_DEFS: Tool[] = [
  TOP_PRODUCTS_TOOL,
  BOTTOM_PRODUCTS_TOOL,
  REFUSE_TOOL,
];
