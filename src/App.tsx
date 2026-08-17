import { lazy, Suspense, useState } from 'react';
import { AppProvider, useAppState } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TabNav } from './components/layout/TabNav';
import { PantryTab } from './components/pantry/PantryTab';
import { Refrigerator } from 'lucide-react';

const SignInScreen = lazy(() => import('./components/auth/SignInScreen').then((m) => ({ default: m.SignInScreen })));

// Pantry loads eagerly since it's the first screen; the rest load on demand
// so the initial bundle users download before seeing anything stays small.
const MealsTab = lazy(() => import('./components/meals/MealsTab').then((m) => ({ default: m.MealsTab })));
const ShoppingTab = lazy(() => import('./components/shopping/ShoppingTab').then((m) => ({ default: m.ShoppingTab })));
const CartTab = lazy(() => import('./components/cart/CartTab').then((m) => ({ default: m.CartTab })));
const SettingsTab = lazy(() => import('./components/settings/SettingsTab').then((m) => ({ default: m.SettingsTab })));

export type Tab = 'pantry' | 'meals' | 'shopping' | 'cart' | 'settings';

const TAB_TITLES: Record<Tab, string> = {
  pantry: 'Pantry & Fridge',
  meals: 'Meals',
  shopping: 'Shopping List',
  cart: 'Cart',
  settings: 'Settings',
};

function AppShell() {
  const [tab, setTab] = useState<Tab>('pantry');
  const { state, syncing } = useAppState();

  const shoppingBadge = state.shoppingList.filter((i) => !i.checked && !i.inCart).length;
  const cartBadge = state.cart.length;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Refrigerator size={19} />
            </span>
            <div className="leading-tight">
              <p className="font-semibold">Pantry Tracker</p>
              <p className="hidden text-xs text-neutral-500 sm:block">{TAB_TITLES[tab]}</p>
            </div>
          </div>
          <TabNav active={tab} onChange={setTab} badges={{ shopping: shoppingBadge, cart: cartBadge }} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl grow px-4 pb-24 pt-4 md:pb-10">
        {syncing ? (
          <TabLoading />
        ) : (
          <>
            {tab === 'pantry' && <PantryTab onNavigate={setTab} />}
            <Suspense fallback={<TabLoading />}>
              {tab === 'meals' && <MealsTab />}
              {tab === 'shopping' && <ShoppingTab onNavigate={setTab} />}
              {tab === 'cart' && <CartTab />}
              {tab === 'settings' && <SettingsTab />}
            </Suspense>
          </>
        )}
      </main>
    </div>
  );
}

function TabLoading() {
  return (
    <div className="flex justify-center py-16 text-neutral-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}

function AuthGate() {
  const { user, loading, configured } = useAuth();

  if (configured && loading) return <TabLoading />;
  if (configured && !user) {
    return (
      <Suspense fallback={<TabLoading />}>
        <SignInScreen />
      </Suspense>
    );
  }

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
