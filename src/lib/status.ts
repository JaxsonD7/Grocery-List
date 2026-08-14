import type { InventoryItem } from '../types';

export function isExpired(item: InventoryItem): boolean {
  if (!item.expirationDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(item.expirationDate + 'T00:00:00');
  return exp.getTime() < today.getTime();
}

export function isExpiringSoon(item: InventoryItem, withinDays = 3): boolean {
  if (!item.expirationDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(item.expirationDate + 'T00:00:00');
  const diffDays = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= withinDays;
}

export function isOutOfStock(item: InventoryItem): boolean {
  return item.quantity <= 0;
}

export function isLowStock(item: InventoryItem): boolean {
  return item.quantity > 0 && item.quantity <= item.lowStockThreshold;
}

export interface ItemFlags {
  expired: boolean;
  expiringSoon: boolean;
  outOfStock: boolean;
  low: boolean;
}

export function getItemFlags(item: InventoryItem): ItemFlags {
  return {
    expired: isExpired(item),
    expiringSoon: isExpiringSoon(item),
    outOfStock: isOutOfStock(item),
    low: isLowStock(item),
  };
}
