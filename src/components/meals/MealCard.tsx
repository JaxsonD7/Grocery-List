import { ChefHat, Pencil, Trash2 } from 'lucide-react';
import type { Meal } from '../../types';
import { UNIT_LABELS } from '../../types';
import { Button, IconButton } from '../ui/Buttons';

interface MealCardProps {
  meal: Meal;
  onMake: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MealCard({ meal, onMake, onEdit, onDelete }: MealCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <ChefHat size={18} />
          </span>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{meal.name}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <IconButton label="Edit meal" onClick={onEdit}>
            <Pencil size={16} />
          </IconButton>
          <IconButton label="Delete meal" onClick={onDelete}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
        {meal.ingredients.map((ing) => (
          <li key={ing.id} className="flex justify-between">
            <span>{ing.name}</span>
            <span className="tabular-nums text-neutral-500">
              {formatQty(ing.quantity)} {UNIT_LABELS[ing.unit]}
            </span>
          </li>
        ))}
      </ul>

      <Button variant="primary" className="mt-4 w-full" onClick={onMake}>
        Mark as Made
      </Button>
    </div>
  );
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}
