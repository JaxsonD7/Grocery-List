import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Leaf, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import type { CartItem } from '../../types';
import { CATEGORY_LABELS, UNIT_LABELS } from '../../types';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/Buttons';
import { useAppState } from '../../context/AppContext';

export function CartItemRow({ item }: { item: CartItem }) {
  const { dispatch } = useAppState();
  const [expanded, setExpanded] = useState(false);
  const health = item.health;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{item.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">
              {formatQty(item.quantity)} {UNIT_LABELS[item.unit]}
            </Badge>
            <Badge tone="neutral">{CATEGORY_LABELS[item.category]}</Badge>
            {health && (
              <Badge tone={health.score >= 70 ? 'success' : health.score >= 45 ? 'warning' : 'danger'}>
                Health {health.score}/100
              </Badge>
            )}
          </div>
          {item.notes && <p className="mt-1 text-xs text-neutral-500 italic">{item.notes}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton label="Move back to shopping list" onClick={() => dispatch({ type: 'MOVE_CART_TO_LIST', id: item.id })}>
            <ArrowLeft size={16} />
          </IconButton>
          <IconButton label="Remove from cart" onClick={() => dispatch({ type: 'REMOVE_FROM_CART', id: item.id })}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      {health && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide health details' : 'Show health details'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
              {health.brand && <p className="text-xs text-neutral-500">Brand: {health.brand}</p>}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 p-2">
                  <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <ThumbsUp size={12} /> Pros
                  </p>
                  <ul className="space-y-0.5 text-xs text-emerald-900/80 dark:text-emerald-200/80">
                    {health.pros.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-red-50/60 dark:bg-red-950/20 p-2">
                  <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-red-800 dark:text-red-300">
                    <ThumbsDown size={12} /> Cons
                  </p>
                  <ul className="space-y-0.5 text-xs text-red-900/80 dark:text-red-200/80">
                    {health.cons.map((c) => (
                      <li key={c}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="flex items-start gap-1.5 text-xs text-neutral-500">
                <Leaf size={12} className="mt-0.5 shrink-0" />
                {health.raisedInfo ?? 'Sourcing/farming info not specified by the manufacturer.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}
