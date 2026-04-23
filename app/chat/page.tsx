'use client';

import { Button } from '@/components/ui/Button';
import { useSession } from '@/lib/useSession';

export default function ChatPage() {
  const { status, displayName, logout } = useSession();

  if (status === 'loading') {
    return (
      <main className="min-h-[calc(100vh-2.5rem)] flex items-center justify-center">
        <p className="text-brand-textMuted text-sm">Loading session…</p>
      </main>
    );
  }

  if (status !== 'authenticated') {
    // useSession has already triggered a client-side redirect to '/'.
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-2.5rem)] flex flex-col">
      <header className="flex items-center justify-between border-b border-brand-hairline px-6 py-4 bg-brand-bgSurface">
        <div>
          <p className="text-xs font-mono tracking-widest text-brand-textMuted uppercase">
            NexTrade · AI Reporting Assistant
          </p>
          <h1 className="text-xl">{displayName}</h1>
        </div>
        <Button variant="secondary" onClick={logout}>
          Switch vendor
        </Button>
      </header>
      <section className="flex-1 p-6">
        <p className="text-brand-textMuted text-sm">
          Chat is wired up in the next slice. For now, this page confirms your
          active session:{' '}
          <span className="font-mono text-brand-textPrimary">{displayName}</span>
          .
        </p>
      </section>
    </main>
  );
}
