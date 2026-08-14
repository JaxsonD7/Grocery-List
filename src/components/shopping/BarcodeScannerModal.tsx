import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { AlertTriangle, Barcode, Camera, CheckCircle2, Leaf, Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Buttons';
import { Field, inputClass, selectClass } from '../ui/FormField';
import { lookupProductByBarcode, type ProductLookupResult } from '../../lib/barcode';
import { CATEGORIES, CATEGORY_LABELS, UNITS, UNIT_LABELS, type Category, type Unit } from '../../types';
import { useAppState } from '../../context/AppContext';

type Phase = 'scan' | 'looking-up' | 'found' | 'not-found' | 'manual';

interface BarcodeScannerModalProps {
  onClose: () => void;
}

export function BarcodeScannerModal({ onClose }: BarcodeScannerModalProps) {
  const { dispatch } = useAppState();
  const [phase, setPhase] = useState<Phase>('scan');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductLookupResult | null>(null);
  const [scannedCode, setScannedCode] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    if (phase !== 'scan') return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, _err, controls) => {
        controlsRef.current = controls;
        if (cancelled || !result) return;
        controls.stop();
        handleCode(result.getText());
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCameraError(err instanceof Error ? err.message : 'Camera unavailable');
        }
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function handleCode(code: string) {
    setScannedCode(code);
    setPhase('looking-up');
    setLookupError(null);
    try {
      const result = await lookupProductByBarcode(code);
      if (result) {
        setProduct(result);
        setPhase('found');
      } else {
        setPhase('not-found');
      }
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Could not look up this barcode.');
      setPhase('not-found');
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCode(manualCode.trim());
  }

  return (
    <Modal title="Scan Barcode" onClose={onClose} maxWidthClass="max-w-md">
      {phase === 'scan' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
          </div>
          {cameraError ? (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Camera unavailable ({cameraError}). Enter the barcode manually below.
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-neutral-500">
              <Camera size={16} /> Point your camera at a barcode
            </p>
          )}

          <form onSubmit={handleManualSubmit} className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Or enter barcode manually">
                <input
                  className={inputClass}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. 3017620422003"
                  inputMode="numeric"
                />
              </Field>
            </div>
            <Button variant="primary" type="submit" icon={<Barcode size={16} />}>
              Look Up
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setPhase('manual')}
            className="w-full text-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Skip scanning — add item manually
          </button>
        </div>
      )}

      {phase === 'looking-up' && (
        <div className="flex flex-col items-center gap-3 py-10 text-neutral-500">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Looking up product…</p>
        </div>
      )}

      {phase === 'found' && product && (
        <ProductResult product={product} onDone={onClose} onAddedToCart={() => dispatch({ type: 'ADD_CART_ITEM', item: buildCartItem(product) })} />
      )}

      {phase === 'not-found' && (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {lookupError ?? `Barcode ${scannedCode} didn't match a known product.`} You can add it manually instead.
          </p>
          <ManualItemForm
            initialName=""
            initialBarcode={scannedCode}
            onCancel={() => setPhase('scan')}
            onAdd={(item) => {
              dispatch({ type: 'ADD_CART_ITEM', item });
              onClose();
            }}
          />
        </div>
      )}

      {phase === 'manual' && (
        <ManualItemForm initialName="" initialBarcode={null} onCancel={() => setPhase('scan')} onAdd={(item) => {
          dispatch({ type: 'ADD_CART_ITEM', item });
          onClose();
        }} />
      )}
    </Modal>
  );
}

function buildCartItem(product: ProductLookupResult) {
  return {
    name: product.name,
    quantity: 1,
    unit: product.suggestedUnit,
    category: product.suggestedCategory,
    notes: product.quantityText ? `Package size: ${product.quantityText}` : '',
    linkedInventoryItemId: null,
    barcode: product.barcode,
    health: product.health,
  };
}

function ProductResult({
  product,
  onDone,
  onAddedToCart,
}: {
  product: ProductLookupResult;
  onDone: () => void;
  onAddedToCart: () => void;
}) {
  const [added, setAdded] = useState(false);
  const { score, grade, brand, pros, cons, raisedInfo } = product.health;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{brand ?? 'Product'}</p>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</h3>
        {product.quantityText && <p className="text-sm text-neutral-500">{product.quantityText}</p>}
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
        <HealthScoreRing score={score} />
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Health Score</p>
          <p className="text-sm text-neutral-500">
            {score}/100{grade ? ` · Nutri-Score ${grade.toUpperCase()}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            <ThumbsUp size={15} /> Pros
          </p>
          <ul className="space-y-1 text-sm text-emerald-900/80 dark:text-emerald-200/80">
            {pros.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-800 dark:text-red-300">
            <ThumbsDown size={15} /> Cons
          </p>
          <ul className="space-y-1 text-sm text-red-900/80 dark:text-red-200/80">
            {cons.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          <Leaf size={15} /> How it was raised
        </p>
        <p className="text-sm text-neutral-500">{raisedInfo ?? 'Not specified by the manufacturer.'}</p>
      </div>

      {added ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 size={16} /> Added to cart
        </div>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          icon={<CheckCircle2 size={17} />}
          onClick={() => {
            onAddedToCart();
            setAdded(true);
          }}
        >
          Add to Cart
        </Button>
      )}
      <Button variant="secondary" className="w-full" onClick={onDone}>
        {added ? 'Done' : 'Cancel'}
      </Button>
    </div>
  );
}

function HealthScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#059669' : score >= 45 ? '#d97706' : '#dc2626';
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - score / 100);

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-neutral-200 dark:text-neutral-800" />
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" fontSize="18" fontWeight="600" fill={color}>
        {score}
      </text>
    </svg>
  );
}

function ManualItemForm({
  initialName,
  initialBarcode,
  onAdd,
  onCancel,
}: {
  initialName: string;
  initialBarcode: string | null;
  onAdd: (item: {
    name: string;
    quantity: number;
    unit: Unit;
    category: Category;
    notes: string;
    linkedInventoryItemId: null;
    barcode: string | null;
    health: null;
  }) => void;
  onCancel: () => void;
}) {
  const { state } = useAppState();
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>(state.settings.defaultUnit);
  const [category, setCategory] = useState<Category>(state.settings.defaultCategory);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }
    onAdd({
      name: name.trim(),
      quantity,
      unit,
      category,
      notes: '',
      linkedInventoryItemId: null,
      barcode: initialBarcode,
      health: null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Item name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Sourdough bread" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity">
          <input
            type="number"
            min={0}
            step="any"
            className={inputClass}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </Field>
        <Field label="Unit">
          <select className={selectClass} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {UNIT_LABELS[u]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Category">
        <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Back
        </Button>
        <Button variant="primary" type="submit">
          Add to Cart
        </Button>
      </div>
    </form>
  );
}
