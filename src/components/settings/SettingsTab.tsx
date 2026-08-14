import { useState } from 'react';
import { RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  LOCATIONS,
  LOCATION_LABELS,
  UNITS,
  UNIT_LABELS,
  type Category,
  type Location,
  type LowStockBehavior,
  type Unit,
} from '../../types';
import { Field, inputClass, selectClass } from '../ui/FormField';
import { Button } from '../ui/Buttons';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function SettingsTab() {
  const { state, dispatch } = useAppState();
  const { settings } = state;
  const [confirmingReset, setConfirmingReset] = useState(false);

  function update<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    dispatch({ type: 'UPDATE_SETTINGS', updates: { [key]: value } });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Settings</h1>
        <p className="text-sm text-neutral-500">Configure defaults for new items and low-stock handling</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <SettingsIcon size={17} className="text-emerald-600" />
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Low-stock behavior</h2>
        </div>
        <p className="text-sm text-neutral-500">
          Choose what happens by default when a new item's quantity drops to or below its threshold. You can
          override this per item when adding or editing it.
        </p>
        <Field label="Default low-stock behavior">
          <select
            className={selectClass}
            value={settings.defaultLowStockBehavior}
            onChange={(e) => update('defaultLowStockBehavior', e.target.value as LowStockBehavior)}
          >
            <option value="recommend">Recommend — show a suggestion, let me add it</option>
            <option value="auto_add">Auto-add — add to shopping list automatically</option>
            <option value="ignore">Do nothing</option>
          </select>
        </Field>
        <Field label="Default low-stock threshold" hint="Used when adding a new item unless changed">
          <input
            type="number"
            min={0}
            step="any"
            className={inputClass}
            value={settings.defaultLowStockThreshold}
            onChange={(e) => update('defaultLowStockThreshold', Number(e.target.value))}
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Defaults for new items</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Default category">
            <select
              className={selectClass}
              value={settings.defaultCategory}
              onChange={(e) => update('defaultCategory', e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default location">
            <select
              className={selectClass}
              value={settings.defaultLocation}
              onChange={(e) => update('defaultLocation', e.target.value as Location)}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {LOCATION_LABELS[l]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default unit">
            <select
              className={selectClass}
              value={settings.defaultUnit}
              onChange={(e) => update('defaultUnit', e.target.value as Unit)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-5 space-y-3">
        <h2 className="font-semibold text-red-900 dark:text-red-300">Data</h2>
        <p className="text-sm text-red-800/80 dark:text-red-300/70">
          Permanently clear all inventory, meals, shopping list, cart, and history. This can't be undone.
        </p>
        <Button variant="danger" icon={<RotateCcw size={16} />} onClick={() => setConfirmingReset(true)}>
          Clear All Data
        </Button>
      </section>

      {confirmingReset && (
        <ConfirmDialog
          title="Clear all data?"
          message="This permanently removes your pantry, meals, shopping list, cart, and history, and starts fresh from empty. This can't be undone."
          confirmLabel="Clear Data"
          danger
          onCancel={() => setConfirmingReset(false)}
          onConfirm={() => {
            dispatch({ type: 'RESET_DATA' });
            setConfirmingReset(false);
          }}
        />
      )}
    </div>
  );
}
