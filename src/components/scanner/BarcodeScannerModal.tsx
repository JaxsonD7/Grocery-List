import { useEffect, useRef, useState } from 'react';
import { BarcodeFormat, BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import {
  AlertTriangle,
  Barcode,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  FlaskConical,
  Hash,
  Info,
  Leaf,
  ListPlus,
  Loader2,
  MapPin,
  Package,
  PackagePlus,
  Pencil,
  ScanLine,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  Tag,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button, IconButton } from '../ui/Buttons';
import { Field, inputClass, selectClass } from '../ui/FormField';
import { Badge } from '../ui/Badge';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  LOCATIONS,
  LOCATION_LABELS,
  UNITS,
  UNIT_LABELS,
  type Category,
  type InventoryItem,
  type Location,
  type Unit,
} from '../../types';
import {
  estimateExpirationDate,
  lookupProductByBarcode,
  type NutritionFacts,
  type ProductLookupResult,
} from '../../lib/barcode';
import type { AdditiveInfo } from '../../lib/additives';
import { useAppState } from '../../context/AppContext';
import type { Tab } from '../../App';

type Phase = 'scan' | 'looking-up' | 'result' | 'details';
export type ScanContext = 'pantry' | 'shopping';

// text-base (16px) avoids iOS Safari's auto-zoom-on-focus for small form fields.
const rowSelectClass =
  'appearance-none bg-transparent border-0 pr-0 text-right text-base font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-md cursor-pointer';

// Restrict decoding to the barcode symbologies actually used on grocery
// packaging. Trying every supported format (QR, PDF417, Aztec, ...) on every
// frame is the main reason handheld scanning feels slow.
const SCAN_HINTS = new Map([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
    ],
  ],
]);

interface DetailsForm {
  name: string;
  brand: string;
  category: Category;
  location: Location;
  quantity: number;
  unit: Unit;
  expirationDate: string;
  lowStockThreshold: number;
}

interface BarcodeScannerModalProps {
  context: ScanContext;
  onClose: () => void;
  onNavigate: (tab: Tab) => void;
}

