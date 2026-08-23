import { AlertTriangle, CalendarClock, Minus, Package, Pencil, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import type { InventoryItem } from '../../types';
import { CATEGORY_LABELS, LOCATION_LABELS, UNIT_LABELS } from '../../types';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/Buttons';
import { getItemFlags } from '../../lib/status';
import { isAlreadyOnShoppingList } from '../../lib/shoppingList';
import { pricePerUnitLabel } from '../../lib/pricing';
import { useAppState } from '../../context/AppContext';

interface ItemCardProps {
  item: InventoryItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const { state, dispatch } = useAppState();
  const flags = getItemFlags(item);
  const onList = isAlreadyOnShoppingList(state.shoppingList, item.id);
  const step = ['count', 'dozen', 'package', 'bottle', 'can', 'box', 'bag'].includes(item.unit) ? 1 : 0.5;

  function adjust(delta: number) {
    dispatch({ type: 'ADJUST_QUANTITY', id: item.id, delta });
  }

  function addToShoppingList() {
    const need = Math.max(item.lowStockThreshold - item.quantity + 1, 1);
    dispatch({
      type: 'ADD_SHOPPING_ITEM',
      item: {
        name: item.name,
        quantity: need,
        unit: item.unit,
        category: item.category,
        source: 'recommended',
        linkedInventoryItemId: item.id,
      },
    });
  }

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        flags.expired
          ? 'border-red-300 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20'
          : flags.outOfStock
            ? 'border-neutral-300 bg-neutral-100/60 dark:border-neutral-700 dark:bg-neutral-800/40'
            : flags.low
              ? 'border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20'
              : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          {item.photoUrl ? (
            <img src={item.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Package size={18} className="text-neutral-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</p>
            {(item.brand || item.store) && (
              <p className="truncate text-xs text-neutral-500">
                {[item.brand, item.store].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone="neutral">{CATEGORY_LABELS[item.category]}</Badge>
              <Badge tone="info">{LOCATION_LABELS[item.location]}</Badge>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <IconButton label="Edit item" onClick={onEdit}>
            <Pencil size={16} />
          </IconButton>
          <IconButton label="Delete item" onClick={onDelete}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {flags.expired && (
          <Badge tone="danger" icon={<AlertTriangle size={12} />}>
            Expired
          </Badge>
        )}
        {!flags.expired && flags.expiringSoon && (
          <Badge tone="warning" icon={<CalendarClock size={12} />}>
            Expiring soon
          </Badge>
        )}
        {flags.outOfStock ? (
          <Badge tone="danger">Out of stock</Badge>
        ) : flags.low ? (
          <Badge tone="warning">Low stock</Badge>
        ) : (
          <Badge tone="success">In stock</Badge>
        )}
        {onList && <Badge tone="purple">On shopping list</Badge>}
      </div>

      {item.trackByPercent ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
            <span>Remaining</span>
            <span className="font-medium tabular-nums text-neutral-700 dark:text-neutral-200">
              {Math.round(item.quantity)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            className="w-full accent-emerald-600"
            aria-label={`${item.name} percent remaining`}
            value={item.quantity}
            onChange={(e) => dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { quantity: Number(e.target.value) } })}
          />
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <IconButton
            label={`Decrease ${item.name} quantity`}
            variant="secondary"
            onClick={() => adjust(-step)}
            disabled={item.quantity <= 0}
          >
            <Minus size={15} />
          </IconButton>
          <span className="min-w-[4.5rem] text-center text-sm font-medium tabular-nums text-neutral-800 dark:text-neutral-100">
            {formatQty(item.quantity)} {UNIT_LABELS[item.unit]}
          </span>
          <IconButton label={`Increase ${item.name} quantity`} variant="secondary" onClick={() => adjust(step)}>
            <Plus size={15} />
          </IconButton>
        </div>
      )}

      {(flags.low || flags.outOfStock) && !onList && (
        <div className="mt-2.5">
          <IconButton
            label={`Add ${item.name} to shopping list`}
            variant="primary"
            onClick={addToShoppingList}
          >
            <ShoppingCart size={16} />
          </IconButton>
        </div>
      )}

      {(item.price != null || item.expirationDate) && (
        <p className="mt-2 text-xs text-neutral-500">
          {item.price != null && (
            <>
              ${item.price.toFixed(2)}
              {pricePerUnitLabel(item) && ` (${pricePerUnitLabel(item)})`}
              {item.expirationDate && ' · '}
            </>
          )}
          {item.expirationDate && `Expires ${new Date(`${item.expirationDate}T00:00:00`).toLocaleDateString()}`}
        </p>
      )}
      {item.notes && <p className="mt-1 text-xs text-neutral-500 italic">{item.notes}</p>}
    </div>
  );
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}
