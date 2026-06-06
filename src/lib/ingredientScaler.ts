const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

const NICE_FRACTIONS: [number, string][] = [
  [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'],
  [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
];

function parseLeadingAmount(s: string): { value: number; rest: string } | null {
  const t = s.trim();

  // "2½" or "2¼" etc.
  const mixedUnicode = t.match(/^(\d+)([½¼¾⅓⅔⅛⅜⅝⅞])\s*/);
  if (mixedUnicode) {
    return { value: parseInt(mixedUnicode[1]) + UNICODE_FRACTIONS[mixedUnicode[2]], rest: t.slice(mixedUnicode[0].length) };
  }

  // "½" alone
  const unicodeOnly = t.match(/^([½¼¾⅓⅔⅛⅜⅝⅞])\s*/);
  if (unicodeOnly) {
    return { value: UNICODE_FRACTIONS[unicodeOnly[1]], rest: t.slice(unicodeOnly[0].length) };
  }

  // "2 1/2"
  const mixedSlash = t.match(/^(\d+)\s+(\d+)\/(\d+)\s*/);
  if (mixedSlash) {
    return { value: parseInt(mixedSlash[1]) + parseInt(mixedSlash[2]) / parseInt(mixedSlash[3]), rest: t.slice(mixedSlash[0].length) };
  }

  // "1/2"
  const justFrac = t.match(/^(\d+)\/(\d+)\s*/);
  if (justFrac) {
    return { value: parseInt(justFrac[1]) / parseInt(justFrac[2]), rest: t.slice(justFrac[0].length) };
  }

  // decimal or integer
  const num = t.match(/^(\d+\.?\d*)\s*/);
  if (num) {
    return { value: parseFloat(num[1]), rest: t.slice(num[0].length) };
  }

  return null;
}

function formatAmount(n: number): string {
  if (n <= 0) return '0';

  const whole = Math.floor(n);
  const frac = n - whole;

  const niceFrac = NICE_FRACTIONS.find(([val]) => Math.abs(frac - val) < 0.04);
  if (niceFrac) return whole > 0 ? `${whole}${niceFrac[1]}` : niceFrac[1];

  if (Math.abs(frac) < 0.05) return `${Math.round(n)}`;

  // round to nearest 0.25 and try again
  const rounded = Math.round(n * 4) / 4;
  const rf = rounded - Math.floor(rounded);
  const nf2 = NICE_FRACTIONS.find(([val]) => Math.abs(rf - val) < 0.04);
  if (nf2) {
    const w = Math.floor(rounded);
    return w > 0 ? `${w}${nf2[1]}` : nf2[1];
  }

  return n % 1 === 0 ? `${n}` : n.toFixed(1).replace(/\.0$/, '');
}

export function scaleIngredient(ingredient: string, factor: number): string {
  if (factor === 1) return ingredient;

  // Range like "2-3 tbsp" or "10–15 minutes"
  const rangeMatch = ingredient.match(/^(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)(.*)/);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]) * factor;
    const hi = parseFloat(rangeMatch[2]) * factor;
    return `${formatAmount(lo)}–${formatAmount(hi)}${rangeMatch[3]}`;
  }

  const parsed = parseLeadingAmount(ingredient);
  if (!parsed) return ingredient;

  const scaled = parsed.value * factor;
  const formatted = formatAmount(scaled);
  return parsed.rest ? `${formatted} ${parsed.rest}` : formatted;
}

export const SCALE_OPTIONS = [
  { label: '½×', value: 0.5 },
  { label: '1×', value: 1 },
  { label: '2×', value: 2 },
  { label: '3×', value: 3 },
] as const;
