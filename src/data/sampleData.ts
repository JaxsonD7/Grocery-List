import { v4 as uuid } from 'uuid';
import type {
  AppSettings,
  AppState,
  CartItem,
  InventoryItem,
  Meal,
  MealHistoryItem,
  ShoppingListItem,
} from '../types';

function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function isoNow(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultLowStockBehavior: 'recommend',
  defaultUnit: 'count',
  defaultCategory: 'pantry',
  defaultLocation: 'pantry',
  defaultLowStockThreshold: 2,
};

function makeInventory(): InventoryItem[] {
  const base: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastRecommendedAt'>[] = [
    {
      name: 'Eggs',
      category: 'dairy',
      location: 'fridge',
      quantity: 12,
      unit: 'count',
      lowStockThreshold: 3,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(21),
      notes: '',
    },
    {
      name: 'Milk',
      category: 'dairy',
      location: 'fridge',
      quantity: 1,
      unit: 'l',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(6),
      notes: 'Whole milk',
    },
    {
      name: 'Butter',
      category: 'dairy',
      location: 'fridge',
      quantity: 2,
      unit: 'package',
      lowStockThreshold: 1,
      lowStockBehavior: 'ignore',
      expirationDate: daysFromToday(45),
      notes: '',
    },
    {
      name: 'Cheddar Cheese',
      category: 'dairy',
      location: 'fridge',
      quantity: 1,
      unit: 'package',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(14),
      notes: '',
    },
    {
      name: 'Greek Yogurt',
      category: 'dairy',
      location: 'fridge',
      quantity: 2,
      unit: 'count',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(-3),
      notes: 'Check for spoilage before eating',
    },
    {
      name: 'Spinach',
      category: 'produce',
      location: 'fridge',
      quantity: 1,
      unit: 'bag',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(2),
      notes: '',
    },
    {
      name: 'Bananas',
      category: 'produce',
      location: 'pantry',
      quantity: 1,
      unit: 'count',
      lowStockThreshold: 2,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(4),
      notes: '',
    },
    {
      name: 'Onions',
      category: 'produce',
      location: 'pantry',
      quantity: 4,
      unit: 'count',
      lowStockThreshold: 2,
      lowStockBehavior: 'recommend',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Garlic',
      category: 'produce',
      location: 'pantry',
      quantity: 6,
      unit: 'count',
      lowStockThreshold: 2,
      lowStockBehavior: 'recommend',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Chicken Breast',
      category: 'meat',
      location: 'freezer',
      quantity: 2,
      unit: 'lb',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(90),
      notes: '',
    },
    {
      name: 'Ground Beef',
      category: 'meat',
      location: 'freezer',
      quantity: 1,
      unit: 'lb',
      lowStockThreshold: 1,
      lowStockBehavior: 'auto_add',
      expirationDate: daysFromToday(60),
      notes: '',
    },
    {
      name: 'Frozen Peas',
      category: 'frozen',
      location: 'freezer',
      quantity: 1,
      unit: 'bag',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(180),
      notes: '',
    },
    {
      name: 'Vanilla Ice Cream',
      category: 'frozen',
      location: 'freezer',
      quantity: 1,
      unit: 'box',
      lowStockThreshold: 0,
      lowStockBehavior: 'ignore',
      expirationDate: daysFromToday(120),
      notes: '',
    },
    {
      name: 'Rice',
      category: 'pantry',
      location: 'pantry',
      quantity: 4,
      unit: 'cups',
      lowStockThreshold: 2,
      lowStockBehavior: 'recommend',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Pasta',
      category: 'pantry',
      location: 'pantry',
      quantity: 16,
      unit: 'oz',
      lowStockThreshold: 8,
      lowStockBehavior: 'recommend',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Olive Oil',
      category: 'pantry',
      location: 'pantry',
      quantity: 1,
      unit: 'bottle',
      lowStockThreshold: 1,
      lowStockBehavior: 'ignore',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Canned Tomatoes',
      category: 'pantry',
      location: 'pantry',
      quantity: 3,
      unit: 'can',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(300),
      notes: '',
    },
    {
      name: 'Black Beans',
      category: 'pantry',
      location: 'pantry',
      quantity: 2,
      unit: 'can',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(300),
      notes: '',
    },
    {
      name: 'Bread',
      category: 'pantry',
      location: 'pantry',
      quantity: 1,
      unit: 'count',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(3),
      notes: 'Whole wheat loaf',
    },
    {
      name: 'Granola Bars',
      category: 'snacks',
      location: 'pantry',
      quantity: 0,
      unit: 'box',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Tortilla Chips',
      category: 'snacks',
      location: 'pantry',
      quantity: 1,
      unit: 'bag',
      lowStockThreshold: 1,
      lowStockBehavior: 'ignore',
      expirationDate: daysFromToday(60),
      notes: '',
    },
    {
      name: 'Orange Juice',
      category: 'drinks',
      location: 'fridge',
      quantity: 1,
      unit: 'bottle',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: daysFromToday(10),
      notes: '',
    },
    {
      name: 'Sparkling Water',
      category: 'drinks',
      location: 'pantry',
      quantity: 4,
      unit: 'can',
      lowStockThreshold: 2,
      lowStockBehavior: 'ignore',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Salt',
      category: 'spices',
      location: 'pantry',
      quantity: 1,
      unit: 'box',
      lowStockThreshold: 1,
      lowStockBehavior: 'ignore',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Black Pepper',
      category: 'spices',
      location: 'pantry',
      quantity: 1,
      unit: 'bottle',
      lowStockThreshold: 1,
      lowStockBehavior: 'ignore',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Cinnamon',
      category: 'spices',
      location: 'pantry',
      quantity: 1,
      unit: 'bottle',
      lowStockThreshold: 0,
      lowStockBehavior: 'ignore',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Paper Towels',
      category: 'household',
      location: 'other',
      quantity: 3,
      unit: 'count',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: null,
      notes: '',
    },
    {
      name: 'Dish Soap',
      category: 'household',
      location: 'other',
      quantity: 1,
      unit: 'bottle',
      lowStockThreshold: 1,
      lowStockBehavior: 'recommend',
      expirationDate: null,
      notes: '',
    },
  ];

  return base.map((item) => ({
    ...item,
    id: uuid(),
    createdAt: isoNow(-10),
    updatedAt: isoNow(-1),
  }));
}

