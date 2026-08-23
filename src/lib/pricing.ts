import type { InventoryItem } from '../types';
import { UNIT_LABELS } from '../types';

/** "$2.50/lb" style label computed from total price ÷ total weight — there's
 * no separate manually-entered per-unit price field, it's always derived. */
export function pricePerUnitLabel(item: Pick<InventoryItem, 'price' | 'weight' | 'weightUnit'>): string | null {
  if (item.price == null || !item.weight || item.weight <= 0) return null;
  const perUnit = item.price / item.weight;
  const unitLabel = item.weightUnit ? UNIT_LABELS[item.weightUnit] : 'unit';
  return `$${perUnit.toFixed(2)}/${unitLabel}`;
}
