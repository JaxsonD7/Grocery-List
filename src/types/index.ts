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