export function createSampleState(): AppState {
  const inventory = makeInventory();
  const byName = (name: string) => {
    const item = inventory.find((i) => i.name === name);
    if (!item) throw new Error(`Sample data misconfigured: missing "${name}"`);
    return item;
  };

  const eggs = byName('Eggs');
  const butter = byName('Butter');
  const bread = byName('Bread');
  const pasta = byName('Pasta');
  const groundBeef = byName('Ground Beef');
  const tomatoes = byName('Canned Tomatoes');
  const onions = byName('Onions');
  const garlic = byName('Garlic');
  const chicken = byName('Chicken Breast');
  const peas = byName('Frozen Peas');
  const rice = byName('Rice');
  const granolaBars = byName('Granola Bars');

  const meals: Meal[] = [
    {
      id: uuid(),
      name: 'Scrambled Eggs & Toast',
      ingredients: [
        { id: uuid(), inventoryItemId: eggs.id, name: 'Eggs', quantity: 2, unit: 'count' },
        { id: uuid(), inventoryItemId: butter.id, name: 'Butter', quantity: 1, unit: 'tbsp' },
        { id: uuid(), inventoryItemId: bread.id, name: 'Bread', quantity: 2, unit: 'count' },
      ],
      createdAt: isoNow(-10),
      updatedAt: isoNow(-10),
    },
    {
      id: uuid(),
      name: 'Spaghetti with Meat Sauce',
      ingredients: [
        { id: uuid(), inventoryItemId: pasta.id, name: 'Pasta', quantity: 8, unit: 'oz' },
        { id: uuid(), inventoryItemId: groundBeef.id, name: 'Ground Beef', quantity: 1, unit: 'lb' },
        { id: uuid(), inventoryItemId: tomatoes.id, name: 'Canned Tomatoes', quantity: 1, unit: 'can' },
        { id: uuid(), inventoryItemId: onions.id, name: 'Onions', quantity: 1, unit: 'count' },
        { id: uuid(), inventoryItemId: garlic.id, name: 'Garlic', quantity: 2, unit: 'count' },
      ],
      createdAt: isoNow(-9),
      updatedAt: isoNow(-9),
    },
    {
      id: uuid(),
      name: 'Chicken & Rice Stir Fry',
      ingredients: [
        { id: uuid(), inventoryItemId: chicken.id, name: 'Chicken Breast', quantity: 1, unit: 'lb' },
        { id: uuid(), inventoryItemId: peas.id, name: 'Frozen Peas', quantity: 1, unit: 'cups' },
        { id: uuid(), inventoryItemId: rice.id, name: 'Rice', quantity: 2, unit: 'cups' },
      ],
      createdAt: isoNow(-5),
      updatedAt: isoNow(-5),
    },
  ];

  const mealHistory: MealHistoryItem[] = [
    {
      id: uuid(),
      mealId: meals[0].id,
      mealName: meals[0].name,
      madeAt: isoNow(-2),
      ingredientsSubtracted: [
        { name: 'Eggs', quantity: 2, unit: 'count' },
        { name: 'Butter', quantity: 1, unit: 'tbsp' },
        { name: 'Bread', quantity: 2, unit: 'count' },
      ],
    },
  ];

  const shoppingList: ShoppingListItem[] = [
    {
      id: uuid(),
      name: 'Granola Bars',
      quantity: 1,
      unit: 'box',
      category: 'snacks',
      notes: '',
      source: 'recommended',
      linkedInventoryItemId: granolaBars.id,
      inCart: false,
      checked: false,
      createdAt: isoNow(-1),
    },
    {
      id: uuid(),
      name: 'Coffee Filters',
      quantity: 1,
      unit: 'package',
      category: 'household',
      notes: 'Size #4',
      source: 'manual',
      linkedInventoryItemId: null,
      inCart: false,
      checked: false,
      createdAt: isoNow(-1),
    },
  ];

  const cart: CartItem[] = [
    {
      id: uuid(),
      shoppingListItemId: null,
      name: 'Sparkling Water',
      quantity: 1,
      unit: 'can',
      category: 'drinks',
      notes: '12-pack',
      linkedInventoryItemId: byName('Sparkling Water').id,
    },
  ];

  return {
    inventory,
    meals,
    shoppingList,
    cart,
    mealHistory,
    settings: { ...DEFAULT_SETTINGS },
  };
}
