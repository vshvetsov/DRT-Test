'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type VendorKey = 'supplier_1' | 'supplier_2';

export function VendorSelector() {
  const router = useRouter();
  const [pending, setPending] = useState<VendorKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectVendor(vendorKey: VendorKey) {
    setError(null);
    setPending(vendorKey);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorKey }),
      });
      if (!res.ok) {
        setError('Could not start session. Please try again.');
        setPending(null);
        return;
      }
      router.push('/chat');
    } catch {
      setError('Could not start session. Please try again.');
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => selectVendor('supplier_1')}
          disabled={pending !== null}
        >
          {pending === 'supplier_1' ? 'Starting…' : 'Log in as Supplier 1'}
        </Button>
        <Button
          onClick={() => selectVendor('supplier_2')}
          disabled={pending !== null}
        >
          {pending === 'supplier_2' ? 'Starting…' : 'Log in as Supplier 2'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
