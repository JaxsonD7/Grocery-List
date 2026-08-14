import type { Category, ProductHealthInfo, Unit } from '../types';

export interface ProductLookupResult {
  barcode: string;
  name: string;
  quantityText: string | null;
  suggestedCategory: Category;
  suggestedUnit: Unit;
  health: ProductHealthInfo;
}

interface OpenFoodFactsNutriments {
  [key: string]: number | undefined;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  generic_name?: string;
  brands?: string;
  nutriscore_grade?: string;
  nutriscore_score?: number;
  nova_group?: number;
  ingredients_text?: string;
  labels_tags?: string[];
  origins?: string;
  origins_tags?: string[];
  categories_tags?: string[];
  quantity?: string;
  nutriments?: OpenFoodFactsNutriments;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

const RAISED_LABEL_MAP: Record<string, string> = {
  'en:organic': 'Organic',
  'en:fair-trade': 'Fair trade',
  'en:free-range': 'Free-range',
  'en:free-range-eggs': 'Free-range',
  'en:cage-free': 'Cage-free',
  'en:pasture-raised': 'Pasture-raised',
  'en:grass-fed': 'Grass-fed',
  'en:wild-caught': 'Wild-caught',
  'en:non-gmo': 'Non-GMO',
  'en:rainforest-alliance': 'Rainforest Alliance certified',
  'en:vegan': 'Vegan',
  'en:vegetarian': 'Vegetarian',
  'en:sustainable-seafood': 'Sustainably sourced seafood',
  'en:animal-welfare': 'Animal welfare certified',
};

const CATEGORY_KEYWORDS: [Category, string[]][] = [
  ['produce', ['fruits', 'vegetables', 'fresh-produce']],
  ['dairy', ['dairies', 'milks', 'cheeses', 'yogurts', 'eggs']],
  ['meat', ['meats', 'poultry', 'seafood', 'fishes']],
  ['frozen', ['frozen-foods']],
  ['snacks', ['snacks', 'chips', 'candies', 'chocolates']],
  ['drinks', ['beverages', 'waters', 'juices', 'sodas']],
  ['spices', ['spices', 'condiments', 'herbs']],
  ['household', ['cleaning-products', 'household']],
];

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
  if (q.includes('ml')) return 'ml';
  if (q.includes('l')) return 'l';
  if (q.includes('kg')) return 'kg';
  if (q.includes('g')) return 'g';
  if (q.includes('oz')) return 'oz';
  if (q.includes('lb')) return 'lb';
  return 'count';
}

function scoreFromNutriScore(grade: string | undefined, novaGroup: number | undefined): number {
  const base: Record<string, number> = { a: 90, b: 74, c: 56, d: 36, e: 16 };
  let score = grade && base[grade.toLowerCase()] !== undefined ? base[grade.toLowerCase()] : 50;

  if (novaGroup === 1) score += 6;
  else if (novaGroup === 2) score += 2;
  else if (novaGroup === 3) score -= 8;
  else if (novaGroup === 4) score -= 16;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildProsAndCons(n: OpenFoodFactsNutriments, novaGroup: number | undefined, labels: string[]): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  const sugars = n['sugars_100g'];
  const satFat = n['saturated-fat_100g'];
  const salt = n['salt_100g'];
  const fiber = n['fiber_100g'];
  const proteins = n['proteins_100g'];
  const energy = n['energy-kcal_100g'];

  if (proteins !== undefined && proteins >= 8) pros.push('Good source of protein');
  if (fiber !== undefined && fiber >= 3) pros.push('High in fiber');
  if (sugars !== undefined && sugars <= 5) pros.push('Low sugar');
  if (salt !== undefined && salt <= 0.3) pros.push('Low sodium');
  if (novaGroup === 1) pros.push('Minimally processed');
  if (labels.includes('en:organic')) pros.push('Certified organic');

  if (sugars !== undefined && sugars >= 15) cons.push('High in sugar');
  if (satFat !== undefined && satFat >= 5) cons.push('High in saturated fat');
  if (salt !== undefined && salt >= 1.5) cons.push('High in sodium');
  if (novaGroup === 4) cons.push('Ultra-processed food');
  if (energy !== undefined && energy >= 400) cons.push('Energy-dense');

  if (pros.length === 0) pros.push('No standout nutritional benefits identified');
  if (cons.length === 0) cons.push('No major nutritional concerns identified');

  return { pros, cons };
}

function buildRaisedInfo(labelsTags: string[] | undefined, origins: string | undefined): string | null {
  const matched = (labelsTags ?? [])
    .map((tag) => RAISED_LABEL_MAP[tag])
    .filter((v): v is string => !!v);
  const unique = Array.from(new Set(matched));

  const parts: string[] = [];
  if (unique.length > 0) parts.push(unique.join(', '));
  if (origins) parts.push(`Origin: ${origins}`);

  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Looks up a scanned barcode against the Open Food Facts public database and
 * derives a simplified health score, pros/cons, and sourcing info for display.
 * Returns null when the barcode isn't found in the database. */
export async function lookupProductByBarcode(barcode: string): Promise<ProductLookupResult | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,generic_name,brands,nutriscore_grade,nutriscore_score,nova_group,ingredients_text,labels_tags,origins,origins_tags,categories_tags,quantity,nutriments`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lookup failed with status ${res.status}`);
  const data: OpenFoodFactsResponse = await res.json();

  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const name = p.product_name || p.generic_name;
  if (!name) return null;

  const nutriments = p.nutriments ?? {};
  const labels = p.labels_tags ?? [];
  const { pros, cons } = buildProsAndCons(nutriments, p.nova_group, labels);

  return {
    barcode,
    name,
    quantityText: p.quantity ?? null,
    suggestedCategory: guessCategory(p.categories_tags),
    suggestedUnit: guessUnit(p.quantity),
    health: {
      score: scoreFromNutriScore(p.nutriscore_grade, p.nova_group),
      grade: p.nutriscore_grade ?? null,
      brand: p.brands ?? null,
      pros,
      cons,
      raisedInfo: buildRaisedInfo(p.labels_tags, p.origins),
    },
  };
}
