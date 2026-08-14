import { useState } from 'react';
import { ChefHat, Plus } from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import type { Meal } from '../../types';
import { MealCard } from './MealCard';
import { MealFormModal } from './MealFormModal';
import { MakeMealDialog } from './MakeMealDialog';
import { MealHistoryList } from './MealHistoryList';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Buttons';

export function MealsTab() {
  const { state, dispatch } = useAppState();
  const [editingMeal, setEditingMeal] = useState<Meal | null | undefined>(undefined);
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null);
  const [makingMeal, setMakingMeal] = useState<Meal | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Meals</h1>
            <p className="text-sm text-neutral-500">Create meals and mark them made to update inventory</p>
          </div>
          <Button variant="primary" icon={<Plus size={17} />} onClick={() => setEditingMeal(null)}>
            New Meal
          </Button>
        </div>

        <div className="mt-4">
          {state.meals.length === 0 ? (
            <EmptyState
              icon={<ChefHat size={36} />}
              title="No meals yet"
              description="Create a meal with its ingredients so you can quickly subtract them from inventory when you cook."
              action={
                <Button variant="primary" icon={<Plus size={17} />} onClick={() => setEditingMeal(null)}>
                  New Meal
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {state.meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onMake={() => setMakingMeal(meal)}
                  onEdit={() => setEditingMeal(meal)}
                  onDelete={() => setDeletingMeal(meal)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recently Made</h2>
        <MealHistoryList />
      </div>

      {editingMeal !== undefined && (
        <MealFormModal meal={editingMeal ?? undefined} onClose={() => setEditingMeal(undefined)} />
      )}

      {makingMeal && <MakeMealDialog meal={makingMeal} onClose={() => setMakingMeal(null)} />}

      {deletingMeal && (
        <ConfirmDialog
          title="Delete meal?"
          message={`Remove "${deletingMeal.name}" from your meals? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDeletingMeal(null)}
          onConfirm={() => {
            dispatch({ type: 'DELETE_MEAL', id: deletingMeal.id });
            setDeletingMeal(null);
          }}
        />
      )}
    </div>
  );
}
