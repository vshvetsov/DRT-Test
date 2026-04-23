import type { AskResponse } from '@/lib/types';
import { ChartRenderer } from '@/components/charts/ChartRenderer';

// F7 — assistant bubble. Lime marker + ASSISTANT label + text + optional chart.
// The chart is rendered for any non-null ChartPayload, including `empty`
// (zero-rows states surface their own copy inside ChartRenderer).
export function AssistantMessage({ response }: { response: AskResponse }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-brand-textMuted">
        <span
          className="inline-block w-2 h-2 rounded-full bg-brand-accent"
          aria-hidden
        />
        <span>Assistant</span>
      </div>
      <p className="text-sm text-brand-textPrimary leading-relaxed">
        {response.text}
      </p>
      {response.chart && <ChartRenderer chart={response.chart} />}
    </div>
  );
}
