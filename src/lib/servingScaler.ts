export function parseBaseServings(servings: string): number | null {
  const m = servings.match(/(\d+)/);
  return m ? parseInt(m[0], 10) : null;
}

export function adjustServingsLabel(original: string, newCount: number): string {
  return original.replace(/\d+/, String(newCount));
}
