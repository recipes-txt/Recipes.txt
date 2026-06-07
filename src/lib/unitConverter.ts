const FRAC: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

function parseAmt(s: string): number {
  const t = s.trim();
  if (FRAC[t] !== undefined) return FRAC[t];
  const mixed = t.match(/^(\d+(?:\.\d+)?)\s*([½¼¾⅓⅔⅛⅜⅝⅞]?)$/);
  if (mixed) return parseFloat(mixed[1]) + (FRAC[mixed[2]] ?? 0);
  const mixedFrac = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedFrac) return parseInt(mixedFrac[1]) + parseInt(mixedFrac[2]) / parseInt(mixedFrac[3]);
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(t) || 0;
}

// Matches: "2¼", "1 ½", "3/4", "1 3/4", plain digits, single fractions
const AMT = '([\\d½¼¾⅓⅔⅛⅜⅝⅞][\\d½¼¾⅓⅔⅛⅜⅝⅞\\s\\/\\.]*)';

type Rule = { re: RegExp; unit: string; convert: (v: number) => number };

const RULES: Rule[] = [
  { re: new RegExp(`${AMT}\\s*cups?`, 'gi'), unit: 'ml', convert: v => v * 240 },
  { re: new RegExp(`${AMT}\\s*(?:tablespoons?|tbsp)`, 'gi'), unit: 'ml', convert: v => v * 15 },
  { re: new RegExp(`${AMT}\\s*(?:teaspoons?|tsps?|tsp)`, 'gi'), unit: 'ml', convert: v => v * 5 },
  { re: new RegExp(`${AMT}\\s*fl\\.?\\s*oz`, 'gi'), unit: 'ml', convert: v => v * 30 },
  { re: new RegExp(`${AMT}\\s*pints?`, 'gi'), unit: 'ml', convert: v => v * 473 },
  { re: new RegExp(`${AMT}\\s*quarts?`, 'gi'), unit: 'ml', convert: v => v * 946 },
  { re: new RegExp(`${AMT}\\s*(?:pounds?|lbs?)`, 'gi'), unit: 'g', convert: v => v * 454 },
  { re: new RegExp(`${AMT}\\s*oz(?!\\s*fl)`, 'gi'), unit: 'g', convert: v => v * 28 },
  { re: new RegExp(`${AMT}\\s*inches?`, 'gi'), unit: 'cm', convert: v => v * 2.54 },
];

export function toMetric(ingredient: string): string {
  let s = ingredient;
  for (const { re, unit, convert } of RULES) {
    s = s.replace(re, (_, amt) => {
      const val = parseAmt(amt);
      if (!val) return _;
      const converted = convert(val);
      if (unit === 'ml' && converted >= 1000) return `${(converted / 1000).toFixed(1)} L `;
      return `${Math.round(converted)} ${unit} `;
    });
  }
  s = s.replace(/(\d+(?:\.\d+)?)\s*°?\s*F\b/g, (_, f) =>
    `${Math.round((parseFloat(f) - 32) * 5 / 9)}°C`
  );
  return s.trim();
}
