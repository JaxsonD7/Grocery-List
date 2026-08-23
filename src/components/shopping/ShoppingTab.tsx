import { lazy, Suspense, useMemo, useState } from 'react';
import { Barcode, ListChecks, Plus, Store } from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import type { ShoppingListItem } from '../../types';
import type { Tab } from '../../App';
import { ShoppingItemRow } from './ShoppingItemRow';
import { ShoppingItemFormModal } from './ShoppingItemFormModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Buttons';

const BarcodeScannerModal = lazy(() =>
  import('../scanner/BarcodeScannerModal').then((m) => ({ default: m.BarcodeScannerModal })),
);

const NO_STORE = 'No store set';

export function ShoppingTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { state, dispatch } = useAppState();
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null | undefined>(undefined);
  const [deletingItem, setDeletingItem] = useState<ShoppingListItem | null>(null);
  const [scanning, setScanning] = useState(false);

  const visible = useMemo(() => state.shoppingList.filter((i) => !i.inCart), [state.shoppingList]);
  const unchecked = visible.filter((i) => !i.checked);
  const checked = visible.filter((i) => i.checked);
  const cartCount = state.cart.length;

  // Only worth grouping once someone's actually using the store field —
  // otherwise everything would land in one "No store set" bucket and just
  // add a redundant header above the same flat list.
  const groupedByStore = useMemo(() => {
    const groups = new Map<string, ShoppingListItem[]>();
    for (const item of unchecked) {
      const key = item.store || NO_STORE;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return groups.size > 1 ? groups : null;
  }, [unchecked]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Shopping List</h1>
          <p className="text-sm text-neutral-500">
            {unchecked.length} to buy{checked.length > 0 ? ` · ${checked.length} checked off` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cartCount > 0 && (
            <Button variant="secondary" onClick={() => onNavigate('cart')}>
              View Cart ({cartCount})
            </Button>
          )}
          <Button variant="secondary" icon={<Barcode size={17} />} onClick={() => setScanning(true)}>
            Scan Barcode
          </Button>
          <Button variant="primary" icon={<Plus size={17} />} onClick={() => setEditingItem(null)}>
            Add Item
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={36} />}
          title="Shopping list is empty"
          description="Add items manually, or add low-stock items from the Pantry tab."
          action={
            <Button variant="primary" icon={<Plus size={17} />} onClick={() => setEditingItem(null)}>
              Add Item
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {unchecked.length > 0 && (
            <div className="space-y-4">
              {groupedByStore
                ? Array.from(groupedByStore.entries()).map(([store, items]) => (
                    <div key={store}>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        <Store size={13} /> {store} · {items.length}
                      </p>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <ShoppingItemRow
                            key={item.id}
                            item={item}
                            onEdit={() => setEditingItem(item)}
                            onDelete={() => setDeletingItem(item)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                : (
                    <div className="space-y-2">
                      {unchecked.map((item) => (
                        <ShoppingItemRow
                          key={item.id}
                          item={item}
                          onEdit={() => setEditingItem(item)}
                          onDelete={() => setDeletingItem(item)}
                        />
                      ))}
                    </div>
                  )}
            </div>
          )}

          {checked.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Checked off</p>
              <div className="space-y-2">
                {checked.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => setDeletingItem(item)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {editingItem !== undefined && (
        <ShoppingItemFormModal item={editingItem ?? undefined} onClose={() => setEditingItem(undefined)} />
      )}

      {scanning && (
        <Suspense fallback={null}>
          <BarcodeScannerModal context="shopping" onClose={() => setScanning(false)} onNavigate={onNavigate} />
        </Suspense>
      )}

      {deletingItem && (
        <ConfirmDialog
          title="Remove item?"
          message={`Remove "${deletingItem.name}" from your shopping list?`}
          confirmLabel="Remove"
          danger
          onCancel={() => setDeletingItem(null)}
          onConfirm={() => {
            dispatch({ type: 'DELETE_SHOPPING_ITEM', id: deletingItem.id });
            setDeletingItem(null);
          }}
        />
      )}
    </div>
  );
}
