import { bottomProducts } from './bottom-products';
import {
  type RankedProductsArgs,
  type RankedProductsRow,
} from './ranked-products';
import { topProducts } from './top-products';

// Public re-exports.
export { topProducts } from './top-products';
export type { TopProductsArgs, TopProductsRow } from './top-products';
export { bottomProducts } from './bottom-products';
export type { BottomProductsArgs, BottomProductsRow } from './bottom-products';
export type {
  RankDirection,
  RankedProductsArgs,
  RankedProductsRow,
} from './ranked-products';

// ---------------------------------------------------------------------------
// ToolSelectionInput — what the LLM layer hands to the executor. Discriminant
// on `toolName` so the compiler walks every future variant (see runTool).
// ---------------------------------------------------------------------------

export type ToolSelectionInput =
  | { toolName: 'top_products'; args: RankedProductsArgs }
  | { toolName: 'bottom_products'; args: RankedProductsArgs };

// ---------------------------------------------------------------------------
// ToolResult — what the executor returns and the chart/text dispatchers
// consume. Pairs `toolName`, `args`, and concrete `rows` so downstream code
// has everything it needs to render a response.
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
    default: {
      const _exhaustive: never = selection;
      void _exhaustive;
      throw new Error('runTool: unknown tool selection');
    }
  }
}
