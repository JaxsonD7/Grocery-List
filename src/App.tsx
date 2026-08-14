import { useState } from 'react';
import { AppProvider, useAppState } from './context/AppContext';
import { TabNav } from './components/layout/TabNav';
import { PantryTab } from './components/pantry/PantryTab';
import { MealsTab } from './components/meals/MealsTab';
import { ShoppingTab } from './components/shopping/ShoppingTab';
import { CartTab } from './components/cart/CartTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { Refrigerator } from 'lucide-react';

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
  const { state } = useAppState();

  const shoppingBadge = state.shoppingList.filter((i) => !i.checked && !i.inCart).length;
  const cartBadge = state.cart.length;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur">
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
        {tab === 'pantry' && <PantryTab />}
        {tab === 'meals' && <MealsTab />}
        {tab === 'shopping' && <ShoppingTab onGoToCart={() => setTab('cart')} />}
        {tab === 'cart' && <CartTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
