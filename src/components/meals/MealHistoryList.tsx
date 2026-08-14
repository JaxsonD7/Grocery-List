import { History } from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import { UNIT_LABELS } from '../../types';
import { EmptyState } from '../ui/EmptyState';

export function MealHistoryList() {
  const { state } = useAppState();

  if (state.mealHistory.length === 0) {
    return (
      <EmptyState
        icon={<History size={32} />}
        title="No meals made yet"
        description="Mark a meal as made to see it show up here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {state.mealHistory.slice(0, 20).map((entry) => (
        <li
          key={entry.id}
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{entry.mealName}</p>
            <p className="text-xs text-neutral-500">
              {new Date(entry.madeAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Used{' '}
            {entry.ingredientsSubtracted
              .map((i) => `${formatQty(i.quantity)} ${UNIT_LABELS[i.unit]} ${i.name}`)
              .join(', ')}
          </p>
        </li>
      ))}
    </ul>
  );
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}
