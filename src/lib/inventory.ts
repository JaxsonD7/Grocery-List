import { v4 as uuid } from 'uuid';
import type { AppSettings, Category, InventoryItem, Location, Unit } from '../types';

export interface PurchaseInput {
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  notes?: string;
  linkedInventoryItemId?: string | null;
}

function findMatch(inventory: InventoryItem[], purchase: PurchaseInput): InventoryItem | undefined {
  if (purchase.linkedInventoryItemId) {
    const byId = inventory.find((i) => i.id === purchase.linkedInventoryItemId);
    if (byId) return byId;
  }
  return inventory.find((i) => i.name.trim().toLowerCase() === purchase.name.trim().toLowerCase());
}

/** Adds a purchased item back into inventory: increases quantity if it already
 * exists, otherwise creates a new inventory item using the household defaults. */
export function mergePurchaseIntoInventory(
  inventory: InventoryItem[],
  purchase: PurchaseInput,
  settings: AppSettings,
  defaultLocation: Location = settings.defaultLocation,
): InventoryItem[] {
  const match = findMatch(inventory, purchase);
  const now = new Date().toISOString();

  if (match) {
    return inventory.map((item) =>
      item.id === match.id
        ? { ...item, quantity: item.quantity + purchase.quantity, updatedAt: now }
        : item,
    );
  }

  const newItem: InventoryItem = {
    id: uuid(),
    name: purchase.name,
    category: purchase.category,
    location: defaultLocation,
    quantity: purchase.quantity,
    unit: purchase.unit,
    lowStockThreshold: settings.defaultLowStockThreshold,
    lowStockBehavior: settings.defaultLowStockBehavior,
    expirationDate: null,
    notes: purchase.notes ?? '',
    createdAt: now,
    updatedAt: now,
  };
  return [...inventory, newItem];
}
