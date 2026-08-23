export type Category =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'pantry'
  | 'frozen'
  | 'snacks'
  | 'drinks'
  | 'spices'
  | 'household'
  | 'other';

export const CATEGORIES: Category[] = [
  'produce',
  'dairy',
  'meat',
  'pantry',
  'frozen',
  'snacks',
  'drinks',
  'spices',
  'household',
  'other',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  produce: 'Produce',
  dairy: 'Dairy',
  meat: 'Meat',
  pantry: 'Pantry',
  frozen: 'Frozen',
  snacks: 'Snacks',
  drinks: 'Drinks',
  spices: 'Spices',
  household: 'Household',
  other: 'Other',
};

export type Location = 'pantry' | 'fridge' | 'freezer' | 'other';

export const LOCATIONS: Location[] = ['pantry', 'fridge', 'freezer', 'other'];

export const LOCATION_LABELS: Record<Location, string> = {
  pantry: 'Pantry',
  fridge: 'Fridge',
  freezer: 'Freezer',
  other: 'Other',
};

export type Unit =
  | 'count'
  | 'oz'
  | 'lb'
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'cups'
  | 'tbsp'
  | 'tsp'
  | 'package'
  | 'bottle'
  | 'can'
  | 'box'
  | 'bag'
  | 'dozen';

export const UNITS: Unit[] = [
  'count',
  'oz',
  'lb',
  'g',
  'kg',
  'ml',
  'l',
  'cups',
  'tbsp',
  'tsp',
  'package',
  'bottle',
  'can',
  'box',
  'bag',
  'dozen',
];

export const UNIT_LABELS: Record<Unit, string> = {
  count: 'count',
  oz: 'oz',
  lb: 'lb',
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'L',
  cups: 'cups',
  tbsp: 'tbsp',
  tsp: 'tsp',
  package: 'package',
  bottle: 'bottle',
  can: 'can',
  box: 'box',
  bag: 'bag',
  dozen: 'dozen',
};

export type LowStockBehavior = 'recommend' | 'auto_add' | 'ignore';

// Units a price-per-unit or "total weight/size" figure is normally quoted in —
// a subset of Unit that excludes container-style units (bag, box, dozen, ...).
export const WEIGHT_UNITS: Unit[] = ['oz', 'lb', 'g', 'kg', 'ml', 'l'];

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  location: Location;
  quantity: number;
  unit: Unit;
  lowStockThreshold: number;
  lowStockBehavior: LowStockBehavior;
  expirationDate: string | null; // ISO date string
  notes: string;
  barcode?: string | null;
  brand?: string | null;
  store?: string | null; // where it was purchased
  price?: number | null; // total price paid for this purchase
  weight?: number | null; // optional total weight/size as purchased, e.g. 2 for a "2 lb" bag
  weightUnit?: Unit | null; // unit `weight` is measured in; price ÷ weight gives price-per-unit
  // When true, `quantity` (0-100) and `lowStockThreshold` are read as a percent
  // remaining instead of a literal count — for items like a bag or jar that are
  // easier to estimate as "half full" than as a precise unit count.
  trackByPercent?: boolean;
  photoUrl?: string | null; // compressed data URL, stored inline (no file backend)
  createdAt: string;
  updatedAt: string;
}

export interface MealIngredient {
  id: string;
  inventoryItemId: string | null;
  name: string;
  quantity: number;
  unit: Unit;
}

export interface Meal {
  id: string;
  name: string;
  ingredients: MealIngredient[];
  createdAt: string;
  updatedAt: string;
}

export type ShoppingListSource = 'manual' | 'recommended' | 'auto';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  notes: string;
  source: ShoppingListSource;
  linkedInventoryItemId: string | null;
  inCart: boolean;
  checked: boolean;
  store?: string | null; // which store to buy this at
  createdAt: string;
}

export interface CartItem {
  id: string;
  shoppingListItemId: string | null;
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  notes: string;
  linkedInventoryItemId: string | null;
  store?: string | null;
}

export interface MealHistoryItem {
  id: string;
  mealId: string;
  mealName: string;
  madeAt: string;
  ingredientsSubtracted: {
    name: string;
    quantity: number;
    unit: Unit;
  }[];
}

export interface AppSettings {
  defaultLowStockBehavior: LowStockBehavior;
  defaultUnit: Unit;
  defaultCategory: Category;
  defaultLocation: Location;
  defaultLowStockThreshold: number;
}

export interface AppState {
  inventory: InventoryItem[];
  meals: Meal[];
  shoppingList: ShoppingListItem[];
  cart: CartItem[];
  mealHistory: MealHistoryItem[];
  settings: AppSettings;
}

export type ItemStatus = 'out' | 'expired' | 'low' | 'in_stock';
