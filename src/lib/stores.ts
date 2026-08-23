import type { AppState } from '../types';

/** Every distinct store name already typed on an inventory or shopping list
 * item, for autocompleting the "store" field instead of requiring separate
 * store setup. */
export function knownStores(state: AppState): string[] {
  const set = new Set<string>();
  for (const item of state.inventory) if (item.store) set.add(item.store);
  for (const item of state.shoppingList) if (item.store) set.add(item.store);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
