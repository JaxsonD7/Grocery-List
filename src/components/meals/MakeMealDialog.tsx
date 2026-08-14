import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShoppingCart } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Buttons';
import { Badge } from '../ui/Badge';
import type { Meal } from '../../types';
import { UNIT_LABELS } from '../../types';
import { useAppState } from '../../context/AppContext';
import { isAlreadyOnShoppingList } from '../../lib/shoppingList';
import { isLowStock, isOutOfStock } from '../../lib/status';

interface MakeMealDialogProps {
  meal: Meal;
  onClose: () => void;
}

function findInventoryMatch(state: ReturnType<typeof useAppState>['state'], ingredient: Meal['ingredients'][number]) {
  return state.inventory.find(
    (i) => i.id === ingredient.inventoryItemId || i.name.trim().toLowerCase() === ingredient.name.trim().toLowerCase(),
  );
}

export function MakeMealDialog({ meal, onClose }: MakeMealDialogProps) {
  const { state, dispatch } = useAppState();
  const [phase, setPhase] = useState<'confirm' | 'result'>('confirm');
  const [affectedItemIds, setAffectedItemIds] = useState<string[]>([]);

  const checks = useMemo(
    () =>
      meal.ingredients.map((ingredient) => {
        const match = findInventoryMatch(state, ingredient);
        const available = match?.quantity ?? 0;
        const sufficient = !!match && available >= ingredient.quantity;
        return { ingredient, match, available, sufficient };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meal, state.inventory],
  );

  const hasShortage = checks.some((c) => !c.sufficient);

  function confirmMake() {
    const ids = checks.map((c) => c.match?.id).filter((id): id is string => !!id);
    dispatch({ type: 'MAKE_MEAL', mealId: meal.id });
    setAffectedItemIds(ids);
    setPhase('result');
  }

  if (phase === 'result') {
    const newlyLow = state.inventory.filter(
      (item) => affectedItemIds.includes(item.id) && (isLowStock(item) || isOutOfStock(item)),
    );

    return (
      <Modal
        title="Meal made!"
        onClose={onClose}
        maxWidthClass="max-w-md"
        footer={
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>
              <strong>{meal.name}</strong> was marked as made and ingredients were subtracted from your inventory.
            </span>
          </div>

          {newlyLow.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                These ingredients are now low — add them to your shopping list?
              </p>
              <ul className="space-y-2">
                {newlyLow.map((item) => (
                  <RecommendationRow key={item.id} itemId={item.id} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Make "${meal.name}"?`}
      onClose={onClose}
      maxWidthClass="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={hasShortage ? 'danger' : 'primary'} onClick={confirmMake}>
            {hasShortage ? 'Make Anyway' : 'Make Meal'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {hasShortage && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>
              Some ingredients are missing or don't have enough quantity. You can still make this meal — available
              amounts will be used and inventory will go to 0 where needed.
            </span>
          </div>
        )}

        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800">
          {checks.map(({ ingredient, match, available, sufficient }) => (
            <li key={ingredient.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="text-neutral-800 dark:text-neutral-200">{ingredient.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">
                  need {formatQty(ingredient.quantity)} {UNIT_LABELS[ingredient.unit]}
                </span>
                {sufficient ? (
                  <Badge tone="success">Have {formatQty(available)}</Badge>
                ) : match ? (
                  <Badge tone="warning">Only {formatQty(available)}</Badge>
                ) : (
                  <Badge tone="danger">Not in inventory</Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

function RecommendationRow({ itemId }: { itemId: string }) {
  const { state, dispatch } = useAppState();
  const item = state.inventory.find((i) => i.id === itemId);
  if (!item) return null;
  const onList = isAlreadyOnShoppingList(state.shoppingList, item.id);

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item.name}</p>
        <p className="text-xs text-neutral-500">
          {formatQty(item.quantity)} {UNIT_LABELS[item.unit]} left · threshold {formatQty(item.lowStockThreshold)}
        </p>
      </div>
      {onList ? (
        <Badge tone="purple">On list</Badge>
      ) : (
        <Button
          size="sm"
          variant="primary"
          icon={<ShoppingCart size={14} />}
          onClick={() =>
            dispatch({
              type: 'ADD_SHOPPING_ITEM',
              item: {
                name: item.name,
                quantity: Math.max(item.lowStockThreshold - item.quantity + 1, 1),
                unit: item.unit,
                category: item.category,
                source: 'recommended',
                linkedInventoryItemId: item.id,
              },
            })
          }
        >
          Add
        </Button>
      )}
    </li>
  );
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}
