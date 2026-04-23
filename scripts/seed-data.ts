/**
 * Pure, deterministic fixture generator for the prototype.
 *
 * No DB imports here; this module returns plain JS objects. `scripts/seed.ts`
 * writes them to Postgres.
 *
 * Determinism:
 *   - A fixed mulberry32 PRNG seed (PRNG_SEED) means re-running with the same
 *     reference date produces byte-identical data.
 *   - The reference date shifts all generated dates but does NOT shift the
 *     PRNG sequence, so product prices, quantities, etc. stay identical.
 */

// ---------------------------------------------------------------------------
// Fixed identifiers
// ---------------------------------------------------------------------------

const VENDOR_1_ID = '00000000-0000-0000-0000-000000000001';
const VENDOR_2_ID = '00000000-0000-0000-0000-000000000002';

// mulberry32 PRNG seed. Fixed across runs so seed output is deterministic.
const PRNG_SEED = 0xda7ab1ee;

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Vendor = {
  id: string;
  company_name: string;
  contact_email: string;
  status: string;
  created_at: Date;
};

export type Customer = {
  id: string;
  email: string;
  region: string;
  signup_date: Date;
};

export type Product = {
  id: string;
  vendor_id: string;
  sku: string;
  name: string;
  category: string;
  unit_price: number;
  created_at: Date;
};

