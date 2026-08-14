import { ArrowLeft, Trash2 } from 'lucide-react';
import type { CartItem } from '../../types';
import { CATEGORY_LABELS, UNIT_LABELS } from '../../types';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/Buttons';
import { useAppState } from '../../context/AppContext';

export function CartItemRow({ item }: { item: CartItem }) {
  const { dispatch } = useAppState();

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      <div className="min-w-0">
        <p className="font-medium text-neutral-900 dark:text-neutral-100">{item.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">
            {formatQty(item.quantity)} {UNIT_LABELS[item.unit]}
          </Badge>
          <Badge tone="neutral">{CATEGORY_LABELS[item.category]}</Badge>
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
  );
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}
