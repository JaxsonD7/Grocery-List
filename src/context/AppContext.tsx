import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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
import { loadState, saveState } from '../lib/storage';
import { getDb, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { mergeIntoShoppingList, type ShoppingListInput } from '../lib/shoppingList';
import { mergePurchaseIntoInventory } from '../lib/inventory';

type Action =
  | { type: 'ADD_ITEM'; item: InventoryItem }
  | { type: 'UPDATE_ITEM'; id: string; updates: Partial<InventoryItem> }
  | { type: 'DELETE_ITEM'; id: string }
  | { type: 'ADJUST_QUANTITY'; id: string; delta: number }
  | { type: 'ADD_MEAL'; meal: Meal }
  | { type: 'UPDATE_MEAL'; id: string; updates: Partial<Meal> }
  | { type: 'DELETE_MEAL'; id: string }
  | { type: 'MAKE_MEAL'; mealId: string }
  | { type: 'ADD_CART_ITEM'; item: Omit<CartItem, 'id' | 'shoppingListItemId'> }
  | { type: 'ADD_SHOPPING_ITEM'; item: ShoppingListInput }
  | { type: 'UPDATE_SHOPPING_ITEM'; id: string; updates: Partial<ShoppingListItem> }
  | { type: 'DELETE_SHOPPING_ITEM'; id: string }
  | { type: 'TOGGLE_SHOPPING_CHECKED'; id: string }
  | { type: 'MOVE_SHOPPING_TO_CART'; id: string }
  | { type: 'MARK_SHOPPING_PURCHASED'; id: string }
  | { type: 'REMOVE_FROM_CART'; id: string }
  | { type: 'MOVE_CART_TO_LIST'; id: string }
  | { type: 'CHECKOUT_CART' }
  | { type: 'UPDATE_SETTINGS'; updates: Partial<AppSettings> }
  | { type: 'RESET_DATA' };

// Running out completely is an unambiguous signal, so it always queues a
// restock regardless of the item's configurable lowStockBehavior (which only
// governs the softer "at or below threshold" case).
function ranOutOfStock(before: InventoryItem, after: InventoryItem): boolean {
  return before.quantity > 0 && after.quantity <= 0;
}

function restockRequest(item: InventoryItem): ShoppingListInput {
  // Percent-tracked items store 0-100 in `quantity`/`lowStockThreshold`, not a
  // real-world count, so the arithmetic below doesn't apply — just ask for
  // one more of whatever container unit the item restocks as.
  const quantity = item.trackByPercent
    ? 1
    : Math.max(1, item.lowStockThreshold - item.quantity + 1);
  return {
    name: item.name,
    quantity,
    unit: item.unit,
    category: item.category,
    source: 'auto',
    linkedInventoryItemId: item.id,
    store: item.store ?? null,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, inventory: [...state.inventory, action.item] };

    case 'UPDATE_ITEM': {
      const target = state.inventory.find((i) => i.id === action.id);
      if (!target) return state;
      const updated: InventoryItem = { ...target, ...action.updates, updatedAt: new Date().toISOString() };
      const inventory = state.inventory.map((item) => (item.id === action.id ? updated : item));
      const shoppingList = ranOutOfStock(target, updated)
        ? mergeIntoShoppingList(state.shoppingList, restockRequest(updated))
        : state.shoppingList;
      return { ...state, inventory, shoppingList };
    }

    case 'DELETE_ITEM':
      return {
        ...state,
        inventory: state.inventory.filter((item) => item.id !== action.id),
      };

    case 'ADJUST_QUANTITY': {
      const target = state.inventory.find((i) => i.id === action.id);
      if (!target) return state;
      const updated: InventoryItem = {
        ...target,
        quantity: Math.max(0, roundQty(target.quantity + action.delta)),
        updatedAt: new Date().toISOString(),
      };
      const inventory = state.inventory.map((item) => (item.id === action.id ? updated : item));
      const shoppingList = ranOutOfStock(target, updated)
        ? mergeIntoShoppingList(state.shoppingList, restockRequest(updated))
        : state.shoppingList;
      return { ...state, inventory, shoppingList };
    }

    case 'ADD_MEAL':
      return { ...state, meals: [...state.meals, action.meal] };

    case 'UPDATE_MEAL':
      return {
        ...state,
        meals: state.meals.map((meal) =>
          meal.id === action.id
            ? { ...meal, ...action.updates, updatedAt: new Date().toISOString() }
            : meal,
        ),
      };

    case 'DELETE_MEAL':
      return { ...state, meals: state.meals.filter((meal) => meal.id !== action.id) };

    case 'MAKE_MEAL': {
      const meal = state.meals.find((m) => m.id === action.mealId);
      if (!meal) return state;

      const now = new Date().toISOString();
      let inventory = [...state.inventory];
      const subtracted: MealHistoryItem['ingredientsSubtracted'] = [];

      for (const ingredient of meal.ingredients) {
        const idx = inventory.findIndex(
          (i) =>
            i.id === ingredient.inventoryItemId ||
            i.name.trim().toLowerCase() === ingredient.name.trim().toLowerCase(),
        );
        if (idx === -1) continue;
        const current = inventory[idx];
        const amount = Math.min(current.quantity, ingredient.quantity);
        if (amount <= 0) continue;
        inventory[idx] = {
          ...current,
          quantity: roundQty(current.quantity - amount),
          updatedAt: now,
        };
        subtracted.push({ name: current.name, quantity: amount, unit: ingredient.unit });
      }

      let shoppingList = state.shoppingList;
      for (const ingredient of meal.ingredients) {
        const invItem = inventory.find(
          (i) =>
            i.id === ingredient.inventoryItemId ||
            i.name.trim().toLowerCase() === ingredient.name.trim().toLowerCase(),
        );
        if (
          invItem &&
          // Running out completely always queues a restock, regardless of
          // lowStockBehavior — see restockRequest() above.
          ((invItem.lowStockBehavior === 'auto_add' && invItem.quantity <= invItem.lowStockThreshold) ||
            invItem.quantity <= 0)
        ) {
          shoppingList = mergeIntoShoppingList(shoppingList, restockRequest(invItem));
        }
      }

      const historyEntry: MealHistoryItem = {
        id: uuid(),
        mealId: meal.id,
        mealName: meal.name,
        madeAt: now,
        ingredientsSubtracted: subtracted,
      };

      return {
        ...state,
        inventory,
        shoppingList,
        mealHistory: [historyEntry, ...state.mealHistory],
      };
    }

    case 'ADD_CART_ITEM': {
      const idx = state.cart.findIndex(
        (c) => c.name.trim().toLowerCase() === action.item.name.trim().toLowerCase() && c.unit === action.item.unit,
      );
      if (idx !== -1) {
        return {
          ...state,
          cart: state.cart.map((c, i) => (i === idx ? { ...c, quantity: c.quantity + action.item.quantity } : c)),
        };
      }
      const cartItem: CartItem = { ...action.item, id: uuid(), shoppingListItemId: null };
      return { ...state, cart: [...state.cart, cartItem] };
    }

    case 'ADD_SHOPPING_ITEM':
      return { ...state, shoppingList: mergeIntoShoppingList(state.shoppingList, action.item) };

    case 'UPDATE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map((item) =>
          item.id === action.id ? { ...item, ...action.updates } : item,
        ),
      };

    case 'DELETE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.filter((item) => item.id !== action.id),
      };

    case 'TOGGLE_SHOPPING_CHECKED':
      return {
        ...state,
        shoppingList: state.shoppingList.map((item) =>
          item.id === action.id ? { ...item, checked: !item.checked } : item,
        ),
      };

    case 'MOVE_SHOPPING_TO_CART': {
      const item = state.shoppingList.find((i) => i.id === action.id);
      if (!item) return state;
      const cartItem: CartItem = {
        id: uuid(),
        shoppingListItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        linkedInventoryItemId: item.linkedInventoryItemId,
        store: item.store ?? null,
      };
      return {
        ...state,
        cart: [...state.cart, cartItem],
        shoppingList: state.shoppingList.map((i) => (i.id === action.id ? { ...i, inCart: true } : i)),
      };
    }

    case 'MARK_SHOPPING_PURCHASED': {
      const item = state.shoppingList.find((i) => i.id === action.id);
      if (!item) return state;
      const inventory = mergePurchaseIntoInventory(
        state.inventory,
        {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          notes: item.notes,
          linkedInventoryItemId: item.linkedInventoryItemId,
        },
        state.settings,
      );
      return {
        ...state,
        inventory,
        shoppingList: state.shoppingList.filter((i) => i.id !== action.id),
        cart: state.cart.filter((c) => c.shoppingListItemId !== item.id),
      };
    }

    case 'REMOVE_FROM_CART': {
      const cartItem = state.cart.find((c) => c.id === action.id);
      return {
        ...state,
        cart: state.cart.filter((c) => c.id !== action.id),
        shoppingList: cartItem
          ? state.shoppingList.map((i) =>
              i.id === cartItem.shoppingListItemId ? { ...i, inCart: false } : i,
            )
          : state.shoppingList,
      };
    }

    case 'MOVE_CART_TO_LIST': {
      const cartItem = state.cart.find((c) => c.id === action.id);
      if (!cartItem) return state;
      return {
        ...state,
        cart: state.cart.filter((c) => c.id !== action.id),
        shoppingList: state.shoppingList.map((i) =>
          i.id === cartItem.shoppingListItemId ? { ...i, inCart: false } : i,
        ),
      };
    }

    case 'CHECKOUT_CART': {
      let inventory = state.inventory;
      for (const cartItem of state.cart) {
        inventory = mergePurchaseIntoInventory(
          inventory,
          {
            name: cartItem.name,
            quantity: cartItem.quantity,
            unit: cartItem.unit,
            category: cartItem.category,
            notes: cartItem.notes,
            linkedInventoryItemId: cartItem.linkedInventoryItemId,
          },
          state.settings,
        );
      }
      const purchasedListIds = new Set(state.cart.map((c) => c.shoppingListItemId).filter(Boolean));
      return {
        ...state,
        inventory,
        cart: [],
        shoppingList: state.shoppingList.filter((i) => !purchasedListIds.has(i.id)),
      };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.updates } };

    case 'RESET_DATA':
      return createEmptyState();

    default:
      return state;
  }
}

