import type { Category, Location, Unit } from '../types';
import { lookupAdditive, type AdditiveInfo } from './additives';

export type QualityTier = 'Excellent' | 'Good' | 'Poor' | 'Bad';

export interface ProductQuality {
  score: number; // 0-100, higher = better sourced / less processed
  tier: QualityTier;
  pros: string[];
  cons: string[];
  raisedInfo: string | null; // sourcing/farming description, e.g. "Grass-fed, Pasture-raised"
}

export interface NutritionFacts {
  calories: number | null; // kcal per 100g
  protein: number | null; // g per 100g
  carbs: number | null; // g per 100g
  sugar: number | null; // g per 100g
  fat: number | null; // g per 100g
  saturatedFat: number | null; // g per 100g
  fiber: number | null; // g per 100g
  sodium: number | null; // mg per 100g
}

export interface ProductLookupResult {
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  quantityText: string | null;
  suggestedCategory: Category;
  suggestedLocation: Location;
  suggestedUnit: Unit;
  quality: ProductQuality;
  additives: AdditiveInfo[];
  nutrition: NutritionFacts | null;
}

interface OpenFoodFactsNutriments {
  [key: string]: number | undefined;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  generic_name?: string;
  brands?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  ingredients_text?: string;
  labels_tags?: string[];
  origins?: string;
  origins_tags?: string[];
  categories_tags?: string[];
  quantity?: string;
  image_front_small_url?: string;
  image_small_url?: string;
  additives_tags?: string[];
  nutriments?: OpenFoodFactsNutriments;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

const PRODUCT_FIELDS =
  'product_name,generic_name,brands,nova_group,ecoscore_grade,ingredients_text,labels_tags,origins,origins_tags,categories_tags,quantity,image_front_small_url,image_small_url,additives_tags,nutriments';

// Labels that speak to *how* the food was raised or grown, not nutrition content.
// Several tags map to the same display text (e.g. regional "organic" variants) —
// they're de-duplicated by text once matched, so a product doesn't get double
// credit for two tags that mean the same thing.
const RAISED_LABEL_MAP: Record<string, { text: string; points: number }> = {
  'en:organic': { text: 'Organic', points: 20 },
  'en:eu-organic': { text: 'Organic', points: 20 },
  'en:usda-organic': { text: 'Organic', points: 20 },
  'en:organic-farming': { text: 'Organic', points: 20 },
  'en:grass-fed': { text: 'Grass-fed', points: 22 },
  'en:pasture-raised': { text: 'Pasture-raised', points: 22 },
  'en:free-range': { text: 'Free-range', points: 16 },
  'en:free-range-eggs': { text: 'Free-range', points: 16 },
  'en:cage-free': { text: 'Cage-free', points: 12 },
  'en:wild-caught': { text: 'Wild-caught', points: 18 },
  'en:sustainable-seafood': { text: 'Sustainably fished', points: 14 },
  'en:msc': { text: 'MSC certified sustainable seafood', points: 16 },
  'en:responsible-fishing': { text: 'Sustainably fished', points: 14 },
  'en:non-gmo': { text: 'Non-GMO', points: 10 },
  'en:no-gmos': { text: 'Non-GMO', points: 10 },
  'en:fair-trade': { text: 'Fair trade', points: 8 },
  'en:fairtrade-international': { text: 'Fair trade', points: 8 },
  'en:animal-welfare': { text: 'Animal welfare certified', points: 12 },
  'en:certified-humane': { text: 'Certified Humane', points: 14 },
  'en:regenerative-agriculture': { text: 'Regenerative agriculture (builds soil health)', points: 22 },
  'en:regenerative-organic-certified': { text: 'Regenerative Organic Certified', points: 24 },
  'en:demeter': { text: 'Biodynamic (Demeter certified)', points: 20 },
  'en:biodynamic-agriculture': { text: 'Biodynamic farming', points: 20 },
  'en:rainforest-alliance': { text: 'Rainforest Alliance certified', points: 8 },
  'en:rspo': { text: 'RSPO sustainable palm oil', points: 8 },
  'en:no-antibiotics': { text: 'No antibiotics', points: 10 },
  'en:no-hormones': { text: 'No added hormones', points: 10 },
  'en:no-added-nitrates': { text: 'No added nitrates', points: 10 },
};

const CATEGORY_KEYWORDS: [Category, string[]][] = [
  ['produce', ['fruits', 'vegetables', 'fresh-produce', 'salads', 'herbs', 'mushrooms']],
  ['dairy', ['dairies', 'milks', 'cheeses', 'yogurts', 'eggs', 'creams', 'butters']],
  ['meat', ['meats', 'poultry', 'seafood', 'fishes', 'sausages', 'deli-meats', 'charcuteries']],
  ['frozen', ['frozen-foods', 'ice-creams', 'frozen-desserts']],
  ['snacks', ['snacks', 'chips', 'candies', 'chocolates', 'cookies', 'crackers', 'biscuits']],
  ['drinks', ['beverages', 'waters', 'juices', 'sodas', 'coffees', 'teas', 'plant-based-beverages']],
  ['spices', ['spices', 'condiments', 'herbs-and-spices', 'sauces', 'seasonings', 'oils', 'vinegars']],
  ['pantry', ['cereals', 'pastas', 'breads', 'flours', 'canned-foods', 'legumes', 'rices', 'breakfasts']],
  ['household', ['cleaning-products', 'household', 'paper-products']],
];

const LOCATION_BY_CATEGORY: Record<Category, Location> = {
  produce: 'fridge',
  dairy: 'fridge',
  meat: 'fridge',
  frozen: 'freezer',
  pantry: 'pantry',
  snacks: 'pantry',
  drinks: 'pantry',
  spices: 'pantry',
  household: 'other',
  other: 'pantry',
};

function guessCategory(categoriesTags: string[] | undefined): Category {
  if (!categoriesTags) return 'other';
  const joined = categoriesTags.join(' ').toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => joined.includes(kw))) return category;
  }
  return 'other';
}

