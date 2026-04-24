import { bottomProducts } from './bottom-products';
import { categoryBreakdown } from './category-breakdown';
import {
  type CategoryBreakdownArgs,
  type CategoryBreakdownRow,
} from './category-breakdown';
import {
  type RankedProductsArgs,
  type RankedProductsRow,
} from './ranked-products';
import { salesOverTime } from './sales-over-time';
import {
  type SalesOverTimeArgs,
  type SalesOverTimeRow,
} from './sales-over-time';
import { simpleTotal } from './simple-total';
import {
  type SimpleTotalArgs,
  type SimpleTotalRow,
} from './simple-total';
import { topProducts } from './top-products';

// Public re-exports.
export { topProducts } from './top-products';
export type { TopProductsArgs, TopProductsRow } from './top-products';
export { bottomProducts } from './bottom-products';
export type { BottomProductsArgs, BottomProductsRow } from './bottom-products';
export { salesOverTime } from './sales-over-time';
export type { SalesOverTimeArgs, SalesOverTimeRow } from './sales-over-time';
export { simpleTotal } from './simple-total';
export type { SimpleTotalArgs, SimpleTotalRow } from './simple-total';
export { getSimpleTotalValue } from './simple-total';
export { categoryBreakdown } from './category-breakdown';
export type {
  CategoryBreakdownArgs,
  CategoryBreakdownRow,
} from './category-breakdown';
export type {
  RankDirection,
  RankedProductsArgs,
  RankedProductsRow,
} from './ranked-products';

// ---------------------------------------------------------------------------
// ToolSelectionInput — what the LLM layer hands to the executor. Per-toolName
// variants so each toolName is correlated with its own args type. Adding a
// new tool means adding a variant here AND handling the corresponding case
// in every downstream exhaustive switch (runTool below, chartForResult,
// answerForResult, and the parsing branches in lib/llm/client.ts).
// ---------------------------------------------------------------------------

export type ToolSelectionInput =
  | { toolName: 'top_products'; args: RankedProductsArgs }
  | { toolName: 'bottom_products'; args: RankedProductsArgs }
  | { toolName: 'sales_over_time'; args: SalesOverTimeArgs }
  | { toolName: 'simple_total'; args: SimpleTotalArgs }
  | { toolName: 'category_breakdown'; args: CategoryBreakdownArgs };

// ---------------------------------------------------------------------------
// ToolResult — what the executor returns and the chart/text dispatchers
// consume. Same discriminant; also carries concrete rows.
// ---------------------------------------------------------------------------

export type ToolResult =
  | {
      toolName: 'top_products';
      rows: RankedProductsRow[];
      args: RankedProductsArgs;
    }
  | {
      toolName: 'bottom_products';
      rows: RankedProductsRow[];
      args: RankedProductsArgs;
    }
  | {
      toolName: 'sales_over_time';
      rows: SalesOverTimeRow[];
      args: SalesOverTimeArgs;
    }
  | {
      toolName: 'simple_total';
      rows: SimpleTotalRow[];
      args: SimpleTotalArgs;
    }
  | {
      toolName: 'category_breakdown';
      rows: CategoryBreakdownRow[];
      args: CategoryBreakdownArgs;
    };

export async function runTool(
  selection: ToolSelectionInput,
  vendorId: string,
): Promise<ToolResult> {
  switch (selection.toolName) {
    case 'top_products': {
      const rows = await topProducts.run(selection.args, vendorId);
      return { toolName: 'top_products', rows, args: selection.args };
    }
    case 'bottom_products': {
      const rows = await bottomProducts.run(selection.args, vendorId);
      return { toolName: 'bottom_products', rows, args: selection.args };
    }
    case 'sales_over_time': {
      const rows = await salesOverTime.run(selection.args, vendorId);
      return { toolName: 'sales_over_time', rows, args: selection.args };
    }
    case 'simple_total': {
      const rows = await simpleTotal.run(selection.args, vendorId);
      return { toolName: 'simple_total', rows, args: selection.args };
    }
    case 'category_breakdown': {
      const rows = await categoryBreakdown.run(selection.args, vendorId);
      return { toolName: 'category_breakdown', rows, args: selection.args };
    }
    default: {
      const _exhaustive: never = selection;
      void _exhaustive;
      throw new Error('runTool: unknown tool selection');
    }
  }
}
