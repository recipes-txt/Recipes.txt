const UNICODE_FRACS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

function parseNum(s: string): number {
  s = s.trim();
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d+)([½¼¾⅓⅔⅛⅜⅝⅞])$/))) return parseInt(m[1]) + UNICODE_FRACS[m[2]];
  if ((m = s.match(/^([½¼¾⅓⅔⅛⅜⅝⅞])$/))) return UNICODE_FRACS[m[1]];
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]);
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return parseInt(m[1]) / parseInt(m[2]);
  return parseFloat(s) || 0;
}

// Matches any number form before a unit
const NUM = '(\\d+[½¼¾⅓⅔⅛⅜⅝⅞]|[½¼¾⅓⅔⅛⅜⅝⅞]|\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\.?\\d*)';

function mlStr(v: number): string {
  if (v >= 800) return `${parseFloat((v / 1000).toFixed(2).replace(/\.?0+$/, ''))} L`;
  if (v >= 20) return `${Math.round(v / 5) * 5} ml`;
  return `${Math.round(v)} ml`;
}

function gStr(v: number): string {
  if (v >= 1000) return `${parseFloat((v / 1000).toFixed(2).replace(/\.?0+$/, ''))} kg`;
  return `${Math.round(v)} g`;
}

// Ordered so more-specific patterns (fl oz) appear before less-specific (oz)
const CONVERSIONS: [RegExp, (v: number) => string][] = [
  [new RegExp(`${NUM}\\s*(?:fl\\.?\\s*oz|fluid\\s*ounces?)\\b`, 'gi'), v => mlStr(v * 30)],
  [new RegExp(`${NUM}\\s*cups?\\b`, 'gi'), v => mlStr(v * 240)],
  [new RegExp(`${NUM}\\s*(?:tbsp\\.?|tablespoons?)\\b`, 'gi'), v => mlStr(v * 15)],
  [new RegExp(`${NUM}\\s*(?:tsp\\.?|teaspoons?)\\b`, 'gi'), v => mlStr(v * 5)],
  [new RegExp(`${NUM}\\s*(?:pints?|pt\\.?)\\b`, 'gi'), v => mlStr(v * 473)],
  [new RegExp(`${NUM}\\s*(?:quarts?|qt\\.?)\\b`, 'gi'), v => mlStr(v * 946)],
  [new RegExp(`${NUM}\\s*(?:gallons?|gal\\.?)\\b`, 'gi'), v => mlStr(v * 3785)],
  [new RegExp(`${NUM}\\s*(?:lbs?\\.?|pounds?)\\b`, 'gi'), v => gStr(v * 454)],
  [new RegExp(`${NUM}\\s*(?:oz\\.?|ounces?)\\b`, 'gi'), v => gStr(v * 28)],
  [/(\d+(?:\.\d+)?)\s*°?\s*F\b/g, v => `${Math.round((v - 32) * 5 / 9)}°C`],
  [/(\d+(?:\.\d+)?)\s*(?:inch(?:es)?|in\.?)\b/gi, v => `${parseFloat((v * 2.54).toFixed(1))} cm`],
];

export function toMetric(ingredient: string): string {
  let s = ingredient;
  for (const [pattern, convert] of CONVERSIONS) {
    s = s.replace(pattern, (_match, numStr) => convert(parseNum(numStr)));
  }
  return s;
}
