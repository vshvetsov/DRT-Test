import {
  rankedProductsArgsSchema,
  runRankedProducts,
  type RankedProductsArgs,
  type RankedProductsRow,
} from './ranked-products';

// bottom_products ranks the vendor's products from LOWEST to highest by the
// selected metric. Only products that had at least one non-canceled sale in
// the window appear (INNER JOIN on order_items); products with zero sales
// are out of scope for this tool.

export const bottomProductsArgsSchema = rankedProductsArgsSchema;
export type BottomProductsArgs = RankedProductsArgs;
export type BottomProductsRow = RankedProductsRow;

export const bottomProducts = {
  name: 'bottom_products' as const,
  argSchema: rankedProductsArgsSchema,
  run: (args: RankedProductsArgs, vendorId: string) =>
    runRankedProducts(args, vendorId, 'bottom'),
};
