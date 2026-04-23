'use client';

import { type KeyboardEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';

type Props = {
  disabled: boolean;
  onSubmit: (question: string) => void;
};

export function ChatInput({ disabled, onSubmit }: Props) {
  const [value, setValue] = useState('');

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-t border-brand-hairline bg-brand-bgSurface px-6 py-4"
    >
      <div className="flex gap-3 items-end max-w-4xl mx-auto w-full">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Ask NexTrade AI about your products, sales, orders, or cancellations"
          className="flex-1 resize-none rounded-token border border-brand-hairline bg-brand-bgApp px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-60"
        />
        <Button type="submit" disabled={disabled || !value.trim()}>
          Send
        </Button>
      </div>
      <p className="text-[10px] font-mono tracking-widest uppercase text-brand-textMuted mt-2 text-center">
        Enter to send · Shift + Enter newline
      </p>
    </form>
  );
}