export type Order = {
  id: string;
  customer_id: string;
  order_date: Date;
  status: string;
  total_amount: number;
  shipped_at: Date | null;
  delivered_at: Date | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type OrderCancellation = {
  id: string;
  order_id: string;
  reason_category: string;
  detailed_reason: string;
  cancelled_at: Date;
};

export type SeedData = {
  vendors: Vendor[];
  customers: Customer[];
  products: Product[];
  orders: Order[];
  orderItems: OrderItem[];
  cancellations: OrderCancellation[];
  referenceDate: Date;
};

// ---------------------------------------------------------------------------
// Per-vendor metadata. Categories are intentionally disjoint so category and
// product names never overlap across vendors — this is what gives vendor
// isolation checks a fair chance of passing.
// ---------------------------------------------------------------------------

type VendorMeta = {
  id: string;
  marker: '1' | '2';
  company_name: string;
  contact_email: string;
  categories: readonly [string, string, string];
  productNames: Record<string, readonly string[]>;
};

const VENDORS_META: readonly VendorMeta[] = [
  {
    id: VENDOR_1_ID,
    marker: '1',
    company_name: 'Supplier 1',
    contact_email: 'ops@supplier1.example',
    categories: ['Apparel', 'Footwear', 'Accessories'],
    productNames: {
      Apparel: [
        'Classic Cotton Tee',
        'Heavyweight Hoodie',
        'Merino Polo Shirt',
        'Quilted Vest',
        'Relaxed Chino Pants',
        'Denim Jacket',
        'Cashmere Cardigan',
        'Flannel Shirt',
        'Oxford Button-Down',
        'Selvedge Jeans',
        'Pleated Trousers',
        'Linen Blazer',
        'Terrycloth Robe',
        'Cotton Pajamas',
        'Zip-Up Fleece',
        'Long-Sleeve Henley',
        'Tailored Overshirt',
        'Track Pants',
        'Workwear Jacket',
        'Crewneck Sweater',
      ],
      Footwear: [
        'Canvas Sneakers',
        'Trail Runners',
        'Leather Loafers',
        'Chelsea Boots',
        'Hiking Boots',
        'Running Shoes',
        'Suede Chukkas',
        'Deck Shoes',
        'Winter Boots',
        'Slip-On Mules',
        'High-Top Sneakers',
        'Derby Shoes',
        'Minimalist Runners',
        'Wingtip Oxfords',
        'Espadrilles',
        'Leather Sandals',
        'Insulated Snow Boots',
        'Cycling Shoes',
        'Running Flats',
        'Court Sneakers',
      ],
      Accessories: [
        'Leather Wallet',
        'Aviator Sunglasses',
        'Canvas Tote',
        'Wool Beanie',
        'Leather Belt',
        'Silk Scarf',
        'Baseball Cap',
        'Knit Gloves',
        'Crossbody Bag',
        'Laptop Sleeve',
        'Travel Duffle',
        'Bifold Wallet',
        'Tortoise Eyeglasses',
        'Felt Fedora',
        'Paracord Bracelet',
        'Silver Cufflinks',
        'Suede Messenger',
        'Brimmed Sun Hat',
        'Canvas Backpack',
        'Waxed Cotton Cap',
      ],
    },
  },
  {
    id: VENDOR_2_ID,
    marker: '2',
    company_name: 'Supplier 2',
    contact_email: 'ops@supplier2.example',
    categories: ['Home Goods', 'Kitchen', 'Electronics'],
    productNames: {
      'Home Goods': [
        'Ceramic Vase',
        'Linen Throw Blanket',
        'Walnut Picture Frame',
        'Brass Candlestick',
        'Woven Rattan Basket',
        'Stoneware Planter',
        'Hand-Tufted Rug',
        'Glass Terrarium',
        'Velvet Cushion',
        'Macrame Wall Hanging',
        'Oak Side Table',
        'Fringed Floor Lamp',
        'Marble Bookends',
        'Linen Curtains',
        'Mohair Throw',
        'Jute Area Rug',
        'Ceramic Incense Holder',
        'Cork Wall Tiles',
        'Brass Wall Hook',
        'Cotton Bath Mat',
      ],
      Kitchen: [
        'Cast Iron Pan',
        'Espresso Scale',
        "Chef's Knife",
        'Ceramic Mixing Bowl',
        'Copper Saucepan',
        'Pour-Over Kettle',
        'Wooden Cutting Board',
        'Salt Cellar',
        'Enamel Dutch Oven',
        'Ceramic Tea Pot',
        'Stoneware Mug Set',
        'Bamboo Rice Paddle',
        'Stainless Whisk',
        'Marble Mortar Pestle',
        'Glass Storage Jars',
        'Cotton Dish Towels',
        'Olive Wood Spoon',
        'French Press',
        'Matcha Whisk',
        'Copper Cocktail Shaker',
      ],
      Electronics: [
        'Bluetooth Earbuds',
        'Mesh Router',
        'Smart Speaker',
        'Wireless Charger',
        'Noise Canceling Headphones',
        'Portable Speaker',
        'USB-C Hub',
        'Mechanical Keyboard',
        'Wireless Mouse',
        'HDMI Capture Card',
        'Desk Lamp',
        'Standing Desk Converter',
        'Webcam',
        'Ring Light',
        'Podcast Microphone',
        'Cable Management Kit',
        'Power Strip',
        'Surge Protector',
        'External SSD',
        'Laptop Stand',
      ],
    },
  },
] as const;

const REGIONS = ['NA', 'EU', 'APAC', 'LATAM'] as const;

const ORDER_STATUSES_NON_CANCELED = [
  { status: 'delivered', weight: 70 },
  { status: 'shipped', weight: 20 },
  { status: 'placed', weight: 10 },
] as const;

const CANCELLATION_REASONS = [
  {
    category: 'out_of_stock',
    detail: 'Product became unavailable before dispatch.',
  },
  {
    category: 'customer_changed_mind',
    detail: 'Customer requested cancellation within the return window.',
  },
  {
    category: 'shipping_delay',
    detail: 'Fulfilment exceeded the promised dispatch window.',
  },
  { category: 'other', detail: 'Placeholder cancellation reason (seed data).' },
] as const;

// Per-category base price. Gives vendors visibly different AOV in charts.
const CATEGORY_BASE_PRICE: Record<string, number> = {
  Apparel: 42,
  Footwear: 95,
  Accessories: 38,
  'Home Goods': 58,
  Kitchen: 62,
  Electronics: 125,
};

// ---------------------------------------------------------------------------
// Fixed-shape generation parameters
// ---------------------------------------------------------------------------

const CUSTOMER_COUNT = 300;
const PRODUCTS_PER_CATEGORY = [17, 17, 16] as const; // = 50 per vendor
const ORDERS_PER_VENDOR = 500;
const CANCELLATION_RATE = 0.1;
const SEED_WINDOW_DAYS = 90;

// ---------------------------------------------------------------------------
// PRNG + helpers
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeHelpers(rand: () => number) {
  const randInt = (min: number, max: number): number =>
    Math.floor(rand() * (max - min + 1)) + min;

  const randChoice = <T>(arr: readonly T[]): T => {
    if (arr.length === 0) throw new Error('randChoice: empty array');
    const item = arr[Math.floor(rand() * arr.length)];
    if (item === undefined) throw new Error('randChoice: undefined element');
    return item;
  };

  const randWeighted = <T extends { weight: number }>(items: readonly T[]): T => {
    const total = items.reduce((acc, it) => acc + it.weight, 0);
    let r = rand() * total;
    for (const it of items) {
      r -= it.weight;
      if (r <= 0) return it;
    }
    const last = items[items.length - 1];
    if (!last) throw new Error('randWeighted: empty list');
    return last;
  };

  const randFloat = (min: number, max: number, decimals = 2): number => {
    const raw = min + rand() * (max - min);
    const factor = 10 ** decimals;
    return Math.round(raw * factor) / factor;
  };

  const shuffle = <T>(arr: readonly T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i]!, a[j]!] = [a[j]!, a[i]!];
    }
    return a;
  };

  return { randInt, randChoice, randWeighted, randFloat, shuffle };
}

