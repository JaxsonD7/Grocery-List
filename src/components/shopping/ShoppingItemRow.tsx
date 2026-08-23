import { CheckCircle2, Pencil, ShoppingCart, Sparkles, Store, Trash2, UserRound, Zap } from 'lucide-react';
import type { ShoppingListItem } from '../../types';
import { CATEGORY_LABELS, UNIT_LABELS } from '../../types';
import { Badge } from '../ui/Badge';
import { Button, IconButton } from '../ui/Buttons';
import { useAppState } from '../../context/AppContext';

const SOURCE_META = {
  manual: { label: 'Manual', icon: <UserRound size={11} />, tone: 'neutral' as const },
  recommended: { label: 'Recommended', icon: <Sparkles size={11} />, tone: 'warning' as const },
  auto: { label: 'Auto-added', icon: <Zap size={11} />, tone: 'info' as const },
};

interface ShoppingItemRowProps {
  item: ShoppingListItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function ShoppingItemRow({ item, onEdit, onDelete }: ShoppingItemRowProps) {
  const { dispatch } = useAppState();
  const sourceMeta = SOURCE_META[item.source];

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
        item.checked
          ? 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50'
          : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SHOPPING_CHECKED', id: item.id })}
          aria-label={item.checked ? 'Mark as not picked up' : 'Check off item'}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            item.checked
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-neutral-300 text-transparent hover:border-emerald-500 dark:border-neutral-600'
          }`}
        >
          <CheckCircle2 size={16} />
        </button>
        <div className="min-w-0">
          <p
            className={`font-medium ${
              item.checked
                ? 'text-neutral-400 line-through dark:text-neutral-600'
                : 'text-neutral-900 dark:text-neutral-100'
            }`}
          >
            {item.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">
              {formatQty(item.quantity)} {UNIT_LABELS[item.unit]}
            </Badge>
            <Badge tone="neutral">{CATEGORY_LABELS[item.category]}</Badge>
            {item.store && (
              <Badge tone="purple" icon={<Store size={11} />}>
                {item.store}
              </Badge>
            )}
            <Badge tone={sourceMeta.tone} icon={sourceMeta.icon}>
              {sourceMeta.label}
            </Badge>
          </div>
          {item.notes && <p className="mt-1 text-xs text-neutral-500 italic">{item.notes}</p>}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <Button size="sm" variant="secondary" icon={<ShoppingCart size={14} />} onClick={() => dispatch({ type: 'MOVE_SHOPPING_TO_CART', id: item.id })}>
          To Cart
        </Button>
        <Button size="sm" variant="primary" icon={<CheckCircle2 size={14} />} onClick={() => dispatch({ type: 'MARK_SHOPPING_PURCHASED', id: item.id })}>
          Purchased
        </Button>
        <IconButton label="Edit item" onClick={onEdit}>
          <Pencil size={16} />
        </IconButton>
        <IconButton label="Remove item" onClick={onDelete}>
          <Trash2 size={16} />
        </IconButton>
      </div>
    </div>
  );
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}
