import { useState } from 'react';
import { ArrowRight, Refrigerator, ShoppingBasket, ListChecks, X } from 'lucide-react';
import { hasSeenOnboarding, markOnboardingSeen } from '../../lib/storage';

export function OnboardingHint() {
  const [dismissed, setDismissed] = useState(hasSeenOnboarding());

  if (dismissed) return null;

  function dismiss() {
    markOnboardingSeen();
    setDismissed(true);
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">How the tabs fit together</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-emerald-800/90 dark:text-emerald-300/80">
          <Refrigerator size={14} className="shrink-0" /> Pantry (what you own)
          <ArrowRight size={12} className="shrink-0 opacity-60" />
          <ListChecks size={14} className="shrink-0" /> Shopping List (what you need)
          <ArrowRight size={12} className="shrink-0 opacity-60" />
          <ShoppingBasket size={14} className="shrink-0" /> Cart (buying now)
          <ArrowRight size={12} className="shrink-0 opacity-60" />
          back to Pantry after checkout.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-emerald-700/70 hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-400/70 dark:hover:bg-emerald-900/40"
      >
        <X size={16} />
      </button>
    </div>
  );
}
