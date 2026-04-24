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

// ---------------------------------------------------------------------------
// simple_total — one scalar aggregate over a required date range.
// metric has THREE options here (orders is new). No limit, no bucket.
// ---------------------------------------------------------------------------

export const SIMPLE_TOTAL_TOOL: Tool = {
  name: 'simple_total',
  description:
    "Compute a single scalar total for the current vendor over a required date range. Use this for questions asking for ONE NUMBER: a total, a count, or a sum (for example \"what was my total revenue last month\", \"how many orders this week\", \"how many units did I ship this quarter\", \"total sales over the last 30 days\"). Never use this for ranking products, for per-bucket trends over time, for category breakdowns, or for cancellation summaries.",
  input_schema: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        enum: ['revenue', 'orders', 'units'],
        description:
          'What to total. revenue = USD, units = item count across all order lines, orders = COUNT of distinct order headers (not line items, not products).',
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
    },
    required: ['metric', 'date_from', 'date_to'],
  },
};

// ---------------------------------------------------------------------------
// category_breakdown — group the vendor's sales by PRODUCTS.category.
// metric required; dates optional. No limit, no bucket.
// ---------------------------------------------------------------------------

export const CATEGORY_BREAKDOWN_TOOL: Tool = {
  name: 'category_breakdown',
  description:
    "Group the current vendor's sales by product category (revenue or units) over an optional date range. Use this for questions that ask to break down or split sales across categories (for example \"sales by category this month\", \"which categories are best\", \"revenue by category\", \"category breakdown of units\"). Never use this for temporal bucketing (use sales_over_time for that), for ranking products (use top_products/bottom_products), or for single totals (use simple_total).",
  input_schema: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        enum: ['revenue', 'units'],
        description:
          'Whether to break down by revenue (USD) or units sold (item count).',
      },
      date_from: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description:
          'Inclusive start date in YYYY-MM-DD (UTC). Omit for no lower bound (overall).',
      },
      date_to: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description:
          'Inclusive end date in YYYY-MM-DD (UTC). Omit for no upper bound (overall).',
      },
    },
    required: ['metric'],
  },
};

// ---------------------------------------------------------------------------
// cancellation_summary — total / canceled / rate for the vendor over an
// optional date range. No metric, no limit, no bucket, no group_by.
// ---------------------------------------------------------------------------

export const CANCELLATION_SUMMARY_TOOL: Tool = {
  name: 'cancellation_summary',
  description:
    "Compute the current vendor's cancellation rate and counts (total orders, canceled orders, percentage) over an optional date range. Use this for questions asking for a rate or count of cancellations (for example \"what is my cancellation rate\", \"how many cancellations this month\", \"canceled order count last quarter\"). Never use this for WHY questions about cancellations (cause/reason questions) — those must call 'refuse' with reason='unavailable_reason'. Never use this for a breakdown of cancellations by reason category — that is not yet implemented; call 'refuse' with reason='out_of_scope'.",
  input_schema: {
    type: 'object',
    properties: {
      date_from: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description:
          'Inclusive start date in YYYY-MM-DD (UTC). Omit for no lower bound (overall).',
      },
      date_to: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description:
          'Inclusive end date in YYYY-MM-DD (UTC). Omit for no upper bound (overall).',
      },
    },
    required: [],
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
  SIMPLE_TOTAL_TOOL,
  CATEGORY_BREAKDOWN_TOOL,
  CANCELLATION_SUMMARY_TOOL,
  REFUSE_TOOL,
];
