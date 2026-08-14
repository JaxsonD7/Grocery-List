import { createPortal } from 'react-dom';
import { ChefHat, Refrigerator, Settings, ShoppingBasket, ListChecks } from 'lucide-react';
import type { Tab } from '../../App';

interface TabDef {
  id: Tab;
  label: string;
  icon: typeof ChefHat;
}

const TABS: TabDef[] = [
  { id: 'pantry', label: 'Pantry', icon: Refrigerator },
  { id: 'meals', label: 'Meals', icon: ChefHat },
  { id: 'shopping', label: 'Shopping', icon: ListChecks },
  { id: 'cart', label: 'Cart', icon: ShoppingBasket },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface TabNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  badges: Partial<Record<Tab, number>>;
}

export function TabNav({ active, onChange, badges }: TabNavProps) {
  return (
    <>
      {/* Desktop / tablet: horizontal nav in header */}
      <nav className="hidden md:flex items-center gap-1">
        {TABS.map((tab) => (
          <TabButton key={tab.id} tab={tab} active={active === tab.id} badge={badges[tab.id]} onClick={() => onChange(tab.id)} horizontal />
        ))}
      </nav>

      {/* Mobile: fixed bottom nav, portaled to <body> so it anchors to the real
          viewport rather than any ancestor that establishes a containing block
          (e.g. the header's backdrop-blur). */}
      {createPortal(
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {TABS.map((tab) => (
            <TabButton key={tab.id} tab={tab} active={active === tab.id} badge={badges[tab.id]} onClick={() => onChange(tab.id)} />
          ))}
        </nav>,
        document.body,
      )}
    </>
  );
}

function TabButton({
  tab,
  active,
  badge,
  onClick,
  horizontal = false,
}: {
  tab: TabDef;
  active: boolean;
  badge?: number;
  onClick: () => void;
  horizontal?: boolean;
}) {
  const Icon = tab.icon;
  if (horizontal) {
    return (
      <button
        onClick={onClick}
        className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
          active
            ? 'bg-emerald-600 text-white'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <Icon size={17} />
        {tab.label}
        {!!badge && (
          <span
            className={`ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
              active ? 'bg-white/25 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
        active ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'
      }`}
    >
      <span className="relative">
        <Icon size={22} strokeWidth={active ? 2.4 : 2} />
        {!!badge && (
          <span className="absolute -right-2 -top-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
            {badge}
          </span>
        )}
      </span>
      {tab.label}
    </button>
  );
}
