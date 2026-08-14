import { v4 as uuid } from 'uuid';
import type { Category, ShoppingListItem, ShoppingListSource, Unit } from '../types';

export interface ShoppingListInput {
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  notes?: string;
  source: ShoppingListSource;
  linkedInventoryItemId?: string | null;
}

function sameItem(a: ShoppingListItem, b: ShoppingListInput): boolean {
  if (a.linkedInventoryItemId && b.linkedInventoryItemId) {
    return a.linkedInventoryItemId === b.linkedInventoryItemId;
  }
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && a.unit === b.unit;
}

const SOURCE_PRIORITY: Record<ShoppingListSource, number> = {
  manual: 3,
  auto: 2,
  recommended: 1,
};

/** Adds an item to the shopping list, merging quantities into an existing
 * unpurchased entry for the same item instead of creating a duplicate row. */
export function mergeIntoShoppingList(
  list: ShoppingListItem[],
  incoming: ShoppingListInput,
): ShoppingListItem[] {
  const existingIndex = list.findIndex((item) => !item.checked && sameItem(item, incoming));

  if (existingIndex === -1) {
    const newItem: ShoppingListItem = {
      id: uuid(),
      name: incoming.name,
      quantity: incoming.quantity,
      unit: incoming.unit,
      category: incoming.category,
      notes: incoming.notes ?? '',
      source: incoming.source,
      linkedInventoryItemId: incoming.linkedInventoryItemId ?? null,
      inCart: false,
      checked: false,
      createdAt: new Date().toISOString(),
    };
    return [...list, newItem];
  }

  return list.map((item, i) => {
    if (i !== existingIndex) return item;
    const bestSource =
      SOURCE_PRIORITY[incoming.source] > SOURCE_PRIORITY[item.source] ? incoming.source : item.source;
    return {
      ...item,
      quantity: item.quantity + incoming.quantity,
      notes: incoming.notes ? incoming.notes : item.notes,
      source: bestSource,
      linkedInventoryItemId: item.linkedInventoryItemId ?? incoming.linkedInventoryItemId ?? null,
    };
  });
}

/** True when an unpurchased shopping list entry already tracks this inventory item,
 * used to suppress repeat low-stock recommendations for the same item. */
export function isAlreadyOnShoppingList(
  list: ShoppingListItem[],
  inventoryItemId: string,
): boolean {
  return list.some((item) => !item.checked && item.linkedInventoryItemId === inventoryItemId);
}
