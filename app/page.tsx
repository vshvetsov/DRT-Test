import { VendorSelector } from '@/components/VendorSelector';

export default function LandingPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="space-y-2">
          <p className="text-xs font-mono tracking-widest text-brand-textMuted uppercase">
            NexTrade · AI Reporting Assistant
          </p>
          <h1 className="text-4xl text-brand-textPrimary">
            Who are you signing in as?
          </h1>
          <p className="text-brand-textMuted">
            Pick a supplier to explore their sales, products, and cancellations.
          </p>
        </div>
        <VendorSelector />
      </div>
    </main>
  );
}
