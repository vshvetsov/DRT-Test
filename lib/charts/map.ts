import type { ChartPayload, BarHorizontalChart, EmptyChart } from '@/lib/types';
import type { TopProductsArgs, TopProductsRow } from '@/lib/tools/top-products';

function metricLabel(args: TopProductsArgs): string {
  return args.metric === 'revenue' ? 'revenue' : 'units sold';
}

function describeRange(args: TopProductsArgs): string {
  if (args.date_from && args.date_to) return `${args.date_from} to ${args.date_to}`;
  if (args.date_from) return `from ${args.date_from}`;
  if (args.date_to) return `through ${args.date_to}`;
  return '';
}

function buildTitle(args: TopProductsArgs): string {
  const range = describeRange(args);
  return `Top ${args.limit} products by ${metricLabel(args)}${range ? ` · ${range}` : ''}`;
}

export function chartForTopProducts(
  rows: TopProductsRow[],
  args: TopProductsArgs,
): ChartPayload {
  if (rows.length === 0) {
    const empty: EmptyChart = {
      type: 'empty',
      title: buildTitle(args),
      message: 'No product sales in this range.',
    };
    return empty;
  }

  const barRows = rows.map((r) => ({
    label: r.product_name,
    v: args.metric === 'revenue' ? r.revenue : r.units,
  }));

  const bar: BarHorizontalChart = {
    type: 'bar_horizontal',
    title: buildTitle(args),
    rows: barRows,
    unit: args.metric === 'revenue' ? 'usd' : 'count',
  };
  return bar;
}
