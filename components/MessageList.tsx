'use client';

import { useEffect, useRef } from 'react';
import type { AskResponse } from '@/lib/types';
import { AssistantMessage } from '@/components/AssistantMessage';

export type ChatMessage =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'assistant'; response: AskResponse }
  | { id: string; kind: 'loading' }
  | { id: string; kind: 'error'; text: string };

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-token bg-brand-textPrimary text-white px-4 py-3 text-sm whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-brand-textMuted">
        <span
          className="inline-block w-2 h-2 rounded-full bg-brand-accent animate-pulse"
          aria-hidden
        />
        <span>Assistant</span>
      </div>
      <div
        className="flex gap-1"
        role="status"
        aria-live="polite"
        aria-label="Assistant is thinking"
      >
        <span
          className="w-2 h-2 rounded-full bg-brand-accent animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-brand-accent animate-bounce"
          style={{ animationDelay: '120ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-brand-accent animate-bounce"
          style={{ animationDelay: '240ms' }}
        />
      </div>
    </div>
  );
}

function ErrorBubble({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-brand-textMuted">
        <span>Assistant</span>
      </div>
      <p className="text-sm text-brand-textMuted italic">{text}</p>
    </div>
  );
}

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 && (
          <p className="text-sm text-brand-textMuted">
            Ask a question to get started.
          </p>
        )}
        {messages.map((m) => {
          if (m.kind === 'user') return <UserMessage key={m.id} text={m.text} />;
          if (m.kind === 'assistant')
            return <AssistantMessage key={m.id} response={m.response} />;
          if (m.kind === 'loading') return <TypingIndicator key={m.id} />;
          if (m.kind === 'error') return <ErrorBubble key={m.id} text={m.text} />;
          return null;
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
