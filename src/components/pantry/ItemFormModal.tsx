import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Camera, X } from 'lucide-react';
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
  WEIGHT_UNITS,
  type Category,
  type InventoryItem,
  type Location,
  type LowStockBehavior,
  type Unit,
} from '../../types';
import { useAppState } from '../../context/AppContext';
import { knownStores } from '../../lib/stores';
import { fileToCompressedDataUrl } from '../../lib/image';

interface ItemFormModalProps {
  item?: InventoryItem;
  onClose: () => void;
}

export function ItemFormModal({ item, onClose }: ItemFormModalProps) {
  const { state, dispatch } = useAppState();
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? '');
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [store, setStore] = useState(item?.store ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? state.settings.defaultCategory);
  const [location, setLocation] = useState<Location>(item?.location ?? state.settings.defaultLocation);
  const [trackByPercent, setTrackByPercent] = useState(item?.trackByPercent ?? false);
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [unit, setUnit] = useState<Unit>(item?.unit ?? state.settings.defaultUnit);
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '');
  const [weight, setWeight] = useState(item?.weight != null ? String(item.weight) : '');
  const [weightUnit, setWeightUnit] = useState<Unit | ''>(item?.weightUnit ?? '');
  const [threshold, setThreshold] = useState(item?.lowStockThreshold ?? state.settings.defaultLowStockThreshold);
  const [behavior, setBehavior] = useState<LowStockBehavior>(
    item?.lowStockBehavior ?? state.settings.defaultLowStockBehavior,
  );
  const [expiration, setExpiration] = useState(item?.expirationDate ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(item?.photoUrl ?? null);
  const [photoError, setPhotoError] = useState('');
  const [error, setError] = useState('');

  const priceNum = price.trim() === '' ? null : Number(price);
  const weightNum = weight.trim() === '' ? null : Number(weight);
  const pricePerUnit = priceNum != null && weightNum ? priceNum / weightNum : null;

  function toggleTrackByPercent(next: boolean) {
    setTrackByPercent(next);
    // Percent and count-based quantity aren't on the same scale, so switching
    // modes resets to a sensible default instead of carrying over a stale number.
    if (next) {
      setQuantity(item?.trackByPercent ? item.quantity : 100);
      if (!item?.trackByPercent) setThreshold(20);
    } else if (item?.trackByPercent) {
      setQuantity(1);
      setThreshold(state.settings.defaultLowStockThreshold);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhotoUrl(await fileToCompressedDataUrl(file));
      setPhotoError('');
    } catch {
      setPhotoError('Could not load that photo — try a different image.');
    }
  }

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
    if (priceNum != null && (Number.isNaN(priceNum) || priceNum < 0)) {
      setError('Price must be a positive number.');
      return;
    }
    if (weightNum != null && (Number.isNaN(weightNum) || weightNum < 0)) {
      setError('Weight must be a positive number.');
      return;
    }

    const shared = {
      name: name.trim(),
      brand: brand.trim() || null,
      store: store.trim() || null,
      category,
      location,
      quantity: trackByPercent ? Math.min(100, Math.max(0, quantity)) : quantity,
      unit,
      trackByPercent,
      price: priceNum,
      weight: weightNum,
      weightUnit: weightUnit || null,
      lowStockThreshold: threshold,
      lowStockBehavior: behavior,
      expirationDate: expiration || null,
      notes: notes.trim(),
      photoUrl,
    };

    if (isEdit && item) {
      dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: shared });
    } else {
      const now = new Date().toISOString();
      const newItem: InventoryItem = { id: uuid(), ...shared, createdAt: now, updatedAt: now };
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
        <Field label="Photo (optional)">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera size={22} className="text-neutral-400" />
              )}
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <Camera size={14} />
                {photoUrl ? 'Change Photo' : 'Add Photo'}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <X size={12} /> Remove photo
                </button>
              )}
            </div>
          </div>
          {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
        </Field>

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
          <Field label="Brand (optional)">
            <input className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Kirkland" />
          </Field>
          <Field label="Store purchased at (optional)">
            <input
              className={inputClass}
              list="pantry-known-stores"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="e.g. Costco"
            />
            <datalist id="pantry-known-stores">
              {knownStores(state).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
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

        <label className="flex items-center gap-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2.5">
          <input
            type="checkbox"
            className="h-4 w-4 accent-emerald-600"
            checked={trackByPercent}
            onChange={(e) => toggleTrackByPercent(e.target.checked)}
          />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            Track by % remaining instead of a count
            <span className="block text-xs text-neutral-500">Good for a bag, jar, or bottle you're using down</span>
          </span>
        </label>

        {trackByPercent ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currently remaining" hint={`${Math.round(quantity)}%`}>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                className="w-full accent-emerald-600"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </Field>
            <Field label="Restock as" hint="Unit added to the shopping list when it runs out">
              <select className={selectClass} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {UNIT_LABELS[u]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
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
        )}

        <div className="grid grid-cols-3 gap-3">
          <Field label="Price paid (optional)" hint="Total for this purchase">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${inputClass} pl-6`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </Field>
          <Field label="Total weight (optional)">
            <input
              type="number"
              min={0}
              step="any"
              className={inputClass}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </Field>
          <Field label="Weight unit">
            <select className={selectClass} value={weightUnit} onChange={(e) => setWeightUnit(e.target.value as Unit)}>
              <option value="">—</option>
              {WEIGHT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {pricePerUnit != null && weightUnit && (
          <p className="-mt-2 text-xs text-neutral-500">≈ ${pricePerUnit.toFixed(2)} per {UNIT_LABELS[weightUnit]}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={trackByPercent ? 'Low-stock threshold' : 'Low-stock threshold'}
            hint={trackByPercent ? 'Flag as low at or below this % remaining' : 'Flag as low at or below this'}
          >
            <input
              type="number"
              min={0}
              max={trackByPercent ? 100 : undefined}
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
