'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type SessionState =
  | { status: 'loading'; vendorId: null; displayName: null }
  | { status: 'authenticated'; vendorId: string; displayName: string }
  | { status: 'unauthenticated'; vendorId: null; displayName: null };

export function useSession() {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({
    status: 'loading',
    vendorId: null,
    displayName: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/session', { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setState({ status: 'unauthenticated', vendorId: null, displayName: null });
          router.replace('/');
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as {
            vendorId: string;
            displayName: string;
          };
          setState({
            status: 'authenticated',
            vendorId: data.vendorId,
            displayName: data.displayName,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'unauthenticated', vendorId: null, displayName: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = useCallback(async () => {
    await fetch('/api/session', { method: 'DELETE' });
    setState({ status: 'unauthenticated', vendorId: null, displayName: null });
    router.replace('/');
  }, [router]);

  return { ...state, logout };
}