export function BarcodeScannerModal({ context, onClose, onNavigate }: BarcodeScannerModalProps) {
  const { state, dispatch } = useAppState();
  const [phase, setPhase] = useState<Phase>('scan');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductLookupResult | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matched, setMatched] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [addedToPantry, setAddedToPantry] = useState(false);
  const [addedToList, setAddedToList] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [form, setForm] = useState<DetailsForm | null>(null);

  const existingInInventory = form
    ? state.inventory.find(
        (i) =>
          (scannedCode && i.barcode === scannedCode) ||
          i.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
      ) ?? null
    : null;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    if (phase !== 'scan') return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader(SCAN_HINTS, { delayBetweenScanAttempts: 150 });

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, _err, controls) => {
        controlsRef.current = controls;
        if (cancelled || !result) return;
        controls.stop();
        navigator.vibrate?.(80);
        handleCode(result.getText());
      })
      .catch((err: unknown) => {
        if (!cancelled) setCameraError(err instanceof Error ? err.message : 'Camera unavailable');
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function buildForm(p: ProductLookupResult | null): DetailsForm {
    const category = p?.suggestedCategory ?? state.settings.defaultCategory;
    return {
      name: p?.name ?? '',
      brand: p?.brand ?? '',
      category,
      location: p?.suggestedLocation ?? state.settings.defaultLocation,
      quantity: 1,
      unit: p?.suggestedUnit ?? state.settings.defaultUnit,
      expirationDate: estimateExpirationDate(category),
      lowStockThreshold: state.settings.defaultLowStockThreshold,
    };
  }

  async function handleCode(code: string) {
    setScannedCode(code);
    setPhase('looking-up');
    setLookupError(null);
    try {
      const result = await lookupProductByBarcode(code);
      if (result) {
        setProduct(result);
        setMatched(true);
        setForm(buildForm(result));
        setPhase('result');
      } else {
        setProduct(null);
        setMatched(false);
        setForm(buildForm(null));
        setEditingIdentity(true);
        setPhase('details');
      }
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Could not look up this barcode.');
      setProduct(null);
      setMatched(false);
      setForm(buildForm(null));
      setEditingIdentity(true);
      setPhase('details');
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCode(manualCode.trim());
  }

  function skipToManual() {
    setProduct(null);
    setMatched(false);
    setScannedCode(null);
    setForm(buildForm(null));
    setEditingIdentity(true);
    setPhase('details');
  }

  function scanAnother() {
    setProduct(null);
    setMatched(false);
    setScannedCode(null);
    setForm(null);
    setManualCode('');
    setCameraError(null);
    setLookupError(null);
    setEditingIdentity(false);
    setAddedToPantry(false);
    setAddedToList(false);
    setAddedToCart(false);
    setPhase('scan');
  }

  function updateForm(updates: Partial<DetailsForm>) {
    setForm((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  function addToPantry() {
    if (!form || !form.name.trim()) return;
    const existing = existingInInventory;
    const now = new Date().toISOString();
    const notes = product ? buildQualityNote(product) : '';

    if (existing) {
      dispatch({
        type: 'UPDATE_ITEM',
        id: existing.id,
        updates: {
          quantity: existing.quantity + form.quantity,
          category: form.category,
          location: form.location,
          unit: form.unit,
          lowStockThreshold: form.lowStockThreshold,
          expirationDate: form.expirationDate || null,
          barcode: scannedCode ?? existing.barcode ?? null,
        },
      });
    } else {
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        category: form.category,
        location: form.location,
        quantity: form.quantity,
        unit: form.unit,
        lowStockThreshold: form.lowStockThreshold,
        lowStockBehavior: state.settings.defaultLowStockBehavior,
        expirationDate: form.expirationDate || null,
        notes,
        barcode: scannedCode ?? null,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_ITEM', item: newItem });
    }
    setAddedToPantry(true);
  }

  function addToShoppingList() {
    if (!form || !form.name.trim()) return;
    dispatch({
      type: 'ADD_SHOPPING_ITEM',
      item: {
        name: form.name.trim(),
        quantity: form.quantity,
        unit: form.unit,
        category: form.category,
        source: 'manual',
        linkedInventoryItemId: null,
      },
    });
    setAddedToList(true);
  }

  function addToCart() {
    if (!form || !form.name.trim()) return;
    dispatch({
      type: 'ADD_CART_ITEM',
      item: {
        name: form.name.trim(),
        quantity: form.quantity,
        unit: form.unit,
        category: form.category,
        notes: '',
        linkedInventoryItemId: null,
      },
    });
    setAddedToCart(true);
  }

  return (
    <Modal
      title={phase === 'details' ? 'Item Details' : phase === 'result' ? 'Scan Result' : 'Scan Barcode'}
      onClose={onClose}
      maxWidthClass="max-w-md"
    >
      {phase === 'scan' && (
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {!cameraError && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                <div className="relative h-2/5 w-full max-w-xs">
                  <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-lg border-l-4 border-t-4 border-emerald-400" />
                  <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-lg border-r-4 border-t-4 border-emerald-400" />
                  <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-lg border-b-4 border-l-4 border-emerald-400" />
                  <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-lg border-b-4 border-r-4 border-emerald-400" />
                </div>
              </div>
            )}
          </div>
          {cameraError ? (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Camera unavailable ({cameraError}). Enter the barcode manually below.
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-neutral-500">
              <Camera size={16} /> Align the barcode within the frame
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
            onClick={skipToManual}
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

      {phase === 'result' && product && form && (
        <ResultScreen
          product={product}
          scannedCode={scannedCode}
          expirationDate={form.expirationDate}
          onChangeExpiration={(date) => updateForm({ expirationDate: date })}
          onContinue={() => setPhase('details')}
          onCancel={onClose}
        />
      )}

      {phase === 'details' && form && (
        <DetailsScreen
          context={context}
          form={form}
          matched={matched}
          scannedCode={scannedCode}
          lookupError={lookupError}
          editingIdentity={editingIdentity}
          onToggleEditing={() => setEditingIdentity((v) => !v)}
          onChange={updateForm}
          existingInInventory={existingInInventory}
          addedToPantry={addedToPantry}
          addedToList={addedToList}
          addedToCart={addedToCart}
          onAddToPantry={addToPantry}
          onAddToShoppingList={addToShoppingList}
          onAddToCart={addToCart}
          onScanAnother={scanAnother}
          onDone={onClose}
          onGoToTab={(t) => {
            onNavigate(t);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

function buildQualityNote(product: ProductLookupResult): string {
  const { score, tier } = product.quality;
  return `Sourcing quality: ${tier} (${score}/100)${product.quality.raisedInfo ? ` — ${product.quality.raisedInfo}` : ''}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function ResultScreen({
  product,
  scannedCode,
  expirationDate,
  onChangeExpiration,
  onContinue,
  onCancel,
}: {
  product: ProductLookupResult;
  scannedCode: string | null;
  expirationDate: string;
  onChangeExpiration: (date: string) => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const [editingDate, setEditingDate] = useState(false);
  const { quality } = product;
  const days = expirationDate ? daysUntil(expirationDate) : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Package size={32} className="text-neutral-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
            {product.name}
          </h3>
          <p className="mt-0.5 text-sm text-neutral-500">Barcode: {scannedCode}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="success" icon={<CheckCircle2 size={12} />}>
          Matched
        </Badge>
        <Badge tone="info" icon={<MapPin size={12} />}>
          {LOCATION_LABELS[product.suggestedLocation]}
        </Badge>
        <Badge tone="purple" icon={<ShieldCheck size={12} />}>
          High confidence
        </Badge>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center gap-4">
          <QualityRing score={quality.score} />
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {quality.tier} Sourcing
            </p>
            <p className="text-sm text-neutral-500">{quality.score}/100 · how it was raised or grown</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <ThumbsUp size={13} /> Pros
            </p>
            <ul className="space-y-0.5 text-xs text-emerald-900/80 dark:text-emerald-200/80">
              {quality.pros.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-red-50/60 dark:bg-red-950/20 p-2.5">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-800 dark:text-red-300">
              <ThumbsDown size={13} /> Cons
            </p>
            <ul className="space-y-0.5 text-xs text-red-900/80 dark:text-red-200/80">
              {quality.cons.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </div>
        </div>

        {quality.raisedInfo && (
          <p className="mt-2.5 flex items-start gap-1.5 text-xs text-neutral-500">
            <Leaf size={13} className="mt-0.5 shrink-0" />
            {quality.raisedInfo}
          </p>
        )}
      </div>

      {product.additives.length > 0 && <AdditivesCard additives={product.additives} />}
      {product.nutrition && <NutritionCard nutrition={product.nutrition} />}

      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CalendarDays size={18} className="text-amber-700 dark:text-amber-400" />
            <div>
              {days !== null ? (
                <>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                    {days >= 0 ? `Expires in ${days} day${days === 1 ? '' : 's'}` : 'Expiration estimate'}
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                    {new Date(expirationDate + 'T00:00:00').toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    (estimated)
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">No expiration set</p>
              )}
            </div>
          </div>
          <Button size="sm" variant="secondary" icon={<Pencil size={13} />} onClick={() => setEditingDate((v) => !v)}>
            Edit Date
          </Button>
        </div>
        {editingDate && (
          <input
            type="date"
            className={`${inputClass} mt-3`}
            value={expirationDate}
            onChange={(e) => onChangeExpiration(e.target.value)}
          />
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" className="flex-1" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

const RISK_LABEL: Record<AdditiveInfo['risk'], string> = { high: 'High risk', moderate: 'Moderate', low: 'Low risk' };
const RISK_TONE: Record<AdditiveInfo['risk'], 'danger' | 'warning' | 'success'> = {
  high: 'danger',
  moderate: 'warning',
  low: 'success',
};

function AdditivesCard({ additives }: { additives: AdditiveInfo[] }) {
  const [expanded, setExpanded] = useState(false);
  const highCount = additives.filter((a) => a.risk === 'high').length;
  const moderateCount = additives.filter((a) => a.risk === 'moderate').length;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2.5">
          <FlaskConical size={18} className="text-neutral-500" />
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {additives.length} additive{additives.length === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-neutral-500">
              {highCount > 0
                ? `${highCount} higher-risk`
                : moderateCount > 0
                  ? `${moderateCount} moderate-risk`
                  : 'All low-risk'}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-neutral-400" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-neutral-400" />
        )}
      </button>
      {expanded && (
        <ul className="mt-3 space-y-2.5 border-t border-neutral-100 dark:border-neutral-800 pt-3">
          {additives.map((a) => (
            <li key={a.code} className="flex items-start justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-neutral-800 dark:text-neutral-200">
                  {a.code} · {a.name}
                </p>
                <p className="text-xs text-neutral-500">{a.note}</p>
              </div>
              <Badge tone={RISK_TONE[a.risk]} className="shrink-0">
                {RISK_LABEL[a.risk]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NutritionCard({ nutrition }: { nutrition: NutritionFacts }) {
  const [expanded, setExpanded] = useState(false);
  const rows: [string, string][] = [
    ['Calories', nutrition.calories !== null ? `${Math.round(nutrition.calories)} kcal` : '—'],
    ['Protein', nutrition.protein !== null ? `${nutrition.protein.toFixed(1)} g` : '—'],
    ['Carbs', nutrition.carbs !== null ? `${nutrition.carbs.toFixed(1)} g` : '—'],
    ['Sugar', nutrition.sugar !== null ? `${nutrition.sugar.toFixed(1)} g` : '—'],
    ['Fat', nutrition.fat !== null ? `${nutrition.fat.toFixed(1)} g` : '—'],
    ['Saturated Fat', nutrition.saturatedFat !== null ? `${nutrition.saturatedFat.toFixed(1)} g` : '—'],
    ['Fiber', nutrition.fiber !== null ? `${nutrition.fiber.toFixed(1)} g` : '—'],
    ['Sodium', nutrition.sodium !== null ? `${nutrition.sodium} mg` : '—'],
  ];

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Flame size={18} className="text-neutral-500" />
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Nutrition Facts</p>
            <p className="text-xs text-neutral-500">
              {nutrition.calories !== null ? `${Math.round(nutrition.calories)} kcal` : '—'} per 100g
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-neutral-400" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-neutral-400" />
        )}
      </button>
      {expanded && (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="text-neutral-500">{label}</dt>
                <dd className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2.5 text-[11px] text-neutral-400">
            Per 100g · reference only, doesn't affect the sourcing score
          </p>
        </>
      )}
    </div>
  );
}

function DetailsScreen({
  context,
  form,
  matched,
  scannedCode,
  lookupError,
  editingIdentity,
  onToggleEditing,
  onChange,
  existingInInventory,
  addedToPantry,
  addedToList,
  addedToCart,
  onAddToPantry,
  onAddToShoppingList,
  onAddToCart,
  onScanAnother,
  onDone,
  onGoToTab,
}: {
  context: ScanContext;
  form: DetailsForm;
  matched: boolean;
  scannedCode: string | null;
  lookupError: string | null;
  editingIdentity: boolean;
  onToggleEditing: () => void;
  onChange: (updates: Partial<DetailsForm>) => void;
  existingInInventory: InventoryItem | null;
  addedToPantry: boolean;
  addedToList: boolean;
  addedToCart: boolean;
  onAddToPantry: () => void;
  onAddToShoppingList: () => void;
  onAddToCart: () => void;
  onScanAnother: () => void;
  onDone: () => void;
  onGoToTab: (tab: Tab) => void;
}) {
  const step = ['count', 'dozen', 'package', 'bottle', 'can', 'box', 'bag'].includes(form.unit) ? 1 : 0.5;

  return (
    <div className="space-y-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <CheckCircle2 size={16} className="text-emerald-600" /> Item details
        </p>
        <p className="text-sm text-neutral-500">Review and confirm the details below.</p>
      </div>

      {context === 'shopping' && existingInInventory && (
        <p className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-800 dark:text-blue-300">
          <Info size={16} className="shrink-0" />
          Already in pantry: {formatQty(existingInInventory.quantity)} {UNIT_LABELS[existingInInventory.unit]}
        </p>
      )}

      {!matched && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {lookupError ?? (scannedCode ? `Barcode ${scannedCode} didn't match a known product.` : 'Enter the item details manually.')}
        </p>
      )}

      <div className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <DetailRow icon={<Tag size={16} />} label="Product">
          {editingIdentity || !matched ? (
            <input
              className={`${inputClass} text-right`}
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Item name"
              autoFocus={!matched}
            />
          ) : (
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{form.name}</span>
          )}
        </DetailRow>

        <DetailRow icon={<Building2 size={16} />} label="Brand">
          {editingIdentity || !matched ? (
            <input
              className={`${inputClass} text-right`}
              value={form.brand}
              onChange={(e) => onChange({ brand: e.target.value })}
              placeholder="Optional"
            />
          ) : (
            <span className="text-sm text-neutral-600 dark:text-neutral-300">{form.brand || '—'}</span>
          )}
        </DetailRow>

        <DetailRow icon={<Package size={16} />} label="Category">
          <select
            className={rowSelectClass}
            value={form.category}
            onChange={(e) => onChange({ category: e.target.value as Category })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </DetailRow>

        <DetailRow icon={<MapPin size={16} />} label="Location">
          <select
            className={rowSelectClass}
            value={form.location}
            onChange={(e) => onChange({ location: e.target.value as Location })}
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {LOCATION_LABELS[l]}
              </option>
            ))}
          </select>
        </DetailRow>

        <DetailRow icon={<Hash size={16} />} label="Quantity">
          <div className="flex items-center gap-1.5">
            <IconButton
              label="Decrease quantity"
              variant="secondary"
              onClick={() => onChange({ quantity: Math.max(0, roundQty(form.quantity - step)) })}
            >
              <span className="text-base leading-none">−</span>
            </IconButton>
            <span className="w-8 text-center text-sm tabular-nums">{formatQty(form.quantity)}</span>
            <IconButton
              label="Increase quantity"
              variant="secondary"
              onClick={() => onChange({ quantity: roundQty(form.quantity + step) })}
            >
              <span className="text-base leading-none">+</span>
            </IconButton>
            <select
              className={`${selectClass} w-24 text-right`}
              value={form.unit}
              onChange={(e) => onChange({ unit: e.target.value as Unit })}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </div>
        </DetailRow>

        <DetailRow icon={<CalendarDays size={16} />} label="Expiration date">
          <input
            type="date"
            className={`${inputClass} w-auto text-right`}
            value={form.expirationDate}
            onChange={(e) => onChange({ expirationDate: e.target.value })}
          />
        </DetailRow>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <TrendingDown size={18} className="mt-0.5 text-neutral-500" />
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Low stock threshold</p>
              <p className="text-xs text-neutral-500">Get notified when quantity is at or below this amount.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <IconButton
              label="Decrease threshold"
              variant="secondary"
              onClick={() => onChange({ lowStockThreshold: Math.max(0, form.lowStockThreshold - 1) })}
            >
              <span className="text-base leading-none">−</span>
            </IconButton>
            <span className="w-6 text-center text-sm tabular-nums">{form.lowStockThreshold}</span>
            <IconButton
              label="Increase threshold"
              variant="secondary"
              onClick={() => onChange({ lowStockThreshold: form.lowStockThreshold + 1 })}
            >
              <span className="text-base leading-none">+</span>
            </IconButton>
          </div>
        </div>
      </div>

      {addedToPantry && (
        <SuccessBanner label="Added to pantry" actionLabel="View Pantry" onAction={() => onGoToTab('pantry')} />
      )}
      {addedToList && (
        <SuccessBanner label="Added to shopping list" actionLabel="View List" onAction={() => onGoToTab('shopping')} />
      )}
      {addedToCart && (
        <SuccessBanner label="Added to cart" actionLabel="View Cart" onAction={() => onGoToTab('cart')} />
      )}

      {context === 'shopping' ? (
        <Button
          variant="primary"
          className="w-full"
          icon={<ShoppingCart size={17} />}
          disabled={!form.name.trim()}
          onClick={onAddToCart}
        >
          Add to Cart
        </Button>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          icon={<PackagePlus size={17} />}
          disabled={!form.name.trim()}
          onClick={onAddToPantry}
        >
          Add to Pantry
        </Button>
      )}

      <div className="grid grid-cols-3 gap-2">
        {context === 'shopping' ? (
          <Button size="sm" variant="secondary" icon={<PackagePlus size={14} />} onClick={onAddToPantry} disabled={!form.name.trim()}>
            Add to Pantry
          </Button>
        ) : (
          <Button size="sm" variant="secondary" icon={<ListPlus size={14} />} onClick={onAddToShoppingList} disabled={!form.name.trim()}>
            Shopping List
          </Button>
        )}
        {matched ? (
          <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={onToggleEditing}>
            {editingIdentity ? 'Done' : 'Edit'}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" icon={<ShoppingBasket size={14} />} onClick={onDone}>
            Close
          </Button>
        )}
        <Button size="sm" variant="secondary" icon={<ScanLine size={14} />} onClick={onScanAnother}>
          Scan Another
        </Button>
      </div>
    </div>
  );
}

function SuccessBanner({
  label,
  actionLabel,
  onAction,
}: {
  label: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
      <span className="flex items-center gap-2">
        <CheckCircle2 size={16} /> {label}
      </span>
      <button type="button" onClick={onAction} className="font-semibold underline underline-offset-2">
        {actionLabel}
      </button>
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex items-center gap-2.5 text-sm text-neutral-500">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

function QualityRing({ score }: { score: number }) {
  const color = score >= 75 ? '#059669' : score >= 50 ? '#84cc16' : score >= 25 ? '#d97706' : '#dc2626';
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

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

function roundQty(n: number): number {
  return Math.round(n * 100) / 100;
}
