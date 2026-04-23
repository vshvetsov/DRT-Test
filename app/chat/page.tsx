'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChatInput } from '@/components/ChatInput';
import { MessageList, type ChatMessage } from '@/components/MessageList';
import { postQuestion } from '@/lib/api';
import { useSession } from '@/lib/useSession';

export default function ChatPage() {
  const router = useRouter();
  const { status, displayName, logout } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (question: string) => {
      const userId = `u-${Date.now()}`;
      const loadingId = `l-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userId, kind: 'user', text: question },
        { id: loadingId, kind: 'loading' },
      ]);
      setSubmitting(true);

      const result = await postQuestion(question);
      setSubmitting(false);

      if (result.kind === 'unauthenticated') {
        router.replace('/');
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? result.kind === 'ok'
              ? { id: loadingId, kind: 'assistant', response: result.response }
              : { id: loadingId, kind: 'error', text: result.message }
            : m,
        ),
      );
    },
    [router],
  );

  if (status === 'loading') {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-brand-textMuted text-sm">Loading session…</p>
      </main>
    );
  }

  if (status !== 'authenticated') {
    // useSession has already triggered a client-side redirect to '/'.
    return null;
  }

  return (
    <main className="flex-1 flex flex-col min-h-0">
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
      <MessageList messages={messages} />
      <ChatInput disabled={submitting} onSubmit={handleSubmit} />
    </main>
  );
}
