# Pantry Tracker

A mobile-friendly pantry, fridge, and freezer inventory tracker for households. Track what food you have, plan meals and subtract ingredients when you cook, manage a shopping list, and check out items into a cart — all persisted locally in the browser.

## Features

- **Pantry & Fridge** — track items by category, storage location, quantity, unit, low-stock threshold, and expiration date. Quick +/- quantity adjustments, search, and filtering. Low-stock and expired items are visually flagged.
- **Meals** — build meals from ingredients, mark them as made to subtract inventory automatically, with a warning when stock is insufficient. Recently-made meals are tracked in history.
- **Shopping List** — manually add items or accept low-stock recommendations, with duplicate-safe merging. Includes a barcode scanner (camera or manual entry) that looks up products via the Open Food Facts database and shows a health score, pros/cons, and sourcing info before adding to your cart.
- **Cart** — move items from the shopping list to the cart while shopping, then check out to add them back into inventory.
- **Settings** — configure default low-stock behavior, thresholds, categories, and units, or reset to sample data.

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
