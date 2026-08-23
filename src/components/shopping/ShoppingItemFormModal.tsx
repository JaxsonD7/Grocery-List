import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Buttons';
import { Field, inputClass, selectClass } from '../ui/FormField';
import { CATEGORIES, CATEGORY_LABELS, UNITS, UNIT_LABELS, type Category, type ShoppingListItem, type Unit } from '../../types';
import { useAppState } from '../../context/AppContext';
import { knownStores } from '../../lib/stores';

interface ShoppingItemFormModalProps {
  item?: ShoppingListItem;
  onClose: () => void;
}

export function ShoppingItemFormModal({ item, onClose }: ShoppingItemFormModalProps) {
  const { state, dispatch } = useAppState();
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? '');
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [unit, setUnit] = useState<Unit>(item?.unit ?? state.settings.defaultUnit);
  const [category, setCategory] = useState<Category>(item?.category ?? state.settings.defaultCategory);
  const [store, setStore] = useState(item?.store ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }
    const store_ = store.trim() || null;
    if (isEdit && item) {
      dispatch({
        type: 'UPDATE_SHOPPING_ITEM',
        id: item.id,
        updates: { name: name.trim(), quantity, unit, category, notes: notes.trim(), store: store_ },
      });
    } else {
      dispatch({
        type: 'ADD_SHOPPING_ITEM',
        item: {
          name: name.trim(),
          quantity,
          unit,
          category,
          notes: notes.trim(),
          source: 'manual',
          linkedInventoryItemId: null,
          store: store_,
        },
      });
    }
    onClose();
  }

  return (
    <Modal
      title={isEdit ? 'Edit Shopping Item' : 'Add Shopping Item'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="shopping-item-form">
            Save
          </Button>
        </>
      }
    >
      <form id="shopping-item-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Item name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Coffee filters" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <input
              type="number"
              min={0}
              step="any"
              className={inputClass}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </Field>
          <Field label="Unit">
            <select className={selectClass} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Store (optional)">
            <input
              className={inputClass}
              list="shopping-known-stores"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="e.g. Costco"
            />
            <datalist id="shopping-known-stores">
              {knownStores(state).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field label="Notes (optional)">
          <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
