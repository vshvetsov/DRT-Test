import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

// Prototype vendor map. The same UUIDs will be used by the seed script (D4)
// so that these session vendor IDs match real rows once the DB is seeded.
const VENDOR_MAP = {
  supplier_1: {
    id: '00000000-0000-0000-0000-000000000001',
    displayName: 'Supplier 1',
  },
  supplier_2: {
    id: '00000000-0000-0000-0000-000000000002',
    displayName: 'Supplier 2',
  },
} as const;

type VendorKey = keyof typeof VENDOR_MAP;

function isVendorKey(value: unknown): value is VendorKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(VENDOR_MAP, value);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const vendorKey = (body as { vendorKey?: unknown })?.vendorKey;
  if (!isVendorKey(vendorKey)) {
    return NextResponse.json({ error: 'invalid_vendor_key' }, { status: 400 });
  }

  const vendor = VENDOR_MAP[vendorKey];
  const session = await getSession();
  session.vendorId = vendor.id;
  session.displayName = vendor.displayName;
  await session.save();

  return NextResponse.json({
    vendorId: vendor.id,
    displayName: vendor.displayName,
  });
}

export async function GET() {
  const session = await getSession();
  if (!session.vendorId || !session.displayName) {
    return NextResponse.json({ error: 'no_session' }, { status: 401 });
  }
  return NextResponse.json({
    vendorId: session.vendorId,
    displayName: session.displayName,
  });
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return new NextResponse(null, { status: 204 });
}