function formatId(prefix: string, vendorMarker: '0' | '1' | '2', serial: number): string {
  // Valid UUID shape 8-4-4-4-12 using deterministic hex segments.
  // The first segment encodes the entity type; each character must be 0-9a-f
  // so Postgres's uuid type will accept it.
  if (!/^[0-9a-f]+$/.test(prefix)) {
    throw new Error(`formatId: prefix must be hex-only, got '${prefix}'`);
  }
  const low = serial.toString(16).padStart(12, '0');
  const p = prefix.padEnd(8, '0').slice(0, 8);
  return `${p}-0000-0000-000${vendorMarker}-${low}`;
}

function minusDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * DAY_MS);
}

function plusDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generate(referenceDate: Date): SeedData {
  const rand = mulberry32(PRNG_SEED);
  const { randInt, randChoice, randWeighted, randFloat, shuffle } = makeHelpers(rand);

  // --- vendors -----------------------------------------------------------
  const vendors: Vendor[] = VENDORS_META.map((v) => ({
    id: v.id,
    company_name: v.company_name,
    contact_email: v.contact_email,
    status: 'active',
    created_at: minusDays(referenceDate, 365 + randInt(0, 180)),
  }));

  // --- customers (shared across vendors) ---------------------------------
  const customers: Customer[] = [];
  for (let i = 1; i <= CUSTOMER_COUNT; i++) {
    customers.push({
      id: formatId('cccccccc', '0', i),
      email: `customer${i.toString().padStart(3, '0')}@example.test`,
      region: randChoice(REGIONS),
      signup_date: minusDays(referenceDate, randInt(SEED_WINDOW_DAYS, 900)),
    });
  }

  // --- products per vendor -----------------------------------------------
  const products: Product[] = [];
  const vendorProductIndex = new Map<string, Product[]>();
  for (const meta of VENDORS_META) {
    let serial = 0;
    const vendorProducts: Product[] = [];
    for (let c = 0; c < meta.categories.length; c++) {
      const category = meta.categories[c]!;
      const count = PRODUCTS_PER_CATEGORY[c]!;
      const basePrice = CATEGORY_BASE_PRICE[category] ?? 40;
      const pool = meta.productNames[category] ?? [];
      const shuffled = shuffle(pool);
      for (let i = 0; i < count; i++) {
        serial++;
        const variationMultiplier = 0.6 + rand() * 1.6; // 0.6x .. 2.2x of base
        const unit_price = randFloat(
          basePrice * variationMultiplier * 0.95,
          basePrice * variationMultiplier * 1.05,
          2,
        );
        const product: Product = {
          id: formatId('aaaaaaaa', meta.marker, serial),
          vendor_id: meta.id,
          sku: `V${meta.marker}-${category.slice(0, 3).toUpperCase().replace(/\s/g, '')}-${serial.toString().padStart(4, '0')}`,
          name: shuffled[i % shuffled.length]!,
          category,
          unit_price,
          created_at: minusDays(referenceDate, randInt(SEED_WINDOW_DAYS + 10, 300)),
        };
        products.push(product);
        vendorProducts.push(product);
      }
    }
    vendorProductIndex.set(meta.id, vendorProducts);
  }

  // --- orders + items + cancellations, per vendor ------------------------
  const orders: Order[] = [];
  const orderItems: OrderItem[] = [];
  const cancellations: OrderCancellation[] = [];

  for (const meta of VENDORS_META) {
    const vendorProducts = vendorProductIndex.get(meta.id)!;
    let orderSerial = 0;
    let itemSerial = 0;
    let cancellationSerial = 0;

    for (let i = 0; i < ORDERS_PER_VENDOR; i++) {
      orderSerial++;
      const daysAgo = randInt(0, SEED_WINDOW_DAYS - 1);
      const orderDate = minusDays(referenceDate, daysAgo);

      // 1..4 items per order, all from this vendor's catalog.
      const itemCount = randInt(1, 4);
      const orderId = formatId('bbbbbbbb', meta.marker, orderSerial);
      let total = 0;
      const chosenProducts = new Set<string>();

      for (let k = 0; k < itemCount; k++) {
        // Avoid duplicate product lines in the same order.
        let product = randChoice(vendorProducts);
        let guard = 0;
        while (chosenProducts.has(product.id) && guard < 6) {
          product = randChoice(vendorProducts);
          guard++;
        }
        chosenProducts.add(product.id);

        const quantity = randInt(1, 5);
        itemSerial++;
        orderItems.push({
          id: formatId('dddddddd', meta.marker, itemSerial),
          order_id: orderId,
          product_id: product.id,
          quantity,
          unit_price: product.unit_price,
        });
        total += quantity * product.unit_price;
      }

      // Decide cancellation first so order.status aligns.
      const isCanceled = rand() < CANCELLATION_RATE;
      let status: string;
      let shippedAt: Date | null = null;
      let deliveredAt: Date | null = null;

      if (isCanceled) {
        status = 'canceled';
        // Some canceled orders shipped before being returned.
        if (rand() < 0.2) shippedAt = plusDays(orderDate, randInt(1, 2));
      } else {
        status = randWeighted(ORDER_STATUSES_NON_CANCELED).status;
        if (status === 'shipped' || status === 'delivered') {
          shippedAt = plusDays(orderDate, randInt(1, 3));
        }
        if (status === 'delivered' && shippedAt) {
          deliveredAt = plusDays(shippedAt, randInt(1, 5));
        }
      }

      orders.push({
        id: orderId,
        customer_id: randChoice(customers).id,
        order_date: orderDate,
        status,
        total_amount: Math.round(total * 100) / 100,
        shipped_at: shippedAt,
        delivered_at: deliveredAt,
      });

      if (isCanceled) {
        cancellationSerial++;
        const reason = randChoice(CANCELLATION_REASONS);
        cancellations.push({
          id: formatId('eeeeeeee', meta.marker, cancellationSerial),
          order_id: orderId,
          reason_category: reason.category,
          detailed_reason: reason.detail,
          cancelled_at: plusDays(orderDate, randInt(0, 5)),
        });
      }
    }
  }

  return {
    vendors,
    customers,
    products,
    orders,
    orderItems,
    cancellations,
    referenceDate,
  };
}

// Reference-date helpers are re-exported from lib/ so /api/ask uses the same
// logic as the seed script.
export {
  DEFAULT_REFERENCE_DATE,
  resolveReferenceDate,
} from '../lib/reference-date';