function roundQty(n: number): number {
  return Math.round(n * 100) / 100;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultLowStockBehavior: 'recommend',
  defaultUnit: 'count',
  defaultCategory: 'pantry',
  defaultLocation: 'pantry',
  defaultLowStockThreshold: 2,
};

function createEmptyState(): AppState {
  return {
    inventory: [],
    meals: [],
    shoppingList: [],
    cart: [],
    mealHistory: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

interface AppContextValue {
  state: AppState;
  dispatch: (action: Action) => void;
  /** True while the initial cloud state is still loading, so the UI can
   * avoid flashing an empty pantry before the real data arrives. */
  syncing: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

// Firestore itself is only pulled in (via the dynamic imports below) once
// someone is actually signed in, so signed-out visitors never download it.
async function writeCloudState(uid: string, data: AppState): Promise<void> {
  const [{ doc, setDoc }, db] = await Promise.all([import('firebase/firestore'), getDb()]);
  if (!db) return;
  await setDoc(doc(db, 'households', uid), data);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const useCloud = isFirebaseConfigured && !!user;

  const [state, setState] = useState<AppState>(() =>
    useCloud ? createEmptyState() : (loadState<AppState>() ?? createEmptyState()),
  );
  const [syncing, setSyncing] = useState(useCloud);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestState = useRef(state);

  // Cloud mode: subscribe to this account's document. The same account
  // signed in on two devices shares one document, so changes made on either
  // device sync to the other in real time (and while offline, Firestore's
  // local cache keeps the last-synced data available and queues writes).
  useEffect(() => {
    if (!useCloud || !user) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    setSyncing(true);

    void (async () => {
      const [{ doc, onSnapshot, setDoc }, db] = await Promise.all([
        import('firebase/firestore'),
        getDb(),
      ]);
      if (cancelled || !db) return;
      const ref = doc(db, 'households', user.uid);
      unsubscribe = onSnapshot(
        ref,
        (snap: import('firebase/firestore').DocumentSnapshot) => {
          if (snap.exists()) {
            const data = snap.data() as AppState;
            latestState.current = data;
            setState(data);
          } else {
            const initial = createEmptyState();
            latestState.current = initial;
            setState(initial);
            void setDoc(ref, initial);
          }
          setSyncing(false);
        },
        () => setSyncing(false),
      );
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCloud, user?.uid]);

  // Local-only fallback when no Firebase project is configured.
  useEffect(() => {
    if (useCloud) return;
    saveState(state);
  }, [state, useCloud]);

  function dispatch(action: Action) {
    setState((prev) => {
      const next = reducer(prev, action);
      latestState.current = next;
      if (useCloud && user) {
        if (writeTimer.current) clearTimeout(writeTimer.current);
        writeTimer.current = setTimeout(() => {
          void writeCloudState(user.uid, latestState.current);
        }, 400);
      }
      return next;
    });
  }

  const value: AppContextValue = { state, dispatch, syncing };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