function guessUnit(quantity: string | undefined): Unit {
  if (!quantity) return 'count';
  const q = quantity.toLowerCase();
  // Word-boundary matching avoids "1 lb" being misread as containing "l" (liters).
  if (/\bml\b/.test(q)) return 'ml';
  if (/\bkg\b/.test(q)) return 'kg';
  if (/\blb(s)?\b/.test(q)) return 'lb';
  if (/\boz\b/.test(q)) return 'oz';
  if (/\bg\b/.test(q)) return 'g';
  if (/\bl\b/.test(q)) return 'l';
  return 'count';
}

function tierFromScore(score: number): QualityTier {
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 25) return 'Poor';
  return 'Bad';
}

// Unrated additives get no penalty — we simply don't have data to judge them,
// which isn't the same as them being risky. Penalizing "unknown" the same as
// "moderate risk" would make the score over-warn on additives we know nothing about.
const ADDITIVE_PENALTY: Record<AdditiveInfo['risk'], number> = { high: 15, moderate: 7, low: 2, unrated: 0 };

// Ingredient-list red flags that aren't always captured by OFF's additives_tags
// (e.g. trans fats and HFCS aren't E-numbered additives, and "artificial
// flavor/color" is often only mentioned as free text, not tagged).
const INGREDIENT_RED_FLAGS: [RegExp, string][] = [
  [/hydrogenated/i, 'Contains (partially) hydrogenated oil — a trans fat source'],
  [/high[\s-]?fructose corn syrup/i, 'Sweetened with high-fructose corn syrup'],
  [/artificial flavo(u)?r/i, 'Contains artificial flavoring'],
  [/artificial colo(u)?r/i, 'Contains artificial coloring'],
];

const ECOSCORE_ADJUST: Record<string, number> = { a: 8, b: 4, c: 0, d: -4, e: -8 };

