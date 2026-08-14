import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button, IconButton } from '../ui/Buttons';
import { Field, inputClass, selectClass } from '../ui/FormField';
import { UNITS, UNIT_LABELS, type Meal, type MealIngredient, type Unit } from '../../types';
import { useAppState } from '../../context/AppContext';

interface DraftIngredient {
  key: string;
  name: string;
  quantity: number;
  unit: Unit;
}

interface MealFormModalProps {
  meal?: Meal;
  onClose: () => void;
}

export function MealFormModal({ meal, onClose }: MealFormModalProps) {
  const { state, dispatch } = useAppState();
  const isEdit = !!meal;

  const [name, setName] = useState(meal?.name ?? '');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    meal?.ingredients.length
      ? meal.ingredients.map((i) => ({ key: i.id, name: i.name, quantity: i.quantity, unit: i.unit }))
      : [{ key: uuid(), name: '', quantity: 1, unit: state.settings.defaultUnit }],
  );
  const [error, setError] = useState('');

  function updateIngredient(key: string, updates: Partial<DraftIngredient>) {
    setIngredients((prev) => prev.map((ing) => (ing.key === key ? { ...ing, ...updates } : ing)));
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { key: uuid(), name: '', quantity: 1, unit: state.settings.defaultUnit }]);
  }

  function removeIngredientRow(key: string) {
    setIngredients((prev) => prev.filter((ing) => ing.key !== key));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = ingredients.filter((i) => i.name.trim());
    if (!name.trim()) {
      setError('Meal name is required.');
      return;
    }
    if (cleaned.length === 0) {
      setError('Add at least one ingredient.');
      return;
    }

    const finalIngredients: MealIngredient[] = cleaned.map((i) => {
      const match = state.inventory.find((inv) => inv.name.trim().toLowerCase() === i.name.trim().toLowerCase());
      return {
        id: uuid(),
        inventoryItemId: match?.id ?? null,
        name: i.name.trim(),
        quantity: Math.max(0, i.quantity),
        unit: i.unit,
      };
    });

    const now = new Date().toISOString();
    if (isEdit && meal) {
      dispatch({ type: 'UPDATE_MEAL', id: meal.id, updates: { name: name.trim(), ingredients: finalIngredients } });
    } else {
      dispatch({
        type: 'ADD_MEAL',
        meal: { id: uuid(), name: name.trim(), ingredients: finalIngredients, createdAt: now, updatedAt: now },
      });
    }
    onClose();
  }

  return (
    <Modal
      title={isEdit ? 'Edit Meal' : 'New Meal'}
      onClose={onClose}
      maxWidthClass="max-w-xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="meal-form">
            Save Meal
          </Button>
        </>
      }
    >
      <form id="meal-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Meal name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spaghetti with Meat Sauce"
            autoFocus
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Ingredients</span>
            <button
              type="button"
              onClick={addIngredientRow}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              <Plus size={15} /> Add ingredient
            </button>
          </div>

          <datalist id="inventory-names">
            {state.inventory.map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>

          <div className="space-y-2">
            {ingredients.map((ing) => (
              <div key={ing.key} className="flex items-center gap-2">
                <input
                  className={`${inputClass} flex-1`}
                  list="inventory-names"
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(ing.key, { name: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  className={`${inputClass} w-20`}
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(ing.key, { quantity: Number(e.target.value) })}
                />
                <select
                  className={`${selectClass} w-28`}
                  value={ing.unit}
                  onChange={(e) => updateIngredient(ing.key, { unit: e.target.value as Unit })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {UNIT_LABELS[u]}
                    </option>
                  ))}
                </select>
                <IconButton
                  label="Remove ingredient"
                  onClick={() => removeIngredientRow(ing.key)}
                  disabled={ingredients.length === 1}
                >
                  <Trash2 size={15} />
                </IconButton>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
