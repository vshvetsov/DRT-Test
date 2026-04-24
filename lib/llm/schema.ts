import type Anthropic from '@anthropic-ai/sdk';

// JSON Schema sent to Anthropic for tool-use. Mirrored from the Zod schemas
// under lib/tools/*; Zod remains the runtime source of truth for argument
// validation after the model selects a tool.

type Tool = Anthropic.Messages.Tool;

// ---------------------------------------------------------------------------
// Shared input_schema for the ranked-product tools.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// sales_over_time — time-series. Required dates and bucket. No limit.
// ---------------------------------------------------------------------------

export const SALES_OVER_TIME_TOOL: Tool = {
  name: 'sales_over_time',
  description:
    "Compute the current vendor's revenue or units sold as a time series over a required date range, bucketed by day, week, or month. Use this for questions about CHANGE OVER TIME (for example \"sales trend over the last 30 days\", \"revenue per week this quarter\", \"how have my units sold moved this month\"). Never use this for ranking individual products; use top_products or bottom_products for that.",
  input_schema: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        enum: ['revenue', 'units'],
        description:
          'Whether to plot revenue (USD) or units sold (item count).',
      },
      date_from: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description:
          'Inclusive start date in YYYY-MM-DD (UTC). ALWAYS supply this, computed relative to today.',
      },
      date_to: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description:
          'Inclusive end date in YYYY-MM-DD (UTC). ALWAYS supply this, computed relative to today.',
      },
      bucket: {
        type: 'string',
        enum: ['day', 'week', 'month'],
        description:
          'Time bucket granularity. Pick day for ranges up to ~45 days, week for ranges up to ~200 days, month for longer ranges.',
      },
    },
    required: ['metric', 'date_from', 'date_to', 'bucket'],
  },
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
  SALES_OVER_TIME_TOOL,
  REFUSE_TOOL,
];
