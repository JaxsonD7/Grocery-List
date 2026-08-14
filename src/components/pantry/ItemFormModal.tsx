import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Buttons';
import { Field, inputClass, selectClass } from '../ui/FormField';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  LOCATIONS,
  LOCATION_LABELS,
  UNITS,
  UNIT_LABELS,
  type Category,
  type InventoryItem,
  type Location,
  type LowStockBehavior,
  type Unit,
} from '../../types';
import { useAppState } from '../../context/AppContext';

interface ItemFormModalProps {
  item?: InventoryItem;
  onClose: () => void;
}

export function ItemFormModal({ item, onClose }: ItemFormModalProps) {
  const { state, dispatch } = useAppState();
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? state.settings.defaultCategory);
  const [location, setLocation] = useState<Location>(item?.location ?? state.settings.defaultLocation);
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [unit, setUnit] = useState<Unit>(item?.unit ?? state.settings.defaultUnit);
  const [threshold, setThreshold] = useState(item?.lowStockThreshold ?? state.settings.defaultLowStockThreshold);
  const [behavior, setBehavior] = useState<LowStockBehavior>(
    item?.lowStockBehavior ?? state.settings.defaultLowStockBehavior,
  );
  const [expiration, setExpiration] = useState(item?.expirationDate ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }
    if (quantity < 0 || threshold < 0) {
      setError('Quantity and threshold cannot be negative.');
      return;
    }

    if (isEdit && item) {
      dispatch({
        type: 'UPDATE_ITEM',
        id: item.id,
        updates: {
          name: name.trim(),
          category,
          location,
          quantity,
          unit,
          lowStockThreshold: threshold,
          lowStockBehavior: behavior,
          expirationDate: expiration || null,
          notes: notes.trim(),
        },
      });
    } else {
      const now = new Date().toISOString();
      const newItem: InventoryItem = {
        id: uuid(),
        name: name.trim(),
        category,
        location,
        quantity,
        unit,
        lowStockThreshold: threshold,
        lowStockBehavior: behavior,
        expirationDate: expiration || null,
        notes: notes.trim(),
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_ITEM', item: newItem });
    }
    onClose();
  }

  return (
    <Modal
      title={isEdit ? 'Edit Item' : 'Add Item'}
      onClose={onClose}
      footer={<ItemFormFooter onCancel={onClose} />}
    >
      <form id="item-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Item name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Eggs"
            autoFocus
          />
        </Field>

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
          <Field label="Storage location">
            <select className={selectClass} value={location} onChange={(e) => setLocation(e.target.value as Location)}>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {LOCATION_LABELS[l]}
                </option>
              ))}
            </select>
          </Field>
        </div>

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
          <Field label="Low-stock threshold" hint="Flag as low at or below this">
            <input
              type="number"
              min={0}
              step="any"
              className={inputClass}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </Field>
          <Field label="Low-stock behavior">
            <select
              className={selectClass}
              value={behavior}
              onChange={(e) => setBehavior(e.target.value as LowStockBehavior)}
            >
              <option value="recommend">Recommend</option>
              <option value="auto_add">Auto-add to list</option>
              <option value="ignore">Do nothing</option>
            </select>
          </Field>
        </div>

        <Field label="Expiration date (optional)">
          <input
            type="date"
            className={inputClass}
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
          />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            className={inputClass}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details..."
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

export function ItemFormFooter({ formId = 'item-form', onCancel }: { formId?: string; onCancel: () => void }) {
  return (
    <>
      <Button variant="secondary" type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" form={formId}>
        Save
      </Button>
    </>
  );
}