function assessQuality(product: OpenFoodFactsProduct, additives: AdditiveInfo[]): ProductQuality {
  const labels = product.labels_tags ?? [];
  const matched = labels
    .map((tag) => RAISED_LABEL_MAP[tag])
    .filter((v): v is { text: string; points: number } => !!v);
  const uniqueByText = Array.from(new Map(matched.map((m) => [m.text, m])).values());

  let score = 30; // baseline for a conventionally-sourced, unverified product
  const pros: string[] = [];
  const cons: string[] = [];

  for (const { text, points } of uniqueByText) {
    score += points;
    pros.push(text);
  }

  // NOVA groups: 1 = unprocessed/minimally processed, 2 = processed culinary
  // ingredients (oils, butter, sugar — neutral), 3 = processed foods, 4 =
  // ultra-processed. Only 1 and 4 are extreme enough to always call out.
  if (product.nova_group === 1) {
    score += 10;
    pros.push('Minimally processed, close to its natural state');
  } else if (product.nova_group === 3) {
    score -= 8;
    cons.push('Processed food (NOVA group 3) — combines ingredients beyond minimal processing');
  } else if (product.nova_group === 4) {
    score -= 20;
    cons.push('Ultra-processed (NOVA group 4) — heavily altered from whole ingredients');
  }

  if (product.ecoscore_grade) {
    const grade = product.ecoscore_grade.toLowerCase();
    const adjust = ECOSCORE_ADJUST[grade];
    if (adjust !== undefined) {
      score += adjust;
      if (adjust > 0) pros.push(`Eco-Score ${grade.toUpperCase()} — lower environmental footprint`);
      else if (adjust < 0) cons.push(`Eco-Score ${grade.toUpperCase()} — higher environmental footprint`);
    }
  }

  const highRisk = additives.filter((a) => a.risk === 'high');
  const moderateRisk = additives.filter((a) => a.risk === 'moderate');
  const additivePenalty = additives.reduce((sum, a) => sum + ADDITIVE_PENALTY[a.risk], 0);
  if (additivePenalty > 0) {
    score -= Math.min(40, additivePenalty);
    if (highRisk.length > 0) {
      cons.push(`${highRisk.length} higher-risk additive${highRisk.length === 1 ? '' : 's'}: ${highRisk.map((a) => a.name).join(', ')}`);
    }
    if (moderateRisk.length > 0) {
      cons.push(`${moderateRisk.length} moderate-risk additive${moderateRisk.length === 1 ? '' : 's'}: ${moderateRisk.map((a) => a.name).join(', ')}`);
    }
  }

  if (product.ingredients_text) {
    const flagged = INGREDIENT_RED_FLAGS.filter(([re]) => re.test(product.ingredients_text!));
    if (flagged.length > 0) {
      score -= Math.min(20, flagged.length * 8);
      for (const [, note] of flagged) cons.push(note);
    }
  }

  if (pros.length === 0) {
    pros.push('No sourcing or farming certifications found on this product');
  }
  if (cons.length === 0) {
    cons.push('No red flags found in available ingredient data');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const raisedParts: string[] = [];
  if (uniqueByText.length > 0) raisedParts.push(uniqueByText.map((m) => m.text).join(', '));
  if (product.origins) raisedParts.push(`Origin: ${product.origins}`);

  return {
    score,
    tier: tierFromScore(score),
    pros,
    cons,
    raisedInfo: raisedParts.length > 0 ? raisedParts.join(' · ') : null,
  };
}

function extractNutrition(n: OpenFoodFactsNutriments | undefined): NutritionFacts | null {
  if (!n) return null;
  const sodiumG = n['sodium_100g'];
  const facts: NutritionFacts = {
    calories: n['energy-kcal_100g'] ?? null,
    protein: n['proteins_100g'] ?? null,
    carbs: n['carbohydrates_100g'] ?? null,
    sugar: n['sugars_100g'] ?? null,
    fat: n['fat_100g'] ?? null,
    saturatedFat: n['saturated-fat_100g'] ?? null,
    fiber: n['fiber_100g'] ?? null,
    sodium: sodiumG !== undefined ? Math.round(sodiumG * 1000) : null,
  };
  const hasAnyValue = Object.values(facts).some((v) => v !== null);
  return hasAnyValue ? facts : null;
}

/** Turns an Open Food Facts tag like "en:tomato-sauces" into "Tomato Sauces". */
function humanizeTag(tag: string): string {
  return tag
    .replace(/^[a-z]{2}:/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** When a product has no product_name/generic_name (common for smaller or
 * regional brands), fall back to a readable name built from its brand and
 * category instead of treating the scan as a total miss. */
function fallbackName(p: OpenFoodFactsProduct): string | null {
  const catTag = p.categories_tags?.[p.categories_tags.length - 1];
  const catLabel = catTag ? humanizeTag(catTag) : null;
  if (p.brands && catLabel) return `${p.brands} ${catLabel}`;
  if (catLabel) return catLabel;
  if (p.brands) return p.brands;
  return null;
}

async function fetchProduct(code: string): Promise<OpenFoodFactsProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${PRODUCT_FIELDS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lookup failed with status ${res.status}`);
  const data: OpenFoodFactsResponse = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return data.product;
}

/** A scanned/typed barcode can be UPC-A (12 digits) while the product is only
 * indexed under its EAN-13 form (padded with a leading zero), or vice versa —
 * this is a common reason US products fail to match. Try the code as scanned
 * first, then the alternate form. */
function candidateCodes(raw: string): string[] {
  const cleaned = raw.replace(/[\s-]/g, '');
  const candidates = [cleaned];
  if (/^\d{12}$/.test(cleaned)) candidates.push(`0${cleaned}`);
  else if (/^\d{13}$/.test(cleaned) && cleaned.startsWith('0')) candidates.push(cleaned.slice(1));
  return candidates;
}

/** Looks up a scanned barcode against the Open Food Facts public database.
 * Assesses ingredient/sourcing quality — how the food was raised or grown
 * (organic, grass-fed, pasture-raised, wild-caught, processing level,
 * environmental Eco-Score, ingredient-list red flags, and individually
 * risk-rated additives) — rather than a nutrition-facts score. Nutrition
 * facts are still returned separately as reference info, Lose It-style, but
 * don't factor into the quality score. Returns null when no form of the
 * barcode is found. */
export async function lookupProductByBarcode(barcode: string): Promise<ProductLookupResult | null> {
  let product: OpenFoodFactsProduct | null = null;
  for (const code of candidateCodes(barcode.trim())) {
    product = await fetchProduct(code);
    if (product) break;
  }
  if (!product) return null;

  const name = product.product_name || product.generic_name || fallbackName(product);
  if (!name) return null;

  const category = guessCategory(product.categories_tags);
  const additives = (product.additives_tags ?? []).map(lookupAdditive);

  return {
    barcode: barcode.trim(),
    name,
    brand: product.brands ?? null,
    imageUrl: product.image_front_small_url ?? product.image_small_url ?? null,
    quantityText: product.quantity ?? null,
    suggestedCategory: category,
    suggestedLocation: LOCATION_BY_CATEGORY[category],
    suggestedUnit: guessUnit(product.quantity),
    quality: assessQuality(product, additives),
    additives,
    nutrition: extractNutrition(product.nutriments),
  };
}

const SHELF_LIFE_DAYS: Record<Category, number> = {
  produce: 7,
  dairy: 10,
  meat: 5,
  frozen: 180,
  pantry: 270,
  snacks: 120,
  drinks: 270,
  spices: 365,
  household: 365,
  other: 30,
};

/** A reasonable default expiration estimate for a freshly-purchased item,
 * shown pre-filled but always editable — we have no real expiration data
 * from the barcode itself. */
export function estimateExpirationDate(category: Category): string {
  const d = new Date();
  d.setDate(d.getDate() + SHELF_LIFE_DAYS[category]);
  return d.toISOString().slice(0, 10);
}
