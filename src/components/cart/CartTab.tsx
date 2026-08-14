import { useState } from 'react';
import { CheckCircle2, ShoppingBasket } from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import { CartItemRow } from './CartItemRow';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Buttons';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function CartTab() {
  const { state, dispatch } = useAppState();
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Cart</h1>
          <p className="text-sm text-neutral-500">
            {state.cart.length} item{state.cart.length === 1 ? '' : 's'} ready to check out
          </p>
        </div>
        {state.cart.length > 0 && (
          <Button variant="primary" icon={<CheckCircle2 size={17} />} onClick={() => setConfirmingCheckout(true)}>
            Checkout
          </Button>
        )}
      </div>

      {state.cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingBasket size={36} />}
          title="Your cart is empty"
          description="Move items here from your shopping list while you shop, then check out to update your inventory."
        />
      ) : (
        <div className="space-y-2">
          {state.cart.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {confirmingCheckout && (
        <ConfirmDialog
          title="Check out?"
          message={`This will add ${state.cart.length} item${state.cart.length === 1 ? '' : 's'} to your pantry/fridge inventory and clear your cart and shopping list.`}
          confirmLabel="Confirm Checkout"
          onCancel={() => setConfirmingCheckout(false)}
          onConfirm={() => {
            dispatch({ type: 'CHECKOUT_CART' });
            setConfirmingCheckout(false);
          }}
        />
      )}
    </div>
  );
}
