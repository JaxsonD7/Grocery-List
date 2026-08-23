import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InventoryItem } from '../types';
import { CATEGORY_LABELS, LOCATION_LABELS, UNIT_LABELS } from '../types';

export type ExportScope = 'pantry' | 'fridge' | 'all';

const SCOPE_LABEL: Record<ExportScope, string> = {
  pantry: 'Pantry',
  fridge: 'Fridge',
  all: 'Full Inventory',
};

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

/** Generates and downloads a PDF table of inventory items. Loaded via a
 * dynamic import at the call site so jsPDF (a sizeable library) is never
 * part of the app's normal eager bundle. */
export function exportInventoryToPdf(inventory: InventoryItem[], scope: ExportScope): void {
  const items = inventory
    .filter((item) => scope === 'all' || item.location === scope)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(SCOPE_LABEL[scope], 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`${items.length} item${items.length === 1 ? '' : 's'} · ${new Date().toLocaleDateString()}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [['Item', 'Brand', 'Category', 'Location', 'Qty', 'Price', 'Store', 'Expires']],
    body: items.map((item) => [
      item.name,
      item.brand ?? '',
      CATEGORY_LABELS[item.category],
      LOCATION_LABELS[item.location],
      item.trackByPercent ? `${formatQty(item.quantity)}%` : `${formatQty(item.quantity)} ${UNIT_LABELS[item.unit]}`,
      item.price != null ? `$${item.price.toFixed(2)}` : '',
      item.store ?? '',
      item.expirationDate ? new Date(`${item.expirationDate}T00:00:00`).toLocaleDateString() : '',
    ]),
    headStyles: { fillColor: [5, 150, 105] },
    styles: { fontSize: 9 },
  });

  const filename = `${scope}-inventory-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
