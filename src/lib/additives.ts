export type AdditiveRisk = 'low' | 'moderate' | 'high';

export interface AdditiveInfo {
  code: string; // e.g. "E211"
  name: string;
  risk: AdditiveRisk;
  note: string;
}

// A curated reference table of additives commonly found on grocery packaging.
// Risk levels are a simplified public-reference classification (not medical
// advice) based on how these are broadly discussed by food-safety bodies
// (EFSA/ANSES) and consumer apps like Yuka — some are debated, and the aim
// here is a quick, consistent signal rather than a clinical judgment.
const ADDITIVE_DB: Record<string, Omit<AdditiveInfo, 'code'>> = {
  e100: { name: 'Curcumin', risk: 'low', note: 'Natural turmeric-derived color' },
  e101: { name: 'Riboflavin', risk: 'low', note: 'Vitamin B2, used as a color' },
  e120: { name: 'Cochineal / Carmine', risk: 'low', note: 'Natural insect-derived red color' },
  e122: { name: 'Azorubine / Carmoisine', risk: 'high', note: 'Synthetic dye linked to hyperactivity in children' },
  e102: { name: 'Tartrazine', risk: 'high', note: 'Synthetic yellow dye, hyperactivity warning in EU' },
  e104: { name: 'Quinoline Yellow', risk: 'high', note: 'Synthetic dye, hyperactivity warning in EU' },
  e110: { name: 'Sunset Yellow', risk: 'high', note: 'Synthetic dye, hyperactivity warning in EU' },
  e124: { name: 'Ponceau 4R', risk: 'high', note: 'Synthetic red dye, hyperactivity warning in EU' },
  e129: { name: 'Allura Red', risk: 'high', note: 'Synthetic red dye, hyperactivity warning in EU' },
  e150a: { name: 'Plain Caramel', risk: 'low', note: 'Caramel color' },
  e150c: { name: 'Ammonia Caramel', risk: 'moderate', note: 'Caramel color, may contain trace 4-MEI' },
  e150d: { name: 'Sulphite Ammonia Caramel', risk: 'moderate', note: 'Caramel color, may contain trace 4-MEI' },
  e160a: { name: 'Beta-Carotene', risk: 'low', note: 'Natural orange color, vitamin A precursor' },
  e162: { name: 'Beetroot Red', risk: 'low', note: 'Natural color from beets' },
  e163: { name: 'Anthocyanins', risk: 'low', note: 'Natural plant-derived color' },
  e171: { name: 'Titanium Dioxide', risk: 'high', note: 'Banned as a food additive in the EU since 2022' },
  e200: { name: 'Sorbic Acid', risk: 'low', note: 'Common natural-origin preservative' },
  e202: { name: 'Potassium Sorbate', risk: 'low', note: 'Widely used, well-tolerated preservative' },
  e211: { name: 'Sodium Benzoate', risk: 'moderate', note: 'Can form benzene when combined with vitamin C' },
  e212: { name: 'Potassium Benzoate', risk: 'moderate', note: 'Same family as sodium benzoate' },
  e220: { name: 'Sulphur Dioxide', risk: 'moderate', note: 'Common allergen, especially for asthma sufferers' },
  e223: { name: 'Sodium Metabisulphite', risk: 'moderate', note: 'Sulphite preservative, allergen risk' },
  e249: { name: 'Potassium Nitrite', risk: 'high', note: 'Cured-meat preservative linked to processed meat cancer risk' },
  e250: { name: 'Sodium Nitrite', risk: 'high', note: 'Cured-meat preservative linked to processed meat cancer risk' },
  e251: { name: 'Sodium Nitrate', risk: 'high', note: 'Cured-meat preservative linked to processed meat cancer risk' },
  e252: { name: 'Potassium Nitrate', risk: 'high', note: 'Cured-meat preservative linked to processed meat cancer risk' },
  e260: { name: 'Acetic Acid', risk: 'low', note: 'Vinegar acid' },
  e270: { name: 'Lactic Acid', risk: 'low', note: 'Naturally occurring acid' },
  e296: { name: 'Malic Acid', risk: 'low', note: 'Naturally occurring fruit acid' },
  e300: { name: 'Ascorbic Acid (Vitamin C)', risk: 'low', note: 'Vitamin C, also an antioxidant' },
  e301: { name: 'Sodium Ascorbate', risk: 'low', note: 'Vitamin C salt, antioxidant' },
  e306: { name: 'Tocopherol (Vitamin E)', risk: 'low', note: 'Natural antioxidant' },
  e307: { name: 'Synthetic Tocopherol', risk: 'low', note: 'Synthetic vitamin E antioxidant' },
  e320: { name: 'BHA', risk: 'high', note: 'Possible carcinogen, restricted in several countries' },
  e321: { name: 'BHT', risk: 'moderate', note: 'Synthetic antioxidant, debated safety' },
  e322: { name: 'Lecithin', risk: 'low', note: 'Common emulsifier, often from soy or sunflower' },
  e330: { name: 'Citric Acid', risk: 'low', note: 'Common natural-origin acid' },
  e339: { name: 'Sodium Phosphate', risk: 'moderate', note: 'Excess dietary phosphate linked to kidney/heart concerns' },
  e340: { name: 'Potassium Phosphate', risk: 'moderate', note: 'Excess dietary phosphate linked to kidney/heart concerns' },
  e401: { name: 'Sodium Alginate', risk: 'low', note: 'Seaweed-derived thickener' },
  e407: { name: 'Carrageenan', risk: 'moderate', note: 'Debated link to digestive irritation' },
  e410: { name: 'Locust Bean Gum', risk: 'low', note: 'Natural thickener' },
  e412: { name: 'Guar Gum', risk: 'low', note: 'Natural thickener' },
  e415: { name: 'Xanthan Gum', risk: 'low', note: 'Common fermentation-derived thickener' },
  e420: { name: 'Sorbitol', risk: 'low', note: 'Sugar alcohol, can cause bloating in large amounts' },
  e433: { name: 'Polysorbate 80', risk: 'moderate', note: 'Emulsifier, debated effect on gut lining' },
  e440: { name: 'Pectin', risk: 'low', note: 'Natural fruit-derived thickener' },
  e450: { name: 'Diphosphates', risk: 'moderate', note: 'Phosphate additive, excess intake concerns' },
  e451: { name: 'Triphosphates', risk: 'moderate', note: 'Phosphate additive, excess intake concerns' },
  e466: { name: 'Carboxymethyl Cellulose', risk: 'moderate', note: 'Emulsifier, debated effect on gut lining' },
  e471: { name: 'Mono- and Diglycerides', risk: 'low', note: 'Common emulsifier, source varies by product' },
  e477: { name: 'Propylene Glycol Esters', risk: 'moderate', note: 'Synthetic emulsifier' },
  e500: { name: 'Sodium Bicarbonate', risk: 'low', note: 'Baking soda' },
  e621: { name: 'Monosodium Glutamate (MSG)', risk: 'low', note: 'Flavor enhancer, safe for most; some report sensitivity' },
  e627: { name: 'Disodium Guanylate', risk: 'low', note: 'Flavor enhancer, often paired with MSG' },
  e631: { name: 'Disodium Inosinate', risk: 'low', note: 'Flavor enhancer, often paired with MSG' },
  e950: { name: 'Acesulfame K', risk: 'moderate', note: 'Artificial sweetener, debated long-term safety data' },
  e951: { name: 'Aspartame', risk: 'moderate', note: 'Artificial sweetener; WHO classed as "possibly carcinogenic" in 2023' },
  e952: { name: 'Cyclamate', risk: 'moderate', note: 'Artificial sweetener, banned in the US' },
  e954: { name: 'Saccharin', risk: 'moderate', note: 'Artificial sweetener, debated long-term safety data' },
  e955: { name: 'Sucralose', risk: 'low', note: 'Artificial sweetener, generally well-tolerated' },
  e960: { name: 'Steviol Glycosides (Stevia)', risk: 'low', note: 'Natural plant-derived sweetener' },
};

/** Looks up an Open Food Facts additive tag (e.g. "en:e211") against our
 * reference table. Falls back to a generic "not rated" entry so unknown or
 * newly-tagged additives still render sensibly. */
export function lookupAdditive(tag: string): AdditiveInfo {
  const raw = tag.replace(/^en:/, '');
  const match = raw.match(/^e(\d+[a-z]?)/i);
  const code = match ? `E${match[1].toUpperCase()}` : raw.toUpperCase();
  const info = ADDITIVE_DB[code.toLowerCase()];
  if (info) return { code, ...info };
  return { code, name: code, risk: 'moderate', note: 'Not individually rated — limited public data available' };
}
