import {
  rankedProductsArgsSchema,
  runRankedProducts,
  type RankedProductsArgs,
  type RankedProductsRow,
} from './ranked-products';

// top_products ranks the vendor's products from HIGHEST to lowest by the
// selected metric. The schema, row shape, and SQL body are shared with
// bottom_products via ./ranked-products.

export const topProductsArgsSchema = rankedProductsArgsSchema;
export type TopProductsArgs = RankedProductsArgs;
export type TopProductsRow = RankedProductsRow;

export const topProducts = {
  name: 'top_products' as const,
  argSchema: rankedProductsArgsSchema,
  run: (args: RankedProductsArgs, vendorId: string) =>
    runRankedProducts(args, vendorId, 'top'),
};
