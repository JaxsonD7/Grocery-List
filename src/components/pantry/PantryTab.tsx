import { lazy, Suspense, useMemo, useState } from 'react';
import { Barcode, Plus, Refrigerator, Search } from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import type { Category, InventoryItem, Location } from '../../types';
import { CATEGORIES, CATEGORY_LABELS, LOCATIONS, LOCATION_LABELS } from '../../types';
import type { Tab } from '../../App';
import { ItemCard } from './ItemCard';
import { ItemFormModal } from './ItemFormModal';
import { OnboardingHint } from './OnboardingHint';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Buttons';
import { inputClass, selectClass } from '../ui/FormField';
import { getItemFlags } from '../../lib/status';

const BarcodeScannerModal = lazy(() =>
  import('../scanner/BarcodeScannerModal').then((m) => ({ default: m.BarcodeScannerModal })),
);

type SortMode = 'name' | 'status';

export function PantryTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { state, dispatch } = useAppState();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [location, setLocation] = useState<Location | 'all'>('all');
  const [sort, setSort] = useState<SortMode>('status');
  const [editingItem, setEditingItem] = useState<InventoryItem | null | undefined>(undefined);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [scanning, setScanning] = useState(false);

  const filtered = useMemo(() => {
    let items = state.inventory.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (location !== 'all' && item.location !== location) return false;
      return true;
    });

    if (sort === 'name') {
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      items = [...items].sort((a, b) => statusRank(a) - statusRank(b) || a.name.localeCompare(b.name));
    }
    return items;
  }, [state.inventory, search, category, location, sort]);

  return (
    <div className="space-y-4">
      <OnboardingHint />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Pantry &amp; Fridge</h1>
          <p className="text-sm text-neutral-500">
            {state.inventory.length} item{state.inventory.length === 1 ? '' : 's'} tracked
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Barcode size={17} />} onClick={() => setScanning(true)}>
            Scan Barcode
          </Button>
          <Button variant="primary" icon={<Plus size={17} />} onClick={() => setEditingItem(null)}>
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as Category | 'all')}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select className={selectClass} value={location} onChange={(e) => setLocation(e.target.value as Location | 'all')}>
          <option value="all">All locations</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {LOCATION_LABELS[l]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm text-neutral-500">
        <label htmlFor="sort" className="shrink-0">
          Sort:
        </label>
        <select
          id="sort"
          className={`${selectClass} w-auto py-1.5`}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
        >
          <option value="status">Needs attention first</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Refrigerator size={36} />}
          title={state.inventory.length === 0 ? 'Your pantry is empty' : 'No items match your filters'}
          description={
            state.inventory.length === 0
              ? 'Add your first item to start tracking what you have on hand.'
              : 'Try adjusting your search or filters.'
          }
          action={
            state.inventory.length === 0 ? (
              <Button variant="primary" icon={<Plus size={17} />} onClick={() => setEditingItem(null)}>
                Add Item
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditingItem(item)}
              onDelete={() => setDeletingItem(item)}
            />
          ))}
        </div>
      )}

      {editingItem !== undefined && (
        <ItemFormModal item={editingItem ?? undefined} onClose={() => setEditingItem(undefined)} />
      )}

      {scanning && (
        <Suspense fallback={null}>
          <BarcodeScannerModal context="pantry" onClose={() => setScanning(false)} onNavigate={onNavigate} />
        </Suspense>
      )}

      {deletingItem && (
        <ConfirmDialog
          title="Delete item?"
          message={`Remove "${deletingItem.name}" from your inventory? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDeletingItem(null)}
          onConfirm={() => {
            dispatch({ type: 'DELETE_ITEM', id: deletingItem.id });
            setDeletingItem(null);
          }}
        />
      )}
    </div>
  );
}

function statusRank(item: InventoryItem): number {
  const flags = getItemFlags(item);
  if (flags.expired) return 0;
  if (flags.outOfStock) return 1;
  if (flags.low) return 2;
  if (flags.expiringSoon) return 3;
  return 4;
}
